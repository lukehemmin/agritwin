import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions as ChartJSOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SensorData } from '../../services/websocket';
import { CHART_COLORS, CHART_BACKGROUNDS } from '../../types/chart.types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SensorBarChartProps {
  sensorData: SensorData[];
  title: string;
  height?: number;
  showAverage?: boolean;
}

export const SensorBarChart: React.FC<SensorBarChartProps> = ({
  sensorData,
  title,
  height = 300,
  showAverage = true
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

    // Group data by sensor type and calculate averages
    const groupedData = sensorData.reduce((acc, data) => {
      const sensorType = data.sensor_id.split('-').pop() || 'unknown';
      
      if (!acc[sensorType]) {
        acc[sensorType] = {
          values: [],
          unit: data.unit,
          type: sensorType
        };
      }
      
      acc[sensorType].values.push(data.value);
      return acc;
    }, {} as Record<string, { values: number[]; unit: string; type: string }>);

    // Calculate statistics for each sensor type
    const sensorStats = Object.entries(groupedData).map(([type, data]) => {
      const values = data.values;
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      return {
        type,
        average: Number(average.toFixed(1)),
        min: Number(min.toFixed(1)),
        max: Number(max.toFixed(1)),
        unit: data.unit,
        count: values.length
      };
    });

    const labels = sensorStats.map(stat => {
      switch (stat.type) {
        case 'temperature': return '온도';
        case 'humidity': return '습도';
        case 'soil_moisture': return '토양수분';
        case 'light': return '조도';
        case 'co2': return 'CO2';
        default: return stat.type;
      }
    });

    const averageData = sensorStats.map(stat => stat.average);
    const minData = sensorStats.map(stat => stat.min);
    const maxData = sensorStats.map(stat => stat.max);

    const datasets: any[] = [
      {
        label: '평균값',
        data: averageData,
        backgroundColor: sensorStats.map((_, index) => {
          const colors = Object.values(CHART_BACKGROUNDS);
          return colors[index % colors.length];
        }),
        borderColor: sensorStats.map((_, index) => {
          const colors = Object.values(CHART_COLORS);
          return colors[index % colors.length];
        }),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }
    ];

    if (showAverage) {
      datasets.push(
        {
          label: '최솟값',
          data: minData,
          backgroundColor: minData.map(() => '#E3F2FD'),
          borderColor: minData.map(() => '#2196F3'),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: '최댓값',
          data: maxData,
          backgroundColor: maxData.map(() => '#FFEBEE'),
          borderColor: maxData.map(() => '#F44336'),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      );
    }

    setChartData({
      labels,
      datasets,
      sensorStats // Store for tooltip
    });
  }, [sensorData, showAverage]);

  const options: ChartJSOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
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
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const sensorStats = chartData.sensorStats;
            if (sensorStats && sensorStats[context.dataIndex]) {
              const stat = sensorStats[context.dataIndex];
              return `${context.dataset.label}: ${context.parsed.y} ${stat.unit}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}`;
          },
          afterBody: function(context) {
            const sensorStats = chartData.sensorStats;
            if (sensorStats && sensorStats[context[0].dataIndex]) {
              const stat = sensorStats[context[0].dataIndex];
              return [
                `데이터 개수: ${stat.count}개`,
                `범위: ${stat.min} ~ ${stat.max} ${stat.unit}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '센서 유형',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '센서 값',
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
        },
        beginAtZero: false
      }
    }
  };

  if (chartData.datasets.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200" style={{ height }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200" style={{ height }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-500">
          총 {sensorData.length}개 데이터
        </div>
      </div>
      <div style={{ height: height - 80 }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};