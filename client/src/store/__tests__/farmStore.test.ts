import { act, renderHook } from '@testing-library/react';
import { useFarmStore } from '../farmStore';
import { Sensor } from '../../types/sensor.types';

describe('Farm Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useFarmStore());
    act(() => {
      result.current.setFarmStructure(null);
      result.current.setSensors([]);
      result.current.setAlerts([]);
      result.current.clearSelectedItems();
      result.current.resetFilters();
    });
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useFarmStore());
    
    expect(result.current.farmStructure).toBeNull();
    expect(result.current.sensors).toEqual([]);
    expect(result.current.sensorData.size).toBe(0);
    expect(result.current.alerts).toEqual([]);
    expect(result.current.selectedZone).toBeNull();
    expect(result.current.selectedSensor).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.sensorTypeFilter).toBeNull();
    expect(result.current.statusFilter).toBe('all');
  });

  test('sets farm structure', () => {
    const { result } = renderHook(() => useFarmStore());
    
    const mockStructure = {
      id: 'farm-1',
      name: 'Test Farm',
      total_levels: 3,
      dimensions: { x: 10, y: 10, z: 8 },
      zones: []
    };

    act(() => {
      result.current.setFarmStructure(mockStructure);
    });

    expect(result.current.farmStructure).toEqual(mockStructure);
  });

  test('sets sensors', () => {
    const { result } = renderHook(() => useFarmStore());
    
    const mockSensors: Sensor[] = [
      {
        id: 'sensor-1',
        name: 'Temperature Sensor',
        type: 'temperature',
        zone_id: 'zone-1',
        is_active: true,
        unit: '°C',
        min_normal: 20,
        max_normal: 30,
        min_warning: 15,
        max_warning: 35,
        min_critical: 10,
        max_critical: 40,
        position_x: 0,
        position_y: 0,
        position_z: 0,
        created_at: new Date().toISOString()
      }
    ];

    act(() => {
      result.current.setSensors(mockSensors);
    });

    expect(result.current.sensors).toEqual(mockSensors);
  });

  test('adds sensor data', () => {
    const { result } = renderHook(() => useFarmStore());
    
    const mockSensorData = {
      id: 1,
      sensor_id: 'sensor-1',
      value: 25.5,
      unit: '°C',
      status: 'normal' as const,
      timestamp: new Date().toISOString()
    };

    act(() => {
      result.current.addSensorData(mockSensorData);
    });

    const sensorData = result.current.sensorData.get('sensor-1');
    expect(sensorData).toEqual([mockSensorData]);
  });

  test('limits sensor data to 100 entries', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      // Add 105 sensor data entries
      for (let i = 0; i < 105; i++) {
        result.current.addSensorData({
          id: i,
          sensor_id: 'sensor-1',
          value: 20 + i,
          unit: '°C',
          status: 'normal',
          timestamp: new Date().toISOString()
        });
      }
    });

    const sensorData = result.current.sensorData.get('sensor-1');
    expect(sensorData?.length).toBe(100);
  });

  test('adds alerts and limits to 50', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      // Add 55 alerts
      for (let i = 0; i < 55; i++) {
        result.current.addAlert({
          id: i,
          sensor_id: 'sensor-1',
          message: `Alert ${i}`,
          severity: 'warning',
          is_resolved: false,
          created_at: new Date().toISOString()
        });
      }
    });

    expect(result.current.alerts.length).toBe(50);
  });

  test('sets selected zone and sensor', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      result.current.setSelectedZone('zone-1');
      result.current.setSelectedSensor('sensor-1');
    });

    expect(result.current.selectedZone).toBe('zone-1');
    expect(result.current.selectedSensor).toBe('sensor-1');
  });

  test('sets time range', () => {
    const { result } = renderHook(() => useFarmStore());
    
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-02');

    act(() => {
      result.current.setTimeRange([startDate, endDate]);
    });

    expect(result.current.timeRange).toEqual([startDate, endDate]);
  });

  test('sets loading and error states', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      result.current.setLoading(true);
      result.current.setError('Test error');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Test error');
  });

  test('sets connection status', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      result.current.setConnected(true);
    });

    expect(result.current.isConnected).toBe(true);
  });

  test('sets filters', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      result.current.setSensorTypeFilter('temperature');
      result.current.setStatusFilter('warning');
    });

    expect(result.current.sensorTypeFilter).toBe('temperature');
    expect(result.current.statusFilter).toBe('warning');
  });

  test('resets filters', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      result.current.setSensorTypeFilter('temperature');
      result.current.setStatusFilter('warning');
      result.current.resetFilters();
    });

    expect(result.current.sensorTypeFilter).toBeNull();
    expect(result.current.statusFilter).toBe('all');
  });

  test('clears selected items', () => {
    const { result } = renderHook(() => useFarmStore());
    
    act(() => {
      result.current.setSelectedZone('zone-1');
      result.current.setSelectedSensor('sensor-1');
      result.current.clearSelectedItems();
    });

    expect(result.current.selectedZone).toBeNull();
    expect(result.current.selectedSensor).toBeNull();
  });
});