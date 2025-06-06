-- AgriTwin Database Schema
-- Migration: 001_create_tables.sql
-- Created: Initial schema creation

-- 농장 구역 테이블
CREATE TABLE IF NOT EXISTS farm_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  area REAL NOT NULL,
  crop_type TEXT,
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  size_x REAL DEFAULT 1,
  size_y REAL DEFAULT 1,
  size_z REAL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 센서 테이블
CREATE TABLE IF NOT EXISTS sensors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('temperature', 'humidity', 'soil_moisture', 'light', 'co2')),
  zone_id TEXT,
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  unit TEXT NOT NULL,
  min_normal REAL DEFAULT 0,
  max_normal REAL DEFAULT 100,
  min_warning REAL DEFAULT 0,
  max_warning REAL DEFAULT 100,
  min_critical REAL DEFAULT 0,
  max_critical REAL DEFAULT 100,
  is_active BOOLEAN DEFAULT 1,
  latest_value REAL,
  latest_status TEXT DEFAULT 'normal' CHECK(latest_status IN ('normal', 'warning', 'critical')),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zone_id) REFERENCES farm_zones (id) ON DELETE SET NULL
);

-- 센서 데이터 테이블
CREATE TABLE IF NOT EXISTS sensor_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'warning', 'critical')),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES sensors (id) ON DELETE CASCADE
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'critical')),
  is_resolved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (sensor_id) REFERENCES sensors (id) ON DELETE CASCADE
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id ON sensor_data(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_status ON sensor_data(status);
CREATE INDEX IF NOT EXISTS idx_sensors_zone_id ON sensors(zone_id);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensors_active ON sensors(is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_farm_zones_level ON farm_zones(level);

-- 뷰 생성 (자주 사용되는 조인 쿼리)
CREATE VIEW IF NOT EXISTS sensors_with_zone AS
SELECT 
  s.*,
  fz.name as zone_name,
  fz.level as zone_level,
  fz.crop_type as zone_crop_type
FROM sensors s
LEFT JOIN farm_zones fz ON s.zone_id = fz.id;

CREATE VIEW IF NOT EXISTS alerts_with_details AS
SELECT 
  a.*,
  s.name as sensor_name,
  s.type as sensor_type,
  fz.name as zone_name,
  fz.id as zone_id
FROM alerts a
JOIN sensors s ON a.sensor_id = s.id
LEFT JOIN farm_zones fz ON s.zone_id = fz.id;

-- 트리거: 센서 데이터 삽입 시 센서의 latest_value와 latest_status 업데이트
CREATE TRIGGER IF NOT EXISTS update_sensor_latest_data 
AFTER INSERT ON sensor_data
BEGIN
  UPDATE sensors 
  SET 
    latest_value = NEW.value,
    latest_status = NEW.status,
    last_updated = NEW.timestamp
  WHERE id = NEW.sensor_id;
END;

-- 트리거: 오래된 센서 데이터 자동 삭제 (30일 이상)
CREATE TRIGGER IF NOT EXISTS cleanup_old_sensor_data
AFTER INSERT ON sensor_data
WHEN (SELECT COUNT(*) FROM sensor_data WHERE sensor_id = NEW.sensor_id) > 1000
BEGIN
  DELETE FROM sensor_data 
  WHERE sensor_id = NEW.sensor_id 
  AND timestamp < datetime('now', '-30 days');
END;