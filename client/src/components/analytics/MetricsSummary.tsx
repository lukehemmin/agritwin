import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Thermometer, 
  Droplets, 
  Sun, 
  Leaf,
  Activity,
  BarChart3
} from 'lucide-react';

interface MetricData {
  current: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

interface MetricsSummaryProps {
  data: {
    avgTemperature: MetricData;
    avgHumidity: MetricData;
    avgSoilMoisture: MetricData;
    avgLight: MetricData;
    growthRate: MetricData;
    systemHealth: MetricData;
  };
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ data }) => {
  const MetricCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    data: MetricData;
    color: string;
  }> = ({ title, icon, data, color }) => {
    const trendIcon = data.trend === 'up' ? <TrendingUp size={16} /> : 
                     data.trend === 'down' ? <TrendingDown size={16} /> : 
                     <Activity size={16} />;
    
    const trendColor = data.trend === 'up' ? 'text-green-600' : 
                      data.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600';

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color}`}>
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            {trendIcon}
            <span className="text-xs font-medium">
              {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {data.current.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">{data.unit}</span>
          </div>
          <div className="text-xs text-gray-500">
            이전: {data.previous.toFixed(1)}{data.unit}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <BarChart3 className="text-blue-600" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">핵심 지표</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="평균 온도"
          icon={<Thermometer className="text-white" size={20} />}
          data={data.avgTemperature}
          color="bg-red-500"
        />
        
        <MetricCard
          title="평균 습도"
          icon={<Droplets className="text-white" size={20} />}
          data={data.avgHumidity}
          color="bg-blue-500"
        />
        
        <MetricCard
          title="평균 토양수분"
          icon={<Droplets className="text-white" size={20} />}
          data={data.avgSoilMoisture}
          color="bg-green-500"
        />
        
        <MetricCard
          title="평균 조도"
          icon={<Sun className="text-white" size={20} />}
          data={data.avgLight}
          color="bg-orange-500"
        />
        
        <MetricCard
          title="성장률"
          icon={<Leaf className="text-white" size={20} />}
          data={data.growthRate}
          color="bg-emerald-500"
        />
        
        <MetricCard
          title="시스템 건강도"
          icon={<Activity className="text-white" size={20} />}
          data={data.systemHealth}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
};