// Test setup for server-side tests

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  // Mock console.log for cleaner test output
  console.log = jest.fn();
  console.info = jest.fn();
  
  // Keep console.warn and console.error for debugging
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Global test utilities
global.testUtils = {
  // Helper to create mock sensor data
  createMockSensorData: (overrides = {}) => ({
    id: 1,
    sensor_id: 'test-sensor-1',
    value: 25.5,
    unit: '°C',
    status: 'normal',
    timestamp: new Date().toISOString(),
    ...overrides
  }),

  // Helper to create mock sensor
  createMockSensor: (overrides = {}) => ({
    id: 'test-sensor-1',
    name: 'Test Temperature Sensor',
    type: 'temperature',
    zone_id: 'test-zone-1',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    unit: '°C',
    min_normal: 20,
    max_normal: 30,
    min_warning: 15,
    max_warning: 35,
    min_critical: 10,
    max_critical: 40,
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  // Helper to create mock farm zone
  createMockZone: (overrides = {}) => ({
    id: 'test-zone-1',
    name: 'Test Zone 1',
    level: 1,
    area: 25.0,
    crop_type: '상추',
    position_x: 0,
    position_y: 0,
    position_z: 0,
    size_x: 5,
    size_y: 5,
    size_z: 2,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  // Helper to create mock alert
  createMockAlert: (overrides = {}) => ({
    id: 1,
    sensor_id: 'test-sensor-1',
    message: 'Test alert message',
    severity: 'warning',
    is_resolved: false,
    created_at: new Date().toISOString(),
    resolved_at: null,
    ...overrides
  })
};

// Type declaration for global test utilities
export {}; // This makes the file a module

declare global {
  var testUtils: {
    createMockSensorData: (overrides?: any) => any;
    createMockSensor: (overrides?: any) => any;
    createMockZone: (overrides?: any) => any;
    createMockAlert: (overrides?: any) => any;
  };
}