import { Database } from 'sqlite';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { SENSOR_TYPES, SENSOR_RANGES, UPDATE_INTERVALS } from '../config/constants';
import { Sensor, SensorData } from '../database/models/Sensor';

export class SensorSimulator {
  private db: Database;
  private io: SocketIOServer;
  private intervalId: NodeJS.Timeout | null = null;
  private sensorHistory: Map<string, number[]> = new Map();

  constructor(db: Database, io: SocketIOServer) {
    this.db = db;
    this.io = io;
  }

  public start(): void {
    if (this.intervalId) {
      this.stop();
    }

    logger.info('Starting REAL-TIME sensor data simulation...');
    
    // Generate initial data for all sensors
    this.generateInitialData();

    // Start periodic data generation (더 빠른 간격으로 설정)
    this.intervalId = setInterval(() => {
      this.generateSensorData();
    }, UPDATE_INTERVALS.SENSOR_DATA); // 2초마다 업데이트

    // 즉시 첫 번째 데이터 생성
    this.generateSensorData();
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Sensor data simulation stopped');
    }
  }

  private async generateInitialData(): Promise<void> {
    try {
      const sensors = await this.db.all<Sensor[]>('SELECT * FROM sensors WHERE is_active = 1');
      
      for (const sensor of sensors) {
        // Initialize sensor history with some realistic values
        const history: number[] = [];
        const range = SENSOR_RANGES[sensor.type];
        
        if (range) {
          // Generate 10 historical points
          for (let i = 0; i < 10; i++) {
            const value = this.generateRealisticValue(sensor.type);
            history.push(value);
          }
        }
        
        this.sensorHistory.set(sensor.id, history);
      }

      logger.info(`Initialized sensor history for ${sensors.length} sensors`);
    } catch (error) {
      logger.error('Failed to generate initial sensor data:', error);
    }
  }

  private async generateSensorData(): Promise<void> {
    try {
      const sensors = await this.db.all<Sensor[]>('SELECT * FROM sensors WHERE is_active = 1');
      const newDataPoints: SensorData[] = [];
      const timestamp = new Date().toISOString();

      logger.info(`🌱 Generating real-time data for ${sensors.length} sensors...`);

      for (const sensor of sensors) {
        const value = this.generateRealisticValue(sensor.type, sensor.id);
        const status = this.calculateStatus(value, sensor);
        
        // Insert into database
        const result = await this.db.run(`
          INSERT INTO sensor_data (sensor_id, value, unit, status, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `, [sensor.id, value, sensor.unit, status, timestamp]);

        const newDataPoint: SensorData = {
          id: result.lastID!,
          sensor_id: sensor.id,
          value: Math.round(value * 10) / 10, // 소수점 1자리
          unit: sensor.unit,
          status,
          timestamp
        };

        newDataPoints.push(newDataPoint);

        // Check for alerts
        if (status !== 'normal') {
          await this.createAlert(sensor, value, status);
        }
      }

      // 모든 클라이언트에게 실시간 데이터 브로드캐스트
      this.io.emit('sensor-data:update', newDataPoints);
      
      // 구독자에게도 전송 (중복이지만 확실히 하기 위해)
      this.io.to('sensor-data').emit('sensor-data:update', newDataPoints);

      logger.info(`📡 Broadcasted ${newDataPoints.length} real-time sensor data points at ${new Date().toLocaleTimeString()}`);
      
      // 샘플 데이터 로그
      if (newDataPoints.length > 0) {
        const sample = newDataPoints.slice(0, 3);
        logger.debug('Sample data:', sample.map(d => `${d.sensor_id}: ${d.value}${d.unit} (${d.status})`));
      }

    } catch (error) {
      logger.error('Failed to generate sensor data:', error);
    }
  }

  private generateRealisticValue(sensorType: string, sensorId?: string): number {
    const range = SENSOR_RANGES[sensorType];
    if (!range) {
      return 0;
    }

    // Get sensor history for trend-based generation
    const history = sensorId ? this.sensorHistory.get(sensorId) || [] : [];
    const lastValue = history.length > 0 ? history[history.length - 1] : null;

    let value: number;
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (lastValue !== null) {
      // Generate value based on previous value with realistic changes
      const changePercent = (Math.random() - 0.5) * 0.08; // ±4% change (더 안정적)
      value = lastValue * (1 + changePercent);
      
      // Add smaller noise for more realistic data
      const noise = (Math.random() - 0.5) * (range.normal.max - range.normal.min) * 0.03;
      value += noise;
    } else {
      // Generate initial value within normal range
      value = range.normal.min + Math.random() * (range.normal.max - range.normal.min);
    }

    // Add realistic time-based variations (실제 농장 환경 시뮬레이션)
    switch (sensorType) {
      case SENSOR_TYPES.TEMPERATURE:
        // 온도: 하루 주기 + 급격한 변화
        const tempCycle = Math.sin((hour - 6) * Math.PI / 12) * 4; // ±4°C 하루 주기
        const tempNoise = (Math.random() - 0.5) * 0.8; // 급격한 변화 시뮬레이션
        value += tempCycle + tempNoise;
        
        // 레벨별 차이 (상층부가 더 따뜻함)
        if (sensorId && sensorId.includes('zone-3-')) {
          value += 2; // 3층은 2도 더 높음
        } else if (sensorId && sensorId.includes('zone-2-')) {
          value += 1; // 2층은 1도 더 높음
        }
        break;
        
      case SENSOR_TYPES.HUMIDITY:
        // 습도: 온도와 반대 관계 + 관수 시스템 영향
        const humidityCycle = Math.cos((hour - 6) * Math.PI / 12) * 8; // 온도와 반대
        const irrigationEffect = (minute % 15 < 3) ? 15 : 0; // 15분마다 3분간 관수
        value += humidityCycle + irrigationEffect + (Math.random() - 0.5) * 3;
        break;
        
      case SENSOR_TYPES.SOIL_MOISTURE:
        // 토양습도: 관수 시스템과 증발 효과
        const evaporation = -0.5; // 지속적인 증발
        const irrigation = (minute % 20 < 2) ? 25 : 0; // 20분마다 2분간 급수
        value += evaporation + irrigation + (Math.random() - 0.5) * 2;
        break;
        
      case SENSOR_TYPES.LIGHT:
        // 조도: 자연광 + 인공조명 스케줄
        if (hour >= 6 && hour <= 18) {
          // 주간: 자연광 + LED 보조조명
          const sunIntensity = Math.sin((hour - 6) * Math.PI / 12) * 20000;
          const ledBoost = 15000; // LED 보조조명
          value = 10000 + sunIntensity + ledBoost + (Math.random() * 5000);
        } else if (hour >= 19 && hour <= 22) {
          // 야간 성장조명
          value = 25000 + (Math.random() * 3000);
        } else {
          // 밤: 최소 조명
          value = 500 + (Math.random() * 1000);
        }
        break;
        
      case SENSOR_TYPES.CO2:
        // CO2: 식물 호흡 + 환기 시스템
        const plantRespiration = hour >= 6 && hour <= 18 ? -100 : 50; // 낮에는 흡수, 밤에는 배출
        const ventilation = (minute % 30 < 5) ? -200 : 0; // 30분마다 5분간 환기
        const baseLevel = 900; // 기본 CO2 농도
        value = baseLevel + plantRespiration + ventilation + (Math.random() - 0.5) * 100;
        break;
    }

    // Ensure value stays within critical bounds
    value = Math.max(range.critical.min, Math.min(range.critical.max, value));

    // Round to appropriate decimal places
    const decimals = sensorType === SENSOR_TYPES.LIGHT ? 0 : 1;
    value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // Update history
    if (sensorId) {
      const history = this.sensorHistory.get(sensorId) || [];
      history.push(value);
      
      // Keep only last 50 values for better trend analysis
      if (history.length > 50) {
        history.shift();
      }
      
      this.sensorHistory.set(sensorId, history);
    }

    return value;
  }

  private calculateStatus(value: number, sensor: Sensor): 'normal' | 'warning' | 'critical' {
    if (value <= sensor.min_critical || value >= sensor.max_critical) {
      return 'critical';
    } else if (value <= sensor.min_warning || value >= sensor.max_warning) {
      return 'warning';
    } else {
      return 'normal';
    }
  }

  private async createAlert(sensor: Sensor, value: number, status: 'warning' | 'critical'): Promise<void> {
    try {
      const message = this.generateAlertMessage(sensor, value, status);
      
      // Check if similar alert already exists and is not resolved
      const existingAlert = await this.db.get(`
        SELECT id FROM alerts 
        WHERE sensor_id = ? AND severity = ? AND is_resolved = 0
        AND created_at > datetime('now', '-10 minutes')
      `, [sensor.id, status]);

      if (!existingAlert) {
        await this.db.run(`
          INSERT INTO alerts (sensor_id, message, severity)
          VALUES (?, ?, ?)
        `, [sensor.id, message, status]);

        // Broadcast alert via WebSocket
        this.io.emit('sensor:alert', {
          sensor_id: sensor.id,
          sensor_name: sensor.name,
          message,
          severity: status,
          value,
          unit: sensor.unit,
          timestamp: new Date().toISOString()
        });

        logger.warn(`Alert created for sensor ${sensor.name}: ${message}`);
      }
    } catch (error) {
      logger.error('Failed to create alert:', error);
    }
  }

  private generateAlertMessage(sensor: Sensor, value: number, status: 'warning' | 'critical'): string {
    const messages = {
      warning: `${sensor.name}에서 경고 수준의 값이 감지되었습니다: ${value}${sensor.unit}`,
      critical: `${sensor.name}에서 위험 수준의 값이 감지되었습니다: ${value}${sensor.unit}`
    };

    return messages[status];
  }

  public async getSensorHistory(sensorId: string, hours: number = 24): Promise<SensorData[]> {
    try {
      return await this.db.all<SensorData[]>(`
        SELECT * FROM sensor_data 
        WHERE sensor_id = ? 
        AND timestamp > datetime('now', '-${hours} hours')
        ORDER BY timestamp DESC
      `, [sensorId]);
    } catch (error) {
      logger.error('Failed to get sensor history:', error);
      return [];
    }
  }
}