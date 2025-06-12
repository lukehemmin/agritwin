export interface Plant {
  id: number;
  farm_zone_id: string;
  plant_type: PlantType;
  position_x: number;
  position_y: number;
  position_z: number;
  planted_at: Date;
  growth_stage: GrowthStage;
  growth_progress: number; // 0-100
  health_status: HealthStatus;
  size_multiplier: number;
  last_watered: Date;
  last_fertilized: Date;
  created_at: Date;
  updated_at: Date;
}

export type PlantType = 'lettuce' | 'spinach' | 'kale' | 'arugula' | 'basil' | 'mint';

export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead';

export type HealthStatus = 'healthy' | 'stressed' | 'sick' | 'dead';

export interface PlantGrowthHistory {
  id: number;
  plant_id: number;
  previous_stage: GrowthStage | null;
  new_stage: GrowthStage;
  previous_progress: number;
  new_progress: number;
  change_reason: string;
  recorded_at: Date;
}

export interface PlantHealthEvent {
  id: number;
  plant_id: number;
  event_type: HealthEventType;
  severity: EventSeverity;
  description: string;
  sensor_readings: Record<string, any>;
  created_at: Date;
  resolved_at: Date | null;
}

export type HealthEventType = 
  | 'temperature_stress' 
  | 'water_stress' 
  | 'nutrient_deficiency' 
  | 'disease' 
  | 'recovery'
  | 'pest_attack'
  | 'light_deficiency'
  | 'ph_imbalance';

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PlantGrowthConfig {
  plant_type: PlantType;
  seed_duration_days: number;
  sprout_duration_days: number;
  growing_duration_days: number;
  mature_duration_days: number;
  optimal_temp_min: number;
  optimal_temp_max: number;
  optimal_humidity_min: number;
  optimal_humidity_max: number;
  water_frequency_hours: number;
  fertilizer_frequency_days: number;
  growth_rate_multiplier: number;
}

export interface PlantWithEvents extends Plant {
  recent_health_events: PlantHealthEvent[];
  growth_history: PlantGrowthHistory[];
}

export interface PlantEnvironmentData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  ph_level: number;
  light_intensity: number;
  nutrient_level: number;
  timestamp: Date;
}