import { Plant, PlantType, GrowthStage, HealthStatus, PlantGrowthConfig, PlantEnvironmentData, HealthEventType, EventSeverity } from '../database/models/Plant';
import { Sensor } from '../database/models/Sensor';

export class PlantGrowthSimulator {
  private static instance: PlantGrowthSimulator;
  private isRunning = false;
  private simulationInterval?: NodeJS.Timeout;
  private readonly SIMULATION_INTERVAL_MS = 60000; // 1분마다 실행

  private constructor() {}

  static getInstance(): PlantGrowthSimulator {
    if (!PlantGrowthSimulator.instance) {
      PlantGrowthSimulator.instance = new PlantGrowthSimulator();
    }
    return PlantGrowthSimulator.instance;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🌱 Plant Growth Simulator started');
    
    this.simulationInterval = setInterval(async () => {
      await this.simulateGrowthCycle();
    }, this.SIMULATION_INTERVAL_MS);
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    console.log('🌱 Plant Growth Simulator stopped');
  }

  private async simulateGrowthCycle(): Promise<void> {
    try {
      console.log('🔄 Running plant growth simulation...');
      
      // 모든 살아있는 식물들을 가져옴
      const plants = await this.getAlivePlants();
      
      for (const plant of plants) {
        // 환경 데이터 수집
        const environmentData = await this.getEnvironmentData(plant.farm_zone_id);
        
        // 식물 건강 상태 평가
        const healthAssessment = this.assessPlantHealth(plant, environmentData);
        
        // 성장 진행
        const growthProgress = this.calculateGrowthProgress(plant, environmentData, healthAssessment);
        
        // 식물 상태 업데이트
        await this.updatePlantStatus(plant, growthProgress, healthAssessment);
      }
      
      console.log(`✅ Growth simulation completed for ${plants.length} plants`);
    } catch (error) {
      console.error('❌ Error in plant growth simulation:', error);
    }
  }

  private async getAlivePlants(): Promise<Plant[]> {
    // 데이터베이스에서 살아있는 식물들 조회
    // TODO: 실제 데이터베이스 쿼리 구현
    return [];
  }

  private async getEnvironmentData(zoneId: string): Promise<PlantEnvironmentData> {
    // 해당 구역의 센서 데이터 수집
    // TODO: 실제 센서 데이터 조회 구현
    return {
      temperature: 22.0,
      humidity: 70.0,
      soil_moisture: 60.0,
      ph_level: 6.5,
      light_intensity: 80.0,
      nutrient_level: 75.0,
      timestamp: new Date()
    };
  }

  private assessPlantHealth(plant: Plant, env: PlantEnvironmentData): {
    health_status: HealthStatus;
    stress_factors: Array<{ type: HealthEventType; severity: EventSeverity; description: string }>;
  } {
    const config = this.getPlantConfig(plant.plant_type);
    const stressFactors: Array<{ type: HealthEventType; severity: EventSeverity; description: string }> = [];
    
    // 온도 스트레스 확인
    if (env.temperature < config.optimal_temp_min - 5 || env.temperature > config.optimal_temp_max + 5) {
      stressFactors.push({
        type: 'temperature_stress',
        severity: 'critical',
        description: `Temperature ${env.temperature}°C is outside critical range (${config.optimal_temp_min}-${config.optimal_temp_max}°C)`
      });
    } else if (env.temperature < config.optimal_temp_min || env.temperature > config.optimal_temp_max) {
      stressFactors.push({
        type: 'temperature_stress',
        severity: 'medium',
        description: `Temperature ${env.temperature}°C is outside optimal range`
      });
    }

    // 수분 스트레스 확인
    if (env.soil_moisture < 20) {
      stressFactors.push({
        type: 'water_stress',
        severity: 'critical',
        description: `Soil moisture critically low: ${env.soil_moisture}%`
      });
    } else if (env.soil_moisture < 40) {
      stressFactors.push({
        type: 'water_stress',
        severity: 'medium',
        description: `Soil moisture low: ${env.soil_moisture}%`
      });
    }

    // 영양분 부족 확인
    if (env.nutrient_level < 30) {
      stressFactors.push({
        type: 'nutrient_deficiency',
        severity: 'high',
        description: `Nutrient level critically low: ${env.nutrient_level}%`
      });
    }

    // pH 불균형 확인
    if (env.ph_level < 5.5 || env.ph_level > 7.5) {
      stressFactors.push({
        type: 'ph_imbalance',
        severity: 'medium',
        description: `pH level outside optimal range: ${env.ph_level}`
      });
    }

    // 빛 부족 확인
    if (env.light_intensity < 40) {
      stressFactors.push({
        type: 'light_deficiency',
        severity: 'medium',
        description: `Light intensity low: ${env.light_intensity}%`
      });
    }

    // 건강 상태 결정
    let healthStatus: HealthStatus = 'healthy';
    const criticalStress = stressFactors.some(f => f.severity === 'critical');
    const highStress = stressFactors.some(f => f.severity === 'high');
    const mediumStress = stressFactors.some(f => f.severity === 'medium');

    if (criticalStress || stressFactors.length >= 3) {
      healthStatus = 'dead';
    } else if (highStress || stressFactors.length >= 2) {
      healthStatus = 'sick';
    } else if (mediumStress) {
      healthStatus = 'stressed';
    }

    return { health_status: healthStatus, stress_factors: stressFactors };
  }

  private calculateGrowthProgress(
    plant: Plant, 
    env: PlantEnvironmentData, 
    healthAssessment: { health_status: HealthStatus }
  ): { new_progress: number; new_stage: GrowthStage } {
    const config = this.getPlantConfig(plant.plant_type);
    const now = new Date();
    const plantAge = (now.getTime() - plant.planted_at.getTime()) / (1000 * 60 * 60 * 24); // days
    
    // 건강 상태에 따른 성장 속도 조정
    let growthMultiplier = 1.0;
    switch (healthAssessment.health_status) {
      case 'dead':
        return { new_progress: plant.growth_progress, new_stage: 'dead' };
      case 'sick':
        growthMultiplier = 0.3;
        break;
      case 'stressed':
        growthMultiplier = 0.7;
        break;
      case 'healthy':
        growthMultiplier = 1.0;
        break;
    }

    // 환경 조건에 따른 추가 보너스
    if (this.isOptimalEnvironment(env, config)) {
      growthMultiplier *= 1.2;
    }

    // 성장 단계별 진행률 계산
    let targetProgress = 0;
    let newStage: GrowthStage = plant.growth_stage;

    if (plantAge <= config.seed_duration_days) {
      newStage = 'seed';
      targetProgress = (plantAge / config.seed_duration_days) * 100;
    } else if (plantAge <= config.seed_duration_days + config.sprout_duration_days) {
      newStage = 'sprout';
      const sproutAge = plantAge - config.seed_duration_days;
      targetProgress = (sproutAge / config.sprout_duration_days) * 100;
    } else if (plantAge <= config.seed_duration_days + config.sprout_duration_days + config.growing_duration_days) {
      newStage = 'growing';
      const growingAge = plantAge - config.seed_duration_days - config.sprout_duration_days;
      targetProgress = (growingAge / config.growing_duration_days) * 100;
    } else if (plantAge <= config.seed_duration_days + config.sprout_duration_days + config.growing_duration_days + config.mature_duration_days) {
      newStage = 'mature';
      const matureAge = plantAge - config.seed_duration_days - config.sprout_duration_days - config.growing_duration_days;
      targetProgress = (matureAge / config.mature_duration_days) * 100;
    } else {
      newStage = 'harvest';
      targetProgress = 100;
    }

    // 현재 진행률에서 점진적으로 증가
    const progressIncrement = (targetProgress - plant.growth_progress) * 0.1 * growthMultiplier;
    const newProgress = Math.min(100, Math.max(0, plant.growth_progress + progressIncrement));

    return { new_progress: newProgress, new_stage: newStage };
  }

  private isOptimalEnvironment(env: PlantEnvironmentData, config: PlantGrowthConfig): boolean {
    return (
      env.temperature >= config.optimal_temp_min &&
      env.temperature <= config.optimal_temp_max &&
      env.humidity >= config.optimal_humidity_min &&
      env.humidity <= config.optimal_humidity_max &&
      env.soil_moisture >= 60 &&
      env.nutrient_level >= 70 &&
      env.ph_level >= 6.0 && env.ph_level <= 7.0
    );
  }

  private async updatePlantStatus(
    plant: Plant, 
    growthProgress: { new_progress: number; new_stage: GrowthStage },
    healthAssessment: { health_status: HealthStatus; stress_factors: any[] }
  ): Promise<void> {
    // 데이터베이스 업데이트
    // TODO: 실제 데이터베이스 업데이트 구현
    
    // 성장 히스토리 기록
    if (plant.growth_stage !== growthProgress.new_stage) {
      console.log(`🌱 Plant ${plant.id} progressed from ${plant.growth_stage} to ${growthProgress.new_stage}`);
      // TODO: growth_history 테이블에 기록
    }

    // 건강 이벤트 기록
    for (const stressFactor of healthAssessment.stress_factors) {
      console.log(`⚠️ Plant ${plant.id} health event: ${stressFactor.type} (${stressFactor.severity})`);
      // TODO: plant_health_events 테이블에 기록
    }
  }

  private getPlantConfig(plantType: PlantType): PlantGrowthConfig {
    // 기본 설정값들
    const configs: Record<PlantType, PlantGrowthConfig> = {
      lettuce: {
        plant_type: 'lettuce',
        seed_duration_days: 2,
        sprout_duration_days: 5,
        growing_duration_days: 18,
        mature_duration_days: 12,
        optimal_temp_min: 16,
        optimal_temp_max: 22,
        optimal_humidity_min: 65,
        optimal_humidity_max: 85,
        water_frequency_hours: 24,
        fertilizer_frequency_days: 7,
        growth_rate_multiplier: 1.0
      },
      spinach: {
        plant_type: 'spinach',
        seed_duration_days: 3,
        sprout_duration_days: 6,
        growing_duration_days: 20,
        mature_duration_days: 10,
        optimal_temp_min: 15,
        optimal_temp_max: 20,
        optimal_humidity_min: 60,
        optimal_humidity_max: 80,
        water_frequency_hours: 24,
        fertilizer_frequency_days: 7,
        growth_rate_multiplier: 1.0
      },
      kale: {
        plant_type: 'kale',
        seed_duration_days: 3,
        sprout_duration_days: 7,
        growing_duration_days: 25,
        mature_duration_days: 15,
        optimal_temp_min: 15,
        optimal_temp_max: 21,
        optimal_humidity_min: 60,
        optimal_humidity_max: 75,
        water_frequency_hours: 24,
        fertilizer_frequency_days: 7,
        growth_rate_multiplier: 0.9
      },
      arugula: {
        plant_type: 'arugula',
        seed_duration_days: 2,
        sprout_duration_days: 4,
        growing_duration_days: 15,
        mature_duration_days: 8,
        optimal_temp_min: 16,
        optimal_temp_max: 22,
        optimal_humidity_min: 65,
        optimal_humidity_max: 80,
        water_frequency_hours: 20,
        fertilizer_frequency_days: 5,
        growth_rate_multiplier: 1.2
      },
      basil: {
        plant_type: 'basil',
        seed_duration_days: 4,
        sprout_duration_days: 8,
        growing_duration_days: 28,
        mature_duration_days: 20,
        optimal_temp_min: 20,
        optimal_temp_max: 26,
        optimal_humidity_min: 70,
        optimal_humidity_max: 85,
        water_frequency_hours: 18,
        fertilizer_frequency_days: 10,
        growth_rate_multiplier: 0.8
      },
      mint: {
        plant_type: 'mint',
        seed_duration_days: 5,
        sprout_duration_days: 10,
        growing_duration_days: 30,
        mature_duration_days: 25,
        optimal_temp_min: 18,
        optimal_temp_max: 24,
        optimal_humidity_min: 70,
        optimal_humidity_max: 90,
        water_frequency_hours: 16,
        fertilizer_frequency_days: 14,
        growth_rate_multiplier: 0.7
      }
    };

    return configs[plantType];
  }

  // 수동으로 식물 심기
  async plantSeed(zoneId: string, plantType: PlantType, positionX: number, positionY: number, positionZ: number): Promise<number> {
    // TODO: 데이터베이스에 새 식물 추가
    console.log(`🌱 Planting ${plantType} seed at zone ${zoneId} (${positionX}, ${positionY}, ${positionZ})`);
    return Math.floor(Math.random() * 1000); // 임시 ID
  }

  // 식물 수확
  async harvestPlant(plantId: number): Promise<boolean> {
    // TODO: 식물을 수확 상태로 변경하고 제거
    console.log(`🌾 Harvesting plant ${plantId}`);
    return true;
  }
}