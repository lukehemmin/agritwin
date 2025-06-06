import React, { useState, useEffect } from 'react';
import { FarmViewer } from '../components/three/FarmViewer';
import { SensorPanel } from '../components/dashboard/SensorPanel';
import { ChartSection } from '../components/dashboard/ChartSection';
import { AlertPanel } from '../components/dashboard/AlertPanel';
import { StatCard } from '../components/dashboard/StatCard';
import { ZoneSelector } from '../components/controls/ZoneSelector';
import { TimeRange } from '../components/controls/TimeRange';
import { Loading } from '../components/common/Loading';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/api';
import { FarmStructure } from '../types/farm.types';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<[Date, Date]>([
    new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    new Date()
  ]);
  const [farmStructure, setFarmStructure] = useState<FarmStructure | null>(null);
  const [farmSummary, setFarmSummary] = useState<any>(null);
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
        setFarmStructure(structure);
        
        // Load farm summary
        const summary = await apiService.getFarmSummary();
        console.log('📈 Dashboard: Farm summary loaded', summary);
        setFarmSummary(summary);
        
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

  const zones = farmStructure?.zones || [];
  const overview = farmSummary?.overview;
  const sensorAverages = farmSummary?.sensor_averages || [];

  console.log('📊 Dashboard: All sensor data', {
    total: sensorData.length,
    latest: sensorData.length > 0 ? new Date(Math.max(...sensorData.map(d => new Date(d.timestamp).getTime()))).toLocaleTimeString() : 'N/A',
    sample: sensorData.slice(0, 3)
  });

  // Calculate averages from recent sensor data
  const tempSensor = sensorAverages.find((s: any) => s.type === 'temperature');
  const humiditySensor = sensorAverages.find((s: any) => s.type === 'humidity');
  
  // Calculate real-time averages from current data
  const recentTempData = sensorData.filter(d => d.sensor_id.includes('temperature'));
  const recentHumidityData = sensorData.filter(d => d.sensor_id.includes('humidity'));
  
  const currentTempAvg = recentTempData.length > 0 
    ? recentTempData.reduce((sum, d) => sum + d.value, 0) / recentTempData.length 
    : tempSensor?.avg_value || 0;
    
  const currentHumidityAvg = recentHumidityData.length > 0 
    ? recentHumidityData.reduce((sum, d) => sum + d.value, 0) / recentHumidityData.length 
    : humiditySensor?.avg_value || 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Controls */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard
            title="총 센서"
            value={overview?.total_sensors || 0}
            unit="개"
            trend={{ value: 0, isPositive: true }}
            icon="sensors"
          />
          <StatCard
            title="활성 센서"
            value={sensorData.length}
            unit="개"
            trend={{ value: 2, isPositive: true }}
            icon="active"
            status={sensorData.length > 0 ? "success" : "warning"}
          />
          <StatCard
            title="평균 온도"
            value={Math.round(currentTempAvg * 10) / 10}
            unit="°C"
            trend={{ value: 1.2, isPositive: true }}
            icon="temperature"
          />
          <StatCard
            title="평균 습도"
            value={Math.round(currentHumidityAvg * 10) / 10}
            unit="%"
            trend={{ value: -2.1, isPositive: false }}
            icon="humidity"
          />
        </div>

        {/* Real-time data info */}
        {sensorData.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
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
          <div className="mt-1 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
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
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-w-0">
          <div className="flex-shrink-0 p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">3D 농장 뷰</h2>
              <ZoneSelector
                zones={zones.map(zone => ({
                  id: zone.id,
                  name: zone.name,
                  level: zone.level,
                  cropType: zone.crop_type,
                  sensorCount: zone.sensors?.length || 5,
                  healthScore: Math.round(Math.random() * 20 + 80) // Placeholder health score
                }))}
                selectedZone={selectedZone}
                onZoneSelect={setSelectedZone}
              />
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            <FarmViewer 
              zones={zones}
              sensorData={sensorData}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
              onSensorSelect={(sensorId) => {
                console.log('Sensor selected:', sensorId);
                // Handle sensor selection (could open a modal or navigate to sensor detail)
              }}
              className="absolute inset-0"
            />
          </div>
        </div>

        {/* Right Panel - Data Panels */}
        <div className="w-80 xl:w-96 flex flex-col bg-gray-50 overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-auto">
            {/* Sensor Panel */}
            <div className="p-4">
              <SensorPanel 
                selectedZone={selectedZone}
                sensorData={sensorData}
                isConnected={isConnected}
              />
            </div>

            {/* Charts */}
            <div className="p-4">
              <ChartSection 
                selectedZone={selectedZone}
                timeRange={timeRange}
                sensorData={sensorData}
              />
            </div>

            {/* Alerts */}
            <div className="p-4">
              <AlertPanel 
                alerts={alerts}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;