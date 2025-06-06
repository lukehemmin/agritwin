export interface FarmZone {
  id: string;
  name: string;
  level: number;
  area: number;
  crop_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  size_x: number;
  size_y: number;
  size_z: number;
  created_at: string;
}

export interface FarmZoneWithSensors extends FarmZone {
  sensors: Array<{
    id: string;
    name: string;
    type: string;
    position_x: number;
    position_y: number;
    position_z: number;
    is_active: boolean;
    latest_value?: number;
    latest_status?: string;
  }>;
}

export interface FarmStructure {
  id: string;
  name: string;
  total_levels: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  zones: FarmZoneWithSensors[];
}