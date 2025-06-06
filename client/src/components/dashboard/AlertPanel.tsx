import React from 'react';
import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { AlertData } from '../../services/websocket';

interface AlertPanelProps {
  alerts: AlertData[];
  isConnected: boolean;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, isConnected }) => {

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-orange-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (!isConnected) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">알림</h3>
          <div className="text-sm text-red-500">연결 끊김</div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔔</div>
          <p className="text-gray-600">알림 서비스에 연결할 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">실시간 알림</h3>
        <div className="flex items-center space-x-2">
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
            {alerts.length}개 활성
          </span>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-green-400 text-4xl mb-2">✅</div>
          <p className="text-gray-600">모든 시스템이 정상입니다.</p>
          <p className="text-sm text-gray-500">새로운 알림이 있으면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.sensor_id}-${alert.timestamp}-${index}`}
              className={`border-l-4 p-3 rounded-r-lg ${getSeverityClass(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-600">{alert.sensor_name}</p>
                    <p className="text-xs text-gray-500">
                      값: {alert.value} {alert.unit}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {getTimeAgo(alert.timestamp)}
                </span>
                
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'warning' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {alert.severity === 'critical' ? '위험' :
                   alert.severity === 'warning' ? '경고' : '정보'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>실시간 알림 수신 중</span>
          <span>{alerts.length > 0 ? `최신: ${getTimeAgo(alerts[0].timestamp)}` : ''}</span>
        </div>
      </div>
    </div>
  );
};