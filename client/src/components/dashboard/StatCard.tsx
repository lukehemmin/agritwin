import React from 'react';
import { TrendingUp, TrendingDown, Activity, Thermometer, Droplets, Zap } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: 'sensors' | 'active' | 'temperature' | 'humidity' | 'activity';
  status?: 'success' | 'warning' | 'error' | 'normal';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  icon,
  status = 'normal'
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'sensors':
        return <Activity size={24} />;
      case 'active':
        return <Zap size={24} />;
      case 'temperature':
        return <Thermometer size={24} />;
      case 'humidity':
        return <Droplets size={24} />;
      case 'activity':
        return <Activity size={24} />;
      default:
        return <Activity size={24} />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconClass = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-primary-600';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getStatusClass()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">{unit}</span>
          </div>
          
          {trend && (
            <div className="flex items-center mt-2 space-x-1">
              {trend.isPositive ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
              <span className="text-xs text-gray-500">vs 이전 기간</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg bg-white ${getIconClass()}`}>
          {getIcon()}
        </div>
      </div>
    </div>
  );
};