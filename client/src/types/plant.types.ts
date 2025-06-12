export interface Plant {
  id: number;
  farm_zone_id: string;
  plant_type: PlantType;
  position_x: number;
  position_y: number;
  position_z: number;
  planted_at: string;
  growth_stage: GrowthStage;
  growth_progress: number; // 0-100
  health_status: HealthStatus;
  size_multiplier: number;
  last_watered: string;
  last_fertilized: string;
  created_at: string;
  updated_at: string;
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
  recorded_at: string;
}

export interface PlantHealthEvent {
  id: number;
  plant_id: number;
  event_type: HealthEventType;
  severity: EventSeverity;
  description: string;
  sensor_readings: Record<string, any>;
  created_at: string;
  resolved_at: string | null;
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

export interface PlantStats {
  total_plants: number;
  by_growth_stage: Record<GrowthStage, number>;
  by_health_status: Record<HealthStatus, number>;
  by_plant_type: Record<PlantType, number>;
}

export interface PlantEnvironmentData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  ph_level: number;
  light_intensity: number;
  nutrient_level: number;
  timestamp: string;
}

export interface PlantWithDetails extends Plant {
  recent_health_events: PlantHealthEvent[];
  growth_history: PlantGrowthHistory[];
  environment_data?: PlantEnvironmentData;
}