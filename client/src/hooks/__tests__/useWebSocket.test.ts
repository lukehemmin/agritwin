import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: true
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}));

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() => useWebSocket());
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.sensorData).toEqual([]);
    expect(result.current.alerts).toEqual([]);
  });

  test('sets up socket event listeners', () => {
    renderHook(() => useWebSocket());
    
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('sensor-data:update', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('sensor:alert', expect.any(Function));
  });

  test('handles connection state changes', () => {
    const { result } = renderHook(() => useWebSocket());
    
    // Simulate connect event
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      connectHandler();
    });
    
    expect(result.current.isConnected).toBe(true);
  });

  test('handles sensor data updates', () => {
    const { result } = renderHook(() => useWebSocket());
    
    const mockSensorData = {
      sensor_id: 'sensor-1',
      value: 25.5,
      unit: '°C',
      status: 'normal',
      timestamp: new Date().toISOString()
    };
    
    act(() => {
      const dataHandler = mockSocket.on.mock.calls.find(call => call[0] === 'sensor-data:update')[1];
      dataHandler(mockSensorData);
    });
    
    expect(result.current.sensorData).toContain(mockSensorData);
  });

  test('handles alert notifications', () => {
    const { result } = renderHook(() => useWebSocket());
    
    const mockAlert = {
      id: 1,
      sensor_id: 'sensor-1',
      message: 'Temperature too high',
      severity: 'warning',
      created_at: new Date().toISOString()
    };
    
    act(() => {
      const alertHandler = mockSocket.on.mock.calls.find(call => call[0] === 'sensor:alert')[1];
      alertHandler(mockAlert);
    });
    
    expect(result.current.alerts).toContain(mockAlert);
  });

  test('limits stored sensor data to maximum count', () => {
    const { result } = renderHook(() => useWebSocket());
    
    // Add more than maximum sensor data entries
    act(() => {
      const dataHandler = mockSocket.on.mock.calls.find(call => call[0] === 'sensor-data:update')[1];
      
      for (let i = 0; i < 150; i++) {
        dataHandler({
          sensor_id: `sensor-${i}`,
          value: 20 + i,
          unit: '°C',
          status: 'normal',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    expect(result.current.sensorData.length).toBeLessThanOrEqual(100);
  });

  test('cleans up socket listeners on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());
    
    unmount();
    
    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect'); 
    expect(mockSocket.off).toHaveBeenCalledWith('sensor-data:update');
    expect(mockSocket.off).toHaveBeenCalledWith('sensor:alert');
  });
});