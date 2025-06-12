import React, { useState, useEffect } from 'react';
import { FarmViewer } from '../components/three/FarmViewer';
import { SensorPanel } from '../components/dashboard/SensorPanel';
import { ChartModal } from '../components/charts/ChartModal';
import { ZoneSelector } from '../components/controls/ZoneSelector';
import { TimeRange } from '../components/controls/TimeRange';
import { FarmControlPanel } from '../components/controls/FarmControlPanel';
import { Loading } from '../components/common/Loading';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/api';
import { FarmStructure, FarmZone } from '../types/farm.types';
import { Sensor } from '../types/sensor.types';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'plant' | 'zone'>('plant'); // 식물별 보기 vs 구역별 보기
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    new Date()
  ]);
  const [farmStructure, setFarmStructure] = useState<FarmStructure | null>(null);
  const [processedZones, setProcessedZones] = useState<FarmZone[]>([]);
  const [error, setError] = useState<string | null>(null);

  // WebSocket hook
  const {
    isConnected,
    sensorData,
    alerts,
    subscribeToSensorData,
    subscribeToAlerts,
    error: wsError
  } = useWebSocket();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        console.log('🔄 Dashboard: Loading farm data...');
        
        // Load farm structure
        const structure = await apiService.getFarmStructure();
        console.log('📊 Dashboard: Farm structure loaded', structure);
        console.log('📊 Dashboard: Raw farm structure from API:', JSON.stringify(structure, null, 2));
        if (structure && structure.zones && structure.zones.length > 0) {
          console.log('📊 Dashboard: First zone raw sensors from API (structure.zones[0].sensors):', JSON.stringify(structure.zones[0].sensors, null, 2));
          console.log('📊 Dashboard: All zones raw sensors from API (structure.zones.map(z => z.sensors)):', JSON.stringify(structure.zones.map(z => z.sensors), null, 2));
        }
        setFarmStructure(structure);
        
        
        setError(null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('농장 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Subscribe to WebSocket data when connected
  useEffect(() => {
    if (isConnected) {
      console.log('🔌 Dashboard: WebSocket connected, subscribing to data...');
      subscribeToSensorData();
      subscribeToAlerts();
    }
  }, [isConnected, subscribeToSensorData, subscribeToAlerts]);

  // Debug WebSocket data
  useEffect(() => {
    console.log('📊 Dashboard: Sensor data updated', { 
      count: sensorData.length, 
      data: sensorData.slice(0, 3) // Log first 3 items 
    });
  }, [sensorData]);

  useEffect(() => {
    console.log('🚨 Dashboard: Alerts updated', { 
      count: alerts.length, 
      alerts: alerts.slice(0, 3) // Log first 3 items
    });
  }, [alerts]);

  // Effect to update/populate zones with sensor definitions and their latest data
  useEffect(() => {
    if (farmStructure?.zones) { // Ensure farmStructure and its zones are loaded
      console.log('🔄 Dashboard: Processing zones and sensor data...');
      if (farmStructure.zones.length > 0) {
        console.log('🔄 Dashboard: Inside processing useEffect - First zone.sensors from farmStructure:', JSON.stringify(farmStructure.zones[0]?.sensors, null, 2));
        console.log('🔄 Dashboard: Inside processing useEffect - All zone.sensors from farmStructure:', JSON.stringify(farmStructure.zones.map(z => z.sensors), null, 2));
      }
      const newProcessedZones = farmStructure.zones.map(zone => {
        // Attempt to parse sensors from sensors_json if available
        let currentZoneSensors: Sensor[] = []; // Initialize currentZoneSensors
        if ((zone as any).sensors_json) {
          try {
            // The sensors_json string is a comma-separated list of JSON objects,
            // not a valid JSON array. Wrap with '[' and ']' to make it parsable.
            const validJsonString = `[${(zone as any).sensors_json}]`;
            const sensorsFromJson = JSON.parse(validJsonString) as Partial<Sensor>[]; // Use Partial<Sensor> for flexibility

            // Define valid sensor types and statuses based on the Sensor interface
            const validSensorTypes: Sensor['type'][] = ['temperature', 'humidity', 'soil_moisture', 'light', 'co2'];
            const validSensorStatuses: NonNullable<Sensor['latest_status']>[] = ['normal', 'warning', 'critical'];

            currentZoneSensors = sensorsFromJson.map((s, index) => {
              let determinedType: Sensor['type'];
              if (s.type && validSensorTypes.includes(s.type as Sensor['type'])) {
                determinedType = s.type as Sensor['type'];
              } else {
                // console.warn(`Dashboard: Invalid or missing sensor type '${s.type}' for sensor in zone ${zone.id}. Defaulting to '${validSensorTypes[0]}'.`);
                determinedType = validSensorTypes[0]; // Default to the first valid type
              }

              let determinedStatus: Sensor['latest_status'];
              if (s.latest_status) {
                if (validSensorStatuses.includes(s.latest_status as NonNullable<Sensor['latest_status']>)) {
                  determinedStatus = s.latest_status as NonNullable<Sensor['latest_status']>;
                } else {
                  // console.warn(`Dashboard: Invalid sensor status '${s.latest_status}' for sensor in zone ${zone.id}. Defaulting to 'normal'.`);
                  determinedStatus = 'normal'; // Default for invalid but present status
                }
              } else {
                determinedStatus = undefined; // Status is optional
              }

              const newSensor: Sensor = {
                id: s.id || `sensor-${zone.id}-${determinedType}-${index}`,
                name: s.name || `${zone.name} ${determinedType} Sensor ${index + 1}`,
                type: determinedType,
                zone_id: zone.id,
                position_x: s.position_x ?? 0,
                position_y: s.position_y ?? 0,
                position_z: s.position_z ?? 0,
                min_normal: s.min_normal ?? 0,
                max_normal: s.max_normal ?? 0,
                min_warning: s.min_warning ?? 0,
                max_warning: s.max_warning ?? 0,
                min_critical: s.min_critical ?? 0,
                max_critical: s.max_critical ?? 0,
                unit: s.unit || '', // Ensure unit is always a string
                is_active: s.is_active ?? true,
                created_at: s.created_at || new Date().toISOString(),
                latest_value: s.latest_value,
                latest_status: determinedStatus,
                latest_timestamp: s.latest_timestamp,
              };
              return newSensor;
            });
            // console.log(`🔄 Dashboard: Parsed ${currentZoneSensors.length} sensors from sensors_json for zone ${zone.id}. First:`, currentZoneSensors[0]);
          } catch (error) {
            console.error(`❌ Dashboard: Error parsing sensors_json for zone ${zone.id}:`, error, `JSON string: ${(zone as any).sensors_json}`);
            currentZoneSensors = []; 
          }
        } else {
           console.log(`ℹ️ Dashboard: No sensors_json found for zone ${zone.id}. Initializing with empty sensor array.`);
           currentZoneSensors = [];
        }
        // Add a log to see what currentZoneSensors contains after parsing, before WebSocket merge
        if (currentZoneSensors.length > 0) {
            console.log(`ℹ️ Dashboard: Zone ${zone.id} has ${currentZoneSensors.length} sensors after parsing sensors_json. First sensor:`, currentZoneSensors[0]);
        } else {
            console.log(`ℹ️ Dashboard: Zone ${zone.id} has no sensors after attempting to parse sensors_json.`);
        }

        // If we have live sensor data from WebSocket, update/enrich our sensor definitions
        if (sensorData && sensorData.length > 0) {
          currentZoneSensors = currentZoneSensors.map(definedSensor => {
            const liveUpdate = sensorData.find(sd => sd.sensor_id === definedSensor.id);
            if (liveUpdate) {
              return {
                ...definedSensor,
                latest_value: liveUpdate.value,
                latest_status: liveUpdate.status,
                latest_timestamp: liveUpdate.timestamp,
              };
            }
            return definedSensor; // No live update for this sensor, keep API-provided data
          });
        }
        
        return {
          ...zone,
          sensors: currentZoneSensors, // This is now Sensor[]
          sensor_count: currentZoneSensors.length,
        };
      });
      setProcessedZones(newProcessedZones); // newProcessedZones is FarmZone[] with correct Sensor[]
      console.log('✅ Dashboard: Processed zones with sensor data', newProcessedZones);
    } else {
      // If farmStructure or its zones are not available, reset processedZones
      setProcessedZones([]);
    }
  }, [farmStructure, sensorData]);

  if (isLoading) {
    return <Loading fullScreen message="농장 데이터를 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 로딩 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // const zones = farmStructure?.zones || []; // 이제 processedZones를 사용합니다.

  console.log('📊 Dashboard: All sensor data', {
    total: sensorData.length,
    latest: sensorData.length > 0 ? new Date(Math.max(...sensorData.map(d => new Date(d.timestamp).getTime()))).toLocaleTimeString() : 'N/A',
    sample: sensorData.slice(0, 3)
  });


  return (
    <div className="dashboard-layout h-screen flex flex-col bg-gray-50">
      {/* Top Controls */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3 max-h-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">농장 대시보드</h1>
            <div className="flex items-center space-x-2 text-sm">
              <div className={isConnected ? "status-dot-normal" : "status-dot-critical"}></div>
              <span className={isConnected ? "text-green-600" : "text-red-600"}>
                {isConnected ? "실시간 연결됨" : "연결 끊김"}
              </span>
              {wsError && <span className="text-red-500">({wsError.message})</span>}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <TimeRange 
              value={timeRange}
              onChange={setTimeRange}
            />
            
            <button className="btn-primary">
              데이터 내보내기
            </button>
          </div>
        </div>


        {/* Real-time data info */}
        {sensorData.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">
                📊 실시간: {sensorData.length}개 센서
              </span>
              <span className="text-blue-600">
                업데이트: {sensorData.length > 0 ? 
                  new Date(Math.max(...sensorData.map(d => new Date(d.timestamp).getTime()))).toLocaleTimeString() 
                  : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Alerts info */}
        {alerts.length > 0 && (
          <div className="mt-1 p-2 bg-orange-50 border border-orange-200 rounded text-xs flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-orange-700">
                🚨 알림: {alerts.length}개
              </span>
              <span className="text-orange-600">
                최신: {alerts[0]?.message.substring(0, 30)}...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - 3D Viewer */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-w-0 min-h-0">
          <div className="flex-shrink-0 p-3 border-b border-gray-200 h-auto max-h-none">
            <div className="flex items-center justify-between min-h-0">
              <h2 className="text-base font-semibold text-gray-900 flex-shrink-0">3D 농장 뷰</h2>
              <div className="flex items-center space-x-4 flex-shrink-0">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 font-medium">보기 모드:</span>
                  <div className="flex space-x-1 border border-gray-300 rounded-lg p-1 bg-gray-100">
                    <button
                      onClick={() => setViewMode('plant')}
                      className={`px-3 py-2 text-sm rounded-md transition-all duration-200 font-medium ${
                        viewMode === 'plant'
                          ? 'bg-green-500 text-white shadow-md transform scale-105'
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-green-600 border border-transparent hover:border-green-200'
                      }`}
                    >
                      🌱 식물별 보기
                    </button>
                    <button
                      onClick={() => setViewMode('zone')}
                      className={`px-3 py-2 text-sm rounded-md transition-all duration-200 font-medium ${
                        viewMode === 'zone'
                          ? 'bg-blue-500 text-white shadow-md transform scale-105'
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 border border-transparent hover:border-blue-200'
                      }`}
                    >
                      🏠 구역별 보기
                    </button>
                  </div>
                </div>

                {/* Zone Selector */}
                <ZoneSelector
                  zones={processedZones.map(zone => ({ // farmStructure.zones 대신 processedZones 사용
                    id: zone.id,
                    name: zone.name,
                    level: zone.level,
                    cropType: zone.crop_type,
                    sensorCount: zone.sensor_count || 0, // 이제 zone.sensor_count가 useEffect에서 업데이트됨
                    healthScore: Math.round(Math.random() * 20 + 80) // Placeholder health score
                  }))}
                  selectedZone={selectedZone}
                  onZoneSelect={setSelectedZone}
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden min-h-0">
            <FarmViewer 
              zones={processedZones} // farmStructure.zones 대신 processedZones 사용
              sensorData={sensorData}
              selectedZone={selectedZone}
              viewMode={viewMode} // Pass view mode to FarmViewer
              onZoneSelect={setSelectedZone}
              onSensorSelect={(sensorId) => {
                console.log('Sensor selected:', sensorId);
                // Handle sensor selection (could open a modal or navigate to sensor detail)
              }}
              onChartToggle={() => setIsChartModalOpen(!isChartModalOpen)}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Right Panel - Sensor Panel + Control Panel */}
        <div className="w-80 xl:w-96 flex flex-col bg-gray-50 overflow-hidden flex-shrink-0">
          {/* Sensor Panel - 더 많은 공간 할당 */}
          <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '60vh' }}>
            <SensorPanel 
              selectedZone={selectedZone}
              sensorData={sensorData}
              isConnected={isConnected}
            />
          </div>
          
          {/* Control Panel - 컴팩트하게 표시 */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200">
            <FarmControlPanel
              onLightingControl={(tier, side, action) => {
                console.log(`조명 제어: ${tier}층 ${side}구역 ${action}`);
                // TODO: 3D 모델의 LED 조명 제어 구현
              }}
              onIrrigationControl={(tier, side, action) => {
                console.log(`급수 제어: ${tier}층 ${side}구역 ${action}`);
                // TODO: 3D 모델의 스프링클러 제어 구현
              }}
            />
          </div>
        </div>
      </div>

      {/* Chart Modal */}
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        selectedZone={selectedZone}
        timeRange={timeRange}
        sensorData={sensorData}
      />
    </div>
  );
};

export default Dashboard;