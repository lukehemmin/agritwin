import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FarmZone } from '../../types/farm.types';
import { Sensor } from '../../types/sensor.types';

// ZoneInfoModal Component (defined in the same file to avoid import issues)
interface ZoneInfoModalProps {
  zoneData: FarmZone | null;
  onClose: () => void;
}

// PlantSensorModal Component
interface PlantSensorModalProps {
  plantData: PlantSensorButtonProps | null;
  onClose: () => void;
}

// ControlModal Component
interface ControlModalProps {
  controlData: ControlIconProps | null;
  onClose: () => void;
  onToggle: (tier: number, side: number, type: 'lighting' | 'irrigation') => void;
}

const ZoneInfoModal: React.FC<ZoneInfoModalProps> = ({ zoneData, onClose }) => {
  if (!zoneData) return null;

  // 구역 건강 상태 계산
  const getZoneHealthStatus = () => {
    if (!zoneData.sensors || zoneData.sensors.length === 0) return { status: 'unknown', color: '#6b7280', icon: '🏭' };
    
    const criticalCount = zoneData.sensors.filter(s => s.latest_status === 'critical').length;
    const warningCount = zoneData.sensors.filter(s => s.latest_status === 'warning').length;
    
    if (criticalCount > 0) return { status: 'critical', color: '#ef4444', icon: '🚨' };
    if (warningCount > 0) return { status: 'warning', color: '#f59e0b', icon: '⚠️' };
    return { status: 'normal', color: '#10b981', icon: '🏢' };
  };

  const zoneHealth = getZoneHealthStatus();

  // 센서 타입별 그룹화
  const sensorsByType = zoneData.sensors ? zoneData.sensors.reduce((acc: any, sensor) => {
    if (!acc[sensor.type]) acc[sensor.type] = [];
    acc[sensor.type].push(sensor);
    return acc;
  }, {}) : {};

  // 센서 타입별 평균값 계산
  const getSensorSummary = (sensors: Sensor[]) => {
    const validSensors = sensors.filter(s => s.latest_value !== null && s.latest_value !== undefined);
    if (validSensors.length === 0) return { avg: 0, min: 0, max: 0, unit: '' };
    
    const values = validSensors.map(s => s.latest_value!);
    return {
      avg: Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
      unit: validSensors[0].unit || ''
    };
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'soil_moisture': return '🌱';
      case 'light': return '💡';
      case 'co2': return '🌬️';
      default: return '📊';
    }
  };

  const getSensorTypeName = (type: string) => {
    switch (type) {
      case 'temperature': return '온도';
      case 'humidity': return '습도';
      case 'soil_moisture': return '토양 수분';
      case 'light': return '조도';
      case 'co2': return 'CO2';
      default: return type;
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1001,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {/* 헤더 */}
        <div style={{
          background: `linear-gradient(135deg, ${zoneHealth.color}22, ${zoneHealth.color}11)`,
          padding: '24px', borderRadius: '16px 16px 0 0',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                fontSize: '32px', background: 'white', borderRadius: '12px',
                padding: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {zoneHealth.icon}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                  {zoneData.name || zoneData.id}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                  구역 상태: <span style={{ color: zoneHealth.color, fontWeight: '600' }}>
                    {zoneHealth.status === 'normal' ? '정상' : 
                     zoneHealth.status === 'warning' ? '주의' : 
                     zoneHealth.status === 'critical' ? '위험' : '알 수 없음'}
                  </span>
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'white', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', color: '#6b7280',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#6b7280';
            }}>
              ×
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div style={{ padding: '24px' }}>
          {/* 구역 정보 */}
          <div style={{
            background: '#f9fafb', borderRadius: '12px', padding: '16px',
            marginBottom: '20px', border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              📍 구역 정보
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#6b7280' }}>구역 ID:</span>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{zoneData.id}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>센서 개수:</span>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>
                  {zoneData.sensors ? zoneData.sensors.length : 0}개
                </div>
              </div>
            </div>
          </div>

          {/* 센서 현황 */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              📊 센서 현황
            </h3>
            
            {Object.keys(sensorsByType).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(sensorsByType).map(([type, sensors]) => {
                  const summary = getSensorSummary(sensors as Sensor[]);
                  const icon = getSensorIcon(type);
                  const name = getSensorTypeName(type);
                  
                  return (
                    <div key={type} style={{
                      background: 'white', borderRadius: '12px', padding: '16px',
                      border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{icon}</span>
                          <span style={{ fontWeight: '600', color: '#374151' }}>{name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                            {summary.avg}{summary.unit}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {summary.min} ~ {summary.max}{summary.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px', color: '#6b7280',
                background: '#f9fafb', borderRadius: '12px', border: '2px dashed #d1d5db'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <p style={{ margin: 0, fontSize: '16px' }}>이 구역에는 센서 정보가 없습니다</p>
              </div>
            )}
          </div>

          {/* 실시간 차트 플레이스홀더 */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea22, #764ba222)',
            borderRadius: '12px', padding: '24px', textAlign: 'center',
            border: '2px dashed #a855f7'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              실시간 차트
            </h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              구역별 환경 데이터의 시간별 변화를 표시합니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlantSensorModal: React.FC<PlantSensorModalProps> = ({ plantData, onClose }) => {
  if (!plantData) return null;

  // 모의 센서 데이터 (실제로는 API에서 가져와야 함)
  const generateRealisticSensorData = () => {
    // 구역별 기준 온도 설정 (층과 위치에 따라)
    const zoneBaseTempMap: Record<string, number> = {
      'zone-1-1': 22, // 1층 존 1
      'zone-1-2': 22.5, // 1층 존 2 (약간 따뜻)
      'zone-2-1': 21.5, // 2층 존 1 (약간 차가움)
      'zone-2-2': 22, // 2층 존 2
      'zone-3-1': 21, // 3층 존 1 (가장 차가움)
      'zone-3-2': 21.5, // 3층 존 2
    };
    
    // 식물 위치에 따른 미세한 변화 (동일 구역 내 식물들은 매우 비슷한 환경)
    const positionVariation = {
      temperature: (Math.random() - 0.5) * 1, // ±0.5도
      humidity: (Math.random() - 0.5) * 5, // ±2.5%
      soilMoisture: (Math.random() - 0.5) * 8, // ±4%
      phLevel: (Math.random() - 0.5) * 0.2, // ±0.1
      lightIntensity: (Math.random() - 0.5) * 6, // ±3%
      nutrientLevel: (Math.random() - 0.5) * 10 // ±5%
    };
    
    // 구역별 기준값
    const zoneBaseTemp = zoneBaseTempMap[plantData.zoneId] || 22;
    
    const baseValues = {
      temperature: zoneBaseTemp + positionVariation.temperature,
      humidity: 68 + positionVariation.humidity, // 구역별로 큰 차이 없음
      soilMoisture: 65 + positionVariation.soilMoisture,
      phLevel: 6.4 + positionVariation.phLevel,
      lightIntensity: 85 + positionVariation.lightIntensity,
      nutrientLevel: 78 + positionVariation.nutrientLevel
    };
    
    // 건강 상태에 따라 센서 값 조정 (더 현실적으로)
    if (plantData.healthStatus === 'stressed') {
      baseValues.temperature += 1.5; // 약간의 스트레스
      baseValues.soilMoisture -= 8;
      baseValues.nutrientLevel -= 5;
    } else if (plantData.healthStatus === 'sick') {
      baseValues.temperature += 2.5; // 더 심한 스트레스
      baseValues.soilMoisture -= 15;
      baseValues.nutrientLevel -= 15;
      baseValues.phLevel += 0.3; // pH 불균형
    }
    
    return baseValues;
  };

  const sensorData = generateRealisticSensorData();

  const getSensorStatus = (value: number, optimal: [number, number]) => {
    if (value < optimal[0] || value > optimal[1]) {
      return { status: 'warning', color: '#f59e0b' };
    }
    return { status: 'normal', color: '#10b981' };
  };

  const getPlantTypeKorean = (type: string) => {
    const names: Record<string, string> = {
      lettuce: '상추',
      spinach: '시금치',
      kale: '케일',
      arugula: '루꼴라',
      basil: '바질',
      mint: '민트'
    };
    return names[type] || type;
  };

  const getGrowthStageKorean = (stage: string) => {
    const stages: Record<string, string> = {
      seed: '씨앗',
      sprout: '새싹',
      growing: '성장',
      mature: '성숙',
      harvest: '수확',
      dead: '죽음'
    };
    return stages[stage] || stage;
  };

  const getHealthStatusKorean = (status: string) => {
    const statuses: Record<string, string> = {
      healthy: '건강',
      stressed: '스트레스',
      sick: '아픔',
      dead: '죽음'
    };
    return statuses[status] || status;
  };

  const modalStyles: { [key: string]: React.CSSProperties } = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1001,
    },
    modal: {
      backgroundColor: 'white', padding: '20px', borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)', width: '90%',
      maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px',
    },
    closeButton: { 
      background: 'none', border: 'none', fontSize: '1.5rem', 
      cursor: 'pointer', color: '#6b7280', padding: '5px'
    },
    sensorGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px', marginTop: '20px'
    },
    sensorCard: {
      border: '1px solid #e5e7eb', borderRadius: '8px',
      padding: '12px', backgroundColor: '#f9fafb'
    },
    sensorLabel: {
      fontSize: '0.875rem', fontWeight: '600',
      color: '#374151', marginBottom: '5px'
    },
    sensorValue: {
      fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2px'
    },
    sensorUnit: {
      fontSize: '0.75rem', color: '#6b7280'
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937' }}>🌱 식물 센서 정보</h2>
            <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              {getPlantTypeKorean(plantData.plantType)} • {plantData.zoneId} • 위치: ({plantData.position.row + 1}, {plantData.position.col + 1})
            </p>
          </div>
          <button onClick={onClose} style={modalStyles.closeButton}>×</button>
        </div>
        
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>식물 상태</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>성장 단계:</span>
                <span style={{ marginLeft: '8px', fontWeight: '600', color: '#059669' }}>
                  {getGrowthStageKorean(plantData.growthStage)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>건강 상태:</span>
                <span style={{ 
                  marginLeft: '8px', fontWeight: '600',
                  color: plantData.healthStatus === 'healthy' ? '#059669' : 
                         plantData.healthStatus === 'stressed' ? '#d97706' : '#dc2626'
                }}>
                  {getHealthStatusKorean(plantData.healthStatus)}
                </span>
              </div>
            </div>
          </div>

          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>토양 센서 데이터</h3>
          <div style={modalStyles.sensorGrid}>
            <div style={modalStyles.sensorCard}>
              <div style={modalStyles.sensorLabel}>🌡️ 온도</div>
              <div style={{ 
                ...modalStyles.sensorValue, 
                color: getSensorStatus(sensorData.temperature, [18, 24]).color 
              }}>
                {sensorData.temperature.toFixed(1)}
              </div>
              <div style={modalStyles.sensorUnit}>°C</div>
            </div>
            
            <div style={modalStyles.sensorCard}>
              <div style={modalStyles.sensorLabel}>💧 습도</div>
              <div style={{ 
                ...modalStyles.sensorValue, 
                color: getSensorStatus(sensorData.humidity, [60, 80]).color 
              }}>
                {sensorData.humidity.toFixed(0)}
              </div>
              <div style={modalStyles.sensorUnit}>%</div>
            </div>
            
            <div style={modalStyles.sensorCard}>
              <div style={modalStyles.sensorLabel}>🏔️ 토양수분</div>
              <div style={{ 
                ...modalStyles.sensorValue, 
                color: getSensorStatus(sensorData.soilMoisture, [40, 80]).color 
              }}>
                {sensorData.soilMoisture.toFixed(0)}
              </div>
              <div style={modalStyles.sensorUnit}>%</div>
            </div>
            
            <div style={modalStyles.sensorCard}>
              <div style={modalStyles.sensorLabel}>🧪 pH</div>
              <div style={{ 
                ...modalStyles.sensorValue, 
                color: getSensorStatus(sensorData.phLevel, [6.0, 7.0]).color 
              }}>
                {sensorData.phLevel.toFixed(1)}
              </div>
              <div style={modalStyles.sensorUnit}>pH</div>
            </div>
            
            <div style={modalStyles.sensorCard}>
              <div style={modalStyles.sensorLabel}>☀️ 조도</div>
              <div style={{ 
                ...modalStyles.sensorValue, 
                color: getSensorStatus(sensorData.lightIntensity, [60, 100]).color 
              }}>
                {sensorData.lightIntensity.toFixed(0)}
              </div>
              <div style={modalStyles.sensorUnit}>%</div>
            </div>
            
            <div style={modalStyles.sensorCard}>
              <div style={modalStyles.sensorLabel}>🌿 영양분</div>
              <div style={{ 
                ...modalStyles.sensorValue, 
                color: getSensorStatus(sensorData.nutrientLevel, [70, 100]).color 
              }}>
                {sensorData.nutrientLevel.toFixed(0)}
              </div>
              <div style={modalStyles.sensorUnit}>%</div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>💡 권장사항</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '0.875rem' }}>
              {sensorData.soilMoisture < 40 && (
                <li>토양 수분이 부족합니다. 물을 주세요.</li>
              )}
              {sensorData.temperature > 24 && (
                <li>온도가 높습니다. 환기를 늘려주세요.</li>
              )}
              {sensorData.nutrientLevel < 70 && (
                <li>영양분이 부족합니다. 비료를 공급해주세요.</li>
              )}
              {sensorData.phLevel < 6.0 && (
                <li>토양이 산성입니다. pH 조절이 필요합니다.</li>
              )}
              {sensorData.phLevel > 7.0 && (
                <li>토양이 알칼리성입니다. pH 조절이 필요합니다.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlModal: React.FC<ControlModalProps> = ({ controlData, onClose, onToggle }) => {
  if (!controlData) return null;

  const isLighting = controlData.type === 'lighting';
  const systemName = isLighting ? '조명 시스템' : '급수 시스템';
  const tierName = `${controlData.tier + 1}층`;
  const sideName = `구역 ${controlData.side === 0 ? 'A' : 'B'}`;
  const statusText = controlData.isActive ? 'ON' : 'OFF';
  const statusColor = controlData.isActive 
    ? (isLighting ? '#fbbf24' : '#3b82f6') 
    : '#6b7280';

  const modalStyles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modal: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '16px',
      padding: '24px',
      width: '400px',
      maxWidth: '90vw',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #e2e8f0'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: `3px solid ${statusColor}`
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      backgroundColor: controlData.isActive ? statusColor : '#f3f4f6',
      color: controlData.isActive ? 'white' : '#6b7280',
      marginLeft: '12px'
    },
    controlSection: {
      backgroundColor: '#f8fafc',
      padding: '16px',
      borderRadius: '12px',
      marginTop: '16px'
    },
    toggleButton: {
      width: '100%',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: controlData.isActive ? '#ef4444' : statusColor,
      color: 'white'
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div>
            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>
              {isLighting ? '💡' : '💧'} {systemName}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              {tierName} • {sideName}
              <span style={modalStyles.statusBadge}>{statusText}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={modalStyles.closeButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>
        
        <div>
          <h3 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '16px' }}>시스템 정보</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>위치</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{tierName} {sideName}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>상태</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: statusColor }}>{statusText}</div>
            </div>
          </div>

          {isLighting ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>밝기</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                  {controlData.isActive ? '80%' : '0%'}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>소비전력</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                  {controlData.isActive ? '45W' : '0W'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>유량</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  {controlData.isActive ? '2.5L/min' : '0L/min'}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>압력</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  {controlData.isActive ? '3.2bar' : '0bar'}
                </div>
              </div>
            </div>
          )}

          <div style={modalStyles.controlSection}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '14px' }}>제어</h4>
            <button
              style={modalStyles.toggleButton}
              onClick={() => {
                onToggle(controlData.tier, controlData.side, controlData.type);
                onClose();
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {controlData.isActive ? `${systemName} 끄기` : `${systemName} 켜기`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to create a zone mesh
function createZoneMesh(id: string, sizeX: number, sizeY: number, sizeZ: number, posX: number, posY: number, posZ: number, currentSelectedZoneId: string | null) {
  const zoneMaterial = new THREE.MeshStandardMaterial({
    color: id === currentSelectedZoneId ? SELECTED_ZONE_COLOR : DEFAULT_ZONE_COLOR,
    transparent: true,
    opacity: ZONE_OPACITY,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.2,
  });

  const zoneGeometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
  const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
  // 구역의 position_y는 BoxGeometry의 중심이므로, (바닥 y + 높이/2)
  zoneMesh.position.set(posX, posY + sizeY / 2, posZ);
  zoneMesh.name = `zone-${id}`;
  zoneMesh.userData = { type: 'zone', zoneId: id };
  zoneMesh.castShadow = true; // Zones can cast shadows
  // zoneMesh.receiveShadow = true; // Zones can also receive shadows
  return zoneMesh;
}


interface FarmModelProps {
  scene: THREE.Scene;
  zones: FarmZone[];
  selectedZoneId: string | null;
  camera: THREE.Camera; // 카메라 prop 추가
  cameraUpdateTrigger?: number; // 카메라 업데이트 트리거
  viewMode?: 'plant' | 'zone'; // 보기 모드
  onZoneClick?: (zoneId: string | null) => void;
  onSensorClick?: (sensorId: string) => void;
}

// ... 기존 상수들 ...

interface ZoneButtonProps {
  id: string;
  name: string; // 구역 이름 (예: "floor-1-A")
  x: number;    // 화면 X 좌표
  y: number;    // 화면 Y 좌표
  visible: boolean; // 화면에 보이는지 여부
  zoneData: FarmZone; // 해당 구역의 전체 데이터 (센서 정보 포함)
}

interface PlantSensorButtonProps {
  id: string;
  plantType: string;
  growthStage: string;
  healthStatus: string;
  x: number;
  y: number;
  visible: boolean;
  position: { row: number; col: number };
  zoneId: string;
}

interface ControlIconProps {
  id: string;
  type: 'lighting' | 'irrigation';
  tier: number;
  side: number;
  x: number;
  y: number;
  visible: boolean;
  isActive: boolean;
}

const DEFAULT_ZONE_COLOR = 0x007bff; // Blue - Can be changed to a more earthy tone
const SELECTED_ZONE_COLOR = 0x28a745; // Green
const ZONE_OPACITY = 0.5; // Slightly increased opacity for better visibility
const GROUND_COLOR = 0x8B4513; // Brown for soil, or 0x228B22 for grass
const SKY_COLOR = 0xc8e6c9; // Natural light green - 농장 환경에 어울리는 연한 녹색

// Simplified Greenhouse Model Constants
const GREENHOUSE_WIDTH = 3.5; // X-axis (across gable end)
const GREENHOUSE_DEPTH = 5; // Z-axis (along ridge/eaves)
const GREENHOUSE_WALL_HEIGHT = 2.5; // Y-axis for vertical walls
const GREENHOUSE_ROOF_PEAK_ADD_HEIGHT = 0.8; // Additional height from wall top to roof peak (adjusted for a slightly steeper roof than 0.7)
const FRAME_THICKNESS = 0.08;
const FRAME_COLOR = 0xC0C0C0; // Silver

const WALL_MATERIAL_COLOR = 0xADD8E6; // Light blueish for glass/acrylic tint
const WALL_OPACITY = 0.2;

const BASE_PLATFORM_HEIGHT = 0.15;
const BASE_PLATFORM_COLOR = 0xAAAAAA; // Grey for base
const greenhouseInitialYOffset = BASE_PLATFORM_HEIGHT;

// const PIPE_RADIUS = 0.15;
// const PIPE_COLOR = 0xEAEAEA; // Lighter grey for pipes
// const PIPE_SEGMENTS = 16;
// const pipeMaterial = new THREE.MeshStandardMaterial({ color: PIPE_COLOR, roughness: 0.3, metalness: 0.1 });
const FAN_COLOR = 0x555555;           // Dark grey for fans (used for fanBodyMaterial if specific not set)
const FAN_FRAME_COLOR = 0x666666;     // Slightly different grey for frame
const FAN_BLADE_COLOR = 0x444444;     // Darker grey for blades
const FAN_FRAME_SIZE = 0.4;
const FAN_FRAME_THICKNESS = 0.05;
const FAN_BODY_RADIUS = 0.15;
const FAN_BODY_DEPTH = 0.1;
const FAN_BLADE_HEIGHT = 0.02; // Renamed from FAN_BLADE_WIDTH for clarity with BoxGeometry
const FAN_BLADE_THICKNESS = 0.01; // Thickness of the blade
const NUM_FAN_BLADES = 4;
const FAN_SPACING_X = GREENHOUSE_WIDTH / 3; // Adjust as needed for 2 fans
const FAN_SPACING_Y = 0.6; // Vertical spacing between fans in a 2x2 grid
const GABLE_Y_OFFSET = -1.35; // Fine-tune Y position of fans on gable (top of fan assembly at gable base)
const GABLE_Z_OFFSET_FAN = FRAME_THICKNESS / 2 + FAN_FRAME_THICKNESS / 2; // Offset from gable wall surface

// Pipe Tier (Growing Bed) Constants
const NUM_PIPE_TIERS = 3;
const PIPE_TIER_INITIAL_Y_OFFSET = 0.5; // Height of the first tier from the greenhouse base platform
const PIPE_TIER_SPACING_Y = 0.7;      // Vertical spacing between tiers
const PIPE_TIER_DEPTH_RATIO = 0.9;    // Percentage of greenhouse depth
const PIPE_TIER_WIDTH_RATIO = 0.85;   // Percentage of greenhouse width
const PIPE_TIER_THICKNESS = 0.2;      // Thickness of the soil/bed
const PIPE_TIER_COLOR = 0x964B00;     // Brown color for soil/beds
const PIPE_TIER_AISLE_WIDTH = 0.15;   // Width of the aisle between A and B sections of a tier
const PIPE_TIER_RETAINING_WALL_THICKNESS = 0.05;
const PIPE_TIER_RETAINING_WALL_HEIGHT = PIPE_TIER_THICKNESS + 0.02; // Slightly taller than soil
const PIPE_TIER_RETAINING_WALL_COLOR = 0xCCCCCC; // Light grey

// Support Columns for Pipe Tiers
const SUPPORT_COLUMN_RADIUS = 0.03;
const SUPPORT_COLUMN_COLOR = 0x888888; // Grey, similar to frame
const SUPPORT_COLUMN_SEGMENTS = 12;

// Plant Constants
const PLANT_COLORS = {
  lettuce: { leaf: 0x32CD32, stem: 0x228B22, dark: 0x228B22 },  // 상추
  spinach: { leaf: 0x228B22, stem: 0x1F5F1F, dark: 0x0F3F0F },  // 시금치
  kale: { leaf: 0x006400, stem: 0x004100, dark: 0x002100 },     // 케일
  arugula: { leaf: 0x9ACD32, stem: 0x6B8B23, dark: 0x556B2F },  // 루꼴라
  basil: { leaf: 0x8FBC8F, stem: 0x6B8B23, dark: 0x2E4B28 },    // 바질
  mint: { leaf: 0x90EE90, stem: 0x6B8B23, dark: 0x32CD32 }      // 민트
};

const PLANT_BASE_HEIGHT = 0.08;
const PLANTS_PER_ROW = 4; // 6에서 4로 감소
const PLANTS_PER_COLUMN = 4; // 6에서 4로 감소

// 식물별 최적 환경 조건
const PLANT_OPTIMAL_CONDITIONS = {
  lettuce: { // 상추
    temperature: { min: 15, max: 22, optimal: 18 },
    humidity: { min: 60, max: 80, optimal: 70 },
    soilMoisture: { min: 65, max: 85, optimal: 75 },
    phLevel: { min: 6.0, max: 7.0, optimal: 6.5 },
    lightIntensity: { min: 150, max: 300, optimal: 200 }
  },
  spinach: { // 시금치
    temperature: { min: 13, max: 20, optimal: 16 },
    humidity: { min: 65, max: 85, optimal: 75 },
    soilMoisture: { min: 70, max: 90, optimal: 80 },
    phLevel: { min: 6.0, max: 7.5, optimal: 6.8 },
    lightIntensity: { min: 120, max: 250, optimal: 180 }
  },
  kale: { // 케일
    temperature: { min: 16, max: 24, optimal: 20 },
    humidity: { min: 60, max: 80, optimal: 70 },
    soilMoisture: { min: 60, max: 80, optimal: 70 },
    phLevel: { min: 6.0, max: 7.5, optimal: 6.5 },
    lightIntensity: { min: 200, max: 400, optimal: 300 }
  },
  arugula: { // 루꼴라
    temperature: { min: 14, max: 21, optimal: 17 },
    humidity: { min: 55, max: 75, optimal: 65 },
    soilMoisture: { min: 55, max: 75, optimal: 65 },
    phLevel: { min: 6.0, max: 7.0, optimal: 6.3 },
    lightIntensity: { min: 150, max: 280, optimal: 220 }
  },
  basil: { // 바질
    temperature: { min: 20, max: 28, optimal: 24 },
    humidity: { min: 50, max: 70, optimal: 60 },
    soilMoisture: { min: 50, max: 70, optimal: 60 },
    phLevel: { min: 6.0, max: 7.5, optimal: 6.8 },
    lightIntensity: { min: 250, max: 500, optimal: 350 }
  },
  mint: { // 민트
    temperature: { min: 18, max: 25, optimal: 21 },
    humidity: { min: 70, max: 90, optimal: 80 },
    soilMoisture: { min: 75, max: 95, optimal: 85 },
    phLevel: { min: 6.0, max: 7.0, optimal: 6.5 },
    lightIntensity: { min: 200, max: 350, optimal: 275 }
  }
};

// 현실적인 센서 데이터 생성 함수
function generateRealisticSensorData(plantType: keyof typeof PLANT_OPTIMAL_CONDITIONS, tier: number, position: { row: number; col: number }) {
  const conditions = PLANT_OPTIMAL_CONDITIONS[plantType];
  
  // 위치 기반 변화 (가장자리는 약간 다른 조건)
  const edgeEffect = (position.row === 0 || position.row === 3 || position.col === 0 || position.col === 3) ? 0.05 : 0;
  
  // 층별 효과 (위층일수록 조금 더 따뜻하고 건조)
  const tierEffect = tier * 0.02;
  
  // 현실적인 범위 내에서 랜덤 생성
  const temperature = conditions.temperature.optimal + (Math.random() - 0.5) * 4 + tierEffect + edgeEffect * 2;
  const humidity = conditions.humidity.optimal + (Math.random() - 0.5) * 10 - tierEffect * 5 + edgeEffect * 3;
  const soilMoisture = conditions.soilMoisture.optimal + (Math.random() - 0.5) * 15 + edgeEffect * 5;
  const phLevel = conditions.phLevel.optimal + (Math.random() - 0.5) * 0.4;
  const lightIntensity = conditions.lightIntensity.optimal + (Math.random() - 0.5) * 50;
  
  return {
    temperature: Math.max(10, Math.min(35, temperature)), // 10-35도 범위
    humidity: Math.max(30, Math.min(95, humidity)), // 30-95% 범위
    soilMoisture: Math.max(20, Math.min(100, soilMoisture)), // 20-100% 범위
    phLevel: Math.max(5.5, Math.min(8.0, phLevel)), // 5.5-8.0 범위
    lightIntensity: Math.max(50, Math.min(600, lightIntensity)) // 50-600 lux 범위
  };
}

// 센서 데이터를 기반으로 식물 건강 상태 평가
function evaluatePlantHealth(plantType: keyof typeof PLANT_OPTIMAL_CONDITIONS, sensorData: any): 'healthy' | 'stressed' | 'sick' | 'dead' {
  const conditions = PLANT_OPTIMAL_CONDITIONS[plantType];
  let healthScore = 100;
  
  // 각 조건별 건강도 평가
  const factors = [
    { value: sensorData.temperature, range: conditions.temperature },
    { value: sensorData.humidity, range: conditions.humidity },
    { value: sensorData.soilMoisture, range: conditions.soilMoisture },
    { value: sensorData.phLevel, range: conditions.phLevel },
    { value: sensorData.lightIntensity, range: conditions.lightIntensity }
  ];
  
  factors.forEach(factor => {
    if (factor.value < factor.range.min || factor.value > factor.range.max) {
      // 범위를 벗어난 경우 큰 감점
      const deviation = Math.min(
        Math.abs(factor.value - factor.range.min),
        Math.abs(factor.value - factor.range.max)
      );
      healthScore -= deviation * 3;
    } else {
      // 범위 내에서도 최적값과의 차이에 따라 감점
      const optimalDeviation = Math.abs(factor.value - factor.range.optimal);
      const maxDeviation = Math.max(
        factor.range.optimal - factor.range.min,
        factor.range.max - factor.range.optimal
      );
      healthScore -= (optimalDeviation / maxDeviation) * 10;
    }
  });
  
  // 건강 상태 결정
  if (healthScore >= 80) return 'healthy';
  if (healthScore >= 60) return 'stressed';
  if (healthScore >= 30) return 'sick';
  return 'dead';
}

// 건강 상태에 따른 성장 단계 조정
function adjustGrowthStage(baseGrowthStage: string, healthStatus: 'healthy' | 'stressed' | 'sick' | 'dead'): string {
  if (healthStatus === 'dead') return 'dead';
  if (healthStatus === 'sick' && Math.random() > 0.7) return 'dead';
  if (healthStatus === 'stressed' && baseGrowthStage === 'harvest') return 'mature';
  return baseGrowthStage;
}

// Plant creation helper function
function createRealisticPlant(
  plantType: keyof typeof PLANT_COLORS, 
  growthStage: 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead' = 'mature',
  healthStatus: 'healthy' | 'stressed' | 'sick' | 'dead' = 'healthy',
  sizeMultiplier: number = 1.0
): THREE.Group {
  const plantGroup = new THREE.Group();
  const colors = PLANT_COLORS[plantType];
  
  // 성장 단계별 크기 조정
  const stageMultipliers = {
    seed: 0.1,
    sprout: 0.3,
    growing: 0.7,
    mature: 1.0,
    harvest: 1.2,
    dead: 0.8
  };
  
  const finalSize = stageMultipliers[growthStage] * sizeMultiplier;
  
  // 건강 상태별 색상 조정
  let healthColorModifier = { r: 1, g: 1, b: 1 };
  switch (healthStatus) {
    case 'stressed':
      healthColorModifier = { r: 1, g: 0.9, b: 0.7 }; // 약간 노랗게
      break;
    case 'sick':
      healthColorModifier = { r: 1, g: 0.7, b: 0.5 }; // 갈색으로
      break;
    case 'dead':
      healthColorModifier = { r: 0.4, g: 0.3, b: 0.2 }; // 갈색/검은색으로
      break;
  }
  
  // 건강 상태를 반영한 재료
  const applyHealthColor = (originalColor: number) => {
    const color = new THREE.Color(originalColor);
    color.r *= healthColorModifier.r;
    color.g *= healthColorModifier.g;
    color.b *= healthColorModifier.b;
    return color.getHex();
  };
  
  // Stem material
  const stemMaterial = new THREE.MeshStandardMaterial({
    color: applyHealthColor(colors.stem),
    roughness: 0.8,
    metalness: 0.1,
  });
  
  // Leaf materials
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: applyHealthColor(colors.leaf),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  
  const darkLeafMaterial = new THREE.MeshStandardMaterial({
    color: applyHealthColor(colors.dark),
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  
  // 성장 단계별 줄기 생성
  if (growthStage !== 'seed') {
    const stemHeight = PLANT_BASE_HEIGHT * 0.6 * finalSize;
    const stemGeometry = new THREE.CylinderGeometry(0.005 * finalSize, 0.008 * finalSize, stemHeight, 6);
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = stemHeight * 0.5;
    plantGroup.add(stem);
  }
  
  // 성장 단계별 처리
  if (growthStage === 'seed') {
    // 씨앗 단계 - 작은 갈색 구
    const seedGeometry = new THREE.SphereGeometry(0.008 * finalSize, 6, 4);
    const seedMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // 갈색
      roughness: 0.9,
      metalness: 0.1,
    });
    const seed = new THREE.Mesh(seedGeometry, seedMaterial);
    seed.position.y = 0.005;
    plantGroup.add(seed);
    return plantGroup;
  }
  
  if (growthStage === 'sprout') {
    // 새싹 단계 - 작은 줄기와 초기 잎 1-2개
    const leafCount = 2;
    for (let i = 0; i < leafCount; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.01 * finalSize, 6, 4);
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      const angle = (i / leafCount) * Math.PI * 2;
      leaf.position.x = Math.cos(angle) * 0.008;
      leaf.position.z = Math.sin(angle) * 0.008;
      leaf.position.y = PLANT_BASE_HEIGHT * 0.4 * finalSize;
      leaf.rotation.y = angle;
      plantGroup.add(leaf);
    }
    return plantGroup;
  }
  
  // Create leaves based on plant type (growing, mature, harvest 단계)
  const leafCountMultiplier = growthStage === 'growing' ? 0.7 : 1.0;
  
  switch (plantType) {
    case 'lettuce':
      // 상추 - 둥근 잎들이 로제트 형태로
      const lettuceLeafCount = Math.floor(8 * leafCountMultiplier);
      for (let i = 0; i < lettuceLeafCount; i++) {
        const leafGeometry = new THREE.SphereGeometry(0.025 * finalSize, 8, 6);
        leafGeometry.scale(1, 0.3, 1.5); // 납작하고 길쭉한 형태
        const leaf = new THREE.Mesh(leafGeometry, i % 2 === 0 ? leafMaterial : darkLeafMaterial);
        const angle = (i / lettuceLeafCount) * Math.PI * 2;
        const radius = (0.02 + (i % 3) * 0.01) * finalSize;
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = PLANT_BASE_HEIGHT * 0.5 * finalSize + (i % 2) * 0.01 * finalSize;
        leaf.rotation.y = angle;
        leaf.rotation.x = Math.random() * 0.3 - 0.15;
        plantGroup.add(leaf);
      }
      break;
      
    case 'spinach':
      // 시금치 - 긴 타원형 잎들
      const spinachLeafCount = Math.floor(6 * leafCountMultiplier);
      for (let i = 0; i < spinachLeafCount; i++) {
        const leafGeometry = new THREE.SphereGeometry(0.02 * finalSize, 8, 6);
        leafGeometry.scale(0.8, 0.2, 2); // 길고 좁은 형태
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / spinachLeafCount) * Math.PI * 2;
        const radius = 0.015 * finalSize;
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = PLANT_BASE_HEIGHT * 0.6 * finalSize;
        leaf.rotation.y = angle;
        leaf.rotation.x = -0.2;
        plantGroup.add(leaf);
      }
      break;
      
    case 'kale':
      // 케일 - 큰 주름진 잎들
      const kaleLeafCount = Math.floor(7 * leafCountMultiplier);
      for (let i = 0; i < kaleLeafCount; i++) {
        const leafGeometry = new THREE.SphereGeometry(0.03 * finalSize, 8, 8);
        leafGeometry.scale(1.2, 0.3, 1.8); // 크고 주름진 형태
        const leaf = new THREE.Mesh(leafGeometry, i % 3 === 0 ? darkLeafMaterial : leafMaterial);
        const angle = (i / kaleLeafCount) * Math.PI * 2;
        const radius = 0.02 * finalSize;
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = PLANT_BASE_HEIGHT * 0.6 * finalSize + (i % 2) * 0.015 * finalSize;
        leaf.rotation.y = angle + Math.random() * 0.5;
        leaf.rotation.x = Math.random() * 0.4 - 0.2;
        leaf.rotation.z = Math.random() * 0.3 - 0.15;
        plantGroup.add(leaf);
      }
      break;
      
    case 'arugula':
      // 루꼴라 - 깊게 갈라진 잎들
      const arugulaLeafCount = Math.floor(10 * leafCountMultiplier);
      for (let i = 0; i < arugulaLeafCount; i++) {
        const leafGeometry = new THREE.ConeGeometry(0.015 * finalSize, 0.04 * finalSize, 6);
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / arugulaLeafCount) * Math.PI * 2;
        const radius = (0.01 + (i % 3) * 0.005) * finalSize;
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = PLANT_BASE_HEIGHT * 0.65 * finalSize;
        leaf.rotation.y = angle;
        leaf.rotation.x = Math.random() * 0.6 - 0.3;
        plantGroup.add(leaf);
      }
      break;
      
    case 'basil':
      // 바질 - 작은 타원형 잎들
      const basilLeafCount = Math.floor(12 * leafCountMultiplier);
      for (let i = 0; i < basilLeafCount; i++) {
        const leafGeometry = new THREE.SphereGeometry(0.015 * finalSize, 6, 6);
        leafGeometry.scale(1, 0.3, 1.5);
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / 6) * Math.PI * 2;
        const layer = Math.floor(i / 6);
        const radius = (0.015 + layer * 0.01) * finalSize;
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = PLANT_BASE_HEIGHT * (0.5 + layer * 0.2) * finalSize;
        leaf.rotation.y = angle;
        plantGroup.add(leaf);
      }
      break;
      
    case 'mint':
      // 민트 - 톱니 모양 잎들
      const mintLeafCount = Math.floor(8 * leafCountMultiplier);
      for (let i = 0; i < mintLeafCount; i++) {
        const leafGeometry = new THREE.BoxGeometry(0.025 * finalSize, 0.005 * finalSize, 0.035 * finalSize);
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / 4) * Math.PI * 2;
        const layer = Math.floor(i / 4);
        const radius = 0.018 * finalSize;
        leaf.position.x = Math.cos(angle) * radius;
        leaf.position.z = Math.sin(angle) * radius;
        leaf.position.y = PLANT_BASE_HEIGHT * (0.5 + layer * 0.3) * finalSize;
        leaf.rotation.y = angle;
        leaf.rotation.x = Math.random() * 0.3 - 0.15;
        plantGroup.add(leaf);
      }
      break;
  }
  
  return plantGroup;
}


export const FarmModel: React.FC<FarmModelProps> = ({
  scene,
  zones,
  selectedZoneId,
  camera,
  cameraUpdateTrigger,
  viewMode = 'plant', // 기본값은 식물별 보기
  // onZoneClick, // Not directly used in FarmModel, handled by FarmViewer
  // onSensorClick // Not directly used in FarmModel, handled by FarmViewer
}) => {
  const rootModelGroupRef = useRef<THREE.Group>(new THREE.Group()); // Root group for scaling
  const farmGroupRef = useRef<THREE.Group>(new THREE.Group());
  const zoneGroupRef = useRef<THREE.Group>(new THREE.Group());
  const sensorGroupRef = useRef<THREE.Group>(new THREE.Group());
  const lightsGroupRef = useRef<THREE.Group>(new THREE.Group()); // Group for lights

  const [zoneButtonProps, setZoneButtonProps] = useState<ZoneButtonProps[]>([]); // 버튼 상태 추가
  const [plantSensorButtons, setPlantSensorButtons] = useState<PlantSensorButtonProps[]>([]); // 식물 센서 버튼 상태
  const [selectedZoneForModal, setSelectedZoneForModal] = useState<FarmZone | null>(null); // 모달용 선택된 구역 상태
  const [selectedPlantForModal, setSelectedPlantForModal] = useState<PlantSensorButtonProps | null>(null); // 모달용 선택된 식물 상태
  const [controlIcons, setControlIcons] = useState<ControlIconProps[]>([]); // 제어 아이콘 상태
  const [selectedControlForModal, setSelectedControlForModal] = useState<ControlIconProps | null>(null); // 제어 모달 상태
  
  // 제어 시스템 토글 함수
  const handleControlToggle = useCallback((tier: number, side: number, type: 'lighting' | 'irrigation') => {
    if (type === 'lighting') {
      // LED 조명 상태 변경
      farmGroupRef.current.traverse((object) => {
        if (object.userData.type === 'led-chip' && 
            object.userData.tier === tier && 
            object.userData.side === side) {
          const newState = !object.userData.isOn;
          object.userData.isOn = newState;
          
          // LED 재질 변경 (향상된 시각적 구분)
          if (object instanceof THREE.Mesh) {
            const ledLightOnMaterial = new THREE.MeshStandardMaterial({ 
              color: 0xffffdd, 
              emissive: 0xffdd44,
              emissiveIntensity: 1.2,
              metalness: 0.1, 
              roughness: 0.1 
            });
            
            const ledLightOffMaterial = new THREE.MeshStandardMaterial({ 
              color: 0x222222, 
              emissive: 0x000000,
              emissiveIntensity: 0.0,
              metalness: 0.5, 
              roughness: 0.8 
            });
            
            object.material = newState ? ledLightOnMaterial : ledLightOffMaterial;
          }
        }
        
        // 실제 조명도 토글
        if (object.userData.type === 'led-light' && 
            object.userData.tier === tier && 
            object.userData.side === side) {
          const newState = !object.userData.isOn;
          object.userData.isOn = newState;
          if (object instanceof THREE.SpotLight) {
            object.intensity = newState ? 0.8 : 0;
          }
        }
      });
    } else {
      // 급수 시스템 상태 변경
      farmGroupRef.current.traverse((object) => {
        if (object.userData.type === 'irrigation-nozzle' && 
            object.userData.tier === tier && 
            object.userData.side === side) {
          object.userData.isActive = !object.userData.isActive;
        }
      });
    }
    
    console.log(`${type} 시스템 토글: ${tier + 1}층 ${side === 0 ? 'A' : 'B'}구역`);
  }, []);
  
  // 카메라 위치 업데이트를 위한 애니메이션 루프
  const updateButtonPositions = useCallback(() => {
    if (!camera || !farmGroupRef.current || !zoneGroupRef.current) return;
    
    // 실제 캔버스 크기 가져오기
    const canvas = document.querySelector('canvas');
    const canvasWidth = canvas?.clientWidth || window.innerWidth;
    const canvasHeight = canvas?.clientHeight || window.innerHeight;

    // 구역 버튼 위치 업데이트
    const newButtonProps: ZoneButtonProps[] = [];
    zoneGroupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.userData.type === 'zone') {
        const zoneMesh = child;
        const zoneId = zoneMesh.userData.zoneId as string;
        const farmZoneData = zones.find(z => z.id === zoneId);

        if (farmZoneData) {
          const worldPosition = new THREE.Vector3();
          zoneMesh.getWorldPosition(worldPosition);
          const screenPosition = worldPosition.clone().project(camera);
          const x = (screenPosition.x + 1) / 2 * canvasWidth;
          const y = (-screenPosition.y + 1) / 2 * canvasHeight;
          const visible = screenPosition.z < 1 && x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;

          newButtonProps.push({
            id: zoneId,
            name: farmZoneData.name || zoneId,
            x, y, visible,
            zoneData: farmZoneData,
          });
        }
      }
    });
    setZoneButtonProps(newButtonProps);

    // 식물 센서 버튼 위치 업데이트
    const newPlantSensorButtons: PlantSensorButtonProps[] = [];
    
    // rootModelGroupRef를 통해 스케일링이 적용된 식물들을 찾기
    rootModelGroupRef.current.traverse(child => {
      if (child instanceof THREE.Group && child.userData.type === 'plant') {
        const plantGroup = child;
        const userData = plantGroup.userData;
        
        // 식물의 실제 월드 위치 계산 (스케일링 포함)
        const worldPosition = new THREE.Vector3();
        plantGroup.getWorldPosition(worldPosition);
        
        // 센서 아이콘을 식물 위 약간 위쪽에 배치
        const sensorPosition = worldPosition.clone();
        sensorPosition.y += 0.3; // 스케일링 고려하여 더 높게 설정
        
        const screenPosition = sensorPosition.clone().project(camera);
        
        // NDC 좌표를 화면 좌표로 변환
        const x = (screenPosition.x + 1) / 2 * canvasWidth;
        const y = (-screenPosition.y + 1) / 2 * canvasHeight;
        
        // 가시성 체크 (카메라 앞쪽이고 화면 내부에 있는지)
        const visible = screenPosition.z < 1 && screenPosition.z > -1 && 
                       x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
        
        newPlantSensorButtons.push({
          id: plantGroup.name,
          plantType: userData.plantType,
          growthStage: userData.growthStage,
          healthStatus: userData.healthStatus,
          x, y, visible,
          position: userData.position,
          zoneId: userData.zoneId
        });
      }
    });
    setPlantSensorButtons(newPlantSensorButtons);

    // 제어 아이콘 위치 업데이트 (LED 조명과 급수 시스템)
    const newControlIcons: ControlIconProps[] = [];
    
    // LED 조명 제어 아이콘들
    farmGroupRef.current.traverse((object) => {
      if (object.userData.type === 'led-chip') {
        const { tier, side, row, col, isOn } = object.userData;
        
        // LED 그리드의 중앙 위치만 표시 (2x3 그리드에서 중앙)
        if (row === 0 && col === 1) { // 중앙 LED만 아이콘 표시
          const worldPosition = new THREE.Vector3();
          object.getWorldPosition(worldPosition);
          
          // 아이콘을 LED 위쪽에 표시하기 위해 Y 좌표 조정
          worldPosition.y += 0.1;
          
          const screenPosition = worldPosition.clone().project(camera);
          
          const x = (screenPosition.x + 1) / 2 * canvasWidth;
          const y = (-screenPosition.y + 1) / 2 * canvasHeight;
          const visible = screenPosition.z < 1 && x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
          
          newControlIcons.push({
            id: `lighting-${tier}-${side}`,
            type: 'lighting',
            tier,
            side,
            x, y, visible,
            isActive: isOn
          });
        }
      }
    });

    // 급수 시스템 제어 아이콘들
    farmGroupRef.current.traverse((object) => {
      if (object.userData.type === 'irrigation-nozzle') {
        const { tier, side, nozzleIndex, isActive } = object.userData;
        
        const worldPosition = new THREE.Vector3();
        object.getWorldPosition(worldPosition);
        const screenPosition = worldPosition.clone().project(camera);
        
        const x = (screenPosition.x + 1) / 2 * canvasWidth;
        const y = (-screenPosition.y + 1) / 2 * canvasHeight;
        const visible = screenPosition.z < 1 && x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
        
        // 각 베드의 중앙 노즐만 표시 (모든 노즐이 아닌)
        if (nozzleIndex === 2) { // 중앙 노즐만 아이콘 표시
          newControlIcons.push({
            id: `irrigation-${tier}-${side}`,
            type: 'irrigation',
            tier,
            side,
            x, y, visible,
            isActive
          });
        }
      }
    });

    setControlIcons(newControlIcons);
  }, [camera, zones]);

  // Add main groups and basic scene setup
  useEffect(() => {
    // Add individual groups to the root model group
    rootModelGroupRef.current.add(farmGroupRef.current);
    rootModelGroupRef.current.add(zoneGroupRef.current);
    rootModelGroupRef.current.add(sensorGroupRef.current);
    rootModelGroupRef.current.add(lightsGroupRef.current);

    // Add the root model group to the scene
    scene.add(rootModelGroupRef.current);

    // Scale the root model group
    const scaleFactor = 4.5; // Adjust this value to make the model larger or smaller
    rootModelGroupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);


    // Sky - 농장 환경에 어울리는 연한 녹색 배경
    scene.background = new THREE.Color(SKY_COLOR);

    // Ground Plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500); // Adjust size as needed
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: GROUND_COLOR,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    groundMesh.position.y = -0.05; // Slightly below origin to avoid z-fighting with models at y=0
    groundMesh.receiveShadow = true; // Allow ground to receive shadows
    // Add ground directly to the scene or to a non-scaled group if it shouldn't be scaled
    // For now, adding to farmGroup, so it will be scaled. If ground should not scale, add to scene directly.
    farmGroupRef.current.add(groundMesh);


    // Lighting
    if (lightsGroupRef.current) {
      lightsGroupRef.current.clear(); // Clear previous lights
    }
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    lightsGroupRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Simulates sunlight
    directionalLight.position.set(20, 30, 20); // Adjust position for desired shadow direction
    directionalLight.castShadow = true;
    // 그림자 품질 최적화: 맵 크기 감소로 성능 향상
    directionalLight.shadow.mapSize.width = 512;  // 1024에서 512로 감소
    directionalLight.shadow.mapSize.height = 512; // 1024에서 512로 감소
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    lightsGroupRef.current.add(directionalLight);


    return () => {
      // Remove the root model group from the scene
      scene.remove(rootModelGroupRef.current);
      scene.background = null; // Reset background

      // Dispose of geometries and materials within the rootModelGroup
      if (rootModelGroupRef.current) {
        rootModelGroupRef.current.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          } else if (object instanceof THREE.Sprite && object.material) {
            object.material.dispose();
            if (object.material.map) {
              object.material.map.dispose();
            }
          }
          // Lights are part of the group and will be removed with it.
          // Their specific disposal is usually not needed unless they hold complex resources.
        });
        // Clear all children from the groups.
        // The individual groups (farmGroupRef, zoneGroupRef, etc.) are children of rootModelGroupRef.
        // Clearing rootModelGroupRef will also handle them if they are properly managed.
        // However, to be safe and explicit, we can clear them individually if they might hold other direct refs.
        // For simplicity, clearing the root should be enough if all objects are added to it or its children.
        farmGroupRef.current.clear();
        zoneGroupRef.current.clear();
        sensorGroupRef.current.clear();
        lightsGroupRef.current.clear();
        rootModelGroupRef.current.clear(); // Clear the root group itself
      }
    };
  }, [scene]); // Only re-run if scene changes

  // 1. Create Simplified Greenhouse Structure
  useEffect(() => {
    // Cleanup previous structure (floors, old farm model, or previous greenhouse)
    const namesToClean = ["farmFloor", "farmStructure", "greenhousePart", "greenhouseStructure"];
    const objectsToRemove: THREE.Object3D[] = [];
    farmGroupRef.current.children.forEach(child => {
      if (namesToClean.includes(child.name)) {
        objectsToRemove.push(child);
      }
    });
    objectsToRemove.forEach(child => {
      farmGroupRef.current.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Group) { // Also clean groups
        child.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else if (obj.material) {
                    obj.material.dispose();
                }
            }
        });
      }
    });
    farmGroupRef.current.clear(); // Ensure farmGroup is empty before adding new structure

    const greenhouseGroup = new THREE.Group();
    greenhouseGroup.name = "greenhouseStructure";

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: FRAME_COLOR,
      metalness: 0.7,
      roughness: 0.5,
      side: THREE.DoubleSide
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: WALL_MATERIAL_COLOR,
      transparent: true,
      opacity: WALL_OPACITY,
      side: THREE.DoubleSide,
    });

    // Base platform
    const basePlatformGeo = new THREE.BoxGeometry(GREENHOUSE_WIDTH + FRAME_THICKNESS * 4, BASE_PLATFORM_HEIGHT, GREENHOUSE_DEPTH + FRAME_THICKNESS * 4);
    const basePlatformMat = new THREE.MeshStandardMaterial({ color: BASE_PLATFORM_COLOR, roughness: 0.8 });
    const basePlatformMesh = new THREE.Mesh(basePlatformGeo, basePlatformMat);
    basePlatformMesh.position.y = BASE_PLATFORM_HEIGHT / 2;
    basePlatformMesh.receiveShadow = true;
    basePlatformMesh.name = "greenhousePart";
    greenhouseGroup.add(basePlatformMesh);

    const totalRoofPeakY = GREENHOUSE_WALL_HEIGHT + GREENHOUSE_ROOF_PEAK_ADD_HEIGHT + greenhouseInitialYOffset;

    // Helper to create frame beams
    const createBeam = (size: THREE.Vector3, position: THREE.Vector3, rotation?: THREE.Euler) => {
      const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
      const beam = new THREE.Mesh(geo, frameMaterial);
      beam.position.copy(position);
      if (rotation) beam.rotation.copy(rotation);
      beam.castShadow = true;
      beam.name = "greenhousePart";
      return beam;
    };

    // Vertical Posts (4 corners)
    const postHeight = GREENHOUSE_WALL_HEIGHT;
    const halfWidth = GREENHOUSE_WIDTH / 2;
    const halfDepth = GREENHOUSE_DEPTH / 2;
    const postY = (postHeight / 2) + greenhouseInitialYOffset;
    const postPositions = [
      new THREE.Vector3(-halfWidth, postY, -halfDepth),
      new THREE.Vector3(halfWidth, postY, -halfDepth),
      new THREE.Vector3(-halfWidth, postY, halfDepth),
      new THREE.Vector3(halfWidth, postY, halfDepth),
    ];
    postPositions.forEach(pos => greenhouseGroup.add(createBeam(new THREE.Vector3(FRAME_THICKNESS, postHeight, FRAME_THICKNESS), pos)));

    // Base Beams (Perimeter of greenhouse floor)
    const baseBeamY = (FRAME_THICKNESS / 2) + greenhouseInitialYOffset;
    greenhouseGroup.add(createBeam(new THREE.Vector3(GREENHOUSE_WIDTH, FRAME_THICKNESS, FRAME_THICKNESS), new THREE.Vector3(0, baseBeamY, -halfDepth)));
    greenhouseGroup.add(createBeam(new THREE.Vector3(GREENHOUSE_WIDTH, FRAME_THICKNESS, FRAME_THICKNESS), new THREE.Vector3(0, baseBeamY, halfDepth)));
    greenhouseGroup.add(createBeam(new THREE.Vector3(FRAME_THICKNESS, FRAME_THICKNESS, GREENHOUSE_DEPTH), new THREE.Vector3(-halfWidth, baseBeamY, 0)));
    greenhouseGroup.add(createBeam(new THREE.Vector3(FRAME_THICKNESS, FRAME_THICKNESS, GREENHOUSE_DEPTH), new THREE.Vector3(halfWidth, baseBeamY, 0)));

    // Top Wall Beams (Eaves)
    const topWallBeamY = (GREENHOUSE_WALL_HEIGHT - FRAME_THICKNESS / 2) + greenhouseInitialYOffset;
    greenhouseGroup.add(createBeam(new THREE.Vector3(GREENHOUSE_WIDTH, FRAME_THICKNESS, FRAME_THICKNESS), new THREE.Vector3(0, topWallBeamY, -halfDepth)));
    greenhouseGroup.add(createBeam(new THREE.Vector3(GREENHOUSE_WIDTH, FRAME_THICKNESS, FRAME_THICKNESS), new THREE.Vector3(0, topWallBeamY, halfDepth)));
    greenhouseGroup.add(createBeam(new THREE.Vector3(FRAME_THICKNESS, FRAME_THICKNESS, GREENHOUSE_DEPTH), new THREE.Vector3(-halfWidth, topWallBeamY, 0)));
    greenhouseGroup.add(createBeam(new THREE.Vector3(FRAME_THICKNESS, FRAME_THICKNESS, GREENHOUSE_DEPTH), new THREE.Vector3(halfWidth, topWallBeamY, 0)));

    // Roof Ridge Beam
    greenhouseGroup.add(createBeam(new THREE.Vector3(FRAME_THICKNESS, FRAME_THICKNESS, GREENHOUSE_DEPTH), new THREE.Vector3(0, totalRoofPeakY - FRAME_THICKNESS / 2, 0)));

    // Roof Rafters (Multiple along the depth)
    const numRafterPairs = Math.floor(GREENHOUSE_DEPTH / 1) + 1; // Approx 1 rafter pair per unit depth
    const rafterSpacing = GREENHOUSE_DEPTH / (numRafterPairs -1);
    const eaveY = GREENHOUSE_WALL_HEIGHT + greenhouseInitialYOffset;
    const ridgeY = totalRoofPeakY;

    for (let i = 0; i < numRafterPairs; i++) {
      const zPos = -halfDepth + i * rafterSpacing;

      // Left rafter
      const startLeft = new THREE.Vector3(-halfWidth, eaveY, zPos);
      const endLeft = new THREE.Vector3(0, ridgeY, zPos);
      let length = startLeft.distanceTo(endLeft);
      let center = new THREE.Vector3().addVectors(startLeft, endLeft).multiplyScalar(0.5);
      let rafter = createBeam(new THREE.Vector3(length, FRAME_THICKNESS, FRAME_THICKNESS), center); // Note: size x is length
      // rafter.lookAt(endLeft); // Old incorrect orientation
      const directionLeft = new THREE.Vector3().subVectors(endLeft, startLeft).normalize();
      const quaternionLeft = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), directionLeft);
      rafter.quaternion.copy(quaternionLeft);
      greenhouseGroup.add(rafter);

      // Right rafter
      const startRight = new THREE.Vector3(halfWidth, eaveY, zPos);
      const endRight = new THREE.Vector3(0, ridgeY, zPos);
      length = startRight.distanceTo(endRight);
      center = new THREE.Vector3().addVectors(startRight, endRight).multiplyScalar(0.5);
      rafter = createBeam(new THREE.Vector3(length, FRAME_THICKNESS, FRAME_THICKNESS), center); // Note: size x is length
      // rafter.lookAt(endRight); // Old incorrect orientation
      const directionRight = new THREE.Vector3().subVectors(endRight, startRight).normalize();
      const quaternionRight = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), directionRight);
      rafter.quaternion.copy(quaternionRight);
      greenhouseGroup.add(rafter);
    }

    // Transparent Walls - Adjust Y positions and sizes
    const wallPlaneY = postY; // Centered on post height, already includes offset
    const frontBackWallGeo = new THREE.PlaneGeometry(GREENHOUSE_WIDTH - FRAME_THICKNESS, GREENHOUSE_WALL_HEIGHT - FRAME_THICKNESS);
    const frontWall = new THREE.Mesh(frontBackWallGeo, wallMaterial); frontWall.position.set(0, wallPlaneY, -halfDepth + FRAME_THICKNESS/2); frontWall.name="greenhousePart"; greenhouseGroup.add(frontWall);
    const backWall = new THREE.Mesh(frontBackWallGeo, wallMaterial); backWall.position.set(0, wallPlaneY, halfDepth - FRAME_THICKNESS/2); backWall.rotation.y = Math.PI; backWall.name="greenhousePart"; greenhouseGroup.add(backWall);

    const sideWallGeo = new THREE.PlaneGeometry(GREENHOUSE_DEPTH - FRAME_THICKNESS, GREENHOUSE_WALL_HEIGHT - FRAME_THICKNESS);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial); leftWall.position.set(-halfWidth + FRAME_THICKNESS/2, wallPlaneY, 0); leftWall.rotation.y = -Math.PI / 2; leftWall.name="greenhousePart"; greenhouseGroup.add(leftWall);
    const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial); rightWall.position.set(halfWidth - FRAME_THICKNESS/2, wallPlaneY, 0); rightWall.rotation.y = Math.PI / 2; rightWall.name="greenhousePart"; greenhouseGroup.add(rightWall);

    // Roof Panels (slanted) - Adjust Y positions and size
    const ROOF_MATERIAL_COLOR = 0xADD8E6; // 유리/아크릴 틴트와 유사한 밝은 청색
    const ROOF_OPACITY = 0.3; // 유리에 가깝도록 더 투명하게 설정
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: ROOF_MATERIAL_COLOR,
      opacity: ROOF_OPACITY,
      transparent: true,
      side: THREE.DoubleSide, // 양면 렌더링
      roughness: 0.1,         // 유리에 가깝도록 더 매끄럽게
      metalness: 0.05,
    });
    roofMaterial.name = "GreenhouseRoofMaterial"; // 디버깅용 이름

    // halfWidth, eaveY, ridgeY, GREENHOUSE_ROOF_PEAK_ADD_HEIGHT, GREENHOUSE_DEPTH 변수는 외부 스코프에서 사용 가능
    const panelSlantedWidth = Math.sqrt(Math.pow(halfWidth, 2) + Math.pow(GREENHOUSE_ROOF_PEAK_ADD_HEIGHT, 2));
    const roofAngle = Math.atan2(GREENHOUSE_ROOF_PEAK_ADD_HEIGHT, halfWidth);

    // 지붕 패널 지오메트리 (전체 온실 깊이만큼 생성)
    const roofPanelGeometry = new THREE.PlaneGeometry(panelSlantedWidth, GREENHOUSE_DEPTH);

    // 왼쪽 지붕 패널
    const leftRoofPanel = new THREE.Mesh(roofPanelGeometry, roofMaterial);
    leftRoofPanel.name = "greenhouseRoofLeft";
    // 패널 중심 위치 설정
    // X: -halfWidth와 0의 평균 = -halfWidth / 2
    // Y: eaveY와 ridgeY의 평균 = (eaveY + ridgeY) / 2
    // Z: 0 (깊이 방향 중앙)
    leftRoofPanel.position.set(-halfWidth / 2, (eaveY + ridgeY) / 2, 0);
    // 회전 적용:
    // 1. PlaneGeometry의 원래 Y축 (GREENHOUSE_DEPTH 길이)을 전역 Z축과 정렬 (X축 기준 90도 회전)
    leftRoofPanel.rotation.order = 'ZXY';
    leftRoofPanel.rotation.x = Math.PI / 2;
    // 2. 전역 Z축 (첫 번째 회전 후 평면의 원래 Y축에 해당)을 기준으로 기울기 적용
    leftRoofPanel.rotation.z = roofAngle; // 왼쪽은 양의 각도
    greenhouseGroup.add(leftRoofPanel);

    // 오른쪽 지붕 패널
    const rightRoofPanel = new THREE.Mesh(roofPanelGeometry, roofMaterial);
    rightRoofPanel.name = "greenhouseRoofRight";
    // 패널 중심 위치 설정
    // X: halfWidth와 0의 평균 = halfWidth / 2
    // Y: eaveY와 ridgeY의 평균 = (eaveY + ridgeY) / 2
    // Z: 0
    rightRoofPanel.position.set(halfWidth / 2, (eaveY + ridgeY) / 2, 0);
    // 회전 적용:
    rightRoofPanel.rotation.order = 'ZXY';
    rightRoofPanel.rotation.x = Math.PI / 2; // 동일한 첫 번째 회전
    rightRoofPanel.rotation.z = -roofAngle; // 오른쪽은 음의 각도
    greenhouseGroup.add(rightRoofPanel);

    // Gable end walls (triangular part) - Adjust Y positions and vertex definitions
    const gableShape = new THREE.Shape(); // 복원: 박공벽 모양 정의 (린트 ID: 345ec094-4d73-45e5-a2be-97b69aa9c34d 등 해결)
    // Vertices relative to the shape's origin, adjusted to meet frame centers
    gableShape.moveTo(-halfWidth + FRAME_THICKNESS * 0.5, GREENHOUSE_WALL_HEIGHT - FRAME_THICKNESS * 0.5); // Bottom-left of triangle // 복원
    gableShape.lineTo(halfWidth - FRAME_THICKNESS * 0.5, GREENHOUSE_WALL_HEIGHT - FRAME_THICKNESS * 0.5);  // Bottom-right
    gableShape.lineTo(0, GREENHOUSE_WALL_HEIGHT + GREENHOUSE_ROOF_PEAK_ADD_HEIGHT - FRAME_THICKNESS * 0.5); // Top point
    gableShape.closePath();
    const gableGeo = new THREE.ShapeGeometry(gableShape);
    // Position the shape origin at y = greenhouseInitialYOffset
    const frontGable = new THREE.Mesh(gableGeo, wallMaterial); 
    frontGable.position.set(0, greenhouseInitialYOffset, -halfDepth + FRAME_THICKNESS/2); 
    frontGable.name="greenhousePart"; greenhouseGroup.add(frontGable);
    const backGable = new THREE.Mesh(gableGeo, wallMaterial); 
    backGable.position.set(0, greenhouseInitialYOffset, halfDepth - FRAME_THICKNESS/2); 
    backGable.rotation.y = Math.PI; 
    backGable.name="greenhousePart"; greenhouseGroup.add(backGable);

    // Internal Tiers (2 levels of pipes) - Adjust Y positions
    const fanFrameMaterial = new THREE.MeshStandardMaterial({ color: FAN_FRAME_COLOR, metalness: 0.5, roughness: 0.7 });
    const fanBodyMaterial = new THREE.MeshStandardMaterial({ color: FAN_COLOR, metalness: 0.4, roughness: 0.7 });
    const fanBladeMaterial = new THREE.MeshStandardMaterial({ color: FAN_BLADE_COLOR, metalness: 0.3, roughness: 0.6 });
    // const pipeLength = GREENHOUSE_DEPTH * 0.9;
    // const tierRelativeHeights = [GREENHOUSE_WALL_HEIGHT * 0.3, GREENHOUSE_WALL_HEIGHT * 0.65];
    // const pipesPerTier = 2;
    // const pipeSpacing = GREENHOUSE_WIDTH / (pipesPerTier + 1);

    // tierRelativeHeights.forEach(relYPos => {
    //   const yPos = relYPos + greenhouseInitialYOffset;
    //   for (let i = 0; i < pipesPerTier; i++) {
    //     const xPos = -halfWidth + pipeSpacing * (i + 1);
    //     const pipeGeo = new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, pipeLength, PIPE_SEGMENTS);
    //     const pipe = new THREE.Mesh(pipeGeo, pipeMaterial);
    //     pipe.rotation.x = Math.PI / 2;
    //     pipe.position.set(xPos, yPos, 0);
    //     pipe.castShadow = true; pipe.name = "greenhousePart";
    //     greenhouseGroup.add(pipe);
    //   }
    // });

    // Fans on the back gable wall (2x3 Grid)
    const backGableFanZ = GREENHOUSE_DEPTH / 2 - GABLE_Z_OFFSET_FAN;
    for (let fanRow = 0; fanRow < 3; fanRow++) { // 3 rows
      for (let fanCol = 0; fanCol < 2; fanCol++) { // 2 columns
        const fanX = fanCol % 2 === 0 ? -FAN_SPACING_X / 2 : FAN_SPACING_X / 2;
        const gableBaseWorldY = greenhouseInitialYOffset + GREENHOUSE_WALL_HEIGHT;
        const fanBlockCenterWorldY = gableBaseWorldY + (GREENHOUSE_ROOF_PEAK_ADD_HEIGHT / 2) + GABLE_Y_OFFSET;
        const fanY = fanBlockCenterWorldY + (fanRow - 1) * FAN_SPACING_Y; // Adjusted for 3 rows

        const fanAndFrameGroup = new THREE.Group();

        // Fan Frame
        const fanFrameGeometry = new THREE.BoxGeometry(FAN_FRAME_SIZE, FAN_FRAME_SIZE, FAN_FRAME_THICKNESS);
        const fanFrameMesh = new THREE.Mesh(fanFrameGeometry, fanFrameMaterial);
        fanAndFrameGroup.add(fanFrameMesh);

        // Fan Body (Cylinder)
        const fanBodyGeometry = new THREE.CylinderGeometry(FAN_BODY_RADIUS, FAN_BODY_RADIUS, FAN_BODY_DEPTH, 32);
        const fanBodyMesh = new THREE.Mesh(fanBodyGeometry, fanBodyMaterial);
        fanBodyMesh.rotation.x = Math.PI / 2; // Rotate to be parallel to frame face
        fanBodyMesh.position.z = -(FAN_FRAME_THICKNESS / 2 - FAN_BODY_DEPTH / 2); // Position within the frame, pointing inward
        fanAndFrameGroup.add(fanBodyMesh);

        // Fan Blades
        const bladeGeometry = new THREE.BoxGeometry(FAN_BODY_RADIUS * 1.8, FAN_BLADE_HEIGHT, FAN_BLADE_THICKNESS);
        for (let k = 0; k < NUM_FAN_BLADES; k++) {
          const bladeMesh = new THREE.Mesh(bladeGeometry, fanBladeMaterial);
          const angle = (k / NUM_FAN_BLADES) * Math.PI * 2;
          bladeMesh.rotation.z = angle;
          bladeMesh.position.z = fanBodyMesh.position.z; // Align with fan body center
          fanAndFrameGroup.add(bladeMesh);
        }

        fanAndFrameGroup.position.set(fanX, fanY, backGableFanZ);
        fanAndFrameGroup.rotation.y = Math.PI; // Fans face inwards from back wall
        fanAndFrameGroup.castShadow = true;
        fanAndFrameGroup.receiveShadow = true;
        fanAndFrameGroup.name = `backFan-${fanRow}-${fanCol}`;
        greenhouseGroup.add(fanAndFrameGroup);
      }
    }

    // Fans on the front gable wall (2x3 Grid)
    const frontGableFanZ = -GREENHOUSE_DEPTH / 2 + GABLE_Z_OFFSET_FAN;
    for (let fanRow = 0; fanRow < 3; fanRow++) { // 3 rows
      for (let fanCol = 0; fanCol < 2; fanCol++) { // 2 columns
        const fanX = fanCol % 2 === 0 ? -FAN_SPACING_X / 2 : FAN_SPACING_X / 2;
        const gableBaseWorldY = greenhouseInitialYOffset + GREENHOUSE_WALL_HEIGHT; // Recalculate for clarity, though same as back
        const fanBlockCenterWorldY = gableBaseWorldY + (GREENHOUSE_ROOF_PEAK_ADD_HEIGHT / 2) + GABLE_Y_OFFSET;
        const fanY = fanBlockCenterWorldY + (fanRow - 1) * FAN_SPACING_Y; // Adjusted for 3 rows

        const fanAndFrameGroupFront = new THREE.Group();

        // Fan Frame
        const fanFrameGeometryFront = new THREE.BoxGeometry(FAN_FRAME_SIZE, FAN_FRAME_SIZE, FAN_FRAME_THICKNESS);
        const fanFrameMeshFront = new THREE.Mesh(fanFrameGeometryFront, fanFrameMaterial);
        fanAndFrameGroupFront.add(fanFrameMeshFront);

        // Fan Body (Cylinder)
        const fanBodyGeometryFront = new THREE.CylinderGeometry(FAN_BODY_RADIUS, FAN_BODY_RADIUS, FAN_BODY_DEPTH, 32);
        const fanBodyMeshFront = new THREE.Mesh(fanBodyGeometryFront, fanBodyMaterial);
        fanBodyMeshFront.rotation.x = Math.PI / 2; // Rotate to be parallel to frame face
        fanBodyMeshFront.position.z = FAN_FRAME_THICKNESS / 2 - FAN_BODY_DEPTH / 2; // Position within the frame, pointing outward
        fanAndFrameGroupFront.add(fanBodyMeshFront);

        // Fan Blades
        const bladeGeometryFront = new THREE.BoxGeometry(FAN_BODY_RADIUS * 1.8, FAN_BLADE_HEIGHT, FAN_BLADE_THICKNESS);
        for (let k = 0; k < NUM_FAN_BLADES; k++) {
          const bladeMeshFront = new THREE.Mesh(bladeGeometryFront, fanBladeMaterial);
          const angle = (k / NUM_FAN_BLADES) * Math.PI * 2;
          bladeMeshFront.rotation.z = angle;
          bladeMeshFront.position.z = fanBodyMeshFront.position.z; // Align with fan body center
          fanAndFrameGroupFront.add(bladeMeshFront);
        }

        fanAndFrameGroupFront.position.set(fanX, fanY, frontGableFanZ);
        fanAndFrameGroupFront.rotation.y = 0; // Fans face outwards from front wall
        fanAndFrameGroupFront.castShadow = true;
        fanAndFrameGroupFront.receiveShadow = true;
        fanAndFrameGroupFront.name = `frontFan-${fanRow}-${fanCol}`;
        greenhouseGroup.add(fanAndFrameGroupFront);
      }
    }

    // Create Pipe Tiers (Growing Beds)
    const tierMaterial = new THREE.MeshStandardMaterial({
      color: PIPE_TIER_COLOR,
      roughness: 0.8,
      metalness: 0.1,
    });

    const retainingWallMaterial = new THREE.MeshStandardMaterial({
      color: PIPE_TIER_RETAINING_WALL_COLOR,
      roughness: 0.7,
      metalness: 0.2,
    });

    const supportColumnMaterial = new THREE.MeshStandardMaterial({
      color: SUPPORT_COLUMN_COLOR,
      roughness: 0.6,
      metalness: 0.4,
    });

    const totalBedsWidthArea = GREENHOUSE_WIDTH * PIPE_TIER_WIDTH_RATIO;
    const individualBedWidth = (totalBedsWidthArea - PIPE_TIER_AISLE_WIDTH) / 2;
    const tierDepth = GREENHOUSE_DEPTH * PIPE_TIER_DEPTH_RATIO;

    for (let i = 0; i < NUM_PIPE_TIERS; i++) {
      const tierYPosition = greenhouseInitialYOffset + PIPE_TIER_INITIAL_Y_OFFSET + (i * PIPE_TIER_SPACING_Y) + (PIPE_TIER_THICKNESS / 2);

      // Bed A
      const bedAGeometry = new THREE.BoxGeometry(individualBedWidth, PIPE_TIER_THICKNESS, tierDepth);
      const bedAMesh = new THREE.Mesh(bedAGeometry, tierMaterial);
      bedAMesh.position.set(-(PIPE_TIER_AISLE_WIDTH / 2 + individualBedWidth / 2), tierYPosition, 0);
      bedAMesh.castShadow = true;
      bedAMesh.receiveShadow = true;
      bedAMesh.name = `pipeTier-${i}-A`;
      greenhouseGroup.add(bedAMesh);

      // Retaining walls for Bed A
      const wallYPosition = tierYPosition - (PIPE_TIER_THICKNESS / 2) + (PIPE_TIER_RETAINING_WALL_HEIGHT / 2);
      // Front Wall (positive Z)
      const wallFrontA = new THREE.Mesh(
        new THREE.BoxGeometry(individualBedWidth, PIPE_TIER_RETAINING_WALL_HEIGHT, PIPE_TIER_RETAINING_WALL_THICKNESS),
        retainingWallMaterial
      );
      wallFrontA.position.set(bedAMesh.position.x, wallYPosition, bedAMesh.position.z + tierDepth / 2 + PIPE_TIER_RETAINING_WALL_THICKNESS / 2);
      wallFrontA.castShadow = true;
      wallFrontA.receiveShadow = true;
      wallFrontA.name = `pipeTier-${i}-A-wallFront`;
      greenhouseGroup.add(wallFrontA);
      // Back Wall (negative Z)
      const wallBackA = new THREE.Mesh(
        new THREE.BoxGeometry(individualBedWidth, PIPE_TIER_RETAINING_WALL_HEIGHT, PIPE_TIER_RETAINING_WALL_THICKNESS),
        retainingWallMaterial
      );
      wallBackA.position.set(bedAMesh.position.x, wallYPosition, bedAMesh.position.z - tierDepth / 2 - PIPE_TIER_RETAINING_WALL_THICKNESS / 2);
      wallBackA.castShadow = true;
      wallBackA.receiveShadow = true;
      wallBackA.name = `pipeTier-${i}-A-wallBack`;
      greenhouseGroup.add(wallBackA);
      // Left Wall (negative X)
      const wallLeftA = new THREE.Mesh(
        new THREE.BoxGeometry(PIPE_TIER_RETAINING_WALL_THICKNESS, PIPE_TIER_RETAINING_WALL_HEIGHT, tierDepth + (PIPE_TIER_RETAINING_WALL_THICKNESS * 2)), // Extend to cover front/back wall ends
        retainingWallMaterial
      );
      wallLeftA.position.set(bedAMesh.position.x - individualBedWidth / 2 - PIPE_TIER_RETAINING_WALL_THICKNESS / 2, wallYPosition, bedAMesh.position.z);
      wallLeftA.castShadow = true;
      wallLeftA.receiveShadow = true;
      wallLeftA.name = `pipeTier-${i}-A-wallLeft`;
      greenhouseGroup.add(wallLeftA);
      // Right Wall (positive X)
      const wallRightA = new THREE.Mesh(
        new THREE.BoxGeometry(PIPE_TIER_RETAINING_WALL_THICKNESS, PIPE_TIER_RETAINING_WALL_HEIGHT, tierDepth + (PIPE_TIER_RETAINING_WALL_THICKNESS * 2)), // Extend to cover front/back wall ends
        retainingWallMaterial
      );
      wallRightA.position.set(bedAMesh.position.x + individualBedWidth / 2 + PIPE_TIER_RETAINING_WALL_THICKNESS / 2, wallYPosition, bedAMesh.position.z);
      wallRightA.castShadow = true;
      wallRightA.receiveShadow = true;
      wallRightA.name = `pipeTier-${i}-A-wallRight`;
      greenhouseGroup.add(wallRightA);

      // Support Columns for Bed A
      const columnHeightA = bedAMesh.position.y - (PIPE_TIER_THICKNESS / 2) - greenhouseInitialYOffset;
      const columnYPosA = greenhouseInitialYOffset + columnHeightA / 2;
      const columnPositionsA = [
        { x: bedAMesh.position.x - individualBedWidth / 2 + SUPPORT_COLUMN_RADIUS, z: bedAMesh.position.z - tierDepth / 2 + SUPPORT_COLUMN_RADIUS }, // Back-Left
        { x: bedAMesh.position.x + individualBedWidth / 2 - SUPPORT_COLUMN_RADIUS, z: bedAMesh.position.z - tierDepth / 2 + SUPPORT_COLUMN_RADIUS }, // Back-Right
        { x: bedAMesh.position.x - individualBedWidth / 2 + SUPPORT_COLUMN_RADIUS, z: bedAMesh.position.z + tierDepth / 2 - SUPPORT_COLUMN_RADIUS }, // Front-Left
        { x: bedAMesh.position.x + individualBedWidth / 2 - SUPPORT_COLUMN_RADIUS, z: bedAMesh.position.z + tierDepth / 2 - SUPPORT_COLUMN_RADIUS }, // Front-Right
      ];
      columnPositionsA.forEach((pos, index) => {
        const columnGeom = new THREE.CylinderGeometry(SUPPORT_COLUMN_RADIUS, SUPPORT_COLUMN_RADIUS, columnHeightA, SUPPORT_COLUMN_SEGMENTS);
        const columnMesh = new THREE.Mesh(columnGeom, supportColumnMaterial);
        columnMesh.position.set(pos.x, columnYPosA, pos.z);
        columnMesh.castShadow = true;
        columnMesh.receiveShadow = true;
        columnMesh.name = `pipeTier-${i}-A-support-${index}`;
        greenhouseGroup.add(columnMesh);
      });

      // Bed B
      const bedBGeometry = new THREE.BoxGeometry(individualBedWidth, PIPE_TIER_THICKNESS, tierDepth);
      const bedBMesh = new THREE.Mesh(bedBGeometry, tierMaterial);
      bedBMesh.position.set((PIPE_TIER_AISLE_WIDTH / 2 + individualBedWidth / 2), tierYPosition, 0);
      bedBMesh.castShadow = true;
      bedBMesh.receiveShadow = true;
      bedBMesh.name = `pipeTier-${i}-B`;
      greenhouseGroup.add(bedBMesh);

      // Retaining walls for Bed B
      // Front Wall (positive Z)
      const wallFrontB = new THREE.Mesh(
        new THREE.BoxGeometry(individualBedWidth, PIPE_TIER_RETAINING_WALL_HEIGHT, PIPE_TIER_RETAINING_WALL_THICKNESS),
        retainingWallMaterial
      );
      wallFrontB.position.set(bedBMesh.position.x, wallYPosition, bedBMesh.position.z + tierDepth / 2 + PIPE_TIER_RETAINING_WALL_THICKNESS / 2);
      wallFrontB.castShadow = true;
      wallFrontB.receiveShadow = true;
      wallFrontB.name = `pipeTier-${i}-B-wallFront`;
      greenhouseGroup.add(wallFrontB);
      // Back Wall (negative Z)
      const wallBackB = new THREE.Mesh(
        new THREE.BoxGeometry(individualBedWidth, PIPE_TIER_RETAINING_WALL_HEIGHT, PIPE_TIER_RETAINING_WALL_THICKNESS),
        retainingWallMaterial
      );
      wallBackB.position.set(bedBMesh.position.x, wallYPosition, bedBMesh.position.z - tierDepth / 2 - PIPE_TIER_RETAINING_WALL_THICKNESS / 2);
      wallBackB.castShadow = true;
      wallBackB.receiveShadow = true;
      wallBackB.name = `pipeTier-${i}-B-wallBack`;
      greenhouseGroup.add(wallBackB);
      // Left Wall (negative X)
      const wallLeftB = new THREE.Mesh(
        new THREE.BoxGeometry(PIPE_TIER_RETAINING_WALL_THICKNESS, PIPE_TIER_RETAINING_WALL_HEIGHT, tierDepth + (PIPE_TIER_RETAINING_WALL_THICKNESS * 2)), // Extend to cover front/back wall ends
        retainingWallMaterial
      );
      wallLeftB.position.set(bedBMesh.position.x - individualBedWidth / 2 - PIPE_TIER_RETAINING_WALL_THICKNESS / 2, wallYPosition, bedBMesh.position.z);
      wallLeftB.castShadow = true;
      wallLeftB.receiveShadow = true;
      wallLeftB.name = `pipeTier-${i}-B-wallLeft`;
      greenhouseGroup.add(wallLeftB);
      // Right Wall (positive X)
      const wallRightB = new THREE.Mesh(
        new THREE.BoxGeometry(PIPE_TIER_RETAINING_WALL_THICKNESS, PIPE_TIER_RETAINING_WALL_HEIGHT, tierDepth + (PIPE_TIER_RETAINING_WALL_THICKNESS * 2)), // Extend to cover front/back wall ends
        retainingWallMaterial
      );
      wallRightB.position.set(bedBMesh.position.x + individualBedWidth / 2 + PIPE_TIER_RETAINING_WALL_THICKNESS / 2, wallYPosition, bedBMesh.position.z);
      wallRightB.castShadow = true;
      wallRightB.receiveShadow = true;
      wallRightB.name = `pipeTier-${i}-B-wallRight`;
      greenhouseGroup.add(wallRightB);

      // Support Columns for Bed B
      const columnHeightB = bedBMesh.position.y - (PIPE_TIER_THICKNESS / 2) - greenhouseInitialYOffset;
      const columnYPosB = greenhouseInitialYOffset + columnHeightB / 2;
      const columnPositionsB = [
        { x: bedBMesh.position.x - individualBedWidth / 2 + SUPPORT_COLUMN_RADIUS, z: bedBMesh.position.z - tierDepth / 2 + SUPPORT_COLUMN_RADIUS }, // Back-Left
        { x: bedBMesh.position.x + individualBedWidth / 2 - SUPPORT_COLUMN_RADIUS, z: bedBMesh.position.z - tierDepth / 2 + SUPPORT_COLUMN_RADIUS }, // Back-Right
        { x: bedBMesh.position.x - individualBedWidth / 2 + SUPPORT_COLUMN_RADIUS, z: bedBMesh.position.z + tierDepth / 2 - SUPPORT_COLUMN_RADIUS }, // Front-Left
        { x: bedBMesh.position.x + individualBedWidth / 2 - SUPPORT_COLUMN_RADIUS, z: bedBMesh.position.z + tierDepth / 2 - SUPPORT_COLUMN_RADIUS }, // Front-Right
      ];
      columnPositionsB.forEach((pos, index) => {
        const columnGeom = new THREE.CylinderGeometry(SUPPORT_COLUMN_RADIUS, SUPPORT_COLUMN_RADIUS, columnHeightB, SUPPORT_COLUMN_SEGMENTS);
        const columnMesh = new THREE.Mesh(columnGeom, supportColumnMaterial);
        columnMesh.position.set(pos.x, columnYPosB, pos.z);
        columnMesh.castShadow = true;
        columnMesh.receiveShadow = true;
        columnMesh.name = `pipeTier-${i}-B-support-${index}`;
        greenhouseGroup.add(columnMesh);
      });

      // Add Plants to Each Tier
      const plantTypes = [
        { A: 'lettuce', B: 'spinach' },  // 1층
        { A: 'kale', B: 'arugula' },     // 2층
        { A: 'basil', B: 'mint' }        // 3층
      ];

      if (i < plantTypes.length) {
        const tierPlants = plantTypes[i];
        
        // Add realistic plants to Bed A
        for (let row = 0; row < PLANTS_PER_ROW; row++) {
          for (let col = 0; col < PLANTS_PER_COLUMN; col++) {
            // 현실적인 센서 데이터 생성
            const sensorData = generateRealisticSensorData(tierPlants.A as keyof typeof PLANT_OPTIMAL_CONDITIONS, i, { row, col });
            
            // 센서 데이터를 기반으로 건강 상태 평가
            const healthStatus = evaluatePlantHealth(tierPlants.A as keyof typeof PLANT_OPTIMAL_CONDITIONS, sensorData);
            
            // 기본 성장 단계 (실제로는 시간에 따라 변화)
            const growthStages: Array<'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead'> = ['growing', 'mature', 'harvest'];
            const baseGrowthStage = growthStages[Math.floor(Math.random() * growthStages.length)];
            
            // 건강 상태에 따라 성장 단계 조정
            const finalGrowthStage = adjustGrowthStage(baseGrowthStage, healthStatus) as 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead';
            
            // 건강 상태에 따른 크기 조정
            let sizeMultiplier = 0.8 + Math.random() * 0.4;
            if (healthStatus === 'stressed') sizeMultiplier *= 0.8;
            if (healthStatus === 'sick') sizeMultiplier *= 0.6;
            if (healthStatus === 'dead') sizeMultiplier *= 0.4;
            
            const plantGroup = createRealisticPlant(
              tierPlants.A as keyof typeof PLANT_COLORS,
              finalGrowthStage,
              healthStatus,
              sizeMultiplier
            );
            
            const plantX = bedAMesh.position.x - (individualBedWidth / 2) + (col + 1) * (individualBedWidth / (PLANTS_PER_COLUMN + 1));
            const plantY = bedAMesh.position.y + (PIPE_TIER_THICKNESS / 2);
            const plantZ = bedAMesh.position.z - (tierDepth / 2) + (row + 1) * (tierDepth / (PLANTS_PER_ROW + 1));
            
            // Add some random variation
            plantGroup.position.set(
              plantX + (Math.random() - 0.5) * 0.01,
              plantY,
              plantZ + (Math.random() - 0.5) * 0.01
            );
            plantGroup.rotation.y = Math.random() * Math.PI * 2;
            
            plantGroup.castShadow = true;
            plantGroup.receiveShadow = true;
            plantGroup.name = `plant-${i}-A-${row}-${col}-${tierPlants.A}-${finalGrowthStage}-${healthStatus}`;
            plantGroup.userData = {
              type: 'plant',
              plantType: tierPlants.A,
              growthStage: finalGrowthStage,
              healthStatus: healthStatus,
              zoneId: `floor-${i + 1}-A`,
              position: { row, col },
              sensorData: sensorData // 센서 데이터 저장
            };
            
            // 그림자 최적화: 일부 식물만 그림자 적용
            if ((row + col) % 3 === 0) { // 3개 중 1개만 그림자 활성화
              plantGroup.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
            }
            
            greenhouseGroup.add(plantGroup);
          }
        }
        
        // Add realistic plants to Bed B
        for (let row = 0; row < PLANTS_PER_ROW; row++) {
          for (let col = 0; col < PLANTS_PER_COLUMN; col++) {
            // 현실적인 센서 데이터 생성
            const sensorData = generateRealisticSensorData(tierPlants.B as keyof typeof PLANT_OPTIMAL_CONDITIONS, i, { row, col });
            
            // 센서 데이터를 기반으로 건강 상태 평가
            const healthStatus = evaluatePlantHealth(tierPlants.B as keyof typeof PLANT_OPTIMAL_CONDITIONS, sensorData);
            
            // 기본 성장 단계 (실제로는 시간에 따라 변화)
            const growthStages: Array<'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead'> = ['growing', 'mature', 'harvest'];
            const baseGrowthStage = growthStages[Math.floor(Math.random() * growthStages.length)];
            
            // 건강 상태에 따라 성장 단계 조정
            const finalGrowthStage = adjustGrowthStage(baseGrowthStage, healthStatus) as 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest' | 'dead';
            
            // 건강 상태에 따른 크기 조정
            let sizeMultiplier = 0.8 + Math.random() * 0.4;
            if (healthStatus === 'stressed') sizeMultiplier *= 0.8;
            if (healthStatus === 'sick') sizeMultiplier *= 0.6;
            if (healthStatus === 'dead') sizeMultiplier *= 0.4;
            
            const plantGroup = createRealisticPlant(
              tierPlants.B as keyof typeof PLANT_COLORS,
              finalGrowthStage,
              healthStatus,
              sizeMultiplier
            );
            
            const plantX = bedBMesh.position.x - (individualBedWidth / 2) + (col + 1) * (individualBedWidth / (PLANTS_PER_COLUMN + 1));
            const plantY = bedBMesh.position.y + (PIPE_TIER_THICKNESS / 2);
            const plantZ = bedBMesh.position.z - (tierDepth / 2) + (row + 1) * (tierDepth / (PLANTS_PER_ROW + 1));
            
            // Add some random variation
            plantGroup.position.set(
              plantX + (Math.random() - 0.5) * 0.01,
              plantY,
              plantZ + (Math.random() - 0.5) * 0.01
            );
            plantGroup.rotation.y = Math.random() * Math.PI * 2;
            
            plantGroup.castShadow = true;
            plantGroup.receiveShadow = true;
            plantGroup.name = `plant-${i}-B-${row}-${col}-${tierPlants.B}-${finalGrowthStage}-${healthStatus}`;
            plantGroup.userData = {
              type: 'plant',
              plantType: tierPlants.B,
              growthStage: finalGrowthStage,
              healthStatus: healthStatus,
              zoneId: `floor-${i + 1}-B`,
              position: { row, col },
              sensorData: sensorData // 센서 데이터 저장
            };
            
            // 그림자 최적화: 일부 식물만 그림자 적용
            if ((row + col) % 3 === 0) { // 3개 중 1개만 그림자 활성화
              plantGroup.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              });
            }
            
            greenhouseGroup.add(plantGroup);
          }
        }
      }
    }

    // Add LED Lighting System (Grid Pattern like Sprinklers)
    const addLEDLightingSystem = () => {
      const ledLightGroup = new THREE.Group();
      ledLightGroup.name = 'LED_Lighting_System';

      // LED 조명 재질
      const ledFrameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        metalness: 0.7, 
        roughness: 0.3 
      });
      
      // LED 켜진 상태와 꺼진 상태 재질 (더 명확한 구분)
      const ledLightOnMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffdd, 
        emissive: 0xffdd44,
        emissiveIntensity: 1.2, // 더욱 밝게
        metalness: 0.1, 
        roughness: 0.1 
      });
      
      const ledLightOffMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        emissive: 0x000000,
        emissiveIntensity: 0.0,
        metalness: 0.5, 
        roughness: 0.8 
      });

      // 파이프 재질
      const pipeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666, 
        metalness: 0.8, 
        roughness: 0.2 
      });

      // 각 층마다 LED 조명 그리드 추가
      for (let tier = 0; tier < NUM_PIPE_TIERS; tier++) {
        const tierY = greenhouseInitialYOffset + PIPE_TIER_INITIAL_Y_OFFSET + (tier * PIPE_TIER_SPACING_Y) + PIPE_TIER_THICKNESS + 0.4;
        
        // 각 베드(A, B)마다 LED 그리드 설치
        [-1, 1].forEach((side, sideIndex) => {
          const bedCenterX = side * (PIPE_TIER_AISLE_WIDTH / 2 + individualBedWidth / 2);
          
          // LED 지지 파이프 시스템 (더 현실적)
          const frameWidth = individualBedWidth * 0.9;
          const frameDepth = tierDepth * 0.9;
          const pipeRadius = 0.015; // 파이프 반지름
          
          // 메인 지지 파이프 (가로)
          const mainPipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, frameWidth, 8);
          const frontMainPipe = new THREE.Mesh(mainPipeGeometry, pipeMaterial);
          frontMainPipe.rotation.z = Math.PI / 2;
          frontMainPipe.position.set(bedCenterX, tierY, -frameDepth/2);
          frontMainPipe.castShadow = false;
          frontMainPipe.name = `led-main-pipe-front-tier-${tier}-side-${sideIndex}`;
          ledLightGroup.add(frontMainPipe);
          
          const backMainPipe = new THREE.Mesh(mainPipeGeometry, pipeMaterial);
          backMainPipe.rotation.z = Math.PI / 2;
          backMainPipe.position.set(bedCenterX, tierY, frameDepth/2);
          backMainPipe.castShadow = false;
          backMainPipe.name = `led-main-pipe-back-tier-${tier}-side-${sideIndex}`;
          ledLightGroup.add(backMainPipe);
          
          // LED 배치용 가로 파이프들 (3개)
          const ledPipeGeometry = new THREE.CylinderGeometry(pipeRadius * 0.7, pipeRadius * 0.7, frameWidth * 0.8, 6);
          for (let pipeIndex = 0; pipeIndex < 2; pipeIndex++) {
            const pipeZ = -frameDepth/3 + (pipeIndex * frameDepth/3);
            const ledPipe = new THREE.Mesh(ledPipeGeometry, pipeMaterial);
            ledPipe.rotation.z = Math.PI / 2;
            ledPipe.position.set(bedCenterX, tierY - 0.02, pipeZ);
            ledPipe.castShadow = false;
            ledPipe.name = `led-pipe-tier-${tier}-side-${sideIndex}-${pipeIndex}`;
            ledLightGroup.add(ledPipe);
          }
          
          // 수직 지지대 (4개 모서리)
          const supportGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, 0.3, 6);
          const supportPositions = [
            { x: bedCenterX - frameWidth/2.5, z: -frameDepth/2.5 },
            { x: bedCenterX + frameWidth/2.5, z: -frameDepth/2.5 },
            { x: bedCenterX - frameWidth/2.5, z: frameDepth/2.5 },
            { x: bedCenterX + frameWidth/2.5, z: frameDepth/2.5 }
          ];
          
          supportPositions.forEach((pos, supportIndex) => {
            const support = new THREE.Mesh(supportGeometry, pipeMaterial);
            support.position.set(pos.x, tierY + 0.15, pos.z);
            support.castShadow = false;
            support.name = `led-support-tier-${tier}-side-${sideIndex}-${supportIndex}`;
            ledLightGroup.add(support);
          });

          // LED 그리드 최적화 (2x3 배치로 감소)
          const ledRowCount = 2; // 세로 방향 감소
          const ledColCount = 3; // 가로 방향 감소
          const ledSpacingX = frameWidth * 0.8 / (ledColCount + 1);
          const ledSpacingZ = frameDepth / (ledRowCount + 1);
          
          for (let row = 0; row < ledRowCount; row++) {
            for (let col = 0; col < ledColCount; col++) {
              const ledX = bedCenterX - (frameWidth * 0.8)/2 + (col + 1) * ledSpacingX;
              const ledZ = -frameDepth/2 + (row + 1) * ledSpacingZ;
              const nearestPipeZ = row === 0 ? -frameDepth/3 : frameDepth/3;
              
              // LED 하우징 (더 현실적인 모양)
              const ledHousingGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.04, 8);
              const ledHousing = new THREE.Mesh(ledHousingGeometry, ledFrameMaterial);
              ledHousing.position.set(ledX, tierY - 0.03, nearestPipeZ);
              ledHousing.castShadow = false;
              ledHousing.name = `led-housing-tier-${tier}-side-${sideIndex}-${row}-${col}`;
              ledLightGroup.add(ledHousing);
              
              // LED 칩/모듈 (기본값: 켜진 상태, 더 밝고 구분되게)
              const ledGeometry = new THREE.SphereGeometry(0.02, 8, 6);
              const isLedOn = true; // 기본적으로 켜진 상태
              const ledMesh = new THREE.Mesh(ledGeometry, isLedOn ? ledLightOnMaterial : ledLightOffMaterial);
              ledMesh.position.set(ledX, tierY - 0.045, nearestPipeZ);
              ledMesh.name = `led-chip-tier-${tier}-side-${sideIndex}-${row}-${col}`;
              ledMesh.userData = {
                type: 'led-chip',
                tier,
                side: sideIndex,
                row,
                col,
                isOn: isLedOn
              };
              ledLightGroup.add(ledMesh);
              
              // LED와 파이프 연결부 (작은 브래킷)
              const bracketGeometry = new THREE.BoxGeometry(0.01, 0.015, 0.01);
              const bracket = new THREE.Mesh(bracketGeometry, pipeMaterial);
              bracket.position.set(ledX, tierY - 0.025, nearestPipeZ);
              bracket.castShadow = false;
              bracket.name = `led-bracket-tier-${tier}-side-${sideIndex}-${row}-${col}`;
              ledLightGroup.add(bracket);

              // LED 조명 최적화: 중앙 LED만 실제 조명으로 설정
              if (row === 0 && col === 1) { // 중앙 LED만 실제 광원 추가 (2x3 그리드에 맞게 조정)
                const ledLight = new THREE.SpotLight(0xffffff, 0.8, 3.0, Math.PI / 3, 0.5);
                ledLight.position.set(ledX, tierY, ledZ);
                ledLight.target.position.set(ledX, tierY - 1, ledZ);
                ledLight.castShadow = false; // 그림자 비활성화로 성능 향상
                ledLight.name = `led-light-tier-${tier}-side-${sideIndex}-${row}-${col}`;
                ledLight.userData = { 
                  type: 'led-light', 
                  tier, 
                  side: sideIndex, 
                  row, 
                  col,
                  isOn: true  // 기본적으로 켜져있음
                };
                ledLightGroup.add(ledLight);
                ledLightGroup.add(ledLight.target);
              }
            }
          }

          // 전력 케이블 (메인 파이프를 따라 간단하게)
          const cableGeometry = new THREE.CylinderGeometry(0.005, 0.005, frameWidth * 0.9, 6);
          const cableMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // MeshBasicMaterial로 성능 향상
          
          const powerCable = new THREE.Mesh(cableGeometry, cableMaterial);
          powerCable.rotation.z = Math.PI / 2;
          powerCable.position.set(bedCenterX, tierY + 0.01, 0);
          powerCable.name = `led-power-cable-tier-${tier}-side-${sideIndex}`;
          ledLightGroup.add(powerCable);
        });
      }

      greenhouseGroup.add(ledLightGroup);
    };

    // Add Irrigation/Misting System
    const addIrrigationSystem = () => {
      const irrigationGroup = new THREE.Group();
      irrigationGroup.name = 'Irrigation_System';

      // 관개 시스템 재질
      const pipeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555, 
        metalness: 0.6, 
        roughness: 0.4 
      });
      const nozzleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        metalness: 0.8, 
        roughness: 0.2 
      });

      // 메인 급수 파이프 (온실 천장을 따라)
      const mainPipeGeometry = new THREE.CylinderGeometry(0.03, 0.03, GREENHOUSE_DEPTH * 0.9, 8);
      const mainPipe = new THREE.Mesh(mainPipeGeometry, pipeMaterial);
      mainPipe.rotation.x = Math.PI / 2;
      mainPipe.position.set(0, GREENHOUSE_WALL_HEIGHT + greenhouseInitialYOffset - 0.2, 0);
      mainPipe.castShadow = true;
      mainPipe.name = 'main-water-pipe';
      irrigationGroup.add(mainPipe);

      // 각 층마다 관개 시스템 추가
      for (let tier = 0; tier < NUM_PIPE_TIERS; tier++) {
        const tierY = greenhouseInitialYOffset + PIPE_TIER_INITIAL_Y_OFFSET + (tier * PIPE_TIER_SPACING_Y) + PIPE_TIER_THICKNESS + 0.5;
        
        // 각 베드(A, B)마다 분사 시스템
        [-1, 1].forEach((side, sideIndex) => {
          const bedCenterX = side * (PIPE_TIER_AISLE_WIDTH / 2 + individualBedWidth / 2);
          
          // 분배 파이프 (베드 위를 가로지름)
          const distributionPipe = new THREE.Mesh(mainPipeGeometry.clone(), pipeMaterial);
          distributionPipe.rotation.x = Math.PI / 2;
          distributionPipe.position.set(bedCenterX, tierY, 0);
          distributionPipe.name = `distribution-pipe-tier-${tier}-side-${sideIndex}`;
          irrigationGroup.add(distributionPipe);

          // 메인 파이프에서 분배 파이프로 연결하는 수직 파이프
          const connectingPipeGeometry = new THREE.CylinderGeometry(0.02, 0.02, tierY - (GREENHOUSE_WALL_HEIGHT + greenhouseInitialYOffset - 0.2), 8);
          const connectingPipe = new THREE.Mesh(connectingPipeGeometry, pipeMaterial);
          connectingPipe.position.set(bedCenterX, (tierY + (GREENHOUSE_WALL_HEIGHT + greenhouseInitialYOffset - 0.2)) / 2, 0);
          connectingPipe.name = `connecting-pipe-tier-${tier}-side-${sideIndex}`;
          irrigationGroup.add(connectingPipe);

          // 미스트 노즐들
          const nozzleCount = 6;
          const nozzleSpacing = (tierDepth * 0.8) / (nozzleCount - 1);
          
          for (let nozzleIndex = 0; nozzleIndex < nozzleCount; nozzleIndex++) {
            const nozzleZ = -(tierDepth * 0.4) + (nozzleIndex * nozzleSpacing);
            
            // 노즐 헤드
            const nozzleGeometry = new THREE.SphereGeometry(0.02, 8, 6);
            const nozzleMesh = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            nozzleMesh.position.set(bedCenterX, tierY - 0.05, nozzleZ);
            nozzleMesh.name = `mist-nozzle-tier-${tier}-side-${sideIndex}-${nozzleIndex}`;
            nozzleMesh.userData = { 
              type: 'irrigation-nozzle', 
              tier, 
              side: sideIndex, 
              nozzleIndex,
              isActive: Math.random() > 0.7  // 30% 확률로 활성 상태
            };
            irrigationGroup.add(nozzleMesh);

            // 노즐에서 파이프로 연결하는 작은 파이프
            const nozzleConnectorGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6);
            const nozzleConnector = new THREE.Mesh(nozzleConnectorGeometry, pipeMaterial);
            nozzleConnector.position.set(bedCenterX, tierY - 0.02, nozzleZ);
            nozzleConnector.name = `nozzle-connector-tier-${tier}-side-${sideIndex}-${nozzleIndex}`;
            irrigationGroup.add(nozzleConnector);

            // 물방울 효과 최적화: 활성 노즐 중 일부만 물방울 표시
            if (nozzleMesh.userData.isActive && nozzleIndex % 2 === 0) { // 2개 중 1개만 물방울 표시
              const waterDropGeometry = new THREE.SphereGeometry(0.004, 4, 3); // 더 간단한 geometry
              const waterDropMaterial = new THREE.MeshBasicMaterial({ // MeshStandardMaterial 대신 MeshBasicMaterial 사용
                color: 0x4488ff, 
                transparent: true, 
                opacity: 0.7
              });
              const waterDrop = new THREE.Mesh(waterDropGeometry, waterDropMaterial);
              waterDrop.position.set(
                bedCenterX,
                tierY - 0.08,
                nozzleZ
              );
              waterDrop.name = `water-drop-tier-${tier}-side-${sideIndex}-${nozzleIndex}`;
              waterDrop.userData = { 
                type: 'water-drop', 
                parentNozzle: `mist-nozzle-tier-${tier}-side-${sideIndex}-${nozzleIndex}` 
              };
              irrigationGroup.add(waterDrop);
            }
          }
        });
      }

      // 물 탱크 (온실 한쪽 모서리에)
      const tankGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
      const tankMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2266aa, 
        metalness: 0.3, 
        roughness: 0.7 
      });
      const waterTank = new THREE.Mesh(tankGeometry, tankMaterial);
      waterTank.position.set(
        -GREENHOUSE_WIDTH / 2 + 0.5, 
        greenhouseInitialYOffset + 0.4, 
        -GREENHOUSE_DEPTH / 2 + 0.5
      );
      waterTank.castShadow = false; // 그림자 비활성화
      waterTank.receiveShadow = false;
      waterTank.name = 'water-tank';
      irrigationGroup.add(waterTank);

      // 탱크에서 메인 파이프로 연결하는 펌프 및 파이프
      const pumpPipeGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8);
      const pumpPipe = new THREE.Mesh(pumpPipeGeometry, pipeMaterial);
      pumpPipe.rotation.z = Math.PI / 4;
      pumpPipe.position.set(
        waterTank.position.x + 0.5, 
        waterTank.position.y + 0.6, 
        waterTank.position.z
      );
      pumpPipe.name = 'pump-pipe';
      irrigationGroup.add(pumpPipe);

      greenhouseGroup.add(irrigationGroup);
    };

    // 조명과 관개 시스템 추가
    addLEDLightingSystem();
    addIrrigationSystem();

farmGroupRef.current.add(greenhouseGroup);
    // Ensure zones and sensors are drawn on top or correctly depth-tested
    zoneGroupRef.current.renderOrder = 1;
    sensorGroupRef.current.renderOrder = 2;

  }, [scene]); // Runs once to build the static structure, added scene to dependencies as it's used

  // 2. Visualize Zones (A/B sections for each tier)
  useEffect(() => {
    if (zoneGroupRef.current) zoneGroupRef.current.clear();

    const tierDepthActual = GREENHOUSE_DEPTH * PIPE_TIER_DEPTH_RATIO;
    const tierWidthActual = GREENHOUSE_WIDTH * PIPE_TIER_WIDTH_RATIO;
    const sectionWidth = (tierWidthActual - PIPE_TIER_AISLE_WIDTH) / 2;
    const zoneHeight = PIPE_TIER_THICKNESS; // Height of the zone box, same as tier thickness

    for (let i = 0; i < NUM_PIPE_TIERS; i++) {
      const tierBaseY = greenhouseInitialYOffset + PIPE_TIER_INITIAL_Y_OFFSET + i * PIPE_TIER_SPACING_Y;
      const zonePosZ = 0; // Centered along the depth of the greenhouse for pipe tiers

      // Find matching zones from props for this tier
      const tierZones = zones.filter(zone => zone.level === i + 1);
      console.log(`Creating zones for tier ${i + 1}, found zones:`, tierZones);

      if (tierZones.length >= 2) {
        // Section A for tier i+1 - use the first zone's ID
        const zoneIdA = tierZones[0].id;
        const positionXA = -(PIPE_TIER_AISLE_WIDTH / 2 + sectionWidth / 2);
        const zoneMeshA = createZoneMesh(
          zoneIdA,
          sectionWidth, zoneHeight, tierDepthActual,
          positionXA, tierBaseY, zonePosZ,
          selectedZoneId
        );
        zoneGroupRef.current.add(zoneMeshA);

        // Section B for tier i+1 - use the second zone's ID
        const zoneIdB = tierZones[1].id;
        const positionXB = (PIPE_TIER_AISLE_WIDTH / 2 + sectionWidth / 2);
        const zoneMeshB = createZoneMesh(
          zoneIdB,
          sectionWidth, zoneHeight, tierDepthActual,
          positionXB, tierBaseY, zonePosZ,
          selectedZoneId
        );
        zoneGroupRef.current.add(zoneMeshB);
      } else {
        console.warn(`Not enough zones found for tier ${i + 1}, found ${tierZones.length} zones`);
        
        // Fallback to creating zones with generated IDs if no matching zones found
        const zoneIdA = `zone-${i + 1}-1`;
        const positionXA = -(PIPE_TIER_AISLE_WIDTH / 2 + sectionWidth / 2);
        const zoneMeshA = createZoneMesh(
          zoneIdA,
          sectionWidth, zoneHeight, tierDepthActual,
          positionXA, tierBaseY, zonePosZ,
          selectedZoneId
        );
        zoneGroupRef.current.add(zoneMeshA);

        const zoneIdB = `zone-${i + 1}-2`;
        const positionXB = (PIPE_TIER_AISLE_WIDTH / 2 + sectionWidth / 2);
        const zoneMeshB = createZoneMesh(
          zoneIdB,
          sectionWidth, zoneHeight, tierDepthActual,
          positionXB, tierBaseY, zonePosZ,
          selectedZoneId
        );
        zoneGroupRef.current.add(zoneMeshB);
      }
    }
  // }, [zones, selectedZoneId]); // Original dependencies
  // Dependencies should include selectedZoneId for color updates, and any constants used if they could change.
  // For now, assuming constants are stable and only selectedZoneId triggers re-render of zones for color change.

    // 초기 버튼 위치 설정
    updateButtonPositions();

  }, [selectedZoneId, NUM_PIPE_TIERS, GREENHOUSE_DEPTH, PIPE_TIER_DEPTH_RATIO, GREENHOUSE_WIDTH, PIPE_TIER_WIDTH_RATIO, PIPE_TIER_AISLE_WIDTH, PIPE_TIER_THICKNESS, greenhouseInitialYOffset, PIPE_TIER_INITIAL_Y_OFFSET, PIPE_TIER_SPACING_Y, camera, zones, scene, updateButtonPositions]);

  // 카메라 움직임에 따른 버튼 위치 업데이트 (더 즉각적으로)
  useEffect(() => {
    if (!camera) return;

    let animationFrameId: number;
    let lastCameraPosition = camera.position.clone();
    let lastCameraRotation = camera.rotation.clone();

    const checkCameraMovement = () => {
      // 카메라 업데이트 최적화: 덜 빈번한 업데이트 (0.001 -> 0.01)
      if (camera.position.distanceTo(lastCameraPosition) > 0.01 || 
          Math.abs(camera.rotation.x - lastCameraRotation.x) > 0.01 ||
          Math.abs(camera.rotation.y - lastCameraRotation.y) > 0.01 ||
          Math.abs(camera.rotation.z - lastCameraRotation.z) > 0.01) {
        
        updateButtonPositions();
        lastCameraPosition = camera.position.clone();
        lastCameraRotation = camera.rotation.clone();
      }
      
      animationFrameId = requestAnimationFrame(checkCameraMovement);
    };

    checkCameraMovement();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [camera, updateButtonPositions]);
  
  // 윈도우 리사이즈에 따른 버튼 위치 업데이트
  useEffect(() => {
    const handleWindowResize = () => {
      // 리사이즈 후 약간의 지연을 두어 렌더링이 완료된 후 버튼 위치 업데이트
      setTimeout(updateButtonPositions, 50);
    };

    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [updateButtonPositions]);
  
  // 카메라 업데이트 트리거에 따른 버튼 위치 업데이트
  useEffect(() => {
    if (cameraUpdateTrigger !== undefined) {
      updateButtonPositions();
    }
  }, [cameraUpdateTrigger, updateButtonPositions]);  // 3. Visualize Sensors
  useEffect(() => {
    console.log('[FarmModel] Sensor useEffect triggered. Zones prop:', zones);
    if (sensorGroupRef.current) sensorGroupRef.current.clear();

    zones.forEach(zone => {
      console.log(`[FarmModel] Inspecting Zone ID: ${zone.id}, Sensors:`, zone.sensors);
      if (zone.sensors && zone.sensors.length > 0) {
        zone.sensors.forEach(async (sensor: Sensor) => {
          console.log(`[FarmModel] Processing Sensor ID: ${sensor.id}, Status: ${sensor.latest_status}`, sensor);
          if (sensor.latest_status === 'critical') {
            // console.warn('🔴 CRITICAL SENSOR DETECTED:', sensor); // Keep console warning if needed, but sensor model is hidden
          }
          /* Sensor visualization logic - commented out
          try {
            const sensorModel = await loadSensorModel(sensor.type);
            if (!sensorModel) return;

            const worldSensorX = zone.position_x + sensor.position_x;
            const worldSensorY = (zone.position_y + zone.size_y / 2) + sensor.position_y;
            const worldSensorZ = zone.position_z + sensor.position_z;

            sensorModel.position.set(worldSensorX, worldSensorY, worldSensorZ);
            sensorModel.name = `sensor-${sensor.id}`;
            sensorModel.userData = { type: 'sensor', sensorId: sensor.id, zoneId: zone.id };
            sensorModel.castShadow = true;
            sensorModel.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                }
            });

            if (sensor.latest_status) {
              const statusColor = sensor.latest_status === 'critical' ? 0xff0000 :
                                sensor.latest_status === 'warning' ? 0xffa500 :
                                0x00ff00; // Normal/good status
              sensorModel.traverse(child => {
                if (child instanceof THREE.Mesh && child.material) {
                  const material = child.material as THREE.MeshStandardMaterial | THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;
                  if (material.color) {
                    material.color.set(statusColor);
                  }
                }
              });
            }
            sensorGroupRef.current.add(sensorModel);
          } catch (error) {
            console.error(`❌ FarmModel: Error loading sensor ${sensor.id}:`, error);
          }
          */
        });
      }
    });
  }, [zones]); // Assuming loadSensorModel is stable

    // 임시: 선택된 구역 정보 콘솔 출력 (모달 구현 전 확인용)
  useEffect(() => {
    if (selectedZoneForModal) {
      console.log('Zone selected for modal:', selectedZoneForModal.id, selectedZoneForModal);
    }
  }, [selectedZoneForModal]);

  return (
    <>
      
      {/* 구역별 보기 - 구역 버튼들 */}
      {viewMode === 'zone' && zoneButtonProps.map(buttonProp => {
        if (!buttonProp.visible) return null;
        
        // 구역 건강 상태 계산 (해당 구역의 센서들 기준)
        const getZoneHealthStatus = (zoneData: any) => {
          if (!zoneData.sensors || zoneData.sensors.length === 0) return 'unknown';
          
          const criticalCount = zoneData.sensors.filter((s: any) => s.latest_status === 'critical').length;
          const warningCount = zoneData.sensors.filter((s: any) => s.latest_status === 'warning').length;
          
          if (criticalCount > 0) return 'critical';
          if (warningCount > 0) return 'warning';
          return 'normal';
        };
        
        const getZoneIconColor = (status: string) => {
          switch (status) {
            case 'normal': return '#10b981'; // 초록색
            case 'warning': return '#f59e0b'; // 주황색
            case 'critical': return '#ef4444'; // 빨간색
            default: return '#6b7280'; // 회색
          }
        };
        
        const getZoneIcon = (status: string) => {
          switch (status) {
            case 'normal': return '🏢'; // 정상 빌딩
            case 'warning': return '⚠️'; // 경고
            case 'critical': return '🚨'; // 위험
            default: return '🏭'; // 기본 공장
          }
        };
        
        const zoneStatus = getZoneHealthStatus(buttonProp.zoneData);
        const iconColor = getZoneIconColor(zoneStatus);
        const zoneIcon = getZoneIcon(zoneStatus);
        
        return (
          <div
            key={buttonProp.id}
            style={{
              position: 'absolute',
              left: `${buttonProp.x}px`,
              top: `${buttonProp.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              backgroundColor: 'white',
              border: `3px solid ${iconColor}`,
              borderRadius: '12px',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onClick={() => {
              console.log(`Button clicked for zone: ${buttonProp.zoneData.id}`);
              setSelectedZoneForModal(buttonProp.zoneData);
            }}
          >
            {/* 구역 아이콘 */}
            <div style={{ fontSize: '20px', lineHeight: '1' }}>
              {zoneIcon}
            </div>
            
            {/* 구역 이름 (축약) */}
            <div style={{ 
              fontSize: '8px', 
              color: iconColor, 
              marginTop: '2px',
              textAlign: 'center',
              lineHeight: '1',
              maxWidth: '40px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {buttonProp.name.replace('zone-', '').replace('floor-', 'F')}
            </div>
            
            {/* 센서 개수 표시 */}
            {buttonProp.zoneData.sensors && buttonProp.zoneData.sensors.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '16px',
                height: '16px',
                backgroundColor: iconColor,
                color: 'white',
                borderRadius: '50%',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                border: '2px solid white'
              }}>
                {buttonProp.zoneData.sensors.length}
              </div>
            )}
          </div>
        );
      })}
      
      {/* 식물별 보기 - 식물 센서 아이콘들 */}
      {viewMode === 'plant' && plantSensorButtons.map(plantButton => {
        if (!plantButton.visible) return null;
        
        // 건강 상태에 따른 아이콘 색상
        const getIconColor = (healthStatus: string) => {
          switch (healthStatus) {
            case 'healthy': return '#10b981'; // 초록색
            case 'stressed': return '#f59e0b'; // 주황색
            case 'sick': return '#ef4444'; // 빨간색
            case 'dead': return '#6b7280'; // 회색
            default: return '#6b7280';
          }
        };

        return (
          <div
            key={plantButton.id}
            style={{
              position: 'absolute',
              left: `${plantButton.x}px`,
              top: `${plantButton.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              backgroundColor: 'white',
              border: `2px solid ${getIconColor(plantButton.healthStatus)}`,
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
            }}
            onClick={() => {
              console.log(`Plant sensor clicked for: ${plantButton.plantType}`, plantButton);
              setSelectedPlantForModal(plantButton);
            }}
            title={`${plantButton.plantType} - ${plantButton.healthStatus}`}
          >
            🌡️
          </div>
        );
      })}
      
      {/* 제어 아이콘들 (조명 및 급수 시스템) */}
      {controlIcons.map(controlIcon => {
        if (!controlIcon.visible) return null;
        
        const isLighting = controlIcon.type === 'lighting';
        const iconColor = controlIcon.isActive 
          ? (isLighting ? '#fbbf24' : '#3b82f6') // 활성: 노란색(조명) 또는 파란색(급수)
          : '#6b7280'; // 비활성: 회색
        const iconBgColor = controlIcon.isActive ? '#ffffff' : '#f3f4f6';
        const iconEmoji = isLighting ? '💡' : '💧';
        
        return (
          <div
            key={controlIcon.id}
            style={{
              position: 'absolute',
              left: `${controlIcon.x}px`,
              top: `${controlIcon.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '32px',
              height: '32px',
              backgroundColor: iconBgColor,
              border: `2px solid ${iconColor}`,
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            }}
            onClick={() => {
              console.log(`${controlIcon.type} control clicked:`, controlIcon);
              setSelectedControlForModal(controlIcon);
            }}
            title={`${isLighting ? '조명' : '급수'} 제어 - ${controlIcon.tier + 1}층 ${controlIcon.side === 0 ? 'A' : 'B'}구역 (${controlIcon.isActive ? 'ON' : 'OFF'})`}
          >
            {iconEmoji}
          </div>
        );
      })}
      
      {/* 구역 모달 */}
      {selectedZoneForModal && (
        <ZoneInfoModal 
          zoneData={selectedZoneForModal} 
          onClose={() => setSelectedZoneForModal(null)} 
        />
      )}
      
      {/* 식물 센서 모달 */}
      {selectedPlantForModal && (
        <PlantSensorModal 
          plantData={selectedPlantForModal} 
          onClose={() => setSelectedPlantForModal(null)} 
        />
      )}
      
      {/* 제어 시스템 모달 */}
      {selectedControlForModal && (
        <ControlModal 
          controlData={selectedControlForModal} 
          onClose={() => setSelectedControlForModal(null)}
          onToggle={handleControlToggle}
        />
      )}
    </>
  );
};