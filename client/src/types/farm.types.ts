import { Sensor } from './sensor.types';

export interface FarmZone {
  id: string;
  name: string;
  level: number;
  area: number;
  crop_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  size_x: number;
  size_y: number;
  size_z: number;
  created_at: string;
  sensors?: Sensor[];
  sensor_count?: number;
  health_score?: number;
  description?: string; // 구역에 대한 설명 추가
}

export interface FarmStructure {
  id: string;
  name: string;
  total_levels: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  zones: FarmZone[];
}

export interface FarmSummary {
  overview: {
    total_zones: number;
    total_sensors: number;
    active_sensors: number;
    unresolved_alerts: number;
  };
  status_distribution: Array<{
    status: string;
    count: number;
  }>;
  zone_statistics: Array<{
    id: string;
    name: string;
    level: number;
    crop_type: string;
    sensor_count: number;
    active_sensor_count: number;
  }>;
  sensor_averages: Array<{
    type: string;
    unit: string;
    avg_value: number;
    min_value: number;
    max_value: number;
    data_points: number;
  }>;
  last_updated: string;
}