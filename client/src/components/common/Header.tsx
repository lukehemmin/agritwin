import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings, User } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface HeaderProps {
  onNotificationClick?: () => void;
  unreadNotificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNotificationClick,
  unreadNotificationCount 
}) => {
  const { isConnected, alerts } = useWebSocket();
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gradient">AgriTwin</h1>
          </Link>
          
          <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
            <span>도심형 스마트 농장</span>
            <span className="mx-2">•</span>
            <span>디지털 트윈 시스템</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className={isConnected ? "status-dot-normal" : "status-dot-critical"}></div>
            <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '실시간 연결' : '연결 끊김'}
            </span>
          </div>

          {/* Notifications */}
          <button 
            onClick={onNotificationClick}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="알림"
          >
            <Bell size={20} />
            {(unreadNotificationCount || alerts.length) > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {(unreadNotificationCount || alerts.length) > 99 ? '99+' : (unreadNotificationCount || alerts.length)}
              </span>
            )}
          </button>

          {/* Settings */}
          <Link 
            to="/settings" 
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings size={20} />
          </Link>

          {/* User Menu */}
          <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <User size={20} />
            <span className="hidden md:inline text-sm font-medium">관리자</span>
          </button>
        </div>
      </div>
    </header>
  );
};