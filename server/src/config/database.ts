import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { logger } from '../utils/logger';
import { SENSOR_TYPES, FARM_CONFIG } from './constants';

let dbInstance: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const dbPath = path.join(__dirname, '../../data/agritwin.db');
    
    // Ensure data directory exists
    const fs = await import('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Open database connection
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await dbInstance.exec('PRAGMA foreign_keys = ON');

    // Create tables
    await createTables(dbInstance);
    
    // Seed initial data
    await seedInitialData(dbInstance);
    
    logger.info('Database initialized successfully');
    return dbInstance;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

async function createTables(db: Database): Promise<void> {
  // Create farm_zones table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS farm_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      area REAL NOT NULL,
      crop_type TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      position_z REAL DEFAULT 0,
      size_x REAL DEFAULT 5,
      size_y REAL DEFAULT 5,
      size_z REAL DEFAULT 2.5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create sensors table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone_id TEXT,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      position_z REAL DEFAULT 0,
      min_normal REAL,
      max_normal REAL,
      min_warning REAL,
      max_warning REAL,
      min_critical REAL,
      max_critical REAL,
      unit TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (zone_id) REFERENCES farm_zones (id)
    )
  `);

  // Create sensor_data table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      status TEXT CHECK(status IN ('normal', 'warning', 'critical')) DEFAULT 'normal',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sensor_id) REFERENCES sensors (id)
    )
  `);

  // Create alerts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
      is_resolved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (sensor_id) REFERENCES sensors (id)
    )
  `);

  // Create system_settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id ON sensor_data(sensor_id);
    CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
    CREATE INDEX IF NOT EXISTS idx_sensors_zone_id ON sensors(zone_id);
    CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
  `);

  logger.info('Database tables created successfully');
}

async function seedInitialData(db: Database): Promise<void> {
  // Check if data already exists
  const existingZones = await db.get('SELECT COUNT(*) as count FROM farm_zones');
  if (existingZones.count > 0) {
    logger.info('Database already seeded, skipping initial data');
    return;
  }

  // Import and run the new seeder
  const { runSeeders } = await import('../database/seeders/run-seeders');
  await runSeeders(db);
  return;

  // Create farm zones (3층 x 2구역 = 6개 구역)
  const zones = [
    { id: 'zone-1-1', name: '1층 A구역', level: 1, area: 25.0, crop_type: '상추', position: { x: -2.5, y: 0, z: 1.25 } },
    { id: 'zone-1-2', name: '1층 B구역', level: 1, area: 25.0, crop_type: '시금치', position: { x: 2.5, y: 0, z: 1.25 } },
    { id: 'zone-2-1', name: '2층 A구역', level: 2, area: 25.0, crop_type: '케일', position: { x: -2.5, y: 0, z: 3.75 } },
    { id: 'zone-2-2', name: '2층 B구역', level: 2, area: 25.0, crop_type: '루꼴라', position: { x: 2.5, y: 0, z: 3.75 } },
    { id: 'zone-3-1', name: '3층 A구역', level: 3, area: 25.0, crop_type: '바질', position: { x: -2.5, y: 0, z: 6.25 } },
    { id: 'zone-3-2', name: '3층 B구역', level: 3, area: 25.0, crop_type: '민트', position: { x: 2.5, y: 0, z: 6.25 } }
  ];

  for (const zone of zones) {
    await db.run(`
      INSERT INTO farm_zones (id, name, level, area, crop_type, position_x, position_y, position_z)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      zone.id, zone.name, zone.level, zone.area, zone.crop_type,
      zone.position.x, zone.position.y, zone.position.z
    ]);
  }

  // Create sensors for each zone
  const sensorTypes = Object.values(SENSOR_TYPES);
  const sensorRanges = {
    [SENSOR_TYPES.TEMPERATURE]: { unit: '°C', normal: [20, 28], warning: [18, 30], critical: [15, 35] },
    [SENSOR_TYPES.HUMIDITY]: { unit: '%', normal: [60, 75], warning: [50, 80], critical: [30, 90] },
    [SENSOR_TYPES.SOIL_MOISTURE]: { unit: '%', normal: [40, 70], warning: [30, 75], critical: [20, 80] },
    [SENSOR_TYPES.LIGHT]: { unit: 'lux', normal: [20000, 40000], warning: [15000, 45000], critical: [1000, 50000] },
    [SENSOR_TYPES.CO2]: { unit: 'ppm', normal: [800, 1200], warning: [600, 1300], critical: [300, 1500] }
  };

  for (const zone of zones) {
    for (let i = 0; i < sensorTypes.length; i++) {
      const sensorType = sensorTypes[i];
      const ranges = sensorRanges[sensorType];
      
      // Calculate sensor position within the zone
      const angle = (i / sensorTypes.length) * 2 * Math.PI;
      const radius = 1.5;
      const sensorX = zone.position.x + Math.cos(angle) * radius;
      const sensorY = zone.position.y + Math.sin(angle) * radius;
      const sensorZ = zone.position.z;

      await db.run(`
        INSERT INTO sensors (
          id, name, type, zone_id, position_x, position_y, position_z,
          min_normal, max_normal, min_warning, max_warning, min_critical, max_critical, unit, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `${zone.id}-${sensorType}`,
        `${zone.name} ${getSensorDisplayName(sensorType)} 센서`,
        sensorType,
        zone.id,
        sensorX, sensorY, sensorZ,
        ranges.normal[0], ranges.normal[1],
        ranges.warning[0], ranges.warning[1],
        ranges.critical[0], ranges.critical[1],
        ranges.unit,
        1
      ]);
    }
  }

  // Insert system settings
  const settings = [
    { key: 'data_retention_days', value: '30', description: '센서 데이터 보관 기간 (일)' },
    { key: 'alert_check_interval', value: '10000', description: '알림 체크 간격 (밀리초)' },
    { key: 'sensor_update_interval', value: '5000', description: '센서 데이터 업데이트 간격 (밀리초)' }
  ];

  for (const setting of settings) {
    await db.run(`
      INSERT INTO system_settings (key, value, description)
      VALUES (?, ?, ?)
    `, [setting.key, setting.value, setting.description]);
  }

  logger.info('Initial data seeded successfully');
}

function getSensorDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    [SENSOR_TYPES.TEMPERATURE]: '온도',
    [SENSOR_TYPES.HUMIDITY]: '습도',
    [SENSOR_TYPES.SOIL_MOISTURE]: '토양수분',
    [SENSOR_TYPES.LIGHT]: '조도',
    [SENSOR_TYPES.CO2]: 'CO2'
  };
  return displayNames[type] || type;
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}