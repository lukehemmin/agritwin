import express from 'express';
import { Database } from 'sqlite';
import { asyncHandler, CustomError } from '../utils/errorHandler';
import { Alert, AlertWithSensor } from '../database/models/Alert';
import { HistoricalDataGenerator } from '../services/HistoricalDataGenerator';
import { logger } from '../utils/logger';

const router = express.Router();
let historicalDataGenerator: HistoricalDataGenerator;

// Initialize historical data generator (called from main app)
export const initializeAnalytics = (db: Database) => {
  historicalDataGenerator = new HistoricalDataGenerator(db);
};

// 24시간 시계열 데이터 조회 (과거 12시간 + 미래 12시간)
router.get('/time-series/:sensorId?', asyncHandler(async (req, res) => {
  const { sensorId } = req.params;
  
  if (!historicalDataGenerator) {
    const db: Database = req.app.locals.db;
    historicalDataGenerator = new HistoricalDataGenerator(db);
  }
  
  logger.info(`Generating time series data for sensor: ${sensorId || 'all sensors'}`);
  
  const data = await historicalDataGenerator.generateTimeSeriesData(sensorId);
  
  res.json({
    success: true,
    data,
    sensor_id: sensorId || 'all',
    total_points: data.length,
    time_range: '24 hours (past 12h + future 12h)',
    generated_at: new Date().toISOString()
  });
}));

// 집계 데이터 조회
router.get('/aggregated/:sensorId', asyncHandler(async (req, res) => {
  const { sensorId } = req.params;
  const { 
    start_time, 
    end_time, 
    interval = 'hour' 
  } = req.query;
  
  if (!historicalDataGenerator) {
    const db: Database = req.app.locals.db;
    historicalDataGenerator = new HistoricalDataGenerator(db);
  }
  
  if (!start_time || !end_time) {
    return res.status(400).json({
      success: false,
      error: 'start_time과 end_time 파라미터가 필요합니다.'
    });
  }
  
  const startTime = new Date(start_time as string);
  const endTime = new Date(end_time as string);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return res.status(400).json({
      success: false,
      error: '유효한 날짜 형식을 사용해주세요 (ISO 8601).'
    });
  }
  
  const data = await historicalDataGenerator.generateAggregatedData(
    sensorId, 
    startTime, 
    endTime, 
    interval as 'hour' | 'day'
  );
  
  res.json({
    success: true,
    data,
    sensor_id: sensorId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    interval,
    total_points: data.length
  });
}));

// GET /api/analytics/summary - Get analytics summary
router.get('/summary', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { period = '24h' } = req.query;

  // Calculate time filter based on period
  let timeFilter = "datetime('now', '-24 hours')";
  switch (period) {
    case '1h':
      timeFilter = "datetime('now', '-1 hour')";
      break;
    case '12h':
      timeFilter = "datetime('now', '-12 hours')";
      break;
    case '7d':
      timeFilter = "datetime('now', '-7 days')";
      break;
    case '30d':
      timeFilter = "datetime('now', '-30 days')";
      break;
  }

  // Get summary statistics
  const summary = await db.get(`
    SELECT 
      COUNT(DISTINCT s.id) as total_sensors,
      COUNT(CASE WHEN s.is_active = 1 THEN 1 END) as active_sensors,
      COUNT(DISTINCT sd.sensor_id) as sensors_with_data,
      COUNT(sd.id) as total_data_points,
      (SELECT COUNT(*) FROM alerts WHERE created_at > ${timeFilter}) as alerts_created,
      (SELECT COUNT(*) FROM alerts WHERE is_resolved = 0) as unresolved_alerts
    FROM sensors s
    LEFT JOIN sensor_data sd ON s.id = sd.sensor_id
    AND sd.timestamp > ${timeFilter}
  `);

  // Get status distribution for current period
  const statusStats = await db.all(`
    SELECT 
      sd.status,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / (
        SELECT COUNT(*) 
        FROM sensor_data 
        WHERE timestamp > ${timeFilter}
      ), 2) as percentage
    FROM sensor_data sd
    WHERE sd.timestamp > ${timeFilter}
    GROUP BY sd.status
    ORDER BY count DESC
  `);

  // Get sensor type performance
  const sensorTypeStats = await db.all(`
    SELECT 
      s.type,
      s.unit,
      COUNT(sd.id) as data_points,
      AVG(sd.value) as avg_value,
      MIN(sd.value) as min_value,
      MAX(sd.value) as max_value,
      -- SQLite doesn't have STDDEV, calculate manually
      CASE 
        WHEN COUNT(sd.value) > 1 THEN
          SQRT(
            (SUM(sd.value * sd.value) - (SUM(sd.value) * SUM(sd.value) / COUNT(sd.value))) 
            / (COUNT(sd.value) - 1)
          )
        ELSE 0
      END as std_deviation,
      COUNT(CASE WHEN sd.status = 'normal' THEN 1 END) as normal_count,
      COUNT(CASE WHEN sd.status = 'warning' THEN 1 END) as warning_count,
      COUNT(CASE WHEN sd.status = 'critical' THEN 1 END) as critical_count
    FROM sensors s
    JOIN sensor_data sd ON s.id = sd.sensor_id
    WHERE sd.timestamp > ${timeFilter}
    AND s.is_active = 1
    GROUP BY s.type, s.unit
    ORDER BY data_points DESC
  `);

  // Get zone performance
  const zoneStats = await db.all(`
    SELECT 
      z.id,
      z.name,
      z.level,
      z.crop_type,
      COUNT(sd.id) as data_points,
      COUNT(CASE WHEN sd.status = 'normal' THEN 1 END) as normal_count,
      COUNT(CASE WHEN sd.status = 'warning' THEN 1 END) as warning_count,
      COUNT(CASE WHEN sd.status = 'critical' THEN 1 END) as critical_count,
      ROUND(COUNT(CASE WHEN sd.status = 'normal' THEN 1 END) * 100.0 / COUNT(sd.id), 2) as health_score
    FROM farm_zones z
    JOIN sensors s ON z.id = s.zone_id
    JOIN sensor_data sd ON s.id = sd.sensor_id
    WHERE sd.timestamp > ${timeFilter}
    AND s.is_active = 1
    GROUP BY z.id, z.name, z.level, z.crop_type
    ORDER BY health_score DESC
  `);

  res.json({
    success: true,
    data: {
      period,
      summary,
      status_distribution: statusStats,
      sensor_types: sensorTypeStats,
      zones: zoneStats,
      generated_at: new Date().toISOString()
    }
  });
}));

// POST /api/analytics/query - Custom analytics query
router.post('/query', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { 
    sensor_ids = [],
    zone_ids = [],
    sensor_types = [],
    start_date,
    end_date,
    aggregation = 'hourly',
    metrics = ['avg', 'min', 'max']
  } = req.body;

  // Build WHERE conditions
  const conditions: string[] = ['s.is_active = 1'];
  const params: any[] = [];

  if (sensor_ids.length > 0) {
    conditions.push(`s.id IN (${sensor_ids.map(() => '?').join(',')})`);
    params.push(...sensor_ids);
  }

  if (zone_ids.length > 0) {
    conditions.push(`s.zone_id IN (${zone_ids.map(() => '?').join(',')})`);
    params.push(...zone_ids);
  }

  if (sensor_types.length > 0) {
    conditions.push(`s.type IN (${sensor_types.map(() => '?').join(',')})`);
    params.push(...sensor_types);
  }

  if (start_date) {
    conditions.push('sd.timestamp >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('sd.timestamp <= ?');
    params.push(end_date);
  }

  // Build aggregation time format
  let timeFormat: string;
  switch (aggregation) {
    case 'minute':
      timeFormat = '%Y-%m-%d %H:%M';
      break;
    case 'hourly':
      timeFormat = '%Y-%m-%d %H:00';
      break;
    case 'daily':
      timeFormat = '%Y-%m-%d';
      break;
    case 'weekly':
      timeFormat = '%Y-W%W';
      break;
    default:
      timeFormat = '%Y-%m-%d %H:00';
  }

  // Build metrics selection
  const metricSelections = metrics.map(metric => {
    switch (metric) {
      case 'avg':
        return 'AVG(sd.value) as avg_value';
      case 'min':
        return 'MIN(sd.value) as min_value';
      case 'max':
        return 'MAX(sd.value) as max_value';
      case 'count':
        return 'COUNT(sd.id) as data_count';
      case 'stddev':
        return 'CASE WHEN COUNT(sd.value) > 1 THEN SQRT((SUM(sd.value * sd.value) - (SUM(sd.value) * SUM(sd.value) / COUNT(sd.value))) / (COUNT(sd.value) - 1)) ELSE 0 END as std_deviation';
      default:
        return 'AVG(sd.value) as avg_value';
    }
  }).join(', ');

  const query = `
    SELECT 
      strftime('${timeFormat}', sd.timestamp) as time_period,
      s.type as sensor_type,
      s.unit,
      z.name as zone_name,
      z.id as zone_id,
      ${metricSelections}
    FROM sensor_data sd
    JOIN sensors s ON sd.sensor_id = s.id
    JOIN farm_zones z ON s.zone_id = z.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY time_period, s.type, s.unit, z.id
    ORDER BY time_period DESC, s.type, z.id
  `;

  const results = await db.all(query, params);

  res.json({
    success: true,
    data: {
      query_params: req.body,
      results,
      count: results.length
    }
  });
}));

// GET /api/analytics/alerts - Get alerts with analytics
router.get('/alerts', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { 
    severity,
    resolved = 'all',
    limit = 50,
    page = 1
  } = req.query;

  // Build WHERE conditions
  const conditions: string[] = [];
  const params: any[] = [];

  if (severity && severity !== 'all') {
    conditions.push('a.severity = ?');
    params.push(severity);
  }

  if (resolved === 'true') {
    conditions.push('a.is_resolved = 1');
  } else if (resolved === 'false') {
    conditions.push('a.is_resolved = 0');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get alerts with sensor and zone information
  const limitNum = Math.min(parseInt(limit as string) || 50, 200);
  const pageNum = Math.max(parseInt(page as string) || 1, 1);
  const offset = (pageNum - 1) * limitNum;

  const alerts = await db.all<AlertWithSensor[]>(`
    SELECT 
      a.*,
      s.name as sensor_name,
      s.type as sensor_type,
      z.name as zone_name,
      z.id as zone_id
    FROM alerts a
    JOIN sensors s ON a.sensor_id = s.id
    JOIN farm_zones z ON s.zone_id = z.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, limitNum, offset]);

  // Get total count
  const { total } = await db.get<{ total: number }>(`
    SELECT COUNT(*) as total 
    FROM alerts a
    JOIN sensors s ON a.sensor_id = s.id
    ${whereClause}
  `, params);

  // Get alert statistics
  const alertStats = await db.all(`
    SELECT 
      a.severity,
      COUNT(*) as count,
      COUNT(CASE WHEN a.is_resolved = 0 THEN 1 END) as unresolved_count
    FROM alerts a
    GROUP BY a.severity
    ORDER BY 
      CASE a.severity 
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        WHEN 'info' THEN 3
      END
  `);

  res.json({
    success: true,
    data: {
      alerts,
      statistics: alertStats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// GET /api/analytics/trends - Get trending data
router.get('/trends', asyncHandler(async (req, res) => {
  const db: Database = req.app.locals.db;
  const { 
    sensor_type,
    zone_id,
    period = '24h',
    interval = 'hour'
  } = req.query;

  // Calculate time filter
  let timeFilter = "datetime('now', '-24 hours')";
  switch (period) {
    case '1h':
      timeFilter = "datetime('now', '-1 hour')";
      break;
    case '12h':
      timeFilter = "datetime('now', '-12 hours')";
      break;
    case '7d':
      timeFilter = "datetime('now', '-7 days')";
      break;
    case '30d':
      timeFilter = "datetime('now', '-30 days')";
      break;
  }

  // Set time format based on interval
  let timeFormat = '%Y-%m-%d %H:00';
  switch (interval) {
    case 'minute':
      timeFormat = '%Y-%m-%d %H:%M';
      break;
    case 'day':
      timeFormat = '%Y-%m-%d';
      break;
    case 'week':
      timeFormat = '%Y-W%W';
      break;
  }

  // Build conditions
  const conditions = [`sd.timestamp > ${timeFilter}`, 's.is_active = 1'];
  const params: any[] = [];

  if (sensor_type) {
    conditions.push('s.type = ?');
    params.push(sensor_type);
  }

  if (zone_id) {
    conditions.push('s.zone_id = ?');
    params.push(zone_id);
  }

  const trendData = await db.all(`
    SELECT 
      strftime('${timeFormat}', sd.timestamp) as time_period,
      s.type,
      s.unit,
      AVG(sd.value) as avg_value,
      MIN(sd.value) as min_value,
      MAX(sd.value) as max_value,
      COUNT(sd.id) as data_points,
      COUNT(CASE WHEN sd.status = 'normal' THEN 1 END) as normal_count,
      COUNT(CASE WHEN sd.status = 'warning' THEN 1 END) as warning_count,
      COUNT(CASE WHEN sd.status = 'critical' THEN 1 END) as critical_count
    FROM sensor_data sd
    JOIN sensors s ON sd.sensor_id = s.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY time_period, s.type, s.unit
    ORDER BY time_period ASC, s.type
  `, params);

  res.json({
    success: true,
    data: {
      period,
      interval,
      sensor_type,
      zone_id,
      trends: trendData,
      generated_at: new Date().toISOString()
    }
  });
}));

export default router;