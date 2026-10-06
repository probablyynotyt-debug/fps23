import * as THREE from 'three';
import { buildSniperRifle } from './sniperModelBuilder';
import {
  createTacticalFabricTexture,
  createPolymerStippleTexture,
  createBaseplateTexture,
} from './textureGenerator';

export interface TargetDummy {
  group: THREE.Group;
  pivot: THREE.Group;
  hitMeshes: THREE.Mesh[];
  flinchAngle: number;
  flinchVelocity: number;
  distance: number;
}

/**
 * Builds the complete First-Person Arms + Scaled Sniper Rifle Viewmodel Rig
 */
export function buildFPSViewmodelRig(): { viewmodel: THREE.Group; boltAssembly: THREE.Object3D | null } {
  const viewmodel = new THREE.Group();
  viewmodel.name = 'FPS_Viewmodel';

  // Sniper Rifle Instance
  const sniperContainer = buildSniperRifle();
  sniperContainer.name = 'Equipped_Sniper_Rifle';

  // Find bolt group for animations
  const boltAssembly = sniperContainer.getObjectByName('Bolt_Group') || null;

  // Position and orient the sniper in FPS viewmodel space:
  // -Z is Forward, +X is Right, +Y is Up
  // Realistic FPS weapon scale (scaled down from massive 0.16 to realistic 0.075)
  const sniperPivot = new THREE.Group();
  sniperPivot.name = 'Sniper_Pivot';

  // Rotate so Barrel (+X) points forward (-Z)
  sniperContainer.rotation.y = Math.PI / 2;
  sniperPivot.add(sniperContainer);

  const scale = 0.072;
  sniperPivot.scale.set(scale, scale, scale);

  // Position in natural lower-right FPS hipfire posture (clear center screen)
  sniperPivot.position.set(0.14, -0.15, -0.34);
  viewmodel.add(sniperPivot);

  // ==========================================
  // TACTICAL ARMS & COMBAT GLOVES
  // ==========================================
  const fabricTex = createTacticalFabricTexture();
  const polymerTex = createPolymerStippleTexture();

  // Sleeve Material
  const matSleeve = new THREE.MeshStandardMaterial({
    color: 0x1c2028,
    map: fabricTex.map,
    bumpMap: fabricTex.bumpMap,
    bumpScale: 0.012,
    roughness: 0.88,
    metalness: 0.04,
  });

  // Glove Material
  const matGlove = new THREE.MeshStandardMaterial({
    color: 0x131518,
    map: polymerTex.map,
    bumpMap: polymerTex.bumpMap,
    bumpScale: 0.02,
    roughness: 0.75,
    metalness: 0.1,
  });

  // Knuckle Plate Material
  const matKnucklePlate = new THREE.MeshStandardMaterial({
    color: 0x0c0d10,
    roughness: 0.32,
    metalness: 0.75,
  });

  // Helper to build an articulated finger
  const buildFinger = (lengths: number[], radius: number, curlAngle: number): THREE.Group => {
    const fingerGroup = new THREE.Group();
    let currentJoint = fingerGroup;

    lengths.forEach((len, idx) => {
      const segGeo = new THREE.CylinderGeometry(radius * (1 - idx * 0.15), radius * (1 - (idx + 1) * 0.15), len, 10);
      segGeo.translate(0, len / 2, 0);
      const segMesh = new THREE.Mesh(segGeo, matGlove);
      currentJoint.add(segMesh);

      const knuckleGeo = new THREE.SphereGeometry(radius * (1.05 - idx * 0.12), 8, 8);
      const knuckleMesh = new THREE.Mesh(knuckleGeo, matKnucklePlate);
      currentJoint.add(knuckleMesh);

      if (idx < lengths.length - 1) {
        const nextJoint = new THREE.Group();
        nextJoint.position.set(0, len, 0);
        nextJoint.rotation.x = curlAngle;
        currentJoint.add(nextJoint);
        currentJoint = nextJoint;
      }
    });

    return fingerGroup;
  };

  // ----------------------------------------------------
  // RIGHT HAND & ARM (Grip & Trigger)
  // ----------------------------------------------------
  const rightArmGroup = new THREE.Group();
  rightArmGroup.name = 'Right_Arm_Group';

  // Forearm Sleeve
  const rForearmGeo = new THREE.CylinderGeometry(0.042, 0.055, 0.35, 14);
  const rForearm = new THREE.Mesh(rForearmGeo, matSleeve);
  rForearm.position.set(0.25, -0.28, -0.22);
  rForearm.rotation.set(0.68, 0.12, -0.32);
  rightArmGroup.add(rForearm);

  // Right Hand & Palm
  const rHandGroup = new THREE.Group();
  rHandGroup.position.set(0.15, -0.18, -0.33);
  rHandGroup.rotation.set(0.2, -0.1, -0.15);

  const rPalmGeo = new THREE.BoxGeometry(0.055, 0.06, 0.035);
  const rPalm = new THREE.Mesh(rPalmGeo, matGlove);
  rHandGroup.add(rPalm);

  const rKnuckleGeo = new THREE.BoxGeometry(0.05, 0.024, 0.015);
  const rKnuckle = new THREE.Mesh(rKnuckleGeo, matKnucklePlate);
  rKnuckle.position.set(0.003, 0.014, 0.019);
  rHandGroup.add(rKnuckle);

  // Right Thumb
  const rThumb = buildFinger([0.024, 0.02], 0.011, -0.45);
  rThumb.position.set(-0.024, -0.008, 0.01);
  rThumb.rotation.set(0.4, 0.8, -0.6);
  rHandGroup.add(rThumb);

  // Right Index Finger
  const rIndex = buildFinger([0.028, 0.022, 0.016], 0.009, -0.2);
  rIndex.position.set(0.02, 0.02, -0.006);
  rIndex.rotation.set(0.1, -0.1, 0.0);
  rHandGroup.add(rIndex);

  // Curled Lower Fingers
  const rLowerFingers = [
    { y: 0.003, z: -0.016, curl: -1.2, len: [0.026, 0.02, 0.014] },
    { y: -0.015, z: -0.016, curl: -1.25, len: [0.024, 0.018, 0.013] },
    { y: -0.03, z: -0.016, curl: -1.3, len: [0.02, 0.016, 0.011] },
  ];
  rLowerFingers.forEach((cfg) => {
    const finger = buildFinger(cfg.len, 0.009, cfg.curl);
    finger.position.set(0.018, cfg.y, cfg.z);
    finger.rotation.set(-0.2, 0, 0.1);
    rHandGroup.add(finger);
  });

  rightArmGroup.add(rHandGroup);
  viewmodel.add(rightArmGroup);

  // ----------------------------------------------------
  // LEFT HAND & ARM (Handguard Support)
  // ----------------------------------------------------
  const leftArmGroup = new THREE.Group();
  leftArmGroup.name = 'Left_Arm_Group';

  const lForearmGeo = new THREE.CylinderGeometry(0.042, 0.055, 0.42, 14);
  const lForearm = new THREE.Mesh(lForearmGeo, matSleeve);
  lForearm.position.set(-0.02, -0.28, -0.38);
  lForearm.rotation.set(0.95, -0.38, 0.32);
  leftArmGroup.add(lForearm);

  const lHandGroup = new THREE.Group();
  lHandGroup.position.set(0.11, -0.16, -0.48);
  lHandGroup.rotation.set(0.35, 0.25, -0.6);

  const lPalmGeo = new THREE.BoxGeometry(0.055, 0.055, 0.032);
  const lPalm = new THREE.Mesh(lPalmGeo, matGlove);
  lHandGroup.add(lPalm);

  const lThumb = buildFinger([0.026, 0.02], 0.011, -0.4);
  lThumb.position.set(0.026, 0.02, 0.01);
  lThumb.rotation.set(-0.3, -0.6, 0.4);
  lHandGroup.add(lThumb);

  const lFingers = [
    { x: -0.024, curl: -0.9, len: [0.026, 0.02, 0.015] },
    { x: -0.008, curl: -0.95, len: [0.028, 0.022, 0.016] },
    { x: 0.008, curl: -0.95, len: [0.026, 0.02, 0.015] },
    { x: 0.022, curl: -1.0, len: [0.022, 0.016, 0.012] },
  ];
  lFingers.forEach((cfg) => {
    const finger = buildFinger(cfg.len, 0.009, cfg.curl);
    finger.position.set(cfg.x, 0.028, 0.008);
    finger.rotation.set(0.4, 0, 0);
    lHandGroup.add(finger);
  });

  leftArmGroup.add(lHandGroup);
  viewmodel.add(leftArmGroup);

  // Enable casting shadows on hands
  viewmodel.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return { viewmodel, boltAssembly };
}

/**
 * Builds the 3D Baseplate Environment with Tactical Shooting Dummies
 */
export function buildBaseplateEnvironment(): { envGroup: THREE.Group; targets: TargetDummy[] } {
  const envGroup = new THREE.Group();
  envGroup.name = 'Baseplate_Environment';

  const baseplateTex = createBaseplateTexture();

  // 1. Primary Baseplate Slab (600m x 600m)
  const groundGeo = new THREE.PlaneGeometry(600, 600, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({
    map: baseplateTex.map,
    roughnessMap: baseplateTex.roughnessMap,
    roughness: 0.82,
    metalness: 0.15,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  envGroup.add(ground);

  // 2. Tactical Obstacles & Training Structures
  const matObstacle = new THREE.MeshStandardMaterial({ color: 0x222733, roughness: 0.7, metalness: 0.2 });
  const matAccent = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4, metalness: 0.5 });
  const matPillar = new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.6, metalness: 0.3 });

  const createCoverBlock = (x: number, z: number, w: number, h: number, d: number) => {
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const box = new THREE.Mesh(boxGeo, matObstacle);
    box.position.set(x, h / 2, z);
    box.castShadow = true;
    box.receiveShadow = true;
    envGroup.add(box);

    const stripeGeo = new THREE.BoxGeometry(w + 0.02, 0.12, d + 0.02);
    const stripe = new THREE.Mesh(stripeGeo, matAccent);
    stripe.position.set(x, h - 0.1, z);
    envGroup.add(stripe);
  };

  const blocks = [
    { x: 10, z: -15, w: 4, h: 1.8, d: 2 },
    { x: -10, z: -25, w: 3.5, h: 2.2, d: 2 },
    { x: 16, z: -35, w: 5, h: 1.4, d: 3 },
    { x: -14, z: -45, w: 4, h: 3.0, d: 2 },
    { x: 0, z: -65, w: 8, h: 2.4, d: 3 },
    { x: 22, z: 0, w: 4, h: 1.2, d: 10 },
    { x: -22, z: 0, w: 4, h: 1.2, d: 10 },
    { x: 28, z: -40, w: 6, h: 1.6, d: 6 },
    { x: -28, z: -40, w: 6, h: 1.6, d: 6 },
    { x: 0, z: -30, w: 6, h: 0.9, d: 1.2 },
    { x: 8, z: -90, w: 10, h: 1.5, d: 4 },
    { x: -8, z: -120, w: 12, h: 2.0, d: 4 },
  ];
  blocks.forEach((b) => createCoverBlock(b.x, b.z, b.w, b.h, b.d));

  // Boundary Monolith Pillars
  const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 28, 8);
  const pillarPositions = [
    [-60, -60], [60, -60], [-60, 60], [60, 60],
    [-120, -120], [120, -120], [-120, 120], [120, 120],
    [0, -160], [0, 160], [-160, 0], [160, 0]
  ];
  pillarPositions.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, matPillar);
    pillar.position.set(px, 14, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    envGroup.add(pillar);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    beacon.position.set(px, 28.5, pz);
    envGroup.add(beacon);
  });

  // ==========================================
  // 3. 3D TACTICAL SHOOTING DUMMIES / TARGETS
  // ==========================================
  const targets: TargetDummy[] = [];

  // Materials for Shooting Dummy
  const matDummyStand = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.85, roughness: 0.3 });
  const matDummySpring = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
  const matTorsoPlate = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
  const matBullseye = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.5 });
  const matHeadPlate = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 });
  const matHitFeedback = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const createShootingDummy = (x: number, z: number, rotationY = 0): TargetDummy => {
    const dummyGroup = new THREE.Group();
    dummyGroup.position.set(x, 0, z);
    dummyGroup.rotation.y = rotationY;

    // 1. Static Ground Base Stand
    const baseLegGeo = new THREE.BoxGeometry(1.2, 0.08, 0.15);
    const leg1 = new THREE.Mesh(baseLegGeo, matDummyStand);
    leg1.position.set(0, 0.04, 0);
    const leg2 = new THREE.Mesh(baseLegGeo, matDummyStand);
    leg2.rotation.y = Math.PI / 2;
    leg2.position.set(0, 0.04, 0);
    dummyGroup.add(leg1, leg2);

    // Vertical Stand Pipe
    const standPipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16);
    const standPipe = new THREE.Mesh(standPipeGeo, matDummyStand);
    standPipe.position.set(0, 0.44, 0);
    dummyGroup.add(standPipe);

    // Heavy Spring Coil
    const springGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 16);
    const spring = new THREE.Mesh(springGeo, matDummySpring);
    spring.position.set(0, 0.88, 0);
    dummyGroup.add(spring);

    // 2. Reactive Flinch Pivot (Hinges backward when shot)
    const flinchPivot = new THREE.Group();
    flinchPivot.position.set(0, 0.95, 0);
    dummyGroup.add(flinchPivot);

    const hitMeshes: THREE.Mesh[] = [];

    // Upper Support Bar
    const upBarGeo = new THREE.BoxGeometry(0.08, 0.6, 0.06);
    const upBar = new THREE.Mesh(upBarGeo, matDummyStand);
    upBar.position.set(0, 0.3, 0);
    flinchPivot.add(upBar);

    // Humanoid Torso Plate (IPSC Silhouette)
    const torsoGeo = new THREE.BoxGeometry(0.72, 0.9, 0.05);
    const torso = new THREE.Mesh(torsoGeo, matTorsoPlate);
    torso.position.set(0, 0.55, 0.02);
    torso.castShadow = true;
    torso.receiveShadow = true;
    (torso as unknown as { isTargetMesh: boolean }).isTargetMesh = true;
    hitMeshes.push(torso);
    flinchPivot.add(torso);

    // Center Chest Bullseye Ring
    const ringGeo = new THREE.TorusGeometry(0.18, 0.025, 12, 24);
    const ring = new THREE.Mesh(ringGeo, matBullseye);
    ring.position.set(0, 0.58, 0.05);
    flinchPivot.add(ring);

    // Center Bullseye Dot
    const dotGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    dotGeo.rotateX(Math.PI / 2);
    const dot = new THREE.Mesh(dotGeo, matBullseye);
    dot.position.set(0, 0.58, 0.052);
    (dot as unknown as { isTargetMesh: boolean }).isTargetMesh = true;
    hitMeshes.push(dot);
    flinchPivot.add(dot);

    // Head Zone Plate
    const headGeo = new THREE.BoxGeometry(0.32, 0.35, 0.05);
    const head = new THREE.Mesh(headGeo, matHeadPlate);
    head.position.set(0, 1.15, 0.02);
    head.castShadow = true;
    (head as unknown as { isTargetMesh: boolean }).isTargetMesh = true;
    hitMeshes.push(head);
    flinchPivot.add(head);

    // Head Bullseye Marker
    const headDotGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    headDotGeo.rotateX(Math.PI / 2);
    const headDot = new THREE.Mesh(headDotGeo, matBullseye);
    headDot.position.set(0, 1.15, 0.052);
    flinchPivot.add(headDot);

    // Shoulder Chamfers
    [-0.32, 0.32].forEach((sx) => {
      const chamferGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 3);
      const chamfer = new THREE.Mesh(chamferGeo, matTorsoPlate);
      chamfer.position.set(sx, 0.95, 0.02);
      flinchPivot.add(chamfer);
    });

    envGroup.add(dummyGroup);

    const dist = Math.hypot(x, z);
    return {
      group: dummyGroup,
      pivot: flinchPivot,
      hitMeshes,
      flinchAngle: 0,
      flinchVelocity: 0,
      distance: Math.round(dist),
    };
  };

  // Place dummies at tactical firing range distances
  const dummyPositions = [
    // Close Range (15m - 25m)
    { x: -4, z: -16, rot: 0.1 },
    { x: 5, z: -22, rot: -0.15 },
    // Medium Range (35m - 55m)
    { x: -12, z: -38, rot: 0.25 },
    { x: 0, z: -48, rot: 0.0 },
    { x: 15, z: -55, rot: -0.2 },
    // Long Range (75m - 120m)
    { x: -18, z: -78, rot: 0.15 },
    { x: 6, z: -105, rot: -0.05 },
    { x: -8, z: -135, rot: 0.08 },
    { x: 20, z: -145, rot: -0.1 },
    // Flanking targets
    { x: 32, z: -25, rot: -0.6 },
    { x: -32, z: -30, rot: 0.6 },
  ];

  dummyPositions.forEach((dp) => {
    targets.push(createShootingDummy(dp.x, dp.z, dp.rot));
  });

  return { envGroup, targets };
}
