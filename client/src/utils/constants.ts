// 센서 타입 상수
export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  SOIL_MOISTURE: 'soil_moisture',
  LIGHT: 'light',
  CO2: 'co2'
} as const;

// 상태 타입 상수
export const SENSOR_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

// 알림 심각도 상수
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

// 차트 색상 상수
export const CHART_COLORS = {
  PRIMARY: '#2E7D32',
  SECONDARY: '#1976D2',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  GRAY: '#9E9E9E'
} as const;

// 센서 상태별 색상
export const STATUS_COLORS = {
  [SENSOR_STATUS.NORMAL]: CHART_COLORS.SUCCESS,
  [SENSOR_STATUS.WARNING]: CHART_COLORS.WARNING,
  [SENSOR_STATUS.CRITICAL]: CHART_COLORS.ERROR
} as const;

// 센서 타입별 색상
export const SENSOR_TYPE_COLORS = {
  [SENSOR_TYPES.TEMPERATURE]: '#F44336', // 빨간색
  [SENSOR_TYPES.HUMIDITY]: '#2196F3',    // 파란색
  [SENSOR_TYPES.SOIL_MOISTURE]: '#8BC34A', // 연두색
  [SENSOR_TYPES.LIGHT]: '#FFC107',       // 노란색
  [SENSOR_TYPES.CO2]: '#9C27B0'          // 보라색
} as const;

// 센서 타입별 아이콘
export const SENSOR_ICONS = {
  [SENSOR_TYPES.TEMPERATURE]: '🌡️',
  [SENSOR_TYPES.HUMIDITY]: '💧',
  [SENSOR_TYPES.SOIL_MOISTURE]: '🌱',
  [SENSOR_TYPES.LIGHT]: '💡',
  [SENSOR_TYPES.CO2]: '🫧'
} as const;

// 센서 타입별 한글 이름
export const SENSOR_TYPE_LABELS = {
  [SENSOR_TYPES.TEMPERATURE]: '온도',
  [SENSOR_TYPES.HUMIDITY]: '습도',
  [SENSOR_TYPES.SOIL_MOISTURE]: '토양수분',
  [SENSOR_TYPES.LIGHT]: '조도',
  [SENSOR_TYPES.CO2]: 'CO2'
} as const;

// 상태별 한글 이름
export const STATUS_LABELS = {
  [SENSOR_STATUS.NORMAL]: '정상',
  [SENSOR_STATUS.WARNING]: '경고',
  [SENSOR_STATUS.CRITICAL]: '위험'
} as const;

// 시간 범위 옵션
export const TIME_RANGES = {
  '1h': { label: '최근 1시간', hours: 1 },
  '6h': { label: '최근 6시간', hours: 6 },
  '24h': { label: '최근 24시간', hours: 24 },
  '3d': { label: '최근 3일', hours: 72 },
  '7d': { label: '최근 7일', hours: 168 },
  '30d': { label: '최근 30일', hours: 720 }
} as const;

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  SENSORS: '/api/sensors',
  SENSOR_DATA: '/api/sensors/:id/data',
  FARM_STRUCTURE: '/api/farm/structure',
  ZONES: '/api/farm/zones',
  ANALYTICS: '/api/analytics',
  ALERTS: '/api/analytics/alerts'
} as const;

// WebSocket 이벤트 상수
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  SENSOR_DATA_UPDATE: 'sensor-data:update',
  SENSOR_ALERT: 'sensor:alert',
  SYSTEM_STATUS: 'system:status',
  ZONE_UPDATE: 'zone:update',
  SUBSCRIBE_SENSOR_DATA: 'subscribe:sensor-data',
  SUBSCRIBE_ZONE: 'subscribe:zone',
  SUBSCRIBE_ALERTS: 'subscribe:alerts',
  UNSUBSCRIBE_ALL: 'unsubscribe:all'
} as const;

// 3D 씬 설정 상수
export const SCENE_CONFIG = {
  CAMERA: {
    FOV: 75,
    NEAR: 0.1,
    FAR: 1000,
    POSITION: { x: 10, y: 10, z: 10 }
  },
  LIGHTS: {
    AMBIENT: {
      COLOR: 0x404040,
      INTENSITY: 0.4
    },
    DIRECTIONAL: {
      COLOR: 0xffffff,
      INTENSITY: 0.8,
      POSITION: { x: 10, y: 10, z: 5 }
    }
  },
  FARM: {
    DIMENSIONS: { x: 10, y: 10, z: 8 },
    LEVELS: 3,
    LEVEL_HEIGHT: 2.5
  }
} as const;

// 차트 설정 상수
export const CHART_CONFIG = {
  DEFAULT_MAX_POINTS: 20,
  ANIMATION_DURATION: 750,
  REFRESH_INTERVAL: 5000,
  COLORS: {
    GRID: '#e0e0e0',
    TEXT: '#666666',
    TOOLTIP_BG: '#ffffff',
    TOOLTIP_BORDER: '#cccccc'
  }
} as const;

// 로컬 스토리지 키 상수
export const STORAGE_KEYS = {
  SETTINGS: 'agritwin_settings',
  SELECTED_ZONE: 'agritwin_selected_zone',
  TIME_RANGE: 'agritwin_time_range',
  CHART_CONFIG: 'agritwin_chart_config'
} as const;

// 기본 설정값
export const DEFAULT_SETTINGS = {
  notification_enabled: true,
  auto_refresh_interval: 5000,
  chart_max_points: 20,
  alert_sound_enabled: true,
  dark_mode: false,
  language: 'ko' as const
};

// 농장 설정 상수
export const FARM_CONFIG = {
  NAME: 'AgriTwin 수직농장',
  LEVELS: 3,
  ZONES_PER_LEVEL: 2,
  SENSORS_PER_ZONE: 5
} as const;