import React, { useState } from 'react';
import { Droplets, Power, PowerOff, Zap, ZapOff } from 'lucide-react';

interface ControlPanelProps {
  onLightingControl: (tier: number, side: number, action: 'on' | 'off' | 'toggle') => void;
  onIrrigationControl: (tier: number, side: number, action: 'start' | 'stop' | 'toggle') => void;
}

export const FarmControlPanel: React.FC<ControlPanelProps> = ({
  onLightingControl,
  onIrrigationControl
}) => {
  const [lightingStates, setLightingStates] = useState<Record<string, boolean>>({});
  const [irrigationStates, setIrrigationStates] = useState<Record<string, boolean>>({});

  // 3층, 각 층마다 A, B 구역
  const tiers = [1, 2, 3];
  const sides = ['A', 'B'];

  const handleAllLights = (action: 'on' | 'off') => {
    const newStates: Record<string, boolean> = {};
    tiers.forEach(tier => {
      sides.forEach((_, sideIndex) => {
        const key = `${tier}-${sideIndex}`;
        newStates[key] = action === 'on';
        onLightingControl(tier, sideIndex, action);
      });
    });
    setLightingStates(newStates);
  };

  const handleAllIrrigation = (action: 'start' | 'stop') => {
    const newStates: Record<string, boolean> = {};
    tiers.forEach(tier => {
      sides.forEach((_, sideIndex) => {
        const key = `${tier}-${sideIndex}`;
        newStates[key] = action === 'start';
        onIrrigationControl(tier, sideIndex, action);
      });
    });
    setIrrigationStates(newStates);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
        <Zap className="w-4 h-4 mr-2 text-blue-600" />
        농장 제어판
      </h3>

      {/* 전체 제어 버튼들만 유지 */}
      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-700 mb-2">전체 제어</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-gray-600 font-medium">💡 조명</p>
            <div className="flex space-x-1">
              <button
                onClick={() => handleAllLights('on')}
                className="flex-1 px-2 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded text-xs font-medium transition-colors flex items-center justify-center"
              >
                <Power className="w-3 h-3 mr-1" />
                전체 ON
              </button>
              <button
                onClick={() => handleAllLights('off')}
                className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium transition-colors flex items-center justify-center"
              >
                <PowerOff className="w-3 h-3 mr-1" />
                전체 OFF
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600 font-medium">💧 급수</p>
            <div className="flex space-x-1">
              <button
                onClick={() => handleAllIrrigation('start')}
                className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors flex items-center justify-center"
              >
                <Droplets className="w-3 h-3 mr-1" />
                전체 ON
              </button>
              <button
                onClick={() => handleAllIrrigation('stop')}
                className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium transition-colors flex items-center justify-center"
              >
                <ZapOff className="w-3 h-3 mr-1" />
                전체 OFF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 시스템 상태 표시 */}
      <div className="p-2 bg-green-50 rounded-lg">
        <h4 className="text-xs font-medium text-green-800 mb-2">📊 시스템 상태</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-green-700">활성 조명:</span>
            <span className="font-medium text-green-800">
              {Object.values(lightingStates).filter(Boolean).length}/{tiers.length * sides.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-700">활성 급수:</span>
            <span className="font-medium text-blue-800">
              {Object.values(irrigationStates).filter(Boolean).length}/{tiers.length * sides.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};