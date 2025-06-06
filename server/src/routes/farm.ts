import express from 'express';
import { Database } from 'sqlite';
import { asyncHandler, CustomError } from '../utils/errorHandler';
import { FarmZone, FarmZoneWithSensors, FarmStructure } from '../database/models/FarmZone';
import { FARM_CONFIG } from '../config/constants';

const router = express.Router();

// GET /api/farm/structure - Get complete farm structure
router.get('/structure', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;

  // Get all zones with their sensors
  const zones = await db.all<FarmZoneWithSensors[]>(`
    SELECT 
      z.*,
      GROUP_CONCAT(
        json_object(
          'id', s.id,
          'name', s.name,
          'type', s.type,
          'position_x', s.position_x,
          'position_y', s.position_y,
          'position_z', s.position_z,
          'is_active', s.is_active,
          'latest_value', sd.value,
          'latest_status', sd.status,
          'unit', s.unit
        )
      ) as sensors_json
    FROM farm_zones z
    LEFT JOIN sensors s ON z.id = s.zone_id
    LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
    AND sd.id = (
      SELECT MAX(id) 
      FROM sensor_data 
      WHERE sensor_id = s.id
    )
    GROUP BY z.id
    ORDER BY z.level, z.id
  `);

  // Parse sensors JSON for each zone
  const zonesWithSensors = zones.map((zone: any) => ({
    ...zone,
    sensors: zone.sensors_json 
      ? zone.sensors_json.split(',').map((sensorStr: string) => {
          try {
            return JSON.parse(sensorStr);
          } catch {
            return null;
          }
        }).filter(Boolean)
      : []
  }));

  const farmStructure: FarmStructure = {
    id: 'agritwin-farm-001',
    name: 'AgriTwin 수직농장',
    total_levels: FARM_CONFIG.TOTAL_LEVELS,
    dimensions: FARM_CONFIG.DIMENSIONS,
    zones: zonesWithSensors
  };

  res.json({
    success: true,
    data: farmStructure
  });
}));

// GET /api/farm/zones - Get all zones
router.get('/zones', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { level } = req.query;

  let query = 'SELECT * FROM farm_zones';
  const params: any[] = [];

  if (level) {
    query += ' WHERE level = ?';
    params.push(parseInt(level as string));
  }

  query += ' ORDER BY level, id';

  const zones = await db.all<FarmZone[]>(query, params);

  res.json({
    success: true,
    data: zones,
    count: zones.length
  });
}));

// GET /api/farm/zones/:id - Get specific zone details
router.get('/zones/:id', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { id } = req.params;

  const zone = await db.get<FarmZone>('SELECT * FROM farm_zones WHERE id = ?', [id]);
  
  if (!zone) {
    throw new CustomError('Zone not found', 404);
  }

  // Get sensors for this zone
  const sensors = await db.all(`
    SELECT 
      s.*,
      sd.value as latest_value,
      sd.status as latest_status,
      sd.timestamp as latest_timestamp
    FROM sensors s
    LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
    AND sd.id = (
      SELECT MAX(id) 
      FROM sensor_data 
      WHERE sensor_id = s.id
    )
    WHERE s.zone_id = ?
    ORDER BY s.type
  `, [id]);

  const zoneWithSensors: FarmZoneWithSensors = {
    ...zone,
    sensors
  };

  res.json({
    success: true,
    data: zoneWithSensors
  });
}));

// PUT /api/farm/zones/:id - Update zone information
router.put('/zones/:id', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { id } = req.params;
  const { name, crop_type, area } = req.body;

  // Verify zone exists
  const zone = await db.get<FarmZone>('SELECT id FROM farm_zones WHERE id = ?', [id]);
  if (!zone) {
    throw new CustomError('Zone not found', 404);
  }

  // Build update query dynamically based on provided fields
  const updateFields: string[] = [];
  const params: any[] = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (crop_type !== undefined) {
    updateFields.push('crop_type = ?');
    params.push(crop_type);
  }
  if (area !== undefined) {
    updateFields.push('area = ?');
    params.push(area);
  }

  if (updateFields.length === 0) {
    throw new CustomError('No valid fields to update', 400);
  }

  params.push(id); // Add ID for WHERE clause

  await db.run(`
    UPDATE farm_zones 
    SET ${updateFields.join(', ')} 
    WHERE id = ?
  `, params);

  // Get updated zone
  const updatedZone = await db.get<FarmZone>('SELECT * FROM farm_zones WHERE id = ?', [id]);

  res.json({
    success: true,
    message: 'Zone updated successfully',
    data: updatedZone
  });
}));

// GET /api/farm/summary - Get farm summary statistics
router.get('/summary', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;

  // Get basic counts
  const stats = await db.get(`
    SELECT 
      (SELECT COUNT(*) FROM farm_zones) as total_zones,
      (SELECT COUNT(*) FROM sensors) as total_sensors,
      (SELECT COUNT(*) FROM sensors WHERE is_active = 1) as active_sensors,
      (SELECT COUNT(*) FROM alerts WHERE is_resolved = 0) as unresolved_alerts
  `);

  // Get sensor status distribution
  const statusDistribution = await db.all(`
    SELECT 
      sd.status,
      COUNT(*) as count
    FROM sensor_data sd
    WHERE sd.id IN (
      SELECT MAX(id) 
      FROM sensor_data 
      GROUP BY sensor_id
    )
    GROUP BY sd.status
  `);

  // Get zones with sensor counts
  const zoneStats = await db.all(`
    SELECT 
      z.id,
      z.name,
      z.level,
      z.crop_type,
      COUNT(s.id) as sensor_count,
      COUNT(CASE WHEN s.is_active = 1 THEN 1 END) as active_sensor_count
    FROM farm_zones z
    LEFT JOIN sensors s ON z.id = s.zone_id
    GROUP BY z.id
    ORDER BY z.level, z.id
  `);

  // Get average values by sensor type (last 24 hours)
  const avgValues = await db.all(`
    SELECT 
      s.type,
      s.unit,
      AVG(sd.value) as avg_value,
      MIN(sd.value) as min_value,
      MAX(sd.value) as max_value,
      COUNT(sd.id) as data_points
    FROM sensor_data sd
    JOIN sensors s ON sd.sensor_id = s.id
    WHERE sd.timestamp > datetime('now', '-24 hours')
    AND s.is_active = 1
    GROUP BY s.type, s.unit
  `);

  res.json({
    success: true,
    data: {
      overview: stats,
      status_distribution: statusDistribution,
      zone_statistics: zoneStats,
      sensor_averages: avgValues,
      last_updated: new Date().toISOString()
    }
  });
}));

export default router;