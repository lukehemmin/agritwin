import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

export interface Alert {
  id: number;
  sensor_id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
  sensor_name?: string;
  sensor_type?: string;
  zone_name?: string;
  zone_id?: string;
}

export interface AnalyticsSummary {
  period: string;
  summary: {
    total_sensors: number;
    active_sensors: number;
    sensors_with_data: number;
    total_data_points: number;
    alerts_created: number;
    unresolved_alerts: number;
  };
  status_distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  sensor_types: Array<{
    type: string;
    unit: string;
    data_points: number;
    avg_value: number;
    min_value: number;
    max_value: number;
    normal_count: number;
    warning_count: number;
    critical_count: number;
  }>;
  zones: Array<{
    id: string;
    name: string;
    level: number;
    crop_type: string;
    data_points: number;
    normal_count: number;
    warning_count: number;
    critical_count: number;
    health_score: number;
  }>;
  generated_at: string;
}

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health Check
  async getHealth(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Farm API
  async getFarmStructure(): Promise<FarmStructure> {
    const response = await this.api.get<ApiResponse<FarmStructure>>('/farm/structure');
    return response.data.data;
  }

  async getFarmZones(level?: number): Promise<FarmZone[]> {
    const params = level ? { level } : {};
    const response = await this.api.get<ApiResponse<FarmZone[]>>('/farm/zones', { params });
    return response.data.data;
  }

  async getFarmZone(zoneId: string): Promise<FarmZone> {
    const response = await this.api.get<ApiResponse<FarmZone>>(`/farm/zones/${zoneId}`);
    return response.data.data;
  }

  async updateFarmZone(zoneId: string, data: Partial<FarmZone>): Promise<FarmZone> {
    const response = await this.api.put<ApiResponse<FarmZone>>(`/farm/zones/${zoneId}`, data);
    return response.data.data;
  }

  async getFarmSummary(): Promise<any> {
    const response = await this.api.get<ApiResponse>('/farm/summary');
    return response.data.data;
  }

  // Sensors API
  async getSensors(): Promise<Sensor[]> {
    const response = await this.api.get<ApiResponse<Sensor[]>>('/sensors');
    return response.data.data;
  }

  async getSensor(sensorId: string): Promise<Sensor> {
    const response = await this.api.get<ApiResponse<Sensor>>(`/sensors/${sensorId}`);
    return response.data.data;
  }

  async getSensorData(
    sensorId: string,
    options?: {
      start?: string;
      end?: string;
      limit?: number;
      page?: number;
    }
  ): Promise<{ data: SensorData[]; pagination: any }> {
    const response = await this.api.get<ApiResponse<SensorData[]>>(`/sensors/${sensorId}/data`, {
      params: options,
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  async updateSensorRanges(sensorId: string, ranges: {
    min_normal: number;
    max_normal: number;
    min_warning: number;
    max_warning: number;
    min_critical: number;
    max_critical: number;
  }): Promise<void> {
    await this.api.put(`/sensors/${sensorId}/ranges`, ranges);
  }

  async calibrateSensor(sensorId: string): Promise<void> {
    await this.api.post(`/sensors/${sensorId}/calibrate`);
  }

  async toggleSensor(sensorId: string, isActive: boolean): Promise<void> {
    await this.api.put(`/sensors/${sensorId}/toggle`, { is_active: isActive });
  }

  // Analytics API
  async getAnalyticsSummary(period: string = '24h'): Promise<AnalyticsSummary> {
    const response = await this.api.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', {
      params: { period },
    });
    return response.data.data;
  }

  async queryAnalytics(query: {
    sensor_ids?: string[];
    zone_ids?: string[];
    sensor_types?: string[];
    start_date?: string;
    end_date?: string;
    aggregation?: 'minute' | 'hourly' | 'daily' | 'weekly';
    metrics?: string[];
  }): Promise<any> {
    const response = await this.api.post<ApiResponse>('/analytics/query', query);
    return response.data.data;
  }

  async getAlerts(options?: {
    severity?: string;
    resolved?: boolean;
    limit?: number;
    page?: number;
  }): Promise<{ alerts: Alert[]; statistics: any; pagination: any }> {
    const response = await this.api.get<ApiResponse>('/analytics/alerts', {
      params: options,
    });
    return response.data.data;
  }

  async getTrends(options?: {
    sensor_type?: string;
    zone_id?: string;
    period?: string;
    interval?: string;
  }): Promise<any> {
    const response = await this.api.get<ApiResponse>('/analytics/trends', {
      params: options,
    });
    return response.data.data;
  }

  // 24시간 시계열 데이터 조회 (과거 12시간 + 미래 12시간)
  async getTimeSeriesData(sensorId?: string): Promise<{
    data: Array<{
      timestamp: string;
      value: number;
      unit: string;
      status: 'normal' | 'warning' | 'critical';
      sensor_id: string;
      sensor_name: string;
      sensor_type: string;
    }>;
    sensor_id: string;
    total_points: number;
    time_range: string;
    generated_at: string;
  }> {
    const endpoint = sensorId ? `/analytics/time-series/${sensorId}` : '/analytics/time-series';
    const response = await this.api.get<any>(endpoint);
    return response.data;
  }

  // 집계 데이터 조회
  async getAggregatedData(
    sensorId: string,
    startTime: string,
    endTime: string,
    interval: 'hour' | 'day' = 'hour'
  ): Promise<{
    data: Array<{
      timestamp: string;
      average: number;
      min: number;
      max: number;
      sensor_id: string;
      sensor_name: string;
      unit: string;
    }>;
    sensor_id: string;
    start_time: string;
    end_time: string;
    interval: string;
    total_points: number;
  }> {
    const response = await this.api.get<any>(`/analytics/aggregated/${sensorId}`, {
      params: {
        start_time: startTime,
        end_time: endTime,
        interval,
      },
    });
    return response.data;
  }
}

// Singleton instance
export const apiService = new ApiService();