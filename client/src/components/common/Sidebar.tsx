import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Layers, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Droplets,
  Lightbulb,
  Wind
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: Home, label: '대시보드' },
    { path: '/analytics', icon: BarChart3, label: '분석' },
    { path: '/zones', icon: Layers, label: '구역 관리' },
    { path: '/settings', icon: Settings, label: '설정' },
  ];

  const sensorFilters = [
    { type: 'temperature', icon: Thermometer, label: '온도', count: 6 },
    { type: 'humidity', icon: Droplets, label: '습도', count: 6 },
    { type: 'light', icon: Lightbulb, label: '조도', count: 6 },
    { type: 'co2', icon: Wind, label: 'CO2', count: 6 },
  ];

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className={`space-y-2 ${isCollapsed ? 'hidden' : ''}`}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              메뉴
            </h3>
          </div>
          
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Sensor Filters */}
          {!isCollapsed && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                센서 필터
              </h3>
              <ul className="space-y-1">
                {sensorFilters.map((filter) => (
                  <li key={filter.type}>
                    <button className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <filter.icon size={16} className="flex-shrink-0" />
                        <span className="ml-3 text-sm">{filter.label}</span>
                      </div>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {filter.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Zone Quick Access */}
          {!isCollapsed && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                구역 바로가기
              </h3>
              <ul className="space-y-1">
                {Array.from({ length: 3 }, (_, i) => i + 1).map((level) => (
                  <li key={level}>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      {level}층 ({level === 1 ? '상추, 시금치' : level === 2 ? '케일, 루꼴라' : '바질, 민트'})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Status Summary */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">시스템 상태</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">활성 센서</span>
                  <span className="font-medium text-green-600">28/30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">알림</span>
                  <span className="font-medium text-orange-600">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">마지막 업데이트</span>
                  <span className="font-medium text-gray-700">방금 전</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};