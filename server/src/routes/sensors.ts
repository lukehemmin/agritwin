import express from 'express';
import { Database } from 'sqlite';
import { logger } from '../utils/logger';
import { asyncHandler, CustomError } from '../utils/errorHandler';
import { Sensor, SensorData, SensorWithLatestData } from '../database/models/Sensor';

const router = express.Router();

// GET /api/sensors - Get all sensors
router.get('/', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  
  const sensors = await db.all<SensorWithLatestData[]>(`
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
    ORDER BY s.zone_id, s.type
  `);

  res.json({
    success: true,
    data: sensors,
    count: sensors.length
  });
}));

// GET /api/sensors/:id - Get specific sensor details
router.get('/:id', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { id } = req.params;

  const sensor = await db.get<SensorWithLatestData>(`
    SELECT 
      s.*,
      sd.value as latest_value,
      sd.status as latest_status,
      sd.timestamp as latest_timestamp,
      z.name as zone_name,
      z.level as zone_level
    FROM sensors s
    LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
    AND sd.id = (
      SELECT MAX(id) 
      FROM sensor_data 
      WHERE sensor_id = s.id
    )
    LEFT JOIN farm_zones z ON s.zone_id = z.id
    WHERE s.id = ?
  `, [id]);

  if (!sensor) {
    throw new CustomError('Sensor not found', 404);
  }

  res.json({
    success: true,
    data: sensor
  });
}));

// GET /api/sensors/:id/data - Get sensor data history
router.get('/:id/data', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { id } = req.params;
  const { 
    start, 
    end, 
    limit = 100, 
    page = 1 
  } = req.query;

  // Verify sensor exists
  const sensor = await db.get<Sensor>('SELECT id FROM sensors WHERE id = ?', [id]);
  if (!sensor) {
    throw new CustomError('Sensor not found', 404);
  }

  let query = `
    SELECT * FROM sensor_data 
    WHERE sensor_id = ?
  `;
  const params: any[] = [id];

  // Add date filters if provided
  if (start) {
    query += ' AND timestamp >= ?';
    params.push(start);
  }
  if (end) {
    query += ' AND timestamp <= ?';
    params.push(end);
  }

  query += ' ORDER BY timestamp DESC';

  // Add pagination
  const limitNum = Math.min(parseInt(limit as string) || 100, 1000);
  const pageNum = Math.max(parseInt(page as string) || 1, 1);
  const offset = (pageNum - 1) * limitNum;

  query += ` LIMIT ? OFFSET ?`;
  params.push(limitNum, offset);

  const data = await db.all<SensorData[]>(query, params);

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) as total FROM sensor_data 
    WHERE sensor_id = ?
  `;
  const countParams: any[] = [id];

  if (start) {
    countQuery += ' AND timestamp >= ?';
    countParams.push(start);
  }
  if (end) {
    countQuery += ' AND timestamp <= ?';
    countParams.push(end);
  }

  const totalResult = await db.get<{ total: number }>(countQuery, countParams);
  const total = totalResult?.total || 0;

  res.json({
    success: true,
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}));

// PUT /api/sensors/:id/ranges - Update sensor threshold ranges
router.put('/:id/ranges', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { id } = req.params;
  const { 
    min_normal, 
    max_normal, 
    min_warning, 
    max_warning, 
    min_critical, 
    max_critical 
  } = req.body;

  // Verify sensor exists
  const sensor = await db.get<Sensor>('SELECT id FROM sensors WHERE id = ?', [id]);
  if (!sensor) {
    throw new CustomError('Sensor not found', 404);
  }

  // Validate ranges
  if (min_critical >= min_warning || min_warning >= min_normal || 
      max_normal >= max_warning || max_warning >= max_critical) {
    throw new CustomError('Invalid threshold ranges', 400);
  }

  await db.run(`
    UPDATE sensors 
    SET min_normal = ?, max_normal = ?, 
        min_warning = ?, max_warning = ?, 
        min_critical = ?, max_critical = ?
    WHERE id = ?
  `, [min_normal, max_normal, min_warning, max_warning, min_critical, max_critical, id]);

  res.json({
    success: true,
    message: 'Sensor ranges updated successfully'
  });
}));

// POST /api/sensors/:id/calibrate - Calibrate sensor (placeholder)
router.post('/:id/calibrate', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { id } = req.params;

  // Verify sensor exists
  const sensor = await db.get<Sensor>('SELECT id, name FROM sensors WHERE id = ?', [id]);
  if (!sensor) {
    throw new CustomError('Sensor not found', 404);
  }

  // For simulation purposes, just log the calibration request
  logger.info(`Calibration requested for sensor: ${sensor.name} (${id})`);

  res.json({
    success: true,
    message: `Calibration initiated for ${sensor.name}`,
    timestamp: new Date().toISOString()
  });
}));

// PUT /api/sensors/:id/toggle - Toggle sensor active status
router.put('/:id/toggle', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const io = req.app.locals.io;
  const { id } = req.params;
  const { is_active } = req.body;

  // Verify sensor exists
  const sensor = await db.get<Sensor>('SELECT id, name, is_active FROM sensors WHERE id = ?', [id]);
  if (!sensor) {
    throw new CustomError('Sensor not found', 404);
  }

  await db.run('UPDATE sensors SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

  // Broadcast status change via WebSocket
  io.emit('sensor:status-changed', {
    sensorId: id,
    isActive: is_active,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `Sensor ${is_active ? 'activated' : 'deactivated'} successfully`,
    data: {
      id,
      name: sensor.name,
      is_active
    }
  });
}));

export default router;