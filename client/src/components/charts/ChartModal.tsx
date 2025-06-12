import React, { useState } from 'react';
import { X, TrendingUp, BarChart3, PieChart, Maximize2, Minimize2 } from 'lucide-react';
import { RealTimeLineChart } from './RealTimeLineChart';
import { StatusDonutChart } from './StatusDonutChart';
import { SensorBarChart } from './SensorBarChart';
import { SensorData } from '../../services/websocket';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedZone: string | null;
  timeRange: [Date, Date];
  sensorData: SensorData[];
}

export const ChartModal: React.FC<ChartModalProps> = ({ 
  isOpen,
  onClose,
  selectedZone, 
  timeRange, 
  sensorData 
}) => {
  const [chartView, setChartView] = useState<'line' | 'bar' | 'status'>('line');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  console.log('📈 ChartModal: Rendering with data', { 
    sensorDataCount: sensorData.length, 
    selectedZone, 
    timeRange,
    sampleData: sensorData.slice(0, 2)
  });

  // Filter data by selected zone if specified
  const filteredData = selectedZone 
    ? sensorData.filter(data => data.sensor_id.includes(selectedZone))
    : sensorData;

  console.log('📈 ChartModal: Filtered data', { 
    originalCount: sensorData.length,
    filteredCount: filteredData.length,
    selectedZone
  });

  const renderChart = () => {
    switch (chartView) {
      case 'line':
        return (
          <div className="space-y-6">
            <RealTimeLineChart
              sensorData={filteredData}
              sensorType="temperature"
              title="온도"
              unit="°C"
              height={isExpanded ? 500 : 350}
              maxDataPoints={20}
            />
            <RealTimeLineChart
              sensorData={filteredData}
              sensorType="humidity"
              title="습도"
              unit="%"
              height={isExpanded ? 500 : 350}
              maxDataPoints={20}
            />
          </div>
        );
      
      case 'bar':
        return (
          <SensorBarChart
            sensorData={filteredData}
            title="센서별 통계"
            height={isExpanded ? 600 : 400}
            showAverage={true}
          />
        );
      
      case 'status':
        return (
          <div className="grid grid-cols-1 gap-6">
            <StatusDonutChart
              sensorData={filteredData}
              title="센서 상태 분포"
              size={isExpanded ? 350 : 250}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      {/* Modal Container */}
      <div 
        className={`bg-white rounded-t-2xl shadow-2xl w-full transition-all duration-300 ease-out ${
          isExpanded ? 'h-[90vh]' : 'h-[70vh]'
        }`}
        style={{ maxWidth: '100vw' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">📊 실시간 차트</h2>
            {selectedZone && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {selectedZone} 구역
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Chart Type Toggle Buttons */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setChartView('line')}
                className={`p-2 rounded-md transition-colors ${
                  chartView === 'line' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="라인 차트"
              >
                <TrendingUp size={18} />
              </button>
              <button 
                onClick={() => setChartView('bar')}
                className={`p-2 rounded-md transition-colors ${
                  chartView === 'bar' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="바 차트"
              >
                <BarChart3 size={18} />
              </button>
              <button 
                onClick={() => setChartView('status')}
                className={`p-2 rounded-md transition-colors ${
                  chartView === 'status' 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="상태 차트"
              >
                <PieChart size={18} />
              </button>
            </div>

            {/* Expand/Collapse Button */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? "축소" : "확대"}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="닫기"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chart Type Indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                chartView === 'line' ? 'bg-blue-500' :
                chartView === 'bar' ? 'bg-green-500' : 'bg-purple-500'
              }`}></div>
              <span className="text-gray-700 font-medium">
                {chartView === 'line' ? '실시간 트렌드 분석' : 
                 chartView === 'bar' ? '센서별 통계 비교' : '상태 분포 현황'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-500">
              <span>데이터: {filteredData.length}개</span>
              <span>•</span>
              <span>
                범위: {timeRange[0].toLocaleDateString()} - {timeRange[1].toLocaleDateString()}
              </span>
              {filteredData.length > 0 && (
                <>
                  <span>•</span>
                  <span>
                    업데이트: {new Date(Math.max(...filteredData.map(d => new Date(d.timestamp).getTime()))).toLocaleTimeString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: isExpanded ? 'calc(90vh - 160px)' : 'calc(70vh - 160px)' }}>
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">센서 데이터가 없습니다</h3>
                <p className="text-gray-500 mb-4">
                  {selectedZone ? '선택한 구역에서' : '전체 구역에서'} 데이터를 기다리는 중...
                </p>
                <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600 space-y-1">
                  <div>원본 데이터: {sensorData.length}개</div>
                  <div>필터된 데이터: {filteredData.length}개</div>
                  <div>선택된 구역: {selectedZone || '전체'}</div>
                </div>
              </div>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
    </div>
  );
};