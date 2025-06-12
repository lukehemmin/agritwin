import React, { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useThreeJS } from '../../hooks/useThreeJS';
import { FarmModel } from './FarmModel';
import { useWebSocket } from '../../hooks/useWebSocket';
import { FarmZone } from '../../types/farm.types';

interface FarmViewerProps {
  zones: FarmZone[];
  sensorData?: any[]; // Optional sensor data prop
  selectedZone: string | null;
  viewMode?: 'plant' | 'zone'; // View mode prop from parent
  onZoneSelect?: (zoneId: string | null) => void;
  onSensorSelect?: (sensorId: string) => void;
  className?: string;
}

export const FarmViewer: React.FC<FarmViewerProps> = ({
  zones,
  sensorData: propSensorData,
  selectedZone,
  viewMode = 'plant', // Default to plant view if not provided
  onZoneSelect,
  onSensorSelect,
  className = ''
}) => {
  const [cameraUpdateTrigger, setCameraUpdateTrigger] = useState(0);
  console.log('🌍 FarmViewer: Rendering with', { 
    zones: zones.length, 
    selectedZone,
    className,
    zonesData: zones
  });
  const { canvasRef, scene, camera, renderer, isLoading, error } = useThreeJS();
  const { sensorData: hookSensorData } = useWebSocket();
  
  // Use prop data if provided, otherwise use hook data
  const sensorData = propSensorData || hookSensorData;
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [raycaster] = useState(new THREE.Raycaster());
  const [mouse] = useState(new THREE.Vector2());

  // Initialize OrbitControls
  useEffect(() => {
    if (!camera || !renderer || !canvasRef.current) return;

    const newControls = new OrbitControls(camera, canvasRef.current);
    
    // Configure controls
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.enableZoom = true;
    newControls.enableRotate = true;
    newControls.enablePan = true;
    
    // Set limits
    newControls.maxDistance = 50;
    newControls.minDistance = 5;
    newControls.maxPolarAngle = Math.PI * 0.8;
    newControls.minPolarAngle = Math.PI * 0.1;
    
    // Set target to farm center
    newControls.target.set(0, 2, 0);
    newControls.update();

    setControls(newControls);

    return () => {
      newControls.dispose();
    };
  }, [camera, renderer, canvasRef]);

  // Handle mouse clicks for interaction
  const handleClick = useCallback((event: MouseEvent) => {
    if (!camera || !scene || !canvasRef.current || isLoading || error) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const userData = clickedObject.userData;

      if (userData.type === 'zone' && onZoneSelect) {
        const zoneId = userData.zoneId;
        onZoneSelect(selectedZone === zoneId ? null : zoneId);
      } else if (userData.type === 'sensor' && onSensorSelect) {
        onSensorSelect(userData.sensorId);
      }
    } else {
      // Clicked on empty space, deselect
      onZoneSelect?.(null);
    }
  }, [camera, scene, selectedZone, onZoneSelect, onSensorSelect, raycaster, mouse, isLoading, error, canvasRef]);

  // Add click event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [handleClick, canvasRef]);

  // Animation loop
  useEffect(() => {
    if (!renderer || !scene || !camera || !controls || isLoading || error) {
      return;
    }

    let animationId: number;

    const animate = () => {
      const controlsChanged = controls.update();
      
      // 카메라가 움직였을 때 업데이트 트리거
      if (controlsChanged) {
        setCameraUpdateTrigger(prev => prev + 1);
      }
      
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [renderer, scene, camera, controls, isLoading, error]);

  // Resize handling is now done in useThreeJS hook

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`} style={{ minHeight: '400px' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        style={{ 
          display: 'block'
        }}
      />
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg z-10">
          <div className="text-center p-4">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium">3D 뷰어 초기화 실패</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg z-10">
          <div className="text-center p-4">
            <div className="animate-spin text-4xl mb-2">🔄</div>
            <p className="text-gray-600">3D 농장 모델 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 3D Content */}
      {!isLoading && !error && scene && camera && (
        <>
          {/* 3D Farm Model */}
          <FarmModel
            scene={scene}
            zones={zones}
            selectedZoneId={selectedZone} // Renamed from selectedZone
            camera={camera} // Add camera prop
            cameraUpdateTrigger={cameraUpdateTrigger} // Add camera update trigger
            viewMode={viewMode} // Add view mode prop
            // sensorData prop removed as it's no longer in FarmModelProps
            onZoneClick={onZoneSelect}
            onSensorClick={onSensorSelect}
          />

          {/* Controls Info */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2 z-20">
            <div className="bg-black bg-opacity-70 text-white text-xs p-3 rounded-lg">
              <div className="space-y-1">
                <div>🖱️ 마우스: 회전 및 줌</div>
                <div>👆 클릭: {viewMode === 'plant' ? '식물 센서' : '구역'} 선택</div>
                <div>🎯 휠: 확대/축소</div>
              </div>
            </div>
          </div>

          {/* Zone Selection Info */}
          {selectedZone && (
            <div className="absolute top-4 right-4 bg-green-500 bg-opacity-90 text-white p-3 rounded-lg z-20">
              <div className="text-sm font-medium">
                선택된 구역: {zones.find(z => z.id === selectedZone)?.name || selectedZone}
              </div>
              <div className="text-xs mt-1">
                클릭하여 선택 해제
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="absolute bottom-4 left-4 flex space-x-2 z-20">
            {viewMode === 'zone' && (
              <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                🏠 구역: {zones.length}개
              </div>
            )}
            {viewMode === 'plant' && (
              <>
                <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  🌱 총 식물: {zones.length > 0 ? 3 * 2 * 6 * 6 : 0}개 {/* 3층 * 2구역 * 6x6 식물 */}
                </div>
                <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  🌡️ 활성 센서: {zones.length * 2}개 {/* 각 구역마다 2개 식물 타입 센서 */}
                </div>
              </>
            )}
            <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              📊 실시간 데이터: {sensorData.filter(s => s.status === 'critical' || s.status === 'warning').length}개 주의/위험
            </div>
          </div>
        </>
      )}
    </div>
  );
};