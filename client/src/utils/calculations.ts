import { SensorData } from '../services/api';
import { SENSOR_STATUS } from './constants';

// 센서 데이터의 상태 계산
export const calculateSensorStatus = (
  value: number,
  ranges: {
    min_normal: number;
    max_normal: number;
    min_warning: number;
    max_warning: number;
    min_critical: number;
    max_critical: number;
  }
): 'normal' | 'warning' | 'critical' => {
  // 정상 범위 확인
  if (value >= ranges.min_normal && value <= ranges.max_normal) {
    return SENSOR_STATUS.NORMAL;
  }
  
  // 경고 범위 확인
  if (value >= ranges.min_warning && value <= ranges.max_warning) {
    return SENSOR_STATUS.WARNING;
  }
  
  // 그 외는 위험 상태
  return SENSOR_STATUS.CRITICAL;
};

// 배열의 평균값 계산
export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

// 배열의 중앙값 계산
export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
};

// 표준편차 계산
export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length <= 1) return 0;
  
  const mean = calculateAverage(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateAverage(squaredDifferences);
  
  return Math.sqrt(variance);
};

// 변화율 계산 (이전 값 대비 현재 값의 변화율)
export const calculateChangeRate = (currentValue: number, previousValue: number): number => {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

// 센서 데이터의 트렌드 계산 (상승/하락/안정)
export const calculateTrend = (data: SensorData[]): 'up' | 'down' | 'stable' => {
  if (data.length < 2) return 'stable';
  
  const recent = data.slice(0, Math.min(5, data.length)); // 최근 5개 데이터
  const values = recent.map(d => d.value);
  
  // 선형 회귀를 통한 기울기 계산
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  if (Math.abs(slope) < 0.1) return 'stable';
  return slope > 0 ? 'up' : 'down';
};

// 건강도 점수 계산 (0-100)
export const calculateHealthScore = (
  normalCount: number,
  warningCount: number,
  criticalCount: number
): number => {
  const total = normalCount + warningCount + criticalCount;
  if (total === 0) return 100;
  
  // 정상: 100점, 경고: 50점, 위험: 0점으로 가중 평균
  const score = (normalCount * 100 + warningCount * 50 + criticalCount * 0) / total;
  return Math.round(score);
};

// 데이터 범위 계산 (최솟값, 최댓값, 범위)
export const calculateDataRange = (values: number[]): {
  min: number;
  max: number;
  range: number;
} => {
  if (values.length === 0) {
    return { min: 0, max: 0, range: 0 };
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  return { min, max, range };
};

// 이동평균 계산
export const calculateMovingAverage = (data: SensorData[], windowSize: number): number[] => {
  if (data.length < windowSize) return [];
  
  const result: number[] = [];
  for (let i = 0; i <= data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize);
    const average = calculateAverage(window.map(d => d.value));
    result.push(average);
  }
  
  return result;
};

// 이상치 탐지 (IQR 방법)
export const detectOutliers = (values: number[]): number[] => {
  if (values.length < 4) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(value => value < lowerBound || value > upperBound);
};

// 예측값 계산 (단순 선형 회귀)
export const predictNextValue = (data: SensorData[]): number | null => {
  if (data.length < 2) return null;
  
  const recent = data.slice(0, Math.min(10, data.length)); // 최근 10개 데이터
  const values = recent.map(d => d.value);
  const n = values.length;
  
  // 시간을 x축으로 하는 선형 회귀
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 다음 시점 예측
  const nextX = n;
  return slope * nextX + intercept;
};

// 센서 데이터의 안정성 계산 (변동계수)
export const calculateStability = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = calculateAverage(values);
  const stdDev = calculateStandardDeviation(values);
  
  if (mean === 0) return 0;
  
  // 변동계수 (CV) = 표준편차 / 평균 * 100
  const cv = (stdDev / Math.abs(mean)) * 100;
  
  // 안정성은 변동계수의 역수 (낮은 변동 = 높은 안정성)
  return Math.max(0, 100 - cv);
};

// 정규화 (0-1 범위로 변환)
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0;
  return (value - min) / (max - min);
};

// 역정규화
export const denormalize = (normalizedValue: number, min: number, max: number): number => {
  return normalizedValue * (max - min) + min;
};