import { useEffect, useState, useCallback } from 'react';
import { websocketService, SensorData, AlertData, SensorStatusChange, AlertResolution } from '../services/websocket';

export interface WebSocketHook {
  isConnected: boolean;
  sensorData: SensorData[];
  alerts: AlertData[];
  error: any;
  subscribeToSensorData: () => void;
  subscribeToZone: (zoneId: string) => void;
  subscribeToSensor: (sensorId: string) => void;
  subscribeToAlerts: () => void;
  unsubscribeAll: () => void;
  toggleSensor: (sensorId: string, isActive: boolean) => void;
  resolveAlert: (alertId: number) => void;
}

export const useWebSocket = (): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Set up event listeners
    websocketService.onConnect((connected) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
      }
    });

    websocketService.onSensorData((data) => {
      console.log('🔄 useWebSocket: Updating sensor data state', { 
        newDataCount: data.length,
        sampleData: data.slice(0, 2),
        timestamp: new Date().toLocaleTimeString()
      });
      
      // 실시간 데이터 상태 업데이트
      setSensorData(() => {
        // 새로운 데이터로 완전히 교체 (실시간 스냅샷)
        return data;
      });
    });

    websocketService.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep only last 50 alerts
    });

    websocketService.onStatusChange((status: SensorStatusChange) => {
      // Update sensor data when status changes
      setSensorData(prev => prev.map(sensor => 
        sensor.sensor_id === status.sensorId 
          ? { ...sensor, isActive: status.isActive }
          : sensor
      ));
    });

    websocketService.onAlertResolve((resolution: AlertResolution) => {
      // Remove resolved alert from list
      setAlerts(prev => prev.filter((_, index) => index !== resolution.alertId));
    });

    websocketService.onSocketError((socketError) => {
      setError(socketError);
    });

    // Initial connection status
    setIsConnected(websocketService.isConnected());

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribeAll();
    };
  }, []);

  // Memoized functions to prevent unnecessary re-renders
  const subscribeToSensorData = useCallback(() => {
    websocketService.subscribeToSensorData();
  }, []);

  const subscribeToZone = useCallback((zoneId: string) => {
    websocketService.subscribeToZone(zoneId);
  }, []);

  const subscribeToSensor = useCallback((sensorId: string) => {
    websocketService.subscribeToSensor(sensorId);
  }, []);

  const subscribeToAlerts = useCallback(() => {
    websocketService.subscribeToAlerts();
  }, []);

  const unsubscribeAll = useCallback(() => {
    websocketService.unsubscribeAll();
  }, []);

  const toggleSensor = useCallback((sensorId: string, isActive: boolean) => {
    websocketService.toggleSensor(sensorId, isActive);
  }, []);

  const resolveAlert = useCallback((alertId: number) => {
    websocketService.resolveAlert(alertId);
  }, []);

  return {
    isConnected,
    sensorData,
    alerts,
    error,
    subscribeToSensorData,
    subscribeToZone,
    subscribeToSensor,
    subscribeToAlerts,
    unsubscribeAll,
    toggleSensor,
    resolveAlert,
  };
};