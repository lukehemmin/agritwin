import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Sensor, SensorData, FarmZone, Alert } from '../services/api';

interface FarmState {
  // 농장 데이터
  farmStructure: {
    id: string;
    name: string;
    total_levels: number;
    dimensions: {
      x: number;
      y: number;
      z: number;
    };
    zones: FarmZone[];
  } | null;
  sensors: Sensor[];
  sensorData: Map<string, SensorData[]>;
  alerts: Alert[];
  
  // UI 상태
  selectedZone: string | null;
  selectedSensor: string | null;
  timeRange: [Date, Date];
  isLoading: boolean;
  error: string | null;
  
  // WebSocket 상태
  isConnected: boolean;
  
  // 필터 상태
  sensorTypeFilter: string | null;
  statusFilter: 'all' | 'normal' | 'warning' | 'critical';
  
  // 액션
  setFarmStructure: (structure: FarmState['farmStructure']) => void;
  setSensors: (sensors: Sensor[]) => void;
  updateSensorData: (sensorId: string, data: SensorData[]) => void;
  addSensorData: (data: SensorData) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  
  setSelectedZone: (zoneId: string | null) => void;
  setSelectedSensor: (sensorId: string | null) => void;
  setTimeRange: (range: [Date, Date]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setConnected: (connected: boolean) => void;
  
  setSensorTypeFilter: (type: string | null) => void;
  setStatusFilter: (status: FarmState['statusFilter']) => void;
  
  // 복합 액션
  resetFilters: () => void;
  clearSelectedItems: () => void;
}

export const useFarmStore = create<FarmState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      farmStructure: null,
      sensors: [],
      sensorData: new Map(),
      alerts: [],
      
      selectedZone: null,
      selectedSensor: null,
      timeRange: [
        new Date(Date.now() - 24 * 60 * 60 * 1000), // 24시간 전
        new Date() // 현재
      ],
      isLoading: false,
      error: null,
      
      isConnected: false,
      
      sensorTypeFilter: null,
      statusFilter: 'all',
      
      // 기본 액션
      setFarmStructure: (structure) => 
        set({ farmStructure: structure }, false, 'setFarmStructure'),
      
      setSensors: (sensors) => 
        set({ sensors }, false, 'setSensors'),
      
      updateSensorData: (sensorId, data) => {
        const currentData = get().sensorData;
        const newData = new Map(currentData);
        newData.set(sensorId, data);
        set({ sensorData: newData }, false, 'updateSensorData');
      },
      
      addSensorData: (data) => {
        const currentData = get().sensorData;
        const newData = new Map(currentData);
        const existingData = newData.get(data.sensor_id) || [];
        
        // 최대 100개 데이터포인트만 유지 (메모리 최적화)
        const updatedData = [data, ...existingData].slice(0, 100);
        newData.set(data.sensor_id, updatedData);
        
        set({ sensorData: newData }, false, 'addSensorData');
      },
      
      setAlerts: (alerts) => 
        set({ alerts }, false, 'setAlerts'),
      
      addAlert: (alert) => {
        const currentAlerts = get().alerts;
        set({ 
          alerts: [alert, ...currentAlerts].slice(0, 50) // 최대 50개 알림만 유지
        }, false, 'addAlert');
      },
      
      setSelectedZone: (zoneId) => 
        set({ selectedZone: zoneId }, false, 'setSelectedZone'),
      
      setSelectedSensor: (sensorId) => 
        set({ selectedSensor: sensorId }, false, 'setSelectedSensor'),
      
      setTimeRange: (range) => 
        set({ timeRange: range }, false, 'setTimeRange'),
      
      setLoading: (loading) => 
        set({ isLoading: loading }, false, 'setLoading'),
      
      setError: (error) => 
        set({ error }, false, 'setError'),
      
      setConnected: (connected) => 
        set({ isConnected: connected }, false, 'setConnected'),
      
      setSensorTypeFilter: (type) => 
        set({ sensorTypeFilter: type }, false, 'setSensorTypeFilter'),
      
      setStatusFilter: (status) => 
        set({ statusFilter: status }, false, 'setStatusFilter'),
      
      // 복합 액션
      resetFilters: () => 
        set({ 
          sensorTypeFilter: null, 
          statusFilter: 'all' 
        }, false, 'resetFilters'),
      
      clearSelectedItems: () => 
        set({ 
          selectedZone: null, 
          selectedSensor: null 
        }, false, 'clearSelectedItems'),
    }),
    {
      name: 'farm-store', // Redux DevTools에서 표시될 이름
    }
  )
);

// 선택자 함수들
export const useSelectedZoneData = () => {
  return useFarmStore((state) => {
    if (!state.selectedZone || !state.farmStructure) return null;
    return state.farmStructure.zones.find(zone => zone.id === state.selectedZone);
  });
};

export const useFilteredSensors = () => {
  return useFarmStore((state) => {
    let filtered = state.sensors;
    
    if (state.sensorTypeFilter) {
      filtered = filtered.filter(sensor => sensor.type === state.sensorTypeFilter);
    }
    
    if (state.selectedZone) {
      filtered = filtered.filter(sensor => sensor.zone_id === state.selectedZone);
    }
    
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(sensor => {
        const latestData = state.sensorData.get(sensor.id)?.[0];
        return latestData?.status === state.statusFilter;
      });
    }
    
    return filtered;
  });
};

export const useSelectedSensorData = () => {
  return useFarmStore((state) => {
    if (!state.selectedSensor) return null;
    return {
      sensor: state.sensors.find(s => s.id === state.selectedSensor),
      data: state.sensorData.get(state.selectedSensor) || []
    };
  });
};

export const useRecentAlerts = (limit: number = 5) => {
  return useFarmStore((state) => 
    state.alerts
      .filter(alert => !alert.is_resolved)
      .slice(0, limit)
  );
};

export const useSensorStats = () => {
  return useFarmStore((state) => {
    const totalSensors = state.sensors.length;
    const activeSensors = state.sensors.filter(s => s.is_active).length;
    const alerts = state.alerts.filter(a => !a.is_resolved).length;
    
    const statusCounts = {
      normal: 0,
      warning: 0,
      critical: 0
    };
    
    state.sensors.forEach(sensor => {
      const latestData = state.sensorData.get(sensor.id)?.[0];
      if (latestData) {
        statusCounts[latestData.status as keyof typeof statusCounts]++;
      }
    });
    
    return {
      totalSensors,
      activeSensors,
      alerts,
      statusCounts,
      healthScore: totalSensors > 0 
        ? Math.round((statusCounts.normal / totalSensors) * 100)
        : 0
    };
  });
};