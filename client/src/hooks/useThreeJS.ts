import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ThreeJSHook {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  isLoading: boolean;
  error: string | null;
}

export const useThreeJS = (): ThreeJSHook => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      console.log('🔧 useThreeJS: Initializing Three.js');

      // Scene 생성
      const newScene = new THREE.Scene();
      newScene.background = new THREE.Color(0xa8d5a8); // 자연스러운 농장 그린 배경

      // 부모 컨테이너 크기 가져오기
      const parent = canvasRef.current.parentElement;
      const width = parent?.clientWidth || 800;
      const height = parent?.clientHeight || 600;

      // Camera 생성 (부모 컨테이너 비율로 설정)
      const newCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      newCamera.position.set(10, 10, 10);
      newCamera.lookAt(0, 0, 0);

      // Renderer 생성 (성능 최적화)
      const newRenderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: false, // 안티앨리어싱 비활성화로 성능 향상
        powerPreference: "high-performance" // 고성능 GPU 사용
      });
      newRenderer.setSize(width, height);
      newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 픽셀 비율 제한
      
      // 그림자 설정 최적화
      newRenderer.shadowMap.enabled = true;
      newRenderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap 대신 PCFShadowMap 사용
      
      // 색상 관리 최적화
      newRenderer.outputColorSpace = THREE.SRGBColorSpace;

      // 조명 설정
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      newScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      newScene.add(directionalLight);

      // 테스트 큐브 추가
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0.5, 0);
      newScene.add(cube);

      setScene(newScene);
      setCamera(newCamera);
      setRenderer(newRenderer);
      setIsLoading(false);
      setError(null);

      console.log('✅ useThreeJS: Three.js initialized successfully');

      // 초기 렌더링
      newRenderer.render(newScene, newCamera);

    } catch (err) {
      console.error('❌ useThreeJS: Initialization failed', err);
      setError('3D 엔진 초기화에 실패했습니다.');
      setIsLoading(false);
    }

    return () => {
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  // 리사이즈 핸들러
  useEffect(() => {
    if (!camera || !renderer || !canvasRef.current) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const { clientWidth, clientHeight } = parent;
      
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [camera, renderer]);

  return {
    canvasRef,
    scene,
    camera,
    renderer,
    isLoading,
    error
  };
};