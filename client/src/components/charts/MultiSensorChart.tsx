import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface SensorDataPoint {
  timestamp: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
}

interface MultiSensorChartProps {
  data: SensorDataPoint[];
  height?: number;
  title?: string;
}

export const MultiSensorChart: React.FC<MultiSensorChartProps> = ({
  data,
  height = 300,
  title
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  // 현재 시간
  const now = new Date();

  // 센서 타입별로 데이터 그룹화
  const sensorTypes = [...new Set(data.map(d => d.sensor_type))];
  
  // 시간별로 데이터 정리
  const timePoints = [...new Set(data.map(d => d.timestamp))].sort();
  
  const chartData = timePoints.map(timestamp => {
    const point: any = {
      timestamp: new Date(timestamp).toLocaleTimeString('ko-KR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      fullTimestamp: timestamp,
      isPast: new Date(timestamp) <= now,
      isFuture: new Date(timestamp) > now
    };

    sensorTypes.forEach(sensorType => {
      const sensorData = data.find(d => d.timestamp === timestamp && d.sensor_type === sensorType);
      if (sensorData) {
        point[sensorType] = sensorData.value;
        point[`${sensorType}_status`] = sensorData.status;
        point[`${sensorType}_unit`] = sensorData.unit;
      }
    });

    return point;
  });

  // 센서 타입별 색상 및 이름
  const sensorConfig = {
    temperature: { color: '#ef4444', name: '온도', unit: '°C' },
    humidity: { color: '#3b82f6', name: '습도', unit: '%' },
    soil_moisture: { color: '#10b981', name: '토양수분', unit: '%' },
    light: { color: '#f59e0b', name: '조도', unit: 'lux' },
    co2: { color: '#8b5cf6', name: 'CO2', unit: 'ppm' }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="timestamp"
            tick={{ fontSize: 11 }}
            tickFormatter={(value: any, index: number) => {
              return index % 8 === 0 ? value : '';
            }}
          />
          <YAxis 
            tick={{ fontSize: 11 }}
          />
          <Tooltip 
            content={({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const dataPoint = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <div className="space-y-1 mt-2">
                      {payload.map((entry: any, index: number) => {
                        const sensorType = entry.dataKey;
                        const config = sensorConfig[sensorType as keyof typeof sensorConfig];
                        if (!config) return null;
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: config.color }}
                              />
                              <span>{config.name}:</span>
                            </div>
                            <span className="font-medium">
                              {entry.value?.toFixed(1)}{config.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {dataPoint.isFuture ? '예측 데이터' : '실제 데이터'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          
          {/* 각 센서 타입별 라인 */}
          {sensorTypes.map(sensorType => {
            const config = sensorConfig[sensorType as keyof typeof sensorConfig];
            if (!config) return null;
            
            return (
              <Line
                key={sensorType}
                type="monotone"
                dataKey={sensorType}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                name={config.name}
              />
            );
          })}

          {/* 현재 시간 구분선 */}
          <ReferenceLine 
            x={now.toLocaleTimeString('ko-KR', { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })} 
            stroke="#64748b" 
            strokeDasharray="8 8"
            strokeWidth={1}
            label={{ value: "현재", position: "top", fontSize: 12 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};