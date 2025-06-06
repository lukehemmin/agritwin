import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Thermometer, 
  Droplets, 
  Sun, 
  Wind,
  Bell,
  Monitor,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Database,
  Wifi,
  Clock
} from 'lucide-react';
import { apiService, Sensor } from '../services/api';
import { Loading } from '../components/common/Loading';

interface SensorThresholds {
  min_normal: number;
  max_normal: number;
  min_warning: number;
  max_warning: number;
  min_critical: number;
  max_critical: number;
}

interface SystemSettings {
  notification_enabled: boolean;
  auto_refresh_interval: number;
  chart_max_points: number;
  alert_sound_enabled: boolean;
  dark_mode: boolean;
  language: 'ko' | 'en';
}

const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [thresholds, setThresholds] = useState<SensorThresholds>({
    min_normal: 0,
    max_normal: 100,
    min_warning: 0,
    max_warning: 100,
    min_critical: 0,
    max_critical: 100
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    notification_enabled: true,
    auto_refresh_interval: 5000,
    chart_max_points: 20,
    alert_sound_enabled: true,
    dark_mode: false,
    language: 'ko'
  });
  const [activeTab, setActiveTab] = useState<'sensors' | 'system' | 'notifications'>('sensors');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchSensors();
    loadSystemSettings();
  }, []);

  useEffect(() => {
    if (selectedSensor) {
      setThresholds({
        min_normal: selectedSensor.min_normal,
        max_normal: selectedSensor.max_normal,
        min_warning: selectedSensor.min_warning,
        max_warning: selectedSensor.max_warning,
        min_critical: selectedSensor.min_critical,
        max_critical: selectedSensor.max_critical
      });
    }
  }, [selectedSensor]);

  const fetchSensors = async () => {
    try {
      setIsLoading(true);
      const sensorsData = await apiService.getSensors();
      setSensors(sensorsData);
      if (sensorsData.length > 0) {
        setSelectedSensor(sensorsData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemSettings = () => {
    const saved = localStorage.getItem('agritwin_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSystemSettings({ ...systemSettings, ...parsed });
    }
  };

  const saveSystemSettings = () => {
    localStorage.setItem('agritwin_settings', JSON.stringify(systemSettings));
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const saveSensorThresholds = async () => {
    if (!selectedSensor) return;

    try {
      setSaveStatus('saving');
      await apiService.updateSensorRanges(selectedSensor.id, thresholds);
      
      // Update local sensor data
      setSensors(sensors.map(s => 
        s.id === selectedSensor.id 
          ? { ...s, ...thresholds }
          : s
      ));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save sensor thresholds:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const calibrateSensor = async () => {
    if (!selectedSensor) return;

    try {
      setSaveStatus('saving');
      await apiService.calibrateSensor(selectedSensor.id);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to calibrate sensor:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer size={16} />;
      case 'humidity': return <Droplets size={16} />;
      case 'light': return <Sun size={16} />;
      case 'co2': return <Wind size={16} />;
      default: return <Monitor size={16} />;
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

  if (isLoading) {
    return <Loading message="설정 데이터를 불러오는 중..." />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
          <p className="text-gray-600">센서 임계값, 알림 설정 및 시스템 구성</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle size={16} className="mr-1" />
              저장됨
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertTriangle size={16} className="mr-1" />
              저장 실패
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('sensors')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'sensors'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sliders size={16} />
          <span>센서 설정</span>
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'system'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Monitor size={16} />
          <span>시스템</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'notifications'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell size={16} />
          <span>알림</span>
        </button>
      </div>

      {/* Sensor Settings Tab */}
      {activeTab === 'sensors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sensor List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">센서 목록</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sensors.map((sensor) => (
                <button
                  key={sensor.id}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedSensor?.id === sensor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSensorIcon(sensor.type)}
                      <div>
                        <p className="font-medium text-sm">{sensor.name}</p>
                        <p className="text-xs text-gray-600">{getSensorTypeLabel(sensor.type)}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      sensor.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Threshold Configuration */}
          {selectedSensor && (
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedSensor.name} 임계값 설정
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={calibrateSensor}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw size={14} />
                    <span>보정</span>
                  </button>
                  <button
                    onClick={saveSensorThresholds}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={14} />
                    <span>저장</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Normal Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    정상 범위 (녹색)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최솟값</label>
                      <input
                        type="number"
                        value={thresholds.min_normal}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          min_normal: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최댓값</label>
                      <input
                        type="number"
                        value={thresholds.max_normal}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          max_normal: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Warning Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    경고 범위 (주황색)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최솟값</label>
                      <input
                        type="number"
                        value={thresholds.min_warning}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          min_warning: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최댓값</label>
                      <input
                        type="number"
                        value={thresholds.max_warning}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          max_warning: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Critical Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    위험 범위 (빨간색)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최솟값</label>
                      <input
                        type="number"
                        value={thresholds.min_critical}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          min_critical: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최댓값</label>
                      <input
                        type="number"
                        value={thresholds.max_critical}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          max_critical: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">센서 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">위치:</span>
                      <span className="ml-2">{selectedSensor.zone_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">단위:</span>
                      <span className="ml-2">{selectedSensor.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">상태:</span>
                      <span className={`ml-2 ${selectedSensor.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedSensor.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">최근 값:</span>
                      <span className="ml-2">
                        {selectedSensor.latest_value?.toFixed(1) || 'N/A'} {selectedSensor.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">일반 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  자동 새로고침 간격
                </label>
                <select
                  value={systemSettings.auto_refresh_interval}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    auto_refresh_interval: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1000}>1초</option>
                  <option value={5000}>5초</option>
                  <option value={10000}>10초</option>
                  <option value={30000}>30초</option>
                  <option value={60000}>1분</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  차트 최대 데이터 포인트
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={systemSettings.chart_max_points}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    chart_max_points: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  언어
                </label>
                <select
                  value={systemSettings.language}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    language: e.target.value as 'ko' | 'en'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">다크 모드</p>
                  <p className="text-xs text-gray-600">어두운 테마 사용</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings.dark_mode}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      dark_mode: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button
              onClick={saveSystemSettings}
              className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              <span>설정 저장</span>
            </button>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 정보</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Database className="text-blue-500" size={20} />
                <div>
                  <p className="text-sm font-medium">데이터베이스</p>
                  <p className="text-xs text-gray-600">SQLite 연결됨</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Wifi className="text-green-500" size={20} />
                <div>
                  <p className="text-sm font-medium">WebSocket</p>
                  <p className="text-xs text-gray-600">실시간 연결 활성</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="text-orange-500" size={20} />
                <div>
                  <p className="text-sm font-medium">마지막 업데이트</p>
                  <p className="text-xs text-gray-600">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">알림 활성화</p>
                <p className="text-xs text-gray-600">센서 알림 및 경고 수신</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.notification_enabled}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    notification_enabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">알림 소리</p>
                <p className="text-xs text-gray-600">경고 시 소리 재생</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.alert_sound_enabled}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    alert_sound_enabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">알림 유형별 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">정상 상태 알림</span>
                  <input type="checkbox" checked disabled className="ml-auto" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">경고 알림</span>
                  <input type="checkbox" checked className="ml-auto" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">위험 알림</span>
                  <input type="checkbox" checked className="ml-auto" />
                </div>
              </div>
            </div>

            <button
              onClick={saveSystemSettings}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              <span>알림 설정 저장</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;