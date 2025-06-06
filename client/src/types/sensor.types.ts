export interface Sensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'co2';
  zone_id: string;
  position_x: number;
  position_y: number;
  position_z: number;
  min_normal: number;
  max_normal: number;
  min_warning: number;
  max_warning: number;
  min_critical: number;
  max_critical: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  latest_value?: number;
  latest_status?: 'normal' | 'warning' | 'critical';
  latest_timestamp?: string;
}

export interface SensorData {
  id: number;
  sensor_id: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

export interface SensorRanges {
  min_normal: number;
  max_normal: number;
  min_warning: number;
  max_warning: number;
  min_critical: number;
  max_critical: number;
}

export interface SensorStats {
  sensor_id: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  data_count: number;
  normal_count: number;
  warning_count: number;
  critical_count: number;
}

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

export const SENSOR_ICONS = {
  temperature: '🌡️',
  humidity: '💧',
  soil_moisture: '🌱',
  light: '💡',
  co2: '🫧'
} as const;