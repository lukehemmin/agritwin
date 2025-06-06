export interface Sensor {
  id: string;
  name: string;
  type: string;
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
}

export interface SensorData {
  id: number;
  sensor_id: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

export interface SensorWithLatestData extends Sensor {
  latest_value?: number;
  latest_status?: string;
  latest_timestamp?: string;
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