import React from 'react';
import { Thermometer, Droplets, Lightbulb, Wind, Gauge } from 'lucide-react';
import { SensorData } from '../../services/websocket';

interface SensorPanelProps {
  selectedZone: string | null;
  sensorData: SensorData[];
  isConnected: boolean;
}

export const SensorPanel: React.FC<SensorPanelProps> = ({ selectedZone, sensorData, isConnected }) => {
  console.log('🎛️ SensorPanel: Rendering with data', { 
    sensorDataCount: sensorData.length, 
    selectedZone, 
    isConnected,
    sampleData: sensorData.slice(0, 2)
  });

  // Group sensor data by type and get latest values
  const sensorGroups = sensorData.reduce((acc, data) => {
    const sensorType = data.sensor_id.split('-').pop(); // Extract type from sensor_id
    if (!sensorType) return acc;
    
    if (!acc[sensorType] || new Date(data.timestamp) > new Date(acc[sensorType].timestamp)) {
      acc[sensorType] = data;
    }
    return acc;
  }, {} as Record<string, SensorData>);

  console.log('🎛️ SensorPanel: Grouped sensor data', sensorGroups);

  const getIcon = (type: string) => {
    switch (type) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'light': return Lightbulb;
      case 'co2': return Wind;
      case 'soil_moisture': return Gauge;
      default: return Gauge;
    }
  };

  const getSensorDisplayName = (type: string) => {
    switch (type) {
      case 'temperature': return '온도 센서';
      case 'humidity': return '습도 센서';
      case 'light': return '조도 센서';
      case 'co2': return 'CO2 센서';
      case 'soil_moisture': return '토양수분 센서';
      default: return type;
    }
  };

  // 선택된 구역 필터링
  let filteredData = sensorData;
  if (selectedZone) {
    filteredData = sensorData.filter(data => data.sensor_id.includes(selectedZone));
    console.log('🎛️ SensorPanel: Zone filtered', { zone: selectedZone, count: filteredData.length });
  }

  // 실시간 센서 데이터 처리
  const realtimeSensorGroups = filteredData.reduce((acc, data) => {
    const sensorType = data.sensor_id.split('-').pop();
    if (!sensorType) return acc;
    
    if (!acc[sensorType] || new Date(data.timestamp) > new Date(acc[sensorType].timestamp)) {
      acc[sensorType] = data;
    }
    return acc;
  }, {} as Record<string, SensorData>);

  const sensors = Object.entries(realtimeSensorGroups).map(([type, data]) => ({
    id: data.sensor_id,
    type,
    name: getSensorDisplayName(type),
    value: data.value,
    unit: data.unit,
    status: data.status,
    icon: getIcon(type),
    timestamp: data.timestamp
  }));

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal': return 'status-normal';
      case 'warning': return 'status-warning';
      case 'critical': return 'status-critical';
      default: return 'status-normal';
    }
  };

  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'normal': return 'status-dot-normal';
      case 'warning': return 'status-dot-warning';
      case 'critical': return 'status-dot-critical';
      default: return 'status-dot-normal';
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">센서 현황</h3>
          <div className="text-sm text-red-500">연결 끊김</div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📡</div>
          <p className="text-gray-600">서버 연결이 끊어졌습니다.</p>
          <p className="text-sm text-gray-500">연결을 복구하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">센서 현황</h3>
        <div className="text-sm text-gray-500">
          {selectedZone ? `${selectedZone} 구역` : '전체 구역'}
        </div>
      </div>

      {sensors.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-600">센서 데이터를 불러오는 중...</p>
          <p className="text-xs text-gray-400 mt-2">
            연결됨: {isConnected ? '✅' : '❌'} | 
            데이터 개수: {sensorData.length}개 | 
            구역: {selectedZone || '전체'} |
            필터됨: {filteredData.length}개
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <sensor.icon size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{sensor.name}</p>
                  <div className="flex items-center space-x-2">
                    <div className={getStatusDotClass(sensor.status)}></div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusClass(sensor.status)}`}>
                      {sensor.status === 'normal' ? '정상' : 
                       sensor.status === 'warning' ? '경고' : '위험'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {typeof sensor.value === 'number' ? sensor.value.toLocaleString() : sensor.value}
                </p>
                <p className="text-sm text-gray-500">{sensor.unit}</p>
                <p className="text-xs text-gray-400">
                  {new Date(sensor.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">마지막 업데이트:</span>
          <span className="font-medium text-gray-900">
            {sensors.length > 0 && sensors[0].timestamp 
              ? new Date(sensors[0].timestamp).toLocaleTimeString()
              : '데이터 없음'
            }
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>활성 센서:</span>
          <span>{sensors.length}개</span>
        </div>
      </div>
    </div>
  );
};