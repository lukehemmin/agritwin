import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Database,
  Filter,
  Download,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';
import { apiService, AnalyticsSummary, Alert } from '../services/api';
import { RealTimeLineChart } from '../components/charts/RealTimeLineChart';
import { SensorBarChart } from '../components/charts/SensorBarChart';
import { StatusDonutChart } from '../components/charts/StatusDonutChart';
import { Loading } from '../components/common/Loading';

const Analytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [trends, setTrends] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch analytics summary
      const analyticsData = await apiService.getAnalyticsSummary(selectedPeriod);
      setAnalytics(analyticsData);

      // Fetch recent alerts
      const alertsData = await apiService.getAlerts({ limit: 10 });
      setAlerts(alertsData.alerts);

      // Fetch trends data
      const trendsData = await apiService.getTrends({ 
        period: selectedPeriod,
        interval: selectedPeriod === '24h' ? 'hourly' : 'minute'
      });
      setTrends(trendsData);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('분석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const handleExportData = async () => {
    try {
      // Create a CSV export of current data
      const csvData = [
        ['Sensor Type', 'Data Points', 'Average', 'Min', 'Max', 'Normal Count', 'Warning Count', 'Critical Count'],
        ...(analytics?.sensor_types.map(type => [
          type.type,
          type.data_points,
          type.avg_value,
          type.min_value,
          type.max_value,
          type.normal_count,
          type.warning_count,
          type.critical_count
        ]) || [])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return <Loading message="분석 데이터를 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">데이터 분석</h1>
          <p className="text-gray-600">센서 데이터 및 시스템 성능 종합 분석</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Period Selector */}
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-gray-500" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">최근 1시간</option>
              <option value="6h">최근 6시간</option>
              <option value="24h">최근 24시간</option>
              <option value="7d">최근 7일</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            <span>내보내기</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 센서</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.summary.total_sensors}</p>
              </div>
              <Database className="text-blue-500" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              활성 센서: {analytics.summary.active_sensors}개
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">데이터 포인트</p>
                <p className="text-2xl font-bold text-green-600">{analytics.summary.total_data_points.toLocaleString()}</p>
              </div>
              <Activity className="text-green-500" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              데이터 센서: {analytics.summary.sensors_with_data}개
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">생성된 알림</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.summary.alerts_created}</p>
              </div>
              <AlertTriangle className="text-orange-500" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              미해결: {analytics.summary.unresolved_alerts}개
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">시스템 건강도</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((analytics.status_distribution.find(s => s.status === 'normal')?.percentage || 0))}%
                </p>
              </div>
              <PieChart className="text-purple-500" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              정상 상태 센서 비율
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {analytics && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">센서 상태 분포</h3>
            <div className="space-y-4">
              {analytics.status_distribution.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`w-4 h-4 rounded-full ${
                        status.status === 'normal' ? 'bg-green-500' :
                        status.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {status.status === 'normal' ? '정상' :
                       status.status === 'warning' ? '경고' : '위험'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{status.count}개</span>
                    <span className="text-xs text-gray-500 ml-2">({status.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sensor Types Statistics */}
        {analytics && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">센서 유형별 통계</h3>
            <div className="space-y-3">
              {analytics.sensor_types.map((type) => (
                <div key={type.type} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {type.type === 'temperature' ? '온도' :
                       type.type === 'humidity' ? '습도' :
                       type.type === 'soil_moisture' ? '토양수분' :
                       type.type === 'light' ? '조도' :
                       type.type === 'co2' ? 'CO2' : type.type}
                    </span>
                    <span className="text-sm text-gray-600">{type.data_points}개 데이터</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">평균:</span>
                      <span className="font-medium ml-1">{type.avg_value.toFixed(1)}{type.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최솟값:</span>
                      <span className="font-medium ml-1">{type.min_value.toFixed(1)}{type.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최댓값:</span>
                      <span className="font-medium ml-1">{type.max_value.toFixed(1)}{type.unit}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-green-600">정상: {type.normal_count}</span>
                    <span className="text-orange-600">경고: {type.warning_count}</span>
                    <span className="text-red-600">위험: {type.critical_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zone Performance */}
      {analytics && analytics.zones.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">구역별 성능</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.zones.map((zone) => (
              <div key={zone.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{zone.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    zone.health_score >= 80 ? 'bg-green-100 text-green-800' :
                    zone.health_score >= 60 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    건강도 {Math.round(zone.health_score)}%
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">층수:</span>
                    <span>{zone.level}층</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">작물:</span>
                    <span>{zone.crop_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">데이터:</span>
                    <span>{zone.data_points}개</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t">
                    <span className="text-green-600">정상: {zone.normal_count}</span>
                    <span className="text-orange-600">경고: {zone.warning_count}</span>
                    <span className="text-red-600">위험: {zone.critical_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 알림</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-600">
                      {alert.sensor_name} • {alert.zone_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                  {alert.is_resolved && (
                    <span className="text-xs text-green-600">해결됨</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation Info */}
      {analytics && (
        <div className="text-center text-xs text-gray-500">
          분석 생성 시간: {new Date(analytics.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default Analytics;