export interface Alert {
  id: number;
  sensor_id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface AlertWithSensor extends Alert {
  sensor_name: string;
  sensor_type: string;
  zone_name: string;
  zone_id: string;
}