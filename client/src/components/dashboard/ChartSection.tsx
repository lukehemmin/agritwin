import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart, Maximize2, Minimize2 } from 'lucide-react';
import { RealTimeLineChart } from '../charts/RealTimeLineChart';
import { StatusDonutChart } from '../charts/StatusDonutChart';
import { SensorBarChart } from '../charts/SensorBarChart';
import { SensorData } from '../../services/websocket';

interface ChartSectionProps {
  selectedZone: string | null;
  timeRange: [Date, Date];
  sensorData: SensorData[];
}

export const ChartSection: React.FC<ChartSectionProps> = ({ 
  selectedZone, 
  timeRange, 
  sensorData 
}) => {
  const [chartView, setChartView] = useState<'line' | 'bar' | 'status'>('line');
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('📈 ChartSection: Rendering with data', { 
    sensorDataCount: sensorData.length, 
    selectedZone, 
    timeRange,
    sampleData: sensorData.slice(0, 2)
  });

  // Filter data by selected zone if specified
  const filteredData = selectedZone 
    ? sensorData.filter(data => data.sensor_id.includes(selectedZone))
    : sensorData;

  console.log('📈 ChartSection: Filtered data', { 
    originalCount: sensorData.length,
    filteredCount: filteredData.length,
    selectedZone
  });

  const renderChart = () => {
    switch (chartView) {
      case 'line':
        return (
          <div className="space-y-4">
            <RealTimeLineChart
              sensorData={filteredData}
              sensorType="temperature"
              title="온도"
              unit="°C"
              height={isExpanded ? 400 : 280}
              maxDataPoints={15}
            />
            <RealTimeLineChart
              sensorData={filteredData}
              sensorType="humidity"
              title="습도"
              unit="%"
              height={isExpanded ? 400 : 280}
              maxDataPoints={15}
            />
          </div>
        );
      
      case 'bar':
        return (
          <SensorBarChart
            sensorData={filteredData}
            title="센서별 통계"
            height={isExpanded ? 400 : 300}
            showAverage={true}
          />
        );
      
      case 'status':
        return (
          <div className="grid grid-cols-1 gap-4">
            <StatusDonutChart
              sensorData={filteredData}
              title="센서 상태 분포"
              size={isExpanded ? 250 : 180}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">실시간 차트</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setChartView('line')}
            className={`p-2 rounded-lg transition-colors ${
              chartView === 'line' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="라인 차트"
          >
            <TrendingUp size={16} />
          </button>
          <button 
            onClick={() => setChartView('bar')}
            className={`p-2 rounded-lg transition-colors ${
              chartView === 'bar' 
                ? 'bg-green-100 text-green-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="바 차트"
          >
            <BarChart3 size={16} />
          </button>
          <button 
            onClick={() => setChartView('status')}
            className={`p-2 rounded-lg transition-colors ${
              chartView === 'status' 
                ? 'bg-purple-100 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="상태 차트"
          >
            <PieChart size={16} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? "축소" : "확대"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Chart type indicator */}
      <div className="mb-4 flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">
            {chartView === 'line' ? '실시간 트렌드' : 
             chartView === 'bar' ? '센서별 통계' : '상태 분포'}
          </span>
        </div>
        {selectedZone && (
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              {selectedZone} 구역 필터링됨
            </span>
          </div>
        )}
      </div>

      {/* Charts */}
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">센서 데이터가 없습니다</p>
            <p className="text-sm text-gray-500">
              {selectedZone ? '선택한 구역에서' : '전체 구역에서'} 데이터를 기다리는 중...
            </p>
            <p className="text-xs text-gray-400 mt-3 space-y-1">
              <div>원본 데이터: {sensorData.length}개</div>
              <div>필터된 데이터: {filteredData.length}개</div>
              <div>선택된 구역: {selectedZone || '없음'}</div>
            </p>
          </div>
        </div>
      ) : (
        renderChart()
      )}

      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            데이터 범위: {timeRange[0].toLocaleDateString()} - {timeRange[1].toLocaleDateString()}
          </span>
          <span>
            실시간 데이터: {filteredData.length}개
          </span>
        </div>
        {filteredData.length > 0 && (
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>마지막 업데이트:</span>
            <span>
              {new Date(Math.max(...filteredData.map(d => new Date(d.timestamp).getTime()))).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};