import { apiService } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getSensors', () => {
    test('fetches sensors successfully', async () => {
      const mockSensors = [
        {
          id: 'sensor-1',
          name: 'Temperature Sensor',
          type: 'temperature',
          zone_id: 'zone-1',
          is_active: true,
          unit: '°C'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSensors
      } as Response);

      const result = await apiService.getSensors();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/sensors');
      expect(result).toEqual(mockSensors);
    });

    test('handles fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(apiService.getSensors()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('getSensor', () => {
    test('fetches single sensor successfully', async () => {
      const mockSensor = {
        id: 'sensor-1',
        name: 'Temperature Sensor',
        type: 'temperature',
        zone_id: 'zone-1',
        is_active: true,
        unit: '°C'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSensor
      } as Response);

      const result = await apiService.getSensor('sensor-1');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/sensors/sensor-1');
      expect(result).toEqual(mockSensor);
    });
  });

  describe('getSensorData', () => {
    test('fetches sensor data with parameters', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            sensor_id: 'sensor-1',
            value: 25.5,
            unit: '°C',
            status: 'normal',
            timestamp: '2024-01-01T10:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      } as Response);

      const params = {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-01T23:59:59Z',
        limit: 100
      };

      const result = await apiService.getSensorData('sensor-1', params);
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sensors/sensor-1/data?start=2024-01-01T00%3A00%3A00Z&end=2024-01-01T23%3A59%3A59Z&limit=100'
      );
      expect(result).toEqual(mockData);
    });

    test('fetches sensor data without parameters', async () => {
      const mockData = { data: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      } as Response);

      const result = await apiService.getSensorData('sensor-1');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/sensors/sensor-1/data');
      expect(result).toEqual(mockData);
    });
  });

  describe('updateSensorRanges', () => {
    test('updates sensor ranges successfully', async () => {
      const ranges = {
        min_normal: 20,
        max_normal: 30,
        min_warning: 15,
        max_warning: 35,
        min_critical: 10,
        max_critical: 40
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const result = await apiService.updateSensorRanges('sensor-1', ranges);
      
      expect(mockFetch).toHaveBeenCalledWith('/api/sensors/sensor-1/ranges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ranges)
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('calibrateSensor', () => {
    test('calibrates sensor successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Calibration complete' })
      } as Response);

      const result = await apiService.calibrateSensor('sensor-1');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/sensors/sensor-1/calibrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(result).toEqual({ success: true, message: 'Calibration complete' });
    });
  });

  describe('getAnalyticsSummary', () => {
    test('fetches analytics summary successfully', async () => {
      const mockSummary = {
        summary: {
          total_sensors: 30,
          active_sensors: 28,
          total_data_points: 1000
        },
        status_distribution: [],
        sensor_types: [],
        zones: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary
      } as Response);

      const result = await apiService.getAnalyticsSummary('24h');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/summary?period=24h');
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getFarmStructure', () => {
    test('fetches farm structure successfully', async () => {
      const mockStructure = {
        id: 'farm-1',
        name: 'Test Farm',
        total_levels: 3,
        zones: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStructure
      } as Response);

      const result = await apiService.getFarmStructure();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/farm/structure');
      expect(result).toEqual(mockStructure);
    });
  });
});