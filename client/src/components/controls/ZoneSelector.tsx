import React, { useState } from 'react';
import { ChevronDown, Layers } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  level: number;
  cropType: string;
  sensorCount: number;
  healthScore: number;
}

interface ZoneSelectorProps {
  zones: Zone[];
  selectedZone: string | null;
  onZoneSelect: (zoneId: string | null) => void;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({
  zones,
  selectedZone,
  onZoneSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedZoneData = zones.find(zone => zone.id === selectedZone);

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Layers size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {selectedZoneData ? selectedZoneData.name : '전체 구역'}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">구역 선택</h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {/* All Zones Option */}
            <button
              onClick={() => {
                onZoneSelect(null);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                !selectedZone ? 'bg-primary-50 border-r-2 border-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">전체 구역</p>
                  <p className="text-sm text-gray-600">모든 구역 표시</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{zones.length}개 구역</p>
                  <p className="text-xs text-gray-500">
                    평균 건강도: {Math.round(zones.reduce((acc, zone) => acc + zone.healthScore, 0) / zones.length)}%
                  </p>
                </div>
              </div>
            </button>

            {/* Individual Zones */}
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  onZoneSelect(zone.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  selectedZone === zone.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{zone.name}</p>
                    <p className="text-sm text-gray-600">{zone.cropType}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getHealthScoreColor(zone.healthScore)}`}>
                      건강도 {zone.healthScore}%
                    </p>
                    <p className="text-xs text-gray-500">{zone.sensorCount}개 센서</p>
                  </div>
                </div>
              </button>
            ))}
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