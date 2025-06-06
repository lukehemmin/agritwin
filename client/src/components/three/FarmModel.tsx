import React, { useEffect } from 'react';
import * as THREE from 'three';
import { FarmZone } from '../../types/farm.types';
import { SensorData } from '../../services/websocket';

interface FarmModelProps {
  scene: THREE.Scene;
  zones: FarmZone[];
  sensorData: SensorData[];
  selectedZone: string | null;
  onZoneClick?: (zoneId: string) => void;
  onSensorClick?: (sensorId: string) => void;
}

export const FarmModel: React.FC<FarmModelProps> = ({
  scene,
  zones,
  sensorData,
  selectedZone
}) => {
  useEffect(() => {
    if (!scene) return;

    console.log('🏗️ FarmModel: Creating farm structure');

    // 간단한 농장 바닥 생성
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);

    // 간단한 농장 건물
    const buildingGeometry = new THREE.BoxGeometry(8, 4, 8);
    const buildingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: 0.7
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(0, 2, 0);
    scene.add(building);

    // 구역별 플랫폼 생성
    zones.forEach((zone, index) => {
      const platformGeometry = new THREE.BoxGeometry(3, 0.2, 3);
      const isSelected = selectedZone === zone.id;
      const platformMaterial = new THREE.MeshLambertMaterial({ 
        color: isSelected ? 0xFF5722 : 0x2196F3
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      
      // 플랫폼 위치 설정 (원형 배치)
      const angle = (index / zones.length) * Math.PI * 2;
      const radius = 3;
      platform.position.set(
        Math.cos(angle) * radius,
        0.5 + (zone.level - 1) * 1.5,
        Math.sin(angle) * radius
      );
      
      platform.userData = { type: 'zone', zoneId: zone.id };
      scene.add(platform);

      // 구역 라벨
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#333333';
      context.font = 'Bold 24px Arial';
      context.textAlign = 'center';
      context.fillText(zone.name, 128, 40);

      const labelTexture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        map: labelTexture,
        transparent: true
      });
      const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(
        Math.cos(angle) * radius,
        1 + (zone.level - 1) * 1.5,
        Math.sin(angle) * radius
      );
      label.lookAt(0, label.position.y, 0);
      scene.add(label);
    });

    console.log('✅ FarmModel: Farm structure created');

    return () => {
      // 정리 작업은 필요시 추가
    };
  }, [scene, zones, selectedZone]);

  return null;
};