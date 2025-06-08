import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FarmZone } from '../../types/farm.types';
import { Sensor } from '../../types/sensor.types';

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
  onZoneClick?: (zoneId: string | null) => void; 
  onSensorClick?: (sensorId: string) => void;
}

const DEFAULT_ZONE_COLOR = 0x007bff; // Blue - Can be changed to a more earthy tone
const SELECTED_ZONE_COLOR = 0x28a745; // Green
const ZONE_OPACITY = 0.5; // Slightly increased opacity for better visibility
const GROUND_COLOR = 0x8B4513; // Brown for soil, or 0x228B22 for grass
const SKY_COLOR = 0x87CEEB; // Sky blue

// Simplified Greenhouse Model Constants
const GREENHOUSE_WIDTH = 3.5; // X-axis (across gable end)
const GREENHOUSE_DEPTH = 5; // Z-axis (along ridge/eaves)
const GREENHOUSE_WALL_HEIGHT = 2.5; // Y-axis for vertical walls
const GREENHOUSE_ROOF_PEAK_ADD_HEIGHT = 1.0; // Additional height from wall top to roof peak
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


export const FarmModel: React.FC<FarmModelProps> = ({
  scene,
  zones,
  selectedZoneId,
  // onZoneClick, // Not directly used in FarmModel, handled by FarmViewer
  // onSensorClick // Not directly used in FarmModel, handled by FarmViewer
}) => {
  const farmGroupRef = useRef<THREE.Group>(new THREE.Group());
  const zoneGroupRef = useRef<THREE.Group>(new THREE.Group());
  const sensorGroupRef = useRef<THREE.Group>(new THREE.Group());
  const lightsGroupRef = useRef<THREE.Group>(new THREE.Group()); // Group for lights

  // Add main groups and basic scene setup
  useEffect(() => {
    scene.add(farmGroupRef.current);
    scene.add(zoneGroupRef.current);
    scene.add(sensorGroupRef.current);
    scene.add(lightsGroupRef.current);

    // Sky
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
    // Configure shadow properties for better quality (optional, can be performance intensive)
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    lightsGroupRef.current.add(directionalLight);


    return () => {
      scene.remove(farmGroupRef.current);
      scene.remove(zoneGroupRef.current);
      scene.remove(sensorGroupRef.current);
      scene.remove(lightsGroupRef.current);
      scene.background = null; // Reset background

      [farmGroupRef, zoneGroupRef, sensorGroupRef, lightsGroupRef].forEach(groupRef => {
        if (groupRef.current) {
          groupRef.current.traverse(object => {
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
            } else if (object instanceof THREE.Light) {
              // Lights don't have geometry/material to dispose in the same way,
              // but good to handle if specific light disposal is needed.
            }
          });
          groupRef.current.clear();
        }
      });
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
    const roofPanelSlantedLength = Math.sqrt(Math.pow(halfWidth, 2) + Math.pow(GREENHOUSE_ROOF_PEAK_ADD_HEIGHT, 2)); // Full slant length between frame centers
    const roofPanelActualDepth = GREENHOUSE_DEPTH; // Span full depth
    const roofAngle = Math.atan2(GREENHOUSE_ROOF_PEAK_ADD_HEIGHT, halfWidth);

    // Position Y to be on top of frame elements, accounting for slant
    const roofPanelCenterY = GREENHOUSE_WALL_HEIGHT + (GREENHOUSE_ROOF_PEAK_ADD_HEIGHT / 2) + greenhouseInitialYOffset + FRAME_THICKNESS / 2;

    // Left Roof Panel
    const leftRoofPanelGeo = new THREE.PlaneGeometry(roofPanelActualDepth, roofPanelSlantedLength); // Depth along local X, SlantLength along local Y
    const visualRoofAngle = roofAngle * 0.9; // Make panels visually a bit flatter
    const leftRoofPanelMesh = new THREE.Mesh(leftRoofPanelGeo, wallMaterial);
    leftRoofPanelMesh.rotation.x = visualRoofAngle; // Slant the panel: outer edge down, inner edge up
    
    const leftRoofGroup = new THREE.Group();
    leftRoofGroup.add(leftRoofPanelMesh);
    leftRoofGroup.rotation.y = Math.PI / 2; // Rotate group to align panel's depth (local X) with global Z
    const leftRoofPanelX = -halfWidth / 2;
    leftRoofGroup.position.set(leftRoofPanelX, roofPanelCenterY, 0);
    leftRoofGroup.name = "greenhousePart";
    greenhouseGroup.add(leftRoofGroup);

    // Right Roof Panel
    const rightRoofPanelGeo = new THREE.PlaneGeometry(roofPanelActualDepth, roofPanelSlantedLength);
    const rightRoofPanelMesh = new THREE.Mesh(rightRoofPanelGeo, wallMaterial);
    rightRoofPanelMesh.rotation.x = visualRoofAngle; // Slant the panel: outer edge down, inner edge up

    const rightRoofGroup = new THREE.Group();
    rightRoofGroup.add(rightRoofPanelMesh);
    rightRoofGroup.rotation.y = -Math.PI / 2; // Rotate group to align panel's depth (local X) with global Z
    const rightRoofPanelX = halfWidth / 2;
    rightRoofGroup.position.set(rightRoofPanelX, roofPanelCenterY, 0);
    rightRoofGroup.name = "greenhousePart";
    greenhouseGroup.add(rightRoofGroup);
    
    // Gable end walls (triangular part) - Adjust Y positions and vertex definitions
    const gableShape = new THREE.Shape();
    // Vertices relative to the shape's origin, adjusted to meet frame centers
    gableShape.moveTo(-halfWidth + FRAME_THICKNESS * 0.5, GREENHOUSE_WALL_HEIGHT - FRAME_THICKNESS * 0.5); // Bottom-left of triangle
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
    }
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

      // Section A for tier i+1
      const zoneIdA = `floor-${i + 1}-A`;
      const positionXA = -(PIPE_TIER_AISLE_WIDTH / 2 + sectionWidth / 2);
      const zoneMeshA = createZoneMesh(
        zoneIdA,
        sectionWidth, zoneHeight, tierDepthActual,
        positionXA, tierBaseY, zonePosZ,
        selectedZoneId
      );
      zoneGroupRef.current.add(zoneMeshA);

      // Section B for tier i+1
      const zoneIdB = `floor-${i + 1}-B`;
      const positionXB = (PIPE_TIER_AISLE_WIDTH / 2 + sectionWidth / 2);
      const zoneMeshB = createZoneMesh(
        zoneIdB,
        sectionWidth, zoneHeight, tierDepthActual,
        positionXB, tierBaseY, zonePosZ,
        selectedZoneId
      );
      zoneGroupRef.current.add(zoneMeshB);
    }
  // }, [zones, selectedZoneId]); // Original dependencies
  // Dependencies should include selectedZoneId for color updates, and any constants used if they could change.
  // For now, assuming constants are stable and only selectedZoneId triggers re-render of zones for color change.
  }, [selectedZoneId, NUM_PIPE_TIERS, GREENHOUSE_DEPTH, PIPE_TIER_DEPTH_RATIO, GREENHOUSE_WIDTH, PIPE_TIER_WIDTH_RATIO, PIPE_TIER_AISLE_WIDTH, PIPE_TIER_THICKNESS, greenhouseInitialYOffset, PIPE_TIER_INITIAL_Y_OFFSET, PIPE_TIER_SPACING_Y]);

  // 3. Visualize Sensors
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

  return null;
};