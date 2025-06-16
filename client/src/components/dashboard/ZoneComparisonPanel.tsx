import React, { useMemo } from 'react';
import { FarmZone } from '../../types/farm.types';
import { SensorData } from '../../services/websocket';
import { Thermometer, Droplets, Lightbulb, Wind, Gauge, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface ZoneComparisonPanelProps {
  zones: FarmZone[];
  sensorData: SensorData[];
  selectedZone: string | null;
}

export const ZoneComparisonPanel: React.FC<ZoneComparisonPanelProps> = ({ 
  zones, 
  sensorData, 
  selectedZone 
}) => {
  // 구역별 센서 데이터 요약 계산
  const zoneStats = useMemo(() => {
    return zones.map(zone => {
      // 해당 구역의 센서 데이터 필터링
      const zoneSensorData = sensorData.filter(data => 
        data.sensor_id.includes(zone.id)
      );

      // 센서 타입별 최신 데이터
      const sensorByType = zoneSensorData.reduce((acc, data) => {
        const sensorType = data.sensor_id.split('-').pop();
        if (!sensorType) return acc;
        
        if (!acc[sensorType] || new Date(data.timestamp) > new Date(acc[sensorType].timestamp)) {
          acc[sensorType] = data;
        }
        return acc;
      }, {} as Record<string, SensorData>);

      // 상태별 센서 개수
      const statusCounts = zoneSensorData.reduce((acc, data) => {
        acc[data.status] = (acc[data.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 건강도 계산 (정상: 100, 경고: 50, 위험: 0)
      const totalSensors = zoneSensorData.length;
      const healthScore = totalSensors > 0 ? Math.round(
        ((statusCounts.normal || 0) * 100 + (statusCounts.warning || 0) * 50) / totalSensors
      ) : 0;

      return {
        zone,
        sensorData: sensorByType,
        statusCounts,
        healthScore,
        totalSensors,
        lastUpdate: zoneSensorData.length > 0 
          ? Math.max(...zoneSensorData.map(d => new Date(d.timestamp).getTime()))
          : 0
      };
    });
  }, [zones, sensorData]);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'light': return Lightbulb;
      case 'co2': return Wind;
      case 'soil_moisture': return Gauge;
      default: return Gauge;
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 50) return AlertCircle;
    return AlertTriangle;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // 선택된 구역이 있으면 해당 구역만, 없으면 모든 구역 표시
  const displayZones = selectedZone 
    ? zoneStats.filter(stat => stat.zone.id === selectedZone)
    : zoneStats;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {selectedZone ? `${selectedZone} 구역` : `전체 ${zones.length}개 구역`}
        </div>
      </div>

      <div className="space-y-4">
        {displayZones.map((zoneStat) => {
          const HealthIcon = getHealthIcon(zoneStat.healthScore);
          
          return (
            <div 
              key={zoneStat.zone.id} 
              className={`p-4 rounded-lg border-2 transition-all ${getHealthBgColor(zoneStat.healthScore)} ${
                selectedZone === zoneStat.zone.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* 구역 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <HealthIcon className={`w-6 h-6 ${getHealthColor(zoneStat.healthScore)}`} />
                  <div>
                    <h4 className="font-bold text-gray-900">{zoneStat.zone.name}</h4>
                    <p className="text-sm text-gray-600">{zoneStat.zone.crop_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getHealthColor(zoneStat.healthScore)}`}>
                    {zoneStat.healthScore}점
                  </div>
                  <div className="text-xs text-gray-500">건강도</div>
                </div>
              </div>

              {/* 센서 현황 요약 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {Object.entries(zoneStat.sensorData).map(([type, data]) => {
                  const SensorIcon = getSensorIcon(type);
                  const statusColor = data.status === 'normal' ? 'text-green-600' : 
                                    data.status === 'warning' ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <SensorIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {type === 'temperature' ? '온도' :
                           type === 'humidity' ? '습도' :
                           type === 'light' ? '조도' :
                           type === 'co2' ? 'CO2' :
                           type === 'soil_moisture' ? '토양' : type}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${statusColor}`}>
                          {typeof data.value === 'number' ? data.value.toFixed(1) : data.value}
                          <span className="text-xs ml-1">{data.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 상태 표시기 */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex space-x-4 text-xs">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>정상 {zoneStat.statusCounts.normal || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>경고 {zoneStat.statusCounts.warning || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>위험 {zoneStat.statusCounts.critical || 0}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {zoneStat.lastUpdate > 0 ? 
                    new Date(zoneStat.lastUpdate).toLocaleTimeString() : 
                    '데이터 없음'
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayZones.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🏠</div>
          <p className="text-gray-600">표시할 구역이 없습니다.</p>
        </div>
      )}
    </div>
  );
};