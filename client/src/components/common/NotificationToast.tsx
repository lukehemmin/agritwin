import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export interface ToastNotification {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  autoClose?: boolean;
  duration?: number;
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onClose: (id: string) => void;
  onClickNotification?: (id: string) => void;
  maxVisible?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onClose,
  onClickNotification,
  maxVisible = 2
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // 최신 알림을 우선으로 maxVisible 개수만큼만 표시
    const latestNotifications = notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxVisible);
    
    setVisibleNotifications(latestNotifications);
    
    // 오래된 알림들을 자동으로 닫기
    if (notifications.length > maxVisible) {
      const oldNotifications = notifications.slice(maxVisible);
      oldNotifications.forEach(notification => {
        setTimeout(() => onClose(notification.id), 100);
      });
    }
  }, [notifications, maxVisible, onClose]);

  useEffect(() => {
    // Auto-close notifications after their duration
    notifications.forEach(notification => {
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
          onClose(notification.id);
        }, duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onClose]);

  const getToastIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getToastStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 shadow-red-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 shadow-yellow-100';
      case 'info':
        return 'bg-blue-50 border-blue-200 shadow-blue-100';
      default:
        return 'bg-green-50 border-green-200 shadow-green-100';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-out
            ${getToastStyle(notification.severity)}
            cursor-pointer hover:shadow-xl hover:scale-105
            ${index > 0 ? 'opacity-90' : ''}
          `}
          style={{
            animation: 'slideInRight 0.3s ease-out',
            transform: `translateY(${index * 2}px) scale(${1 - index * 0.03})`,
            zIndex: 1000 - index
          }}
          onClick={() => onClickNotification?.(notification.id)}
        >
          <div className="flex items-start space-x-3">
            {getToastIcon(notification.severity)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString('ko-KR')}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress bar for auto-close */}
          {notification.autoClose !== false && (
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all linear ${
                  notification.severity === 'critical' ? 'bg-red-400' :
                  notification.severity === 'warning' ? 'bg-yellow-400' :
                  notification.severity === 'info' ? 'bg-blue-400' : 'bg-green-400'
                }`}
                style={{
                  animation: `progress ${notification.duration || 5000}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};