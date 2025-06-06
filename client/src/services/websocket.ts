import { io, Socket } from 'socket.io-client';

export interface SensorData {
  id: number;
  sensor_id: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
}

export interface AlertData {
  sensor_id: string;
  sensor_name: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  value: number;
  unit: string;
  timestamp: string;
}

export interface SensorStatusChange {
  sensorId: string;
  isActive: boolean;
  timestamp: string;
}

export interface AlertResolution {
  alertId: number;
  resolvedAt: string;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private onConnectionChange?: (connected: boolean) => void;
  private onSensorDataUpdate?: (data: SensorData[]) => void;
  private onSensorAlert?: (alert: AlertData) => void;
  private onSensorStatusChange?: (status: SensorStatusChange) => void;
  private onAlertResolution?: (resolution: AlertResolution) => void;
  private onError?: (error: any) => void;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.onConnectionChange?.(true);
      
      // 연결 즉시 센서 데이터 구독
      setTimeout(() => {
        console.log('🔄 Auto-subscribing to sensor data...');
        this.subscribeToSensorData();
        this.subscribeToAlerts();
      }, 500);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.onConnectionChange?.(false);
      
      // Auto-reconnect on unexpected disconnection
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.onError?.(error);
      this.handleReconnection();
    });

    // Welcome message
    this.socket.on('connected', (data) => {
      console.log('🎉 Welcome message:', data.message);
    });

    // Sensor data events
    this.socket.on('sensor-data:update', (data: SensorData[]) => {
      console.log('🔄 Real-time sensor data update:', data.length, 'sensors', data.slice(0, 2));
      this.onSensorDataUpdate?.(data);
    });

    this.socket.on('sensor-data:current', (data: any[]) => {
      console.log('📊 Current sensor data:', data.length, 'sensors', data.slice(0, 2));
      this.onSensorDataUpdate?.(data);
    });

    // Alert events
    this.socket.on('sensor:alert', (alert: AlertData) => {
      console.log('🚨 Sensor alert:', alert.severity, alert.message);
      this.onSensorAlert?.(alert);
    });

    this.socket.on('alert:resolved', (resolution: AlertResolution) => {
      console.log('✅ Alert resolved:', resolution.alertId);
      this.onAlertResolution?.(resolution);
    });

    // Status change events
    this.socket.on('sensor:status-changed', (status: SensorStatusChange) => {
      console.log('🔄 Sensor status changed:', status.sensorId, status.isActive);
      this.onSensorStatusChange?.(status);
    });

    // Zone data events
    this.socket.on('zone-data:current', (data: any) => {
      console.log('🏢 Zone data:', data.zoneId, data.sensors.length, 'sensors');
    });

    // System events
    this.socket.on('system:status', (status: any) => {
      console.log('🖥️ System status update:', status);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      this.onError?.(error);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔴 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Public methods
  public subscribeToSensorData() {
    this.socket?.emit('subscribe:sensor-data');
  }

  public subscribeToZone(zoneId: string) {
    this.socket?.emit('subscribe:zone', zoneId);
  }

  public subscribeToSensor(sensorId: string) {
    this.socket?.emit('subscribe:sensor', sensorId);
  }

  public subscribeToAlerts() {
    this.socket?.emit('subscribe:alerts');
  }

  public unsubscribeAll() {
    this.socket?.emit('unsubscribe:all');
  }

  public toggleSensor(sensorId: string, isActive: boolean) {
    this.socket?.emit('sensor:toggle', { sensorId, isActive });
  }

  public resolveAlert(alertId: number) {
    this.socket?.emit('alert:resolve', alertId);
  }

  // Event listener setters
  public onConnect(callback: (connected: boolean) => void) {
    this.onConnectionChange = callback;
  }

  public onSensorData(callback: (data: SensorData[]) => void) {
    this.onSensorDataUpdate = callback;
  }

  public onAlert(callback: (alert: AlertData) => void) {
    this.onSensorAlert = callback;
  }

  public onStatusChange(callback: (status: SensorStatusChange) => void) {
    this.onSensorStatusChange = callback;
  }

  public onAlertResolve(callback: (resolution: AlertResolution) => void) {
    this.onAlertResolution = callback;
  }

  public onSocketError(callback: (error: any) => void) {
    this.onError = callback;
  }

  // Connection status
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Cleanup
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();