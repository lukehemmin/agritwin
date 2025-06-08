export interface Alert {
  id: number;
  sensor_id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_resolved: boolean;
  created_at: string; // ISO 8601 date string
  resolved_at?: string; // ISO 8601 date string, optional

  // Optional: For easier display, if API provides them
  sensor_name?: string;
  zone_id?: string;
  zone_name?: string;
}

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];
