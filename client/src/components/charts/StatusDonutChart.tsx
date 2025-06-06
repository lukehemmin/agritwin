import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions as ChartJSOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { SensorData } from '../../services/websocket';
import { CHART_COLORS } from '../../types/chart.types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusDonutChartProps {
  sensorData: SensorData[];
  title: string;
  size?: number;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  sensorData,
  title,
  size = 200
}) => {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (sensorData.length === 0) {
      setChartData({
        labels: [],
        datasets: []
      });
      return;
    }

    // Count status distribution
    const statusCounts = sensorData.reduce((acc, data) => {
      acc[data.status] = (acc[data.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(statusCounts).map(status => {
      switch (status) {
        case 'normal': return '정상';
        case 'warning': return '경고';
        case 'critical': return '위험';
        default: return status;
      }
    });

    const data = Object.values(statusCounts);
    const backgroundColor = Object.keys(statusCounts).map(status => {
      switch (status) {
        case 'normal': return CHART_COLORS.normal;
        case 'warning': return CHART_COLORS.warning;
        case 'critical': return CHART_COLORS.critical;
        default: return '#9E9E9E';
      }
    });

    const borderColor = backgroundColor.map(color => color);

    setChartData({
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverOffset: 8,
        }
      ]
    });
  }, [sensorData]);

  const options: ChartJSOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%',
    animation: {
      animateRotate: true,
      duration: 1000
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed}개 (${percentage}%)`;
          }
        }
      }
    }
  };

  const totalSensors = sensorData.length;
  const normalCount = sensorData.filter(d => d.status === 'normal').length;
  const warningCount = sensorData.filter(d => d.status === 'warning').length;
  const criticalCount = sensorData.filter(d => d.status === 'critical').length;

  if (totalSensors === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: size }}>
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">데이터 없음</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <Doughnut data={chartData} options={options} />
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-gray-900">{totalSensors}</div>
            <div className="text-sm text-gray-600">총 센서</div>
          </div>
        </div>

        {/* Status summary */}
        <div className="mt-4 w-full space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>정상</span>
            </div>
            <span className="font-medium">{normalCount}개</span>
          </div>
          
          {warningCount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>경고</span>
              </div>
              <span className="font-medium text-orange-600">{warningCount}개</span>
            </div>
          )}
          
          {criticalCount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>위험</span>
              </div>
              <span className="font-medium text-red-600">{criticalCount}개</span>
            </div>
          )}
        </div>

        {/* Health score */}
        <div className="mt-4 w-full p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">전체 건강도</span>
            <span className={`text-lg font-bold ${
              normalCount / totalSensors > 0.8 ? 'text-green-600' :
              normalCount / totalSensors > 0.6 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {Math.round((normalCount / totalSensors) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};