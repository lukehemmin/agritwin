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
  private static instance: WebSocketService | null = null;

  // Event callbacks - using arrays to support multiple listeners
  private onConnectionChangeCallbacks: ((connected: boolean) => void)[] = [];
  private onSensorDataUpdateCallbacks: ((data: SensorData[]) => void)[] = [];
  private onSensorAlertCallbacks: ((alert: AlertData) => void)[] = [];
  private onSensorStatusChangeCallbacks: ((status: SensorStatusChange) => void)[] = [];
  private onAlertResolutionCallbacks: ((resolution: AlertResolution) => void)[] = [];
  private onErrorCallbacks: ((error: any) => void)[] = [];

  constructor() {
    if (WebSocketService.instance) {
      console.log('🔌 Returning existing WebSocket instance');
      return WebSocketService.instance;
    }
    console.log('🔌 Creating new WebSocket instance');
    WebSocketService.instance = this;
    this.connect();
  }

  private connect() {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected, skipping');
      return;
    }

    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5001';
    console.log('🔌 Attempting to connect to WebSocket server:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.onConnectionChangeCallbacks.forEach(callback => callback(true));
      
      // 연결 즉시 센서 데이터 구독
      setTimeout(() => {
        console.log('🔄 Auto-subscribing to sensor data...');
        this.subscribeToSensorData();
        this.subscribeToAlerts();
      }, 500);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.onConnectionChangeCallbacks.forEach(callback => callback(false));
      
      // Auto-reconnect on unexpected disconnection
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.onErrorCallbacks.forEach(callback => callback(error));
      this.handleReconnection();
    });

    // Welcome message
    this.socket.on('connected', (data) => {
      console.log('🎉 Welcome message:', data.message);
    });

    // Sensor data events
    this.socket.on('sensor-data:update', (data: SensorData[]) => {
      console.log('🔄 Real-time sensor data update:', data.length, 'sensors', data.slice(0, 2));
      this.onSensorDataUpdateCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('sensor-data:current', (data: any[]) => {
      console.log('📊 Current sensor data:', data.length, 'sensors', data.slice(0, 2));
      this.onSensorDataUpdateCallbacks.forEach(callback => callback(data));
    });

    // Alert events
    this.socket.on('sensor:alert', (alert: AlertData) => {
      console.log('🚨 Sensor alert:', alert.severity, alert.message);
      this.onSensorAlertCallbacks.forEach(callback => callback(alert));
    });

    this.socket.on('alert:resolved', (resolution: AlertResolution) => {
      console.log('✅ Alert resolved:', resolution.alertId);
      this.onAlertResolutionCallbacks.forEach(callback => callback(resolution));
    });

    // Status change events
    this.socket.on('sensor:status-changed', (status: SensorStatusChange) => {
      console.log('🔄 Sensor status changed:', status.sensorId, status.isActive);
      this.onSensorStatusChangeCallbacks.forEach(callback => callback(status));
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
      this.onErrorCallbacks.forEach(callback => callback(error));
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

  // Event listener setters - now supports multiple listeners
  public onConnect(callback: (connected: boolean) => void) {
    this.onConnectionChangeCallbacks.push(callback);
    return () => {
      const index = this.onConnectionChangeCallbacks.indexOf(callback);
      if (index > -1) this.onConnectionChangeCallbacks.splice(index, 1);
    };
  }

  public onSensorData(callback: (data: SensorData[]) => void) {
    this.onSensorDataUpdateCallbacks.push(callback);
    return () => {
      const index = this.onSensorDataUpdateCallbacks.indexOf(callback);
      if (index > -1) this.onSensorDataUpdateCallbacks.splice(index, 1);
    };
  }

  public onAlert(callback: (alert: AlertData) => void) {
    this.onSensorAlertCallbacks.push(callback);
    return () => {
      const index = this.onSensorAlertCallbacks.indexOf(callback);
      if (index > -1) this.onSensorAlertCallbacks.splice(index, 1);
    };
  }

  public onStatusChange(callback: (status: SensorStatusChange) => void) {
    this.onSensorStatusChangeCallbacks.push(callback);
    return () => {
      const index = this.onSensorStatusChangeCallbacks.indexOf(callback);
      if (index > -1) this.onSensorStatusChangeCallbacks.splice(index, 1);
    };
  }

  public onAlertResolve(callback: (resolution: AlertResolution) => void) {
    this.onAlertResolutionCallbacks.push(callback);
    return () => {
      const index = this.onAlertResolutionCallbacks.indexOf(callback);
      if (index > -1) this.onAlertResolutionCallbacks.splice(index, 1);
    };
  }

  public onSocketError(callback: (error: any) => void) {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index > -1) this.onErrorCallbacks.splice(index, 1);
    };
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
    WebSocketService.instance = null;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Debug function for browser console
if (typeof window !== 'undefined') {
  (window as any).testWebSocket = () => {
    console.log('🔧 Testing WebSocket connection...');
    console.log('🔧 Current connection status:', websocketService.isConnected());
    websocketService.disconnect();
    setTimeout(() => {
      const service = new WebSocketService();
      (window as any).wsService = service;
      console.log('🔧 New WebSocket service created');
    }, 1000);
  };
}