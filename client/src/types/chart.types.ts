export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  timestamp?: string;
  status?: 'normal' | 'warning' | 'critical';
}

export interface SensorChartData {
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
  unit: string;
  data: ChartDataPoint[];
  latest_value: number;
  latest_status: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  animation?: {
    duration: number;
  };
  scales?: any;
  plugins?: any;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
  }>;
}

export interface DonutChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }>;
}

export const CHART_COLORS = {
  temperature: '#FF6384',
  humidity: '#36A2EB', 
  soil_moisture: '#4BC0C0',
  light: '#FFCE56',
  co2: '#9966FF',
  normal: '#4CAF50',
  warning: '#FF9800',
  critical: '#F44336'
} as const;

export const CHART_BACKGROUNDS = {
  temperature: '#FF638420',
  humidity: '#36A2EB20',
  soil_moisture: '#4BC0C020',
  light: '#FFCE5620',
  co2: '#9966FF20',
  normal: '#4CAF5020',
  warning: '#FF980020',
  critical: '#F4433620'
} as const;