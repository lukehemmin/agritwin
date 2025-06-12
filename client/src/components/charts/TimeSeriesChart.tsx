import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart
} from 'recharts';

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  sensor_id: string;
  sensor_name: string;
  sensor_type: string;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  height?: number;
  showFutureDivider?: boolean;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  height = 400,
  showFutureDivider = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  // 현재 시간으로 과거/미래 구분
  const now = new Date();

  // 센서별로 데이터 그룹화
  const sensorGroups = data.reduce((groups, point) => {
    const key = `${point.sensor_type}_${point.sensor_id}`;
    if (!groups[key]) {
      groups[key] = {
        sensorName: point.sensor_name,
        sensorType: point.sensor_type,
        unit: point.unit,
        data: []
      };
    }
    groups[key].data.push({
      ...point,
      timestamp: new Date(point.timestamp).getTime(),
      formattedTime: new Date(point.timestamp).toLocaleTimeString('ko-KR', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isPast: new Date(point.timestamp) <= now,
      isFuture: new Date(point.timestamp) > now
    });
    return groups;
  }, {} as Record<string, any>);

  // 차트 데이터 준비
  const chartData = Object.values(sensorGroups)[0]?.data || [];
  
  // 센서 타입별 색상 매핑
  const getColorForSensorType = (sensorType: string) => {
    const colors = {
      temperature: '#ef4444', // red
      humidity: '#3b82f6',    // blue
      soil_moisture: '#10b981', // green
      light: '#f59e0b',       // amber
      co2: '#8b5cf6'          // purple
    };
    return colors[sensorType as keyof typeof colors] || '#6b7280';
  };

  // 센서 타입별 한국어 이름
  const getSensorTypeName = (sensorType: string) => {
    const names = {
      temperature: '온도',
      humidity: '습도',
      soil_moisture: '토양수분',
      light: '조도',
      co2: 'CO2'
    };
    return names[sensorType as keyof typeof names] || sensorType;
  };

  const mainSensorType = Object.values(sensorGroups)[0]?.sensorType || '';
  const unit = Object.values(sensorGroups)[0]?.unit || '';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h4 className="font-medium text-gray-800">
              {getSensorTypeName(mainSensorType)} 센서 추이
            </h4>
            <span className="text-sm text-gray-600">
              총 {chartData.length}개 데이터 포인트
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">과거 데이터</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-orange-300"></div>
              <span className="text-gray-600">예측 데이터</span>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: any, index: number) => {
              // 6개마다 표시
              return index % 6 === 0 ? value : '';
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ 
              value: unit, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip 
            content={({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-sm">
                      <span className="font-medium">{getSensorTypeName(mainSensorType)}: </span>
                      {payload[0].value}{unit}
                    </p>
                    <p className="text-xs text-gray-600">
                      상태: <span className={`font-medium ${
                        data.status === 'normal' ? 'text-green-600' :
                        data.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {data.status === 'normal' ? '정상' :
                         data.status === 'warning' ? '경고' : '위험'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {data.isFuture ? '예측 데이터' : '실제 데이터'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          
          {/* 데이터 라인 */}
          <Line 
            type="monotone"
            dataKey="value"
            stroke={getColorForSensorType(mainSensorType)}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="센서 데이터"
          />

          {/* 현재 시간 구분선 */}
          {showFutureDivider && (
            <ReferenceLine 
              x={now.getTime()} 
              stroke="#64748b" 
              strokeDasharray="8 8"
              strokeWidth={2}
              label={{ value: "현재", position: "top" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* 데이터 통계 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-600">평균값</p>
          <p className="font-semibold">
            {(chartData.reduce((sum: number, d: any) => sum + d.value, 0) / chartData.length).toFixed(1)}{unit}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-600">최댓값</p>
          <p className="font-semibold">
            {Math.max(...chartData.map((d: any) => d.value)).toFixed(1)}{unit}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-600">최솟값</p>
          <p className="font-semibold">
            {Math.min(...chartData.map((d: any) => d.value)).toFixed(1)}{unit}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-600">정상 비율</p>
          <p className="font-semibold text-green-600">
            {((chartData.filter((d: any) => d.status === 'normal').length / chartData.length) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};