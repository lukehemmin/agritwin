import React, { useState } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

export interface Alert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  sensor_id?: string;
  zone_id?: string;
  acknowledged?: boolean;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  if (!isOpen) return null;

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'unread':
        return !alert.acknowledged;
      case 'critical':
        return alert.severity === 'critical';
      default:
        return true;
    }
  });

  const unreadCount = alerts.filter(alert => !alert.acknowledged).length;
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end pt-16 pr-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-96 max-w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">알림</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            전체 ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            미확인 ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              filter === 'critical'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            긴급 ({criticalCount})
          </button>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">알림이 없습니다</p>
              <p className="text-sm text-gray-400">
                {filter === 'all' ? '모든 알림을 확인했습니다' :
                 filter === 'unread' ? '미확인 알림이 없습니다' :
                 '긴급 알림이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 p-3 rounded-r-lg transition-all duration-200 ${getAlertColor(alert.severity)} ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 leading-5">
                          {alert.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString('ko-KR')}
                          </span>
                          {alert.zone_id && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              구역: {alert.zone_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="ml-2 p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                        title="확인됨으로 표시"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                총 {alerts.length}개 알림
              </span>
              <span>
                마지막 업데이트: {alerts.length > 0 ? new Date(Math.max(...alerts.map(a => new Date(a.timestamp).getTime()))).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};