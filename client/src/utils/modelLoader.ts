import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// 모델 로더 인스턴스
// let gltfLoader: GLTFLoader | null = null;
// let dracoLoader: DRACOLoader | null = null;

// 로더 초기화
/*
export const initializeLoaders = () => {
  // if (!gltfLoader) {
  //   gltfLoader = new GLTFLoader();
    
  //   // DRACO 압축 지원
  //   dracoLoader = new DRACOLoader();
  //   dracoLoader.setDecoderPath('/draco/');
  //   gltfLoader.setDRACOLoader(dracoLoader);
  // }
  
  // return { gltfLoader, dracoLoader };
  return { gltfLoader: null, dracoLoader: null }; // Return nulls to avoid breaking loadModel if it were called
};
*/

// 모델 캐시
const modelCache = new Map<string, THREE.Group>();

// 3D 모델 로드
export const loadModel = async (path: string): Promise<THREE.Group> => {
  // 캐시에서 확인
  if (modelCache.has(path)) {
    const cachedModel = modelCache.get(path)!;
    return cachedModel.clone();
  }

  // const { gltfLoader } = initializeLoaders(); // Commented out loader initialization

  try {
    // const gltf = await new Promise<any>((resolve, reject) => { // Commented out GLTF loading
    //   gltfLoader!.load(
    //     path,
    //     (gltf) => resolve(gltf),
    //     (progress) => {
    //       console.log(`Loading model ${path}: ${(progress.loaded / progress.total * 100)}%`);
    //     },
    //     (error) => reject(error)
    //   );
    // });

    // const model = gltf.scene; // Commented out model extraction
    console.warn(`GLTF loading is commented out. Returning fallback for ${path}`);
    const model = createFallbackModel(path); // Return fallback directly
    
    // 모델 최적화
    optimizeModel(model);
    
    // 캐시에 저장
    modelCache.set(path, model);
    
    return model.clone();
  } catch (error) {
    console.warn(`Failed to load model ${path}:`, error);
    // 실패 시 기본 모델 반환
    return createFallbackModel(path);
  }
};

// 모델 최적화
const optimizeModel = (model: THREE.Group) => {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 그림자 설정
      child.castShadow = true;
      child.receiveShadow = true;
      
      // 재질 최적화
      if (child.material instanceof THREE.MeshStandardMaterial) {
        // 불필요한 features 비활성화
        child.material.envMapIntensity = 0.5;
      }
      
      // 기하학 최적화
      if (child.geometry instanceof THREE.BufferGeometry) {
        child.geometry.computeBoundingBox();
        child.geometry.computeBoundingSphere();
      }
    }
  });
  
  // 모델 크기 정규화 (필요한 경우)
  normalizeModelSize(model);
};

// 모델 크기 정규화
const normalizeModelSize = (model: THREE.Group, targetSize: number = 1) => {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  
  if (maxDimension > targetSize) {
    const scale = targetSize / maxDimension;
    model.scale.setScalar(scale);
  }
};

// 대체 모델 생성 (모델 로드 실패 시)
const createFallbackModel = (path: string): THREE.Group => {
  const group = new THREE.Group();
  
  if (path.includes('sensor')) {
    // 센서 대체 모델
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshLambertMaterial({ 
      color: getSensorColor(path) 
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  } else if (path.includes('plant')) {
    // 식물 대체 모델
    const geometry = new THREE.CylinderGeometry(0.05, 0.1, 0.2, 8);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4CAF50 
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  } else if (path.includes('farm-structure')) {
    // 농장 구조 대체 모델
    createFarmStructure(group);
  }
  
  return group;
};

// 센서 타입별 색상 반환
const getSensorColor = (path: string): number => {
  if (path.includes('temperature')) return 0xFF4444;
  if (path.includes('humidity')) return 0x4444FF;
  if (path.includes('soil-moisture')) return 0x8BC34A;
  if (path.includes('light')) return 0xFFFF44;
  if (path.includes('co2')) return 0x9C27B0;
  return 0x666666; // 기본 색상
};

// 농장 구조 생성
const createFarmStructure = (group: THREE.Group) => {
  const levels = 3;
  const levelHeight = 2.5;
  const zoneWidth = 5;
  const zoneDepth = 5;
  
  // 기둥 생성
  const pillarGeometry = new THREE.CylinderGeometry(0.1, 0.1, levels * levelHeight, 8);
  const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
  
  const pillarPositions = [
    [-2.5, 0, -2.5],
    [2.5, 0, -2.5], 
    [-2.5, 0, 2.5],
    [2.5, 0, 2.5]
  ];
  
  pillarPositions.forEach(([x, _unusedY, z]) => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(x, levels * levelHeight / 2, z);
    group.add(pillar);
  });
  
  // 각 층의 바닥 생성
  for (let level = 0; level < levels; level++) {
    const floorY = level * levelHeight + 0.1;
    
    // 좌측 구역
    const leftFloor = createZoneFloor(-2.5, floorY, 0, zoneWidth, zoneDepth);
    group.add(leftFloor);
    
    // 우측 구역  
    const rightFloor = createZoneFloor(2.5, floorY, 0, zoneWidth, zoneDepth);
    group.add(rightFloor);
  }
};

// 구역 바닥 생성
const createZoneFloor = (x: number, y: number, z: number, width: number, depth: number): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(width, 0.1, depth);
  const material = new THREE.MeshLambertMaterial({ 
    color: 0xCCCCCC,
    transparent: true,
    opacity: 0.7
  });
  const floor = new THREE.Mesh(geometry, material);
  floor.position.set(x, y, z);
  return floor;
};

// 센서 모델 로드 (타입별)
export const loadSensorModel = async (sensorType: string): Promise<THREE.Group> => {
  const modelPath = `/models/sensors/${sensorType}.glb`;
  return await loadModel(modelPath);
};

// 식물 모델 로드 (작물별)  
export const loadPlantModel = async (cropType: string): Promise<THREE.Group> => {
  const cropMap: { [key: string]: string } = {
    '상추': 'lettuce',
    '시금치': 'spinach', 
    '케일': 'kale',
    '루꼴라': 'arugula',
    '바질': 'basil',
    '민트': 'mint'
  };
  
  const modelName = cropMap[cropType] || 'lettuce';
  const modelPath = `/models/plants/${modelName}.glb`;
  return await loadModel(modelPath);
};

// 농장 구조 모델 로드
export const loadFarmStructureModel = async (): Promise<THREE.Group> => {
  const modelPath = '/models/farm-structure.glb';
  return await loadModel(modelPath);
};

// 모델 캐시 정리
export const clearModelCache = () => {
  modelCache.clear();
};

// 모델 프리로드 (성능 최적화)
export const preloadModels = async () => {
  const modelPaths = [
    '/models/farm-structure.glb',
    '/models/sensors/temperature.glb',
    '/models/sensors/humidity.glb', 
    '/models/sensors/soil-moisture.glb',
    '/models/sensors/light.glb',
    '/models/sensors/co2.glb',
    '/models/plants/lettuce.glb',
    '/models/plants/spinach.glb',
    '/models/plants/kale.glb',
    '/models/plants/arugula.glb',
    '/models/plants/basil.glb',
    '/models/plants/mint.glb'
  ];
  
  console.log('Preloading 3D models...');
  
  // 병렬로 모델 로드
  const loadPromises = modelPaths.map(async (path) => {
    try {
      await loadModel(path);
      console.log(`✓ Loaded: ${path}`);
    } catch (error) {
      console.warn(`✗ Failed to load: ${path}`);
    }
  });
  
  await Promise.allSettled(loadPromises);
  console.log('Model preloading completed');
};