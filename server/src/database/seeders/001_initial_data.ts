import { Database } from 'sqlite';

export async function seedInitialData(db: Database) {
  console.log('Seeding initial data...');
  
  try {
    // 기존 데이터 확인 (이미 시드 데이터가 있으면 스킵)
    const existingZones = await db.get('SELECT COUNT(*) as count FROM farm_zones');
    if (existingZones.count > 0) {
      console.log('Initial data already exists, skipping seed...');
      return;
    }
    
    // 농장 구역 데이터 생성 (3층 수직농장)
    const zones = [
      {
        id: 'zone-1-1',
        name: '1층 A구역',
        level: 1,
        area: 25.0,
        crop_type: '상추',
        position_x: -2.5,
        position_y: 0,
        position_z: 0,
        size_x: 5,
        size_y: 5,
        size_z: 2
      },
      {
        id: 'zone-1-2',
        name: '1층 B구역',
        level: 1,
        area: 25.0,
        crop_type: '시금치',
        position_x: 2.5,
        position_y: 0,
        position_z: 0,
        size_x: 5,
        size_y: 5,
        size_z: 2
      },
      {
        id: 'zone-2-1',
        name: '2층 A구역',
        level: 2,
        area: 25.0,
        crop_type: '케일',
        position_x: -2.5,
        position_y: 0,
        position_z: 3,
        size_x: 5,
        size_y: 5,
        size_z: 2
      },
      {
        id: 'zone-2-2',
        name: '2층 B구역',
        level: 2,
        area: 25.0,
        crop_type: '루꼴라',
        position_x: 2.5,
        position_y: 0,
        position_z: 3,
        size_x: 5,
        size_y: 5,
        size_z: 2
      },
      {
        id: 'zone-3-1',
        name: '3층 A구역',
        level: 3,
        area: 25.0,
        crop_type: '바질',
        position_x: -2.5,
        position_y: 0,
        position_z: 6,
        size_x: 5,
        size_y: 5,
        size_z: 2
      },
      {
        id: 'zone-3-2',
        name: '3층 B구역',
        level: 3,
        area: 25.0,
        crop_type: '민트',
        position_x: 2.5,
        position_y: 0,
        position_z: 6,
        size_x: 5,
        size_y: 5,
        size_z: 2
      }
    ];

    // 농장 구역 삽입
    for (const zone of zones) {
      await db.run(`
        INSERT INTO farm_zones (
          id, name, level, area, crop_type, 
          position_x, position_y, position_z,
          size_x, size_y, size_z
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        zone.id, zone.name, zone.level, zone.area, zone.crop_type,
        zone.position_x, zone.position_y, zone.position_z,
        zone.size_x, zone.size_y, zone.size_z
      ]);
    }
    console.log(`✓ Created ${zones.length} farm zones`);

    // 센서 타입별 설정
    const sensorConfigs = {
      temperature: {
        unit: '°C',
        min_normal: 18,
        max_normal: 25,
        min_warning: 15,
        max_warning: 30,
        min_critical: 10,
        max_critical: 35
      },
      humidity: {
        unit: '%',
        min_normal: 60,
        max_normal: 80,
        min_warning: 50,
        max_warning: 90,
        min_critical: 30,
        max_critical: 95
      },
      soil_moisture: {
        unit: '%',
        min_normal: 40,
        max_normal: 70,
        min_warning: 30,
        max_warning: 80,
        min_critical: 20,
        max_critical: 90
      },
      light: {
        unit: 'lux',
        min_normal: 15000,
        max_normal: 25000,
        min_warning: 10000,
        max_warning: 30000,
        min_critical: 5000,
        max_critical: 40000
      },
      co2: {
        unit: 'ppm',
        min_normal: 800,
        max_normal: 1200,
        min_warning: 600,
        max_warning: 1500,
        min_critical: 400,
        max_critical: 2000
      }
    };

    const sensorTypes = Object.keys(sensorConfigs);
    let sensorCount = 0;

    // 센서 생성 (각 구역당 5개 센서)
    for (const zone of zones) {
      for (let i = 0; i < sensorTypes.length; i++) {
        const sensorType = sensorTypes[i];
        const config = sensorConfigs[sensorType as keyof typeof sensorConfigs];
        
        // 센서 위치를 구역 내에 분산 배치
        const offsetX = (i % 2) * 2 - 1; // -1 또는 1
        const offsetY = Math.floor(i / 2) * 2 - 1; // -1 또는 1
        
        const sensorId = `${zone.id}-${sensorType}`;
        
        await db.run(`
          INSERT INTO sensors (
            id, name, type, zone_id, unit,
            position_x, position_y, position_z,
            min_normal, max_normal,
            min_warning, max_warning,
            min_critical, max_critical,
            is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sensorId,
          `${zone.name} ${getSensorTypeLabel(sensorType)} 센서`,
          sensorType,
          zone.id,
          config.unit,
          zone.position_x + offsetX,
          zone.position_y + offsetY,
          zone.position_z + 1,
          config.min_normal,
          config.max_normal,
          config.min_warning,
          config.max_warning,
          config.min_critical,
          config.max_critical,
          1
        ]);
        sensorCount++;
      }
    }
    console.log(`✓ Created ${sensorCount} sensors`);

    // 시스템 설정 초기화
    const systemSettings = [
      { key: 'farm_name', value: 'AgriTwin 수직농장', description: '농장 이름' },
      { key: 'data_retention_days', value: '30', description: '데이터 보관 기간 (일)' },
      { key: 'alert_enabled', value: 'true', description: '알림 활성화 여부' },
      { key: 'auto_calibration', value: 'false', description: '자동 캘리브레이션 여부' },
      { key: 'simulation_speed', value: '1', description: '시뮬레이션 속도 배율' }
    ];

    for (const setting of systemSettings) {
      await db.run(`
        INSERT INTO system_settings (key, value, description)
        VALUES (?, ?, ?)
      `, [setting.key, setting.value, setting.description]);
    }
    console.log(`✓ Created ${systemSettings.length} system settings`);

    // 초기 센서 데이터 생성 (최근 24시간)
    console.log('Generating initial sensor data...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24시간 전
    
    const sensors = await db.all('SELECT * FROM sensors WHERE is_active = 1');
    
    for (const sensor of sensors) {
      const config = sensorConfigs[sensor.type as keyof typeof sensorConfigs];
      
      // 1시간 간격으로 데이터 생성
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(startTime.getTime() + hour * 60 * 60 * 1000);
        const value = generateSensorValue(sensor.type, config);
        const status = calculateStatus(value, config);
        
        await db.run(`
          INSERT INTO sensor_data (sensor_id, value, unit, status, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `, [sensor.id, value, config.unit, status, timestamp.toISOString()]);
      }
    }
    console.log(`✓ Generated initial sensor data for ${sensors.length} sensors`);

    console.log('Initial data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}

function getSensorTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    temperature: '온도',
    humidity: '습도',
    soil_moisture: '토양수분',
    light: '조도',
    co2: 'CO2'
  };
  return labels[type] || type;
}

function generateSensorValue(type: string, config: any): number {
  // 센서 타입별 현실적인 값 생성
  const baseValue = (config.min_normal + config.max_normal) / 2;
  const variation = (config.max_normal - config.min_normal) * 0.3;
  
  // 시간대별 변화 패턴 추가
  const hour = new Date().getHours();
  let timeModifier = 1;
  
  if (type === 'temperature') {
    // 온도는 시간대별로 변화
    timeModifier = 1 + Math.sin((hour - 6) * Math.PI / 12) * 0.2;
  } else if (type === 'light') {
    // 조도는 주간/야간 차이
    timeModifier = hour >= 6 && hour <= 18 ? 1.2 : 0.3;
  }
  
  const randomValue = baseValue + (Math.random() - 0.5) * variation * timeModifier;
  return Math.round(randomValue * 10) / 10; // 소수점 1자리
}

function calculateStatus(value: number, config: any): string {
  if (value >= config.min_normal && value <= config.max_normal) {
    return 'normal';
  } else if (value >= config.min_warning && value <= config.max_warning) {
    return 'warning';
  } else {
    return 'critical';
  }
}