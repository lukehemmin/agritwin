import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Thermometer, 
  Droplets, 
  Sun, 
  Wind, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  Clock,
  MapPin,
  Settings,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { apiService, Sensor, SensorData } from '../services/api';
import { RealTimeLineChart } from '../components/charts/RealTimeLineChart';
import { Loading } from '../components/common/Loading';
import { useWebSocket } from '../hooks/useWebSocket';

const SensorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [isCalibrating, setIsCalibrating] = useState(false);
  
  const { sensorData: realTimeData, isConnected } = useWebSocket();

  useEffect(() => {
    if (id) {
      fetchSensorDetails();
      fetchHistoricalData();
    }
  }, [id, selectedTimeRange]);

  useEffect(() => {
    // Filter real-time data for this specific sensor
    if (realTimeData && id) {
      const filtered = realTimeData.filter(data => data.sensor_id === id);
      setSensorData(filtered);
    }
  }, [realTimeData, id]);

  const fetchSensorDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const sensorDetails = await apiService.getSensor(id);
      setSensor(sensorDetails);
    } catch (error) {
      console.error('Failed to fetch sensor details:', error);
      setError('센서 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    if (!id) return;

    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case '6h':
          startDate.setHours(endDate.getHours() - 6);
          break;
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
      }

      const { data } = await apiService.getSensorData(id, {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        limit: 200
      });
      
      setHistoricalData(data);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    }
  };

  const handleCalibrate = async () => {
    if (!id) return;

    try {
      setIsCalibrating(true);
      await apiService.calibrateSensor(id);
      await fetchSensorDetails(); // Refresh sensor details
    } catch (error) {
      console.error('Failed to calibrate sensor:', error);
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleToggleSensor = async () => {
    if (!sensor) return;

    try {
      await apiService.toggleSensor(sensor.id, !sensor.is_active);
      setSensor({ ...sensor, is_active: !sensor.is_active });
    } catch (error) {
      console.error('Failed to toggle sensor:', error);
    }
  };

  const exportData = () => {
    if (!sensor || historicalData.length === 0) return;

    const csvData = [
      ['Timestamp', 'Value', 'Unit', 'Status'],
      ...historicalData.map(data => [
        new Date(data.timestamp).toISOString(),
        data.value,
        data.unit,
        data.status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-${sensor.id}-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer size={24} />;
      case 'humidity': return <Droplets size={24} />;
      case 'light': return <Sun size={24} />;
      case 'co2': return <Wind size={24} />;
      default: return <Activity size={24} />;
    }
  };

  const getSensorTypeLabel = (type: string) => {
    switch (type) {
      case 'temperature': return '온도';
      case 'humidity': return '습도';
      case 'soil_moisture': return '토양수분';
      case 'light': return '조도';
      case 'co2': return 'CO2';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'critical': return <XCircle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return '정상';
      case 'warning': return '경고';
      case 'critical': return '위험';
      default: return '알 수 없음';
    }
  };

  if (isLoading) {
    return <Loading message="센서 데이터를 불러오는 중..." />;
  }

  if (error || !sensor) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <span className="text-red-700">{error || '센서를 찾을 수 없습니다.'}</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const latestData = sensorData[0] || historicalData[0];
  const stats = historicalData.length > 0 ? {
    average: historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length,
    min: Math.min(...historicalData.map(d => d.value)),
    max: Math.max(...historicalData.map(d => d.value)),
    normal: historicalData.filter(d => d.status === 'normal').length,
    warning: historicalData.filter(d => d.status === 'warning').length,
    critical: historicalData.filter(d => d.status === 'critical').length
  } : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${
              sensor.type === 'temperature' ? 'bg-red-100 text-red-600' :
              sensor.type === 'humidity' ? 'bg-blue-100 text-blue-600' :
              sensor.type === 'light' ? 'bg-yellow-100 text-yellow-600' :
              sensor.type === 'co2' ? 'bg-purple-100 text-purple-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {getSensorIcon(sensor.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sensor.name}</h1>
              <p className="text-gray-600">{getSensorTypeLabel(sensor.type)} 센서 상세 정보</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">최근 1시간</option>
            <option value="6h">최근 6시간</option>
            <option value="24h">최근 24시간</option>
            <option value="7d">최근 7일</option>
          </select>

          <button
            onClick={exportData}
            disabled={historicalData.length === 0}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            <span>내보내기</span>
          </button>

          <button
            onClick={handleCalibrate}
            disabled={isCalibrating}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isCalibrating ? 'animate-spin' : ''} />
            <span>보정</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Status & Controls */}
        <div className="space-y-6">
          {/* Current Value */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">현재 상태</h3>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{isConnected ? '실시간' : '연결 끊김'}</span>
              </div>
            </div>

            {latestData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {latestData.value.toFixed(1)}
                    <span className="text-xl text-gray-600 ml-1">{sensor.unit}</span>
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                    getStatusColor(latestData.status)
                  }`}>
                    {getStatusIcon(latestData.status)}
                    <span>{getStatusLabel(latestData.status)}</span>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  마지막 업데이트: {new Date(latestData.timestamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">데이터가 없습니다</p>
              </div>
            )}
          </div>

          {/* Sensor Controls */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">센서 제어</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">센서 활성화</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sensor.is_active}
                    onChange={handleToggleSensor}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <button
                onClick={() => navigate(`/settings`)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings size={16} />
                <span>임계값 설정</span>
              </button>
            </div>
          </div>

          {/* Sensor Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">센서 정보</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="text-gray-400" size={16} />
                <div>
                  <p className="text-sm font-medium">위치</p>
                  <p className="text-xs text-gray-600">{sensor.zone_id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="text-gray-400" size={16} />
                <div>
                  <p className="text-sm font-medium">설치일</p>
                  <p className="text-xs text-gray-600">
                    {new Date(sensor.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <BarChart3 className="text-gray-400" size={16} />
                <div>
                  <p className="text-sm font-medium">좌표</p>
                  <p className="text-xs text-gray-600">
                    x:{sensor.position_x}, y:{sensor.position_y}, z:{sensor.position_z}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Threshold Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">임계값 범위</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">정상</span>
                <span className="text-sm text-green-600">
                  {sensor.min_normal} - {sensor.max_normal} {sensor.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-800">경고</span>
                <span className="text-sm text-orange-600">
                  {sensor.min_warning} - {sensor.max_warning} {sensor.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-800">위험</span>
                <span className="text-sm text-red-600">
                  {sensor.min_critical} - {sensor.max_critical} {sensor.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Historical Data Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getSensorTypeLabel(sensor.type)} 데이터 추이
              </h3>
              <div className="text-sm text-gray-600">
                {historicalData.length}개 데이터 포인트
              </div>
            </div>

            {historicalData.length > 0 ? (
              <RealTimeLineChart
                sensorData={historicalData}
                sensorType={sensor.type}
                title={getSensorTypeLabel(sensor.type)}
                unit={sensor.unit}
                height={400}
                maxDataPoints={historicalData.length}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <TrendingUp className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-gray-600">선택한 기간에 데이터가 없습니다</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          {stats && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">통계 요약</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">평균값</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.average.toFixed(1)}<span className="text-sm ml-1">{sensor.unit}</span>
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">최솟값</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.min.toFixed(1)}<span className="text-sm ml-1">{sensor.unit}</span>
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">최댓값</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.max.toFixed(1)}<span className="text-sm ml-1">{sensor.unit}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.normal}</div>
                  <div className="text-xs text-gray-600">정상</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{stats.warning}</div>
                  <div className="text-xs text-gray-600">경고</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{stats.critical}</div>
                  <div className="text-xs text-gray-600">위험</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorDetail;