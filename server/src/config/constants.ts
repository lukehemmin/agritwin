export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  SOIL_MOISTURE: 'soil_moisture',
  LIGHT: 'light',
  CO2: 'co2'
} as const;

export const SENSOR_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

export const SENSOR_RANGES = {
  [SENSOR_TYPES.TEMPERATURE]: {
    unit: '°C',
    min: 15,
    max: 35,
    normal: { min: 20, max: 28 },
    warning: { min: 18, max: 30 },
    critical: { min: 15, max: 35 }
  },
  [SENSOR_TYPES.HUMIDITY]: {
    unit: '%',
    min: 30,
    max: 90,
    normal: { min: 60, max: 75 },
    warning: { min: 50, max: 80 },
    critical: { min: 30, max: 90 }
  },
  [SENSOR_TYPES.SOIL_MOISTURE]: {
    unit: '%',
    min: 20,
    max: 80,
    normal: { min: 40, max: 70 },
    warning: { min: 30, max: 75 },
    critical: { min: 20, max: 80 }
  },
  [SENSOR_TYPES.LIGHT]: {
    unit: 'lux',
    min: 1000,
    max: 50000,
    normal: { min: 20000, max: 40000 },
    warning: { min: 15000, max: 45000 },
    critical: { min: 1000, max: 50000 }
  },
  [SENSOR_TYPES.CO2]: {
    unit: 'ppm',
    min: 300,
    max: 1500,
    normal: { min: 800, max: 1200 },
    warning: { min: 600, max: 1300 },
    critical: { min: 300, max: 1500 }
  }
};

export const FARM_CONFIG = {
  TOTAL_LEVELS: 3,
  ZONES_PER_LEVEL: 2,
  SENSORS_PER_ZONE: 5,
  DIMENSIONS: {
    x: 10,
    y: 15,
    z: 8
  }
};

export const UPDATE_INTERVALS = {
  SENSOR_DATA: 2000, // 2초 (더 빠른 실시간 업데이트)
  ALERTS_CHECK: 5000, // 5초
  DATABASE_CLEANUP: 3600000 // 1시간
};