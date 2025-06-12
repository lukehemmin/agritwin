-- 식물 테이블 생성
CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    farm_zone_id VARCHAR(50) NOT NULL,
    plant_type VARCHAR(50) NOT NULL, -- lettuce, spinach, kale, arugula, basil, mint
    position_x DECIMAL(10,6) NOT NULL,
    position_y DECIMAL(10,6) NOT NULL,
    position_z DECIMAL(10,6) NOT NULL,
    planted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    growth_stage VARCHAR(20) DEFAULT 'seed', -- seed, sprout, growing, mature, harvest, dead
    growth_progress DECIMAL(5,2) DEFAULT 0.0, -- 0-100%
    health_status VARCHAR(20) DEFAULT 'healthy', -- healthy, stressed, sick, dead
    size_multiplier DECIMAL(4,2) DEFAULT 1.0, -- 크기 배수
    last_watered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_fertilized TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_zone_id) REFERENCES farm_zones(id) ON DELETE CASCADE
);

-- 식물 성장 히스토리 테이블
CREATE TABLE IF NOT EXISTS plant_growth_history (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL,
    previous_stage VARCHAR(20),
    new_stage VARCHAR(20),
    previous_progress DECIMAL(5,2),
    new_progress DECIMAL(5,2),
    change_reason TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

-- 식물 건강 이벤트 테이블
CREATE TABLE IF NOT EXISTS plant_health_events (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- temperature_stress, water_stress, nutrient_deficiency, disease, recovery
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    description TEXT,
    sensor_readings JSONB, -- 관련 센서 데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
);

-- 식물 타입별 성장 설정 테이블
CREATE TABLE IF NOT EXISTS plant_growth_configs (
    plant_type VARCHAR(50) PRIMARY KEY,
    seed_duration_days INTEGER DEFAULT 3,
    sprout_duration_days INTEGER DEFAULT 7,
    growing_duration_days INTEGER DEFAULT 21,
    mature_duration_days INTEGER DEFAULT 14,
    optimal_temp_min DECIMAL(4,1) DEFAULT 18.0,
    optimal_temp_max DECIMAL(4,1) DEFAULT 24.0,
    optimal_humidity_min DECIMAL(4,1) DEFAULT 60.0,
    optimal_humidity_max DECIMAL(4,1) DEFAULT 80.0,
    water_frequency_hours INTEGER DEFAULT 24,
    fertilizer_frequency_days INTEGER DEFAULT 7,
    growth_rate_multiplier DECIMAL(3,2) DEFAULT 1.0
);

-- 기본 식물 타입 설정 데이터 삽입
INSERT INTO plant_growth_configs (plant_type, seed_duration_days, sprout_duration_days, growing_duration_days, mature_duration_days, optimal_temp_min, optimal_temp_max, optimal_humidity_min, optimal_humidity_max) VALUES
('lettuce', 2, 5, 18, 12, 16.0, 22.0, 65.0, 85.0),
('spinach', 3, 6, 20, 10, 15.0, 20.0, 60.0, 80.0),
('kale', 3, 7, 25, 15, 15.0, 21.0, 60.0, 75.0),
('arugula', 2, 4, 15, 8, 16.0, 22.0, 65.0, 80.0),
('basil', 4, 8, 28, 20, 20.0, 26.0, 70.0, 85.0),
('mint', 5, 10, 30, 25, 18.0, 24.0, 70.0, 90.0);

-- 인덱스 생성
CREATE INDEX idx_plants_farm_zone_id ON plants(farm_zone_id);
CREATE INDEX idx_plants_growth_stage ON plants(growth_stage);
CREATE INDEX idx_plants_health_status ON plants(health_status);
CREATE INDEX idx_plant_growth_history_plant_id ON plant_growth_history(plant_id);
CREATE INDEX idx_plant_health_events_plant_id ON plant_health_events(plant_id);
CREATE INDEX idx_plant_health_events_created_at ON plant_health_events(created_at);