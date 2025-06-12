import { Database } from 'sqlite';
import { logger } from '../utils/logger';
import { SENSOR_TYPES, SENSOR_RANGES } from '../config/constants';
import { Sensor, SensorData } from '../database/models/Sensor';

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
}

export class HistoricalDataGenerator {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 과거 12시간 + 미래 12시간 데이터 생성 (총 24시간)
   */
  public async generateTimeSeriesData(sensorId?: string): Promise<TimeSeriesDataPoint[]> {
    try {
      const now = new Date();
      const data: TimeSeriesDataPoint[] = [];
      
      // 센서 정보 가져오기
      let sensors: Sensor[];
      if (sensorId) {
        const sensor = await this.db.get<Sensor>('SELECT * FROM sensors WHERE id = ? AND is_active = 1', [sensorId]);
        sensors = sensor ? [sensor] : [];
      } else {
        sensors = await this.db.all<Sensor[]>('SELECT * FROM sensors WHERE is_active = 1');
      }

      if (sensors.length === 0) {
        logger.warn('No active sensors found for time series data generation');
        return [];
      }

      // 각 센서별로 24시간 데이터 생성 (30분 간격)
      for (const sensor of sensors) {
        const sensorData = this.generateSensorTimeSeries(sensor, now);
        data.push(...sensorData);
      }

      logger.info(`Generated time series data: ${data.length} data points for ${sensors.length} sensors`);
      return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    } catch (error) {
      logger.error('Failed to generate time series data:', error);
      return [];
    }
  }

  /**
   * 특정 센서의 24시간 데이터 생성 (과거 12시간 + 미래 12시간)
   */
  private generateSensorTimeSeries(sensor: Sensor, currentTime: Date): TimeSeriesDataPoint[] {
    const data: TimeSeriesDataPoint[] = [];
    const intervalMinutes = 30; // 30분 간격
    const totalHours = 24; // 총 24시간
    const startTime = new Date(currentTime.getTime() - 12 * 60 * 60 * 1000); // 12시간 전
    
    // 기준 값 설정 (현재 시간의 정상 범위 중간값)
    const range = SENSOR_RANGES[sensor.type];
    if (!range) {
      logger.warn(`No range found for sensor type: ${sensor.type}`);
      return [];
    }

    let baseValue = (range.normal.min + range.normal.max) / 2;
    const totalDataPoints = (totalHours * 60) / intervalMinutes; // 48개 데이터 포인트

    for (let i = 0; i < totalDataPoints; i++) {
      const timestamp = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000);
      const hour = timestamp.getHours();
      const isCurrentTime = Math.abs(timestamp.getTime() - currentTime.getTime()) < 30 * 60 * 1000; // 현재 시간 ±30분
      const isFuture = timestamp.getTime() > currentTime.getTime();
      
      // 현실적인 값 생성
      const value = this.generateRealisticValueForTime(sensor.type, hour, baseValue, isFuture, isCurrentTime);
      const status = this.calculateStatus(value, sensor);
      
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.round(value * 10) / 10,
        unit: sensor.unit,
        status,
        sensor_id: sensor.id,
        sensor_name: sensor.name,
        sensor_type: sensor.type
      });

      // 다음 값의 기준으로 사용 (점진적 변화)
      baseValue = value;
    }

    return data;
  }

  /**
   * 시간대별 현실적인 센서 값 생성
   */
  private generateRealisticValueForTime(
    sensorType: string, 
    hour: number, 
    baseValue: number, 
    isFuture: boolean,
    isCurrentTime: boolean
  ): number {
    let value = baseValue;
    const range = SENSOR_RANGES[sensorType];
    
    // 미래 데이터는 약간 더 불확실하게
    const uncertaintyMultiplier = isFuture ? 1.5 : 1.0;
    
    // 현재 시간 근처는 더 정확하게
    const accuracyMultiplier = isCurrentTime ? 0.5 : 1.0;

    switch (sensorType) {
      case SENSOR_TYPES.TEMPERATURE:
        // 온도: 하루 주기 + 계절적 변화
        const tempCycle = Math.sin((hour - 6) * Math.PI / 12) * 5; // ±5°C 하루 주기
        const seasonalOffset = 2; // 계절적 요소
        const noise = (Math.random() - 0.5) * 2 * uncertaintyMultiplier * accuracyMultiplier;
        value += tempCycle + seasonalOffset + noise;
        
        // 미래 예측: 날씨 변화 시뮬레이션
        if (isFuture) {
          const weatherChange = Math.sin(hour * Math.PI / 6) * 3; // 날씨 변화 패턴
          value += weatherChange;
        }
        break;
        
      case SENSOR_TYPES.HUMIDITY:
        // 습도: 온도와 반대 관계 + 관수 영향
        const humidityCycle = Math.cos((hour - 6) * Math.PI / 12) * 12; // 온도와 반대
        const irrigationPattern = Math.sin(hour * Math.PI / 4) * 8; // 관수 패턴
        const humidityNoise = (Math.random() - 0.5) * 5 * uncertaintyMultiplier * accuracyMultiplier;
        value += humidityCycle + irrigationPattern + humidityNoise;
        break;
        
      case SENSOR_TYPES.SOIL_MOISTURE:
        // 토양 습도: 관수 스케줄과 증발
        const evaporationRate = hour >= 10 && hour <= 16 ? -1.5 : -0.5; // 낮에 더 많은 증발
        const irrigationBoost = (hour % 6 === 0) ? 15 : 0; // 6시간마다 관수
        const soilNoise = (Math.random() - 0.5) * 3 * uncertaintyMultiplier * accuracyMultiplier;
        value += evaporationRate + irrigationBoost + soilNoise;
        break;
        
      case SENSOR_TYPES.LIGHT:
        // 조도: 자연광 패턴 + 인공조명
        if (hour >= 6 && hour <= 18) {
          // 주간: 자연광 패턴
          const sunIntensity = Math.sin((hour - 6) * Math.PI / 12) * 25000;
          const cloudEffect = (Math.random() - 0.5) * 10000 * uncertaintyMultiplier;
          const ledSupplement = 12000; // LED 보조조명
          value = 5000 + sunIntensity + ledSupplement + cloudEffect;
        } else if (hour >= 19 && hour <= 22) {
          // 야간 성장조명
          value = 28000 + (Math.random() - 0.5) * 5000 * uncertaintyMultiplier;
        } else {
          // 심야: 최소 조명
          value = 800 + (Math.random() - 0.5) * 500 * uncertaintyMultiplier;
        }
        break;
        
      case SENSOR_TYPES.CO2:
        // CO2: 식물 활동 + 환기 시스템
        const photosynthesis = hour >= 6 && hour <= 18 ? -150 : 80; // 낮에는 CO2 흡수
        const ventilationCycle = Math.sin(hour * Math.PI / 3) * 100; // 환기 패턴
        const baseLevel = 1000; // 기본 CO2 농도
        const co2Noise = (Math.random() - 0.5) * 80 * uncertaintyMultiplier * accuracyMultiplier;
        value = baseLevel + photosynthesis + ventilationCycle + co2Noise;
        break;
        
      default:
        // 기본: 작은 랜덤 변화
        const defaultNoise = (Math.random() - 0.5) * 2 * uncertaintyMultiplier * accuracyMultiplier;
        value += defaultNoise;
    }

    // 값이 범위를 벗어나지 않도록 제한
    value = Math.max(range.critical.min, Math.min(range.critical.max, value));
    
    // 점진적 변화 적용 (급격한 변화 방지)
    const maxChange = (range.normal.max - range.normal.min) * 0.1; // 최대 10% 변화
    const change = value - baseValue;
    if (Math.abs(change) > maxChange) {
      value = baseValue + (change > 0 ? maxChange : -maxChange);
    }

    return value;
  }

  /**
   * 센서 상태 계산
   */
  private calculateStatus(value: number, sensor: Sensor): 'normal' | 'warning' | 'critical' {
    if (value <= sensor.min_critical || value >= sensor.max_critical) {
      return 'critical';
    } else if (value <= sensor.min_warning || value >= sensor.max_warning) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  /**
   * 특정 기간의 집계 데이터 생성
   */
  public async generateAggregatedData(
    sensorId: string, 
    startTime: Date, 
    endTime: Date, 
    interval: 'hour' | 'day' = 'hour'
  ): Promise<any[]> {
    try {
      const sensor = await this.db.get<Sensor>('SELECT * FROM sensors WHERE id = ? AND is_active = 1', [sensorId]);
      if (!sensor) {
        return [];
      }

      const data: any[] = [];
      const timeDiff = endTime.getTime() - startTime.getTime();
      const intervalMs = interval === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const steps = Math.ceil(timeDiff / intervalMs);

      for (let i = 0; i < steps; i++) {
        const periodStart = new Date(startTime.getTime() + i * intervalMs);
        const periodEnd = new Date(Math.min(periodStart.getTime() + intervalMs, endTime.getTime()));
        
        // 해당 기간의 평균값 계산
        const avgValue = this.generateRealisticValueForTime(
          sensor.type, 
          periodStart.getHours(),
          (SENSOR_RANGES[sensor.type]?.normal.min + SENSOR_RANGES[sensor.type]?.normal.max) / 2,
          periodStart.getTime() > Date.now(),
          false
        );

        data.push({
          timestamp: periodStart.toISOString(),
          average: Math.round(avgValue * 10) / 10,
          min: Math.round((avgValue * 0.9) * 10) / 10,
          max: Math.round((avgValue * 1.1) * 10) / 10,
          sensor_id: sensor.id,
          sensor_name: sensor.name,
          unit: sensor.unit
        });
      }

      return data;
    } catch (error) {
      logger.error('Failed to generate aggregated data:', error);
      return [];
    }
  }
}