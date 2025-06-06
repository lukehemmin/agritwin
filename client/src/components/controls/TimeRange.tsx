import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface TimeRangeProps {
  value: [Date, Date];
  onChange: (range: [Date, Date]) => void;
}

export const TimeRange: React.FC<TimeRangeProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    { label: '지난 1시간', hours: 1 },
    { label: '지난 6시간', hours: 6 },
    { label: '지난 24시간', hours: 24 },
    { label: '지난 3일', hours: 72 },
    { label: '지난 주', hours: 168 },
    { label: '지난 30일', hours: 720 },
  ];

  const formatDateRange = (start: Date, end: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (diffHours <= 1) return '지난 1시간';
    if (diffHours <= 6) return '지난 6시간';
    if (diffHours <= 24) return '지난 24시간';
    if (diffHours <= 72) return '지난 3일';
    if (diffHours <= 168) return '지난 주';
    if (diffHours <= 720) return '지난 30일';
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const handlePresetSelect = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    onChange([start, end]);
    setIsOpen(false);
  };

  const getCurrentPreset = () => {
    const [start, end] = value;
    const diffHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    return presets.find(preset => Math.abs(preset.hours - diffHours) < 2)?.label || 
           formatDateRange(start, end);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {getCurrentPreset()}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">시간 범위 선택</h3>
          </div>
          
          <div className="p-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset.hours)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                {preset.label}
              </button>
            ))}
            
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={() => {
                  // Custom date range picker would be implemented here
                  console.log('Custom date range picker');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                사용자 정의 범위...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};