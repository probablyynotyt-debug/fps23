import * as THREE from 'three';
import { buildSniperRifle } from './sniperModelBuilder';
import {
  createTacticalFabricTexture,
  createPolymerStippleTexture,
  createBaseplateTexture,
} from './textureGenerator';

/**
 * Builds the complete First-Person Arms + Sniper Rifle Viewmodel Rig
 */
export function buildFPSViewmodelRig(): THREE.Group {
  const viewmodel = new THREE.Group();
  viewmodel.name = 'FPS_Viewmodel';

  // Sniper Rifle Instance
  const sniperContainer = buildSniperRifle();
  sniperContainer.name = 'Equipped_Sniper_Rifle';

  // Position and orient the sniper in FPS viewmodel space:
  // In camera space: -Z is Forward, +X is Right, +Y is Up
  // Our sniper model was built with length along X axis (Barrel at +X, Stock at -X).
  // Rotate so Barrel points forward (-Z) and Top Rail faces Up (+Y).
  const sniperPivot = new THREE.Group();
  sniperPivot.name = 'Sniper_Pivot';

  // Apply rotation so +X becomes -Z
  sniperContainer.rotation.y = Math.PI / 2;
  sniperPivot.add(sniperContainer);

  // Viewmodel scale
  const scale = 0.16;
  sniperPivot.scale.set(scale, scale, scale);

  // Position relative to viewmodel root
  sniperPivot.position.set(0.18, -0.22, -0.52);
  viewmodel.add(sniperPivot);

  // ==========================================
  // TACTICAL ARMS & COMBAT GLOVES
  // ==========================================
  const fabricTex = createTacticalFabricTexture();
  const polymerTex = createPolymerStippleTexture();

  // Sleeve Material (Dark tactical ripstop fabric)
  const matSleeve = new THREE.MeshStandardMaterial({
    color: 0x1f232b,
    map: fabricTex.map,
    bumpMap: fabricTex.bumpMap,
    bumpScale: 0.015,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Glove Material (Textured tactical combat leather & polymer)
  const matGlove = new THREE.MeshStandardMaterial({
    color: 0x14161a,
    map: polymerTex.map,
    bumpMap: polymerTex.bumpMap,
    bumpScale: 0.025,
    roughness: 0.72,
    metalness: 0.12,
  });

  // Glove Knuckle Armor Plate Material (Matte composite carbon)
  const matKnucklePlate = new THREE.MeshStandardMaterial({
    color: 0x0f1114,
    roughness: 0.35,
    metalness: 0.7,
  });

  // Glove Palm & Finger Pad Grip Material
  const matFingerPad = new THREE.MeshStandardMaterial({
    color: 0x242832,
    roughness: 0.6,
    metalness: 0.15,
  });

  // Helper to build an articulated finger
  const buildFinger = (lengths: number[], radius: number, curlAngle: number): THREE.Group => {
    const fingerGroup = new THREE.Group();
    let currentJoint = fingerGroup;

    lengths.forEach((len, idx) => {
      const segGeo = new THREE.CylinderGeometry(radius * (1 - idx * 0.15), radius * (1 - (idx + 1) * 0.15), len, 12);
      segGeo.translate(0, len / 2, 0);
      const segMesh = new THREE.Mesh(segGeo, matGlove);
      currentJoint.add(segMesh);

      // Add joint knuckle ring
      const knuckleGeo = new THREE.SphereGeometry(radius * (1.05 - idx * 0.12), 10, 10);
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
  // RIGHT HAND & ARM (Holding Pistol Grip & Trigger Area)
  // ----------------------------------------------------
  const rightArmGroup = new THREE.Group();
  rightArmGroup.name = 'Right_Arm_Group';

  // Right Forearm Sleeve
  const rForearmGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.45, 16);
  const rForearm = new THREE.Mesh(rForearmGeo, matSleeve);
  rForearm.position.set(0.38, -0.42, -0.28);
  rForearm.rotation.set(0.65, 0.15, -0.35);
  rightArmGroup.add(rForearm);

  // Right Sleeve Cuff
  const rCuffGeo = new THREE.TorusGeometry(0.068, 0.012, 10, 20);
  const rCuff = new THREE.Mesh(rCuffGeo, matSleeve);
  rCuff.position.set(0.28, -0.32, -0.42);
  rCuff.rotation.set(0.65, 0.15, -0.35);
  rightArmGroup.add(rCuff);

  // Right Hand / Glove Wrist & Palm
  const rHandGroup = new THREE.Group();
  rHandGroup.position.set(0.2, -0.27, -0.5);
  rHandGroup.rotation.set(0.2, -0.1, -0.15);

  // Palm Body
  const rPalmGeo = new THREE.BoxGeometry(0.085, 0.09, 0.05);
  const rPalm = new THREE.Mesh(rPalmGeo, matGlove);
  rHandGroup.add(rPalm);

  // Hard Knuckle Armor Plate on Back of Hand
  const rKnuckleGeo = new THREE.BoxGeometry(0.078, 0.035, 0.02);
  const rKnuckle = new THREE.Mesh(rKnuckleGeo, matKnucklePlate);
  rKnuckle.position.set(0.005, 0.02, 0.028);
  rHandGroup.add(rKnuckle);

  // Right Thumb (Wrapping around top of grip)
  const rThumb = buildFinger([0.035, 0.03], 0.016, -0.45);
  rThumb.position.set(-0.035, -0.01, 0.015);
  rThumb.rotation.set(0.4, 0.8, -0.6);
  rHandGroup.add(rThumb);

  // Right Index Finger (Resting along trigger frame in safe discipline)
  const rIndex = buildFinger([0.04, 0.032, 0.025], 0.014, -0.2);
  rIndex.position.set(0.03, 0.03, -0.01);
  rIndex.rotation.set(0.1, -0.1, 0.0);
  rHandGroup.add(rIndex);

  // Middle, Ring, Pinky Fingers (Curled firmly around the pistol grip)
  const fingerOffsets = [
    { y: 0.005, z: -0.025, curl: -1.2, len: [0.038, 0.03, 0.022] },
    { y: -0.022, z: -0.025, curl: -1.25, len: [0.035, 0.028, 0.02] },
    { y: -0.045, z: -0.025, curl: -1.3, len: [0.03, 0.024, 0.018] },
  ];
  fingerOffsets.forEach((cfg) => {
    const finger = buildFinger(cfg.len, 0.013, cfg.curl);
    finger.position.set(0.025, cfg.y, cfg.z);
    finger.rotation.set(-0.2, 0, 0.1);
    rHandGroup.add(finger);
  });

  rightArmGroup.add(rHandGroup);
  viewmodel.add(rightArmGroup);

  // ----------------------------------------------------
  // LEFT HAND & ARM (Supporting Handguard / Forend Underside)
  // ----------------------------------------------------
  const leftArmGroup = new THREE.Group();
  leftArmGroup.name = 'Left_Arm_Group';

  // Left Forearm Sleeve extending from bottom-left forward
  const lForearmGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.55, 16);
  const lForearm = new THREE.Mesh(lForearmGeo, matSleeve);
  lForearm.position.set(-0.05, -0.42, -0.55);
  lForearm.rotation.set(0.9, -0.4, 0.35);
  leftArmGroup.add(lForearm);

  // Left Sleeve Cuff
  const lCuffGeo = new THREE.TorusGeometry(0.068, 0.012, 10, 20);
  const lCuff = new THREE.Mesh(lCuffGeo, matSleeve);
  lCuff.position.set(0.08, -0.28, -0.72);
  lCuff.rotation.set(0.9, -0.4, 0.35);
  leftArmGroup.add(lCuff);

  // Left Hand / Glove (Cupping under the rifle handguard)
  const lHandGroup = new THREE.Group();
  lHandGroup.position.set(0.14, -0.24, -0.78);
  lHandGroup.rotation.set(0.35, 0.25, -0.6);

  // Left Palm Body
  const lPalmGeo = new THREE.BoxGeometry(0.085, 0.08, 0.045);
  const lPalm = new THREE.Mesh(lPalmGeo, matGlove);
  lHandGroup.add(lPalm);

  // Left Knuckle Armor
  const lKnuckleGeo = new THREE.BoxGeometry(0.078, 0.032, 0.018);
  const lKnuckle = new THREE.Mesh(lKnuckleGeo, matKnucklePlate);
  lKnuckle.position.set(0.0, -0.02, -0.026);
  lHandGroup.add(lKnuckle);

  // Left Thumb (Resting on side of handguard / top M-LOK rail)
  const lThumb = buildFinger([0.038, 0.032], 0.016, -0.4);
  lThumb.position.set(0.038, 0.03, 0.015);
  lThumb.rotation.set(-0.3, -0.6, 0.4);
  lHandGroup.add(lThumb);

  // Left 4 Fingers (Wrapping under and supporting handguard)
  const lFingers = [
    { x: -0.035, curl: -0.9, len: [0.038, 0.03, 0.022] },
    { x: -0.012, curl: -0.95, len: [0.04, 0.032, 0.024] },
    { x: 0.012, curl: -0.95, len: [0.038, 0.03, 0.022] },
    { x: 0.032, curl: -1.0, len: [0.032, 0.025, 0.018] },
  ];
  lFingers.forEach((cfg) => {
    const finger = buildFinger(cfg.len, 0.0135, cfg.curl);
    finger.position.set(cfg.x, 0.04, 0.01);
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

  return viewmodel;
}

/**
 * Builds the 3D Baseplate Environment with Grid, Proving Grounds Obstacles & Pillars
 */
export function buildBaseplateEnvironment(): THREE.Group {
  const envGroup = new THREE.Group();
  envGroup.name = 'Baseplate_Environment';

  const baseplateTex = createBaseplateTexture();

  // 1. Massive Primary Ground Baseplate Slab (600m x 600m)
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

  // 2. Concrete & Tactical Proving Grounds Obstacles (Pillars, Ramps, Cover Blocks)
  // for spatial speed perception, jumping, sliding, and movement reference
  const matObstacle = new THREE.MeshStandardMaterial({
    color: 0x222733,
    roughness: 0.7,
    metalness: 0.2,
  });

  const matAccentStripe = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.4,
    metalness: 0.5,
  });

  const matPillar = new THREE.MeshStandardMaterial({
    color: 0x1a1e28,
    roughness: 0.6,
    metalness: 0.3,
  });

  // Spawn a series of tactical testing pillars & cover boxes
  const createCoverBlock = (x: number, z: number, w: number, h: number, d: number) => {
    const boxGeo = new THREE.BoxGeometry(w, h, d);
    const box = new THREE.Mesh(boxGeo, matObstacle);
    box.position.set(x, h / 2, z);
    box.castShadow = true;
    box.receiveShadow = true;
    envGroup.add(box);

    // Accent edge stripe
    const stripeGeo = new THREE.BoxGeometry(w + 0.02, 0.12, d + 0.02);
    const stripe = new THREE.Mesh(stripeGeo, matAccentStripe);
    stripe.position.set(x, h - 0.1, z);
    envGroup.add(stripe);
  };

  // Modular cover layout across baseplate
  const blocks = [
    // Center training corridor
    { x: 8, z: -15, w: 4, h: 1.8, d: 2 },
    { x: -8, z: -25, w: 3.5, h: 2.2, d: 2 },
    { x: 14, z: -35, w: 5, h: 1.4, d: 3 },
    { x: -12, z: -45, w: 4, h: 3.0, d: 2 },
    { x: 0, z: -60, w: 8, h: 2.4, d: 3 },
    // Side platforms & low slide tunnels / hurdles
    { x: 20, z: 0, w: 4, h: 1.2, d: 10 },
    { x: -20, z: 0, w: 4, h: 1.2, d: 10 },
    { x: 25, z: -30, w: 6, h: 1.6, d: 6 },
    { x: -25, z: -30, w: 6, h: 1.6, d: 6 },
    // Low slide arches / barriers
    { x: 0, z: -30, w: 6, h: 0.9, d: 1.2 },
    { x: 6, z: -80, w: 10, h: 1.5, d: 4 },
    { x: -6, z: -100, w: 12, h: 2.0, d: 4 },
  ];

  blocks.forEach((b) => createCoverBlock(b.x, b.z, b.w, b.h, b.d));

  // Tall Boundary & Orientation Monolith Pillars
  const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 28, 8);
  const pillarPositions = [
    [-60, -60], [60, -60], [-60, 60], [60, 60],
    [-120, -120], [120, -120], [-120, 120], [120, 120],
    [0, -150], [0, 150], [-150, 0], [150, 0]
  ];

  pillarPositions.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, matPillar);
    pillar.position.set(px, 14, pz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    envGroup.add(pillar);

    // Glowing tip beacon
    const beaconGeo = new THREE.SphereGeometry(0.8, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(px, 28.5, pz);
    envGroup.add(beacon);
  });

  return envGroup;
}
