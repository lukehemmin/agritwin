import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions as ChartJSOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SensorData } from '../../services/websocket';
import { CHART_COLORS, CHART_BACKGROUNDS } from '../../types/chart.types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RealTimeLineChartProps {
  sensorData: SensorData[];
  sensorType: string;
  title: string;
  unit: string;
  maxDataPoints?: number;
  height?: number;
}

export const RealTimeLineChart: React.FC<RealTimeLineChartProps> = ({
  sensorData,
  sensorType,
  title,
  unit,
  maxDataPoints = 20,
  height = 300
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    console.log('📈 RealTimeLineChart: Processing data update', { 
      sensorType, 
      totalData: sensorData.length,
      timestamp: new Date().toLocaleTimeString()
    });

    // Filter data for the specific sensor type
    const filteredData = sensorData
      .filter(data => data.sensor_id.includes(sensorType))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-maxDataPoints);

    console.log('📈 RealTimeLineChart: Filtered data', { 
      sensorType, 
      count: filteredData.length,
      latest: filteredData.length > 0 ? filteredData[filteredData.length - 1] : null
    });

    if (filteredData.length === 0) {
      setChartData({
        labels: [],
        datasets: []
      });
      return;
    }

    // Group data by sensor
    const groupedData = filteredData.reduce((acc, data) => {
      if (!acc[data.sensor_id]) {
        acc[data.sensor_id] = [];
      }
      acc[data.sensor_id].push(data);
      return acc;
    }, {} as Record<string, SensorData[]>);

    // Create labels from timestamps
    const allTimestamps = filteredData.map(data => 
      new Date(data.timestamp).toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    );
    const uniqueLabels = [...new Set(allTimestamps)].slice(-maxDataPoints);

    // Create datasets for each sensor
    const datasets = Object.entries(groupedData).map(([sensorId, sensorDataPoints], index) => {
      const sensorName = sensorId.replace(/^zone-\d+-\d+-/, '').replace(sensorType, '');
      const colors = Object.values(CHART_COLORS);
      const backgroundColors = Object.values(CHART_BACKGROUNDS);
      
      const color = colors[index % colors.length];
      const backgroundColor = backgroundColors[index % backgroundColors.length];

      return {
        label: `${sensorName} (${sensorId.split('-')[1]}층)`,
        data: sensorDataPoints.slice(-maxDataPoints).map(point => point.value),
        borderColor: color,
        backgroundColor: backgroundColor,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      };
    });

    setChartData({
      labels: uniqueLabels,
      datasets
    });
  }, [sensorData, sensorType, maxDataPoints]);

  const options: ChartJSOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
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
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '시간',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: `${title} (${unit})`,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  if (chartData.datasets.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200" style={{ height: Math.max(height, 280) }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title} 실시간 차트</h3>
        <div className="flex items-center justify-center" style={{ height: Math.max(height - 80, 200) }}>
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
            <p className="text-sm text-gray-500">{sensorType} 센서 데이터 대기 중</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200" style={{ height: Math.max(height, 280) }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title} 실시간 차트</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>실시간 업데이트</span>
        </div>
      </div>
      <div style={{ height: Math.max(height - 80, 200) }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};