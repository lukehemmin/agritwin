import { initializeDatabase } from '../config/database';
import { Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

describe('Database Initialization', () => {
  let db: Database;
  const testDbPath = path.join(__dirname, '../../../data/test_agritwin.db');

  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('initializes database successfully', async () => {
    db = await initializeDatabase();
    expect(db).toBeDefined();
  });

  test('creates required tables', async () => {
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tableNames = tables.map(table => table.name);
    
    expect(tableNames).toContain('farm_zones');
    expect(tableNames).toContain('sensors');
    expect(tableNames).toContain('sensor_data');
    expect(tableNames).toContain('alerts');
    expect(tableNames).toContain('system_settings');
  });

  test('creates required indexes', async () => {
    const indexes = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const indexNames = indexes.map(index => index.name);
    
    expect(indexNames).toContain('idx_sensor_data_sensor_id');
    expect(indexNames).toContain('idx_sensor_data_timestamp');
    expect(indexNames).toContain('idx_alerts_sensor_id');
    expect(indexNames).toContain('idx_sensors_zone_id');
    expect(indexNames).toContain('idx_sensors_type');
  });

  test('creates initial farm zones', async () => {
    const zones = await db.all('SELECT * FROM farm_zones ORDER BY id');
    
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0]).toHaveProperty('id');
    expect(zones[0]).toHaveProperty('name');
    expect(zones[0]).toHaveProperty('level');
    expect(zones[0]).toHaveProperty('crop_type');
  });

  test('creates initial sensors', async () => {
    const sensors = await db.all('SELECT * FROM sensors ORDER BY id');
    
    expect(sensors.length).toBeGreaterThan(0);
    expect(sensors[0]).toHaveProperty('id');
    expect(sensors[0]).toHaveProperty('name');
    expect(sensors[0]).toHaveProperty('type');
    expect(sensors[0]).toHaveProperty('zone_id');
    expect(sensors[0]).toHaveProperty('unit');
  });

  test('creates system settings', async () => {
    const settings = await db.all('SELECT * FROM system_settings ORDER BY key');
    
    expect(settings.length).toBeGreaterThan(0);
    expect(settings[0]).toHaveProperty('key');
    expect(settings[0]).toHaveProperty('value');
    expect(settings[0]).toHaveProperty('description');
  });

  test('enforces foreign key constraints', async () => {
    const result = await db.get('PRAGMA foreign_keys');
    expect(result.foreign_keys).toBe(1);
  });

  test('validates sensor data constraints', async () => {
    // Test invalid status constraint
    await expect(
      db.run(`
        INSERT INTO sensor_data (sensor_id, value, unit, status, timestamp)
        VALUES ('test-sensor', 25.5, '°C', 'invalid_status', datetime('now'))
      `)
    ).rejects.toThrow();
  });

  test('validates alert severity constraints', async () => {
    // First create a sensor to reference
    await db.run(`
      INSERT INTO sensors (id, name, type, unit, is_active)
      VALUES ('test-sensor', 'Test Sensor', 'temperature', '°C', 1)
    `);

    // Test invalid severity constraint
    await expect(
      db.run(`
        INSERT INTO alerts (sensor_id, message, severity)
        VALUES ('test-sensor', 'Test alert', 'invalid_severity')
      `)
    ).rejects.toThrow();
  });

  test('validates sensor type constraints', async () => {
    // Test invalid sensor type constraint
    await expect(
      db.run(`
        INSERT INTO sensors (id, name, type, unit, is_active)
        VALUES ('test-sensor-2', 'Test Sensor 2', 'invalid_type', '°C', 1)
      `)
    ).rejects.toThrow();
  });

  test('creates views for complex queries', async () => {
    const views = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='view'
      ORDER BY name
    `);

    const viewNames = views.map(view => view.name);
    
    expect(viewNames).toContain('sensors_with_zone');
    expect(viewNames).toContain('alerts_with_details');
  });

  test('sensors_with_zone view works correctly', async () => {
    const result = await db.all('SELECT * FROM sensors_with_zone LIMIT 1');
    
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('zone_name');
      expect(result[0]).toHaveProperty('zone_level');
    }
  });
});