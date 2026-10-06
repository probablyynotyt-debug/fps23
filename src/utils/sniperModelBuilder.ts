import * as THREE from 'three';
import {
  createGunmetalTexture,
  createPolymerStippleTexture,
  createKnurlingTexture,
  createTurretDialTexture,
  createCarbonFiberTexture,
  createReceiverLaserMarkingsTexture,
} from './textureGenerator';

/**
 * Builds a hyperrealistic, fully 3D precision tactical sniper rifle (.338 Lapua / .50 Cal style)
 */
export function buildSniperRifle(): THREE.Group {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'SniperRifle';

  // Load / Generate PBR Textures
  const gunmetal = createGunmetalTexture();
  const polymer = createPolymerStippleTexture();
  const knurling = createKnurlingTexture();
  const turretDialTex = createTurretDialTexture();
  const carbon = createCarbonFiberTexture();
  const laserMarkingsTex = createReceiverLaserMarkingsTexture();

  // Materials definition
  const matReceiver = new THREE.MeshStandardMaterial({
    color: 0x1f2229,
    map: gunmetal.map,
    roughnessMap: gunmetal.roughnessMap,
    bumpMap: gunmetal.bumpMap,
    bumpScale: 0.008,
    metalness: 0.88,
    roughness: 0.26,
    envMapIntensity: 1.2,
  });

  const matBarrel = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    map: gunmetal.map,
    roughnessMap: gunmetal.roughnessMap,
    bumpMap: gunmetal.bumpMap,
    bumpScale: 0.005,
    metalness: 0.92,
    roughness: 0.18,
    envMapIntensity: 1.4,
  });

  const matSteelAccents = new THREE.MeshStandardMaterial({
    color: 0x3a3f4b,
    metalness: 0.95,
    roughness: 0.15,
    envMapIntensity: 1.6,
  });

  const matBrass = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.2,
    envMapIntensity: 1.5,
  });

  const matDarkAnodized = new THREE.MeshStandardMaterial({
    color: 0x121418,
    metalness: 0.82,
    roughness: 0.32,
    bumpMap: gunmetal.bumpMap,
    bumpScale: 0.004,
    envMapIntensity: 1.0,
  });

  const matPolymerGrip = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    map: polymer.map,
    bumpMap: polymer.bumpMap,
    bumpScale: 0.03,
    roughnessMap: polymer.roughnessMap,
    roughness: 0.65,
    metalness: 0.08,
    envMapIntensity: 0.6,
  });

  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x151618,
    roughness: 0.88,
    metalness: 0.04,
    bumpMap: polymer.bumpMap,
    bumpScale: 0.015,
  });

  const matCarbonFiber = new THREE.MeshStandardMaterial({
    color: 0x22262d,
    map: carbon.map,
    bumpMap: carbon.bumpMap,
    bumpScale: 0.012,
    roughness: 0.38,
    metalness: 0.5,
    envMapIntensity: 1.1,
  });

  const matKnurledMetal = new THREE.MeshStandardMaterial({
    color: 0x242831,
    bumpMap: knurling.bumpMap,
    bumpScale: 0.03,
    roughnessMap: knurling.roughnessMap,
    metalness: 0.9,
    roughness: 0.3,
    envMapIntensity: 1.3,
  });

  const matTurretDial = new THREE.MeshStandardMaterial({
    map: turretDialTex,
    metalness: 0.85,
    roughness: 0.25,
    envMapIntensity: 1.1,
  });

  const matLaserMarked = new THREE.MeshStandardMaterial({
    map: laserMarkingsTex,
    metalness: 0.85,
    roughness: 0.28,
    envMapIntensity: 1.1,
  });

  // Multi-coated Optical Glass for Scope Lenses
  const matScopeLens = new THREE.MeshPhysicalMaterial({
    color: 0x102535,
    transmission: 0.6,
    opacity: 0.92,
    transparent: true,
    roughness: 0.02,
    metalness: 0.1,
    ior: 1.62,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    reflectivity: 0.9,
    envMapIntensity: 2.2,
    attenuationColor: new THREE.Color(0x00ffff),
    attenuationDistance: 0.5,
  });

  // Internal Scope Reticle Plate
  const matReticle = new THREE.MeshBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.85,
  });

  // Helper function for adding shadows
  const enableShadows = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  // ==========================================
  // 1. UPPER RECEIVER & MONOLITHIC TOP RAIL
  // ==========================================
  const receiverGroup = new THREE.Group();
  receiverGroup.name = 'Receiver_Group';

  // Main Upper Receiver Block
  const upperGeo = new THREE.BoxGeometry(3.6, 0.72, 0.52);
  const upperMesh = new THREE.Mesh(upperGeo, matReceiver);
  upperMesh.position.set(0.0, 0.18, 0);
  receiverGroup.add(upperMesh);

  // Receiver Side Chamfers / Weight Reduction Bevels
  const chamferGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.5, 16);
  chamferGeo.rotateZ(Math.PI / 2);
  const topChamfer = new THREE.Mesh(chamferGeo, matDarkAnodized);
  topChamfer.position.set(0.0, 0.42, 0);
  receiverGroup.add(topChamfer);

  // Left Side Laser Markings Panel
  const laserPlateGeo = new THREE.PlaneGeometry(1.6, 0.45);
  laserPlateGeo.rotateY(-Math.PI / 2);
  const laserPlate = new THREE.Mesh(laserPlateGeo, matLaserMarked);
  laserPlate.position.set(-0.2, 0.18, -0.262);
  receiverGroup.add(laserPlate);

  // Ejection Port Cutout (Right side)
  const ejectionPortBorderGeo = new THREE.BoxGeometry(1.4, 0.36, 0.06);
  const ejectionPortBorder = new THREE.Mesh(ejectionPortBorderGeo, matDarkAnodized);
  ejectionPortBorder.position.set(0.1, 0.24, 0.26);
  receiverGroup.add(ejectionPortBorder);

  // Shell Deflector Wedge (behind ejection port)
  const deflectorGeo = new THREE.ConeGeometry(0.12, 0.28, 4);
  deflectorGeo.rotateZ(-Math.PI / 2);
  deflectorGeo.rotateX(Math.PI / 4);
  const deflectorMesh = new THREE.Mesh(deflectorGeo, matDarkAnodized);
  deflectorMesh.position.set(-0.7, 0.26, 0.28);
  receiverGroup.add(deflectorMesh);

  // Visible Chamber / Bolt Inside Ejection Port
  const chamberInteriorGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.2, 24);
  chamberInteriorGeo.rotateZ(Math.PI / 2);
  const chamberInterior = new THREE.Mesh(chamberInteriorGeo, matSteelAccents);
  chamberInterior.position.set(0.1, 0.22, 0.08);
  receiverGroup.add(chamberInterior);

  // Brass Cartridge inside Chamber
  const brassCaseGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.7, 20);
  brassCaseGeo.rotateZ(Math.PI / 2);
  const brassCase = new THREE.Mesh(brassCaseGeo, matBrass);
  brassCase.position.set(0.15, 0.22, 0.08);
  receiverGroup.add(brassCase);

  // Takedown Pins & Receiver Screws (Hex sockets)
  const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.56, 16);
  pinGeo.rotateX(Math.PI / 2);
  const pin1 = new THREE.Mesh(pinGeo, matSteelAccents);
  pin1.position.set(-1.4, 0.0, 0);
  const pin2 = new THREE.Mesh(pinGeo, matSteelAccents);
  pin2.position.set(1.4, 0.0, 0);
  receiverGroup.add(pin1, pin2);

  // Full-Length Top Picatinny Rail (MIL-STD-1913) with distinct individual teeth
  const railBaseGeo = new THREE.BoxGeometry(7.2, 0.09, 0.44);
  const railBase = new THREE.Mesh(railBaseGeo, matDarkAnodized);
  railBase.position.set(1.5, 0.58, 0);
  receiverGroup.add(railBase);

  // Rail Teeth Slots
  const railToothGeo = new THREE.BoxGeometry(0.06, 0.05, 0.42);
  const railSlotCount = 48;
  const railStart = -1.9;
  const railSpacing = 0.145;

  const railTeethGroup = new THREE.Group();
  for (let i = 0; i < railSlotCount; i++) {
    const tooth = new THREE.Mesh(railToothGeo, matDarkAnodized);
    tooth.position.set(railStart + i * railSpacing, 0.645, 0);
    railTeethGroup.add(tooth);
  }
  receiverGroup.add(railTeethGroup);

  masterGroup.add(receiverGroup);

  // ==========================================
  // 2. MODULAR FREE-FLOAT HANDGUARD / FOREND
  // ==========================================
  const handguardGroup = new THREE.Group();
  handguardGroup.name = 'Handguard_Group';

  // Octagonal Free-Float Handguard Tube
  const handguardLength = 4.2;
  const handguardGeo = new THREE.CylinderGeometry(0.36, 0.36, handguardLength, 8);
  handguardGeo.rotateZ(Math.PI / 2);
  const handguardMesh = new THREE.Mesh(handguardGeo, matReceiver);
  handguardMesh.position.set(3.8, 0.18, 0);
  handguardGroup.add(handguardMesh);

  // Handguard Barrel Collar Lock Nut
  const collarGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
  collarGeo.rotateZ(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, matDarkAnodized);
  collarMesh.position.set(1.85, 0.18, 0);
  handguardGroup.add(collarMesh);

  // Carbon Fiber Side Reinforcement Panels
  const cfPanelGeo = new THREE.BoxGeometry(3.6, 0.22, 0.03);
  const cfPanelLeft = new THREE.Mesh(cfPanelGeo, matCarbonFiber);
  cfPanelLeft.position.set(3.8, 0.18, -0.36);
  const cfPanelRight = new THREE.Mesh(cfPanelGeo, matCarbonFiber);
  cfPanelRight.position.set(3.8, 0.18, 0.36);
  handguardGroup.add(cfPanelLeft, cfPanelRight);

  // M-LOK / KeyMod Vent Cutouts along Handguard
  const mlockSlotGeo = new THREE.BoxGeometry(0.35, 0.08, 0.74);
  for (let row = 0; row < 7; row++) {
    const slotX = 2.4 + row * 0.48;
    const mlockMesh = new THREE.Mesh(mlockSlotGeo, matDarkAnodized);
    mlockMesh.position.set(slotX, 0.38, 0);
    handguardGroup.add(mlockMesh);

    const mlockBottom = new THREE.Mesh(mlockSlotGeo, matDarkAnodized);
    mlockBottom.position.set(slotX, -0.02, 0);
    handguardGroup.add(mlockBottom);
  }

  // Lower Accessory Rail (Under Handguard for Bipod)
  const lowerRailGeo = new THREE.BoxGeometry(1.6, 0.08, 0.36);
  const lowerRail = new THREE.Mesh(lowerRailGeo, matDarkAnodized);
  lowerRail.position.set(5.0, -0.22, 0);
  handguardGroup.add(lowerRail);

  // Side M-LOK Rail Sections (for tactical flashlights / IR lasers)
  const sideRailGeo = new THREE.BoxGeometry(0.9, 0.24, 0.06);
  const sideRailLeft = new THREE.Mesh(sideRailGeo, matDarkAnodized);
  sideRailLeft.position.set(5.1, 0.18, -0.38);
  const sideRailRight = new THREE.Mesh(sideRailGeo, matDarkAnodized);
  sideRailRight.position.set(5.1, 0.18, 0.38);
  handguardGroup.add(sideRailLeft, sideRailRight);

  masterGroup.add(handguardGroup);

  // ==========================================
  // 3. FLUTED MATCH BARREL & TACTICAL MUZZLE BRAKE
  // ==========================================
  const barrelGroup = new THREE.Group();
  barrelGroup.name = 'Barrel_Group';

  // Heavy Contour Match Barrel
  const barrelLength = 6.2;
  const barrelRadius = 0.16;
  const barrelGeo = new THREE.CylinderGeometry(barrelRadius * 0.9, barrelRadius, barrelLength, 32);
  barrelGeo.rotateZ(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, matBarrel);
  barrelMesh.position.set(5.8, 0.18, 0);
  barrelGroup.add(barrelMesh);

  // Precision Helical / Longitudinal Flutes (Spiral / straight grooves for cooling & rigidity)
  const fluteGeo = new THREE.CylinderGeometry(0.035, 0.035, 4.2, 12);
  fluteGeo.rotateZ(Math.PI / 2);
  const numFlutes = 8;
  for (let f = 0; f < numFlutes; f++) {
    const angle = (f / numFlutes) * Math.PI * 2;
    const fluteMesh = new THREE.Mesh(fluteGeo, matDarkAnodized);
    fluteMesh.position.set(5.6, 0.18 + Math.sin(angle) * (barrelRadius * 0.92), Math.cos(angle) * (barrelRadius * 0.92));
    barrelGroup.add(fluteMesh);
  }

  // Gas Block & Front Barrel Collar
  const gasBlockGeo = new THREE.BoxGeometry(0.4, 0.44, 0.34);
  const gasBlock = new THREE.Mesh(gasBlockGeo, matDarkAnodized);
  gasBlock.position.set(6.8, 0.22, 0);
  barrelGroup.add(gasBlock);

  // Thread Protector / Muzzle Collar
  const muzzleCollarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 24);
  muzzleCollarGeo.rotateZ(Math.PI / 2);
  const muzzleCollar = new THREE.Mesh(muzzleCollarGeo, matKnurledMetal);
  muzzleCollar.position.set(8.85, 0.18, 0);
  barrelGroup.add(muzzleCollar);

  // Heavy Tactical Multi-Baffle Muzzle Brake (.50 / .338 Tanker Style)
  const brakeMainGeo = new THREE.BoxGeometry(1.1, 0.38, 0.52);
  const brakeMain = new THREE.Mesh(brakeMainGeo, matBarrel);
  brakeMain.position.set(9.45, 0.18, 0);
  barrelGroup.add(brakeMain);

  // Angled Side Gas Ports / Baffles
  const baffleCutGeo = new THREE.BoxGeometry(0.16, 0.42, 0.6);
  for (let b = 0; b < 3; b++) {
    const baffle = new THREE.Mesh(baffleCutGeo, matDarkAnodized);
    baffle.position.set(9.15 + b * 0.28, 0.18, 0);
    baffle.rotation.y = -0.25; // 15 deg rearward deflection
    barrelGroup.add(baffle);
  }

  // Top Gas Compensation Vents
  const compVentGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.42, 12);
  for (let v = 0; v < 4; v++) {
    const vent = new THREE.Mesh(compVentGeo, matDarkAnodized);
    vent.position.set(9.1 + v * 0.22, 0.38, 0);
    barrelGroup.add(vent);
  }

  // Muzzle Bore Opening & Interior Rifling Detail
  const boreGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 24);
  boreGeo.rotateZ(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, matDarkAnodized);
  boreMesh.position.set(10.02, 0.18, 0);
  barrelGroup.add(boreMesh);

  // Crown Bevel
  const crownGeo = new THREE.TorusGeometry(0.12, 0.03, 16, 32);
  crownGeo.rotateY(Math.PI / 2);
  const crownMesh = new THREE.Mesh(crownGeo, matSteelAccents);
  crownMesh.position.set(10.0, 0.18, 0);
  barrelGroup.add(crownMesh);

  masterGroup.add(barrelGroup);

  // ==========================================
  // 4. VARIABLE HIGH-POWER SNIPER SCOPE & UNIMOUNT
  // ==========================================
  const scopeGroup = new THREE.Group();
  scopeGroup.name = 'Scope_Group';

  // Heavy Duty Cantilever Unimount Base
  const mountBaseGeo = new THREE.BoxGeometry(2.4, 0.28, 0.46);
  const mountBase = new THREE.Mesh(mountBaseGeo, matDarkAnodized);
  mountBase.position.set(0.1, 0.82, 0);
  scopeGroup.add(mountBase);

  // Picatinny Cross-Bolts & Torx Screws on Mount Base
  const crossBoltGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.54, 16);
  crossBoltGeo.rotateX(Math.PI / 2);
  const bolt1 = new THREE.Mesh(crossBoltGeo, matSteelAccents);
  bolt1.position.set(-0.7, 0.78, 0);
  const bolt2 = new THREE.Mesh(crossBoltGeo, matSteelAccents);
  bolt2.position.set(0.7, 0.78, 0);
  scopeGroup.add(bolt1, bolt2);

  // Scope Rings (Front & Rear 35mm heavy-duty rings with 6-screw caps)
  const ringInnerRadius = 0.22;
  const ringWidth = 0.42;

  const ringGeo = new THREE.CylinderGeometry(ringInnerRadius + 0.1, ringInnerRadius + 0.1, ringWidth, 24);
  ringGeo.rotateZ(Math.PI / 2);

  const frontRing = new THREE.Mesh(ringGeo, matDarkAnodized);
  frontRing.position.set(0.85, 1.25, 0);
  const rearRing = new THREE.Mesh(ringGeo, matDarkAnodized);
  rearRing.position.set(-0.75, 1.25, 0);
  scopeGroup.add(frontRing, rearRing);

  // Scope Ring Cap Hex Screws (4 screws per ring)
  const hexScrewGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 6);
  const ringPositions = [0.85, -0.75];
  ringPositions.forEach((rx) => {
    [-0.14, 0.14].forEach((rz) => {
      const screwTop = new THREE.Mesh(hexScrewGeo, matSteelAccents);
      screwTop.position.set(rx - 0.12, 1.58, rz);
      const screwTop2 = new THREE.Mesh(hexScrewGeo, matSteelAccents);
      screwTop2.position.set(rx + 0.12, 1.58, rz);
      scopeGroup.add(screwTop, screwTop2);
    });
  });

  // Scope Main Body Tube (35mm aircraft aluminum)
  const mainTubeGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.6, 32);
  mainTubeGeo.rotateZ(Math.PI / 2);
  const mainTube = new THREE.Mesh(mainTubeGeo, matDarkAnodized);
  mainTube.position.set(0.1, 1.25, 0);
  scopeGroup.add(mainTube);

  // Scope Objective Bell (Front expanding cone)
  const objBellGeo = new THREE.CylinderGeometry(0.36, 0.2, 0.8, 32);
  objBellGeo.rotateZ(-Math.PI / 2);
  const objBell = new THREE.Mesh(objBellGeo, matDarkAnodized);
  objBell.position.set(1.7, 1.25, 0);
  scopeGroup.add(objBell);

  // Objective Lens Sunshade Extension Cylinder
  const sunshadeGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.9, 32);
  sunshadeGeo.rotateZ(Math.PI / 2);
  const sunshade = new THREE.Mesh(sunshadeGeo, matDarkAnodized);
  sunshade.position.set(2.45, 1.25, 0);
  scopeGroup.add(sunshade);

  // Front Objective Optical Lens (Multi-Coated Glass)
  const objLensGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.04, 32);
  objLensGeo.rotateZ(Math.PI / 2);
  const objLens = new THREE.Mesh(objLensGeo, matScopeLens);
  objLens.position.set(2.8, 1.25, 0);
  scopeGroup.add(objLens);

  // Scope Ocular Eyepiece Bell (Rear)
  const ocularBellGeo = new THREE.CylinderGeometry(0.2, 0.28, 0.65, 32);
  ocularBellGeo.rotateZ(-Math.PI / 2);
  const ocularBell = new THREE.Mesh(ocularBellGeo, matDarkAnodized);
  ocularBell.position.set(-1.45, 1.25, 0);
  scopeGroup.add(ocularBell);

  // Fast-Focus Diopter Ring
  const diopterRingGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.4, 32);
  diopterRingGeo.rotateZ(Math.PI / 2);
  const diopterRing = new THREE.Mesh(diopterRingGeo, matRubber);
  diopterRing.position.set(-1.9, 1.25, 0);
  scopeGroup.add(diopterRing);

  // Rear Ocular Optical Lens
  const ocularLensGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 32);
  ocularLensGeo.rotateZ(Math.PI / 2);
  const ocularLens = new THREE.Mesh(ocularLensGeo, matScopeLens);
  ocularLens.position.set(-2.1, 1.25, 0);
  scopeGroup.add(ocularLens);

  // Magnification Power Zoom Ring with Throw Lever
  const zoomRingGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.3, 32);
  zoomRingGeo.rotateZ(Math.PI / 2);
  const zoomRing = new THREE.Mesh(zoomRingGeo, matKnurledMetal);
  zoomRing.position.set(-1.05, 1.25, 0);
  scopeGroup.add(zoomRing);

  // Zoom Throw Lever Fin
  const throwLeverGeo = new THREE.BoxGeometry(0.12, 0.28, 0.08);
  const throwLever = new THREE.Mesh(throwLeverGeo, matSteelAccents);
  throwLever.position.set(-1.05, 1.55, 0.12);
  throwLever.rotation.x = -0.4;
  scopeGroup.add(throwLever);

  // Scope Turret Saddle (Center Housing)
  const saddleGeo = new THREE.BoxGeometry(0.65, 0.54, 0.54);
  const saddle = new THREE.Mesh(saddleGeo, matDarkAnodized);
  saddle.position.set(0.1, 1.25, 0);
  scopeGroup.add(saddle);

  // Elevation Turret (Top Turret)
  const elevTurretGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.38, 32);
  const elevTurret = new THREE.Mesh(elevTurretGeo, matTurretDial);
  elevTurret.position.set(0.1, 1.68, 0);
  const elevCapGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 32);
  const elevCap = new THREE.Mesh(elevCapGeo, matKnurledMetal);
  elevCap.position.set(0.1, 1.9, 0);
  scopeGroup.add(elevTurret, elevCap);

  // Windage Turret (Right Turret)
  const windTurretGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.34, 32);
  windTurretGeo.rotateX(Math.PI / 2);
  const windTurret = new THREE.Mesh(windTurretGeo, matTurretDial);
  windTurret.position.set(0.1, 1.25, 0.42);
  const windCapGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
  windCapGeo.rotateX(Math.PI / 2);
  const windCap = new THREE.Mesh(windCapGeo, matKnurledMetal);
  windCap.position.set(0.1, 1.25, 0.62);
  scopeGroup.add(windTurret, windCap);

  // Parallax / Illumination Dial (Left Turret)
  const parallaxGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.28, 32);
  parallaxGeo.rotateX(Math.PI / 2);
  const parallax = new THREE.Mesh(parallaxGeo, matKnurledMetal);
  parallax.position.set(0.1, 1.25, -0.38);
  const battCapGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 32);
  battCapGeo.rotateX(Math.PI / 2);
  const battCap = new THREE.Mesh(battCapGeo, matSteelAccents);
  battCap.position.set(0.1, 1.25, -0.54);
  scopeGroup.add(parallax, battCap);

  masterGroup.add(scopeGroup);

  // ==========================================
  // 5. BOLT ACTION MECHANISM & TACTICAL BOLT HANDLE
  // ==========================================
  const boltGroup = new THREE.Group();
  boltGroup.name = 'Bolt_Group';

  // Fluted Stainless Bolt Shroud & Firing Pin Cocking Piece
  const boltShroudGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.6, 24);
  boltShroudGeo.rotateZ(Math.PI / 2);
  const boltShroud = new THREE.Mesh(boltShroudGeo, matDarkAnodized);
  boltShroud.position.set(-1.6, 0.22, 0);
  boltGroup.add(boltShroud);

  // Red Cocking Status Indicator Pin (protruding at rear)
  const cockPinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
  cockPinGeo.rotateZ(Math.PI / 2);
  const cockPinMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.3 });
  const cockPin = new THREE.Mesh(cockPinGeo, cockPinMat);
  cockPin.position.set(-1.95, 0.22, 0);
  boltGroup.add(cockPin);

  // Tactical Swept Bolt Handle Stem
  const handleStemGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.65, 16);
  handleStemGeo.rotateX(-Math.PI / 3); // Angled down 60 deg
  handleStemGeo.rotateY(0.2); // Swept slightly back
  const handleStem = new THREE.Mesh(handleStemGeo, matSteelAccents);
  handleStem.position.set(-1.45, 0.05, 0.3);
  boltGroup.add(handleStem);

  // Oversized Tactical Teardrop Bolt Knob with Knurling Rings
  const knobGeo = new THREE.SphereGeometry(0.14, 20, 20);
  knobGeo.scale(1.0, 1.4, 1.0);
  const boltKnob = new THREE.Mesh(knobGeo, matKnurledMetal);
  boltKnob.position.set(-1.4, -0.18, 0.54);
  boltGroup.add(boltKnob);

  // Bolt Release Lever (Left side of receiver)
  const boltReleaseGeo = new THREE.BoxGeometry(0.22, 0.09, 0.05);
  const boltRelease = new THREE.Mesh(boltReleaseGeo, matSteelAccents);
  boltRelease.position.set(-1.4, 0.34, -0.28);
  boltGroup.add(boltRelease);

  masterGroup.add(boltGroup);

  // ==========================================
  // 6. LOWER RECEIVER, TRIGGER GROUP & DETACHABLE MAGAZINE
  // ==========================================
  const lowerGroup = new THREE.Group();
  lowerGroup.name = 'LowerReceiver_Group';

  // Lower Chassis Receiver Housing
  const lowerGeo = new THREE.BoxGeometry(2.8, 0.45, 0.48);
  const lowerMesh = new THREE.Mesh(lowerGeo, matReceiver);
  lowerMesh.position.set(-0.2, -0.25, 0);
  lowerGroup.add(lowerMesh);

  // Magwell Flare (Flared funnel for rapid magazine insertion)
  const magwellGeo = new THREE.BoxGeometry(1.2, 0.5, 0.52);
  const magwellMesh = new THREE.Mesh(magwellGeo, matReceiver);
  magwellMesh.position.set(0.35, -0.45, 0);
  lowerGroup.add(magwellMesh);

  // Ambidextrous Paddle Magazine Release
  const magReleaseGeo = new THREE.BoxGeometry(0.12, 0.22, 0.16);
  const magRelease = new THREE.Mesh(magReleaseGeo, matSteelAccents);
  magRelease.position.set(-0.3, -0.52, 0);
  lowerGroup.add(magRelease);

  // Enlarged Winter Trigger Guard
  const guardCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.3, -0.48, 0),
    new THREE.Vector3(-0.8, -0.92, 0),
    new THREE.Vector3(-1.25, -0.48, 0)
  );
  const guardGeo = new THREE.TubeGeometry(guardCurve, 20, 0.045, 12, false);
  const triggerGuard = new THREE.Mesh(guardGeo, matDarkAnodized);
  lowerGroup.add(triggerGuard);

  // Curved Match Sniper Trigger (with skeletonized lightening slots)
  const triggerGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.35, 12);
  triggerGeo.rotateZ(0.35);
  const trigger = new THREE.Mesh(triggerGeo, matSteelAccents);
  trigger.position.set(-0.75, -0.62, 0);
  lowerGroup.add(trigger);

  // Ambidextrous Safety Selector Switch (Left & Right)
  const safetyGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.56, 16);
  safetyGeo.rotateX(Math.PI / 2);
  const safetyCore = new THREE.Mesh(safetyGeo, matSteelAccents);
  safetyCore.position.set(-1.1, -0.15, 0);

  const safetyLeverGeo = new THREE.BoxGeometry(0.24, 0.07, 0.04);
  const safetyLeverLeft = new THREE.Mesh(safetyLeverGeo, matSteelAccents);
  safetyLeverLeft.position.set(-1.18, -0.18, -0.29);
  safetyLeverLeft.rotation.z = -0.4;
  const safetyLeverRight = new THREE.Mesh(safetyLeverGeo, matSteelAccents);
  safetyLeverRight.position.set(-1.18, -0.18, 0.29);
  safetyLeverRight.rotation.z = -0.4;
  lowerGroup.add(safetyCore, safetyLeverLeft, safetyLeverRight);

  // Detachable Box Magazine (10-Round Double Stack .338 LM)
  const magBodyGeo = new THREE.BoxGeometry(0.92, 1.25, 0.42);
  const magBody = new THREE.Mesh(magBodyGeo, matDarkAnodized);
  magBody.position.set(0.35, -1.05, 0);
  magBody.rotation.z = -0.1; // Forward slant
  lowerGroup.add(magBody);

  // Magazine Ribs & Reinforcement Grooves
  for (let r = 0; r < 4; r++) {
    const ribGeo = new THREE.BoxGeometry(0.72, 0.05, 0.44);
    const ribMesh = new THREE.Mesh(ribGeo, matSteelAccents);
    ribMesh.position.set(0.35 + r * 0.04, -0.75 - r * 0.2, 0);
    ribMesh.rotation.z = -0.1;
    lowerGroup.add(ribMesh);
  }

  // Magazine Witness Ports (Viewing holes for round count)
  const witnessHoleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 12);
  witnessHoleGeo.rotateX(Math.PI / 2);
  for (let w = 0; w < 3; w++) {
    const hole = new THREE.Mesh(witnessHoleGeo, matBrass);
    hole.position.set(0.48 + w * 0.03, -0.85 - w * 0.22, 0);
    lowerGroup.add(hole);
  }

  // Magazine Baseplate Catch & Finger Pull Pad
  const baseplateGeo = new THREE.BoxGeometry(1.05, 0.14, 0.48);
  const baseplate = new THREE.Mesh(baseplateGeo, matPolymerGrip);
  baseplate.position.set(0.48, -1.68, 0);
  baseplate.rotation.z = -0.1;
  lowerGroup.add(baseplate);

  masterGroup.add(lowerGroup);

  // ==========================================
  // 7. ERGONOMIC TEXTURED PISTOL GRIP
  // ==========================================
  const gripGroup = new THREE.Group();
  gripGroup.name = 'PistolGrip_Group';

  // Grip Upper Tang & Main Ergonomic Body
  const gripGeo = new THREE.BoxGeometry(0.55, 1.3, 0.42);
  const gripMesh = new THREE.Mesh(gripGeo, matPolymerGrip);
  gripMesh.position.set(-1.6, -0.85, 0);
  gripMesh.rotation.z = 0.35; // Ergonomic 20 deg rear rake
  gripGroup.add(gripMesh);

  // Finger Grooves on Front of Grip
  for (let g = 0; g < 3; g++) {
    const grooveGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.38, 16);
    grooveGeo.rotateX(Math.PI / 2);
    const groove = new THREE.Mesh(grooveGeo, matPolymerGrip);
    groove.position.set(-1.38 - g * 0.15, -0.65 - g * 0.28, 0);
    gripGroup.add(groove);
  }

  // Palm Swell Contours (Left & Right)
  const swellGeo = new THREE.SphereGeometry(0.24, 16, 16);
  swellGeo.scale(0.8, 1.4, 0.5);
  const swellLeft = new THREE.Mesh(swellGeo, matPolymerGrip);
  swellLeft.position.set(-1.6, -0.85, -0.18);
  swellLeft.rotation.z = 0.35;
  const swellRight = new THREE.Mesh(swellGeo, matPolymerGrip);
  swellRight.position.set(-1.6, -0.85, 0.18);
  swellRight.rotation.z = 0.35;
  gripGroup.add(swellLeft, swellRight);

  // Grip Bottom Storage Cap & Hex Screw
  const gripCapGeo = new THREE.BoxGeometry(0.58, 0.1, 0.44);
  const gripCap = new THREE.Mesh(gripCapGeo, matDarkAnodized);
  gripCap.position.set(-1.82, -1.48, 0);
  gripCap.rotation.z = 0.35;
  gripGroup.add(gripCap);

  masterGroup.add(gripGroup);

  // ==========================================
  // 8. PRECISION SKELETONIZED MODULAR STOCK
  // ==========================================
  const stockGroup = new THREE.Group();
  stockGroup.name = 'Stock_Group';

  // Stock Folding Hinge Mechanism & Heavy Pivot Pin
  const hingeGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.6, 24);
  const hingeMesh = new THREE.Mesh(hingeGeo, matSteelAccents);
  hingeMesh.position.set(-1.95, 0.12, 0);
  stockGroup.add(hingeMesh);

  // Folding Latch Push Button
  const latchBtnGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.64, 16);
  const latchBtn = new THREE.Mesh(latchBtnGeo, matSteelAccents);
  latchBtn.position.set(-1.95, 0.12, 0);
  stockGroup.add(latchBtn);

  // Upper Strut Tube (Connecting hinge to cheek rest base)
  const upperStrutGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.2, 24);
  upperStrutGeo.rotateZ(Math.PI / 2);
  const upperStrut = new THREE.Mesh(upperStrutGeo, matDarkAnodized);
  upperStrut.position.set(-3.1, 0.18, 0);
  stockGroup.add(upperStrut);

  // Lower Diagonal Strut (Skeletonized bridge)
  const lowerStrutCurve = new THREE.LineCurve3(
    new THREE.Vector3(-1.95, -0.3, 0),
    new THREE.Vector3(-4.1, -0.8, 0)
  );
  const lowerStrutGeo = new THREE.TubeGeometry(lowerStrutCurve, 16, 0.08, 12, false);
  const lowerStrut = new THREE.Mesh(lowerStrutGeo, matDarkAnodized);
  stockGroup.add(lowerStrut);

  // Carbon Fiber Stock Side Spars
  const sparGeo = new THREE.BoxGeometry(1.8, 0.28, 0.04);
  const sparLeft = new THREE.Mesh(sparGeo, matCarbonFiber);
  sparLeft.position.set(-3.1, -0.15, -0.18);
  const sparRight = new THREE.Mesh(sparGeo, matCarbonFiber);
  sparRight.position.set(-3.1, -0.15, 0.18);
  stockGroup.add(sparLeft, sparRight);

  // Height-Adjustable Comb / Cheek Rest Piece (Ergonomic polymer curved top)
  const cheekCurveGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.4, 24, 1, false, 0, Math.PI);
  cheekCurveGeo.rotateZ(Math.PI / 2);
  cheekCurveGeo.rotateX(-Math.PI / 2);
  const cheekRest = new THREE.Mesh(cheekCurveGeo, matPolymerGrip);
  cheekRest.position.set(-3.05, 0.42, 0);
  stockGroup.add(cheekRest);

  // Cheek Rest Stainless Steel Adjustment Pillars (Dual Rods)
  const pillarGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.4, 16);
  const pillar1 = new THREE.Mesh(pillarGeo, matSteelAccents);
  pillar1.position.set(-2.6, 0.25, 0);
  const pillar2 = new THREE.Mesh(pillarGeo, matSteelAccents);
  pillar2.position.set(-3.5, 0.25, 0);
  stockGroup.add(pillar1, pillar2);

  // Cheek Rest Knurled Thumb Screws (Elevation locks)
  const thumbScrewGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.48, 20);
  thumbScrewGeo.rotateX(Math.PI / 2);
  const thumbScrew1 = new THREE.Mesh(thumbScrewGeo, matKnurledMetal);
  thumbScrew1.position.set(-2.6, 0.18, 0);
  const thumbScrew2 = new THREE.Mesh(thumbScrewGeo, matKnurledMetal);
  thumbScrew2.position.set(-3.5, 0.18, 0);
  stockGroup.add(thumbScrew1, thumbScrew2);

  // Length-of-Pull (LOP) Telescoping Extension Carrier & Guide Rods
  const lopCarrierGeo = new THREE.BoxGeometry(0.8, 1.2, 0.38);
  const lopCarrier = new THREE.Mesh(lopCarrierGeo, matReceiver);
  lopCarrier.position.set(-4.4, -0.15, 0);
  stockGroup.add(lopCarrier);

  // Dual Stainless LOP Guide Rods
  const guideRodGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 16);
  guideRodGeo.rotateZ(Math.PI / 2);
  const rodTop = new THREE.Mesh(guideRodGeo, matSteelAccents);
  rodTop.position.set(-4.1, 0.2, 0);
  const rodBottom = new THREE.Mesh(guideRodGeo, matSteelAccents);
  rodBottom.position.set(-4.1, -0.5, 0);
  stockGroup.add(rodTop, rodBottom);

  // Heavy Ribbed Shock-Absorbing Rubber Recoil Buttpad
  const buttpadGeo = new THREE.BoxGeometry(0.35, 1.45, 0.48);
  const buttpad = new THREE.Mesh(buttpadGeo, matRubber);
  buttpad.position.set(-4.95, -0.15, 0);
  stockGroup.add(buttpad);

  // Buttpad Horizontal Traction Ribs
  for (let r = 0; r < 8; r++) {
    const ribPadGeo = new THREE.BoxGeometry(0.06, 0.06, 0.44);
    const ribPad = new THREE.Mesh(ribPadGeo, matDarkAnodized);
    ribPad.position.set(-5.14, 0.45 - r * 0.16, 0);
    stockGroup.add(ribPad);
  }

  // Rear Monopod / Bag Rider Rail (Under Buttstock)
  const monopodRailGeo = new THREE.BoxGeometry(0.9, 0.08, 0.28);
  const monopodRail = new THREE.Mesh(monopodRailGeo, matDarkAnodized);
  monopodRail.position.set(-4.2, -0.82, 0);
  stockGroup.add(monopodRail);

  masterGroup.add(stockGroup);

  // ==========================================
  // 9. TACTICAL HEAVY-DUTY BIPOD (ATLAS / HARRIS STYLE)
  // ==========================================
  const bipodGroup = new THREE.Group();
  bipodGroup.name = 'Bipod_Group';

  // Bipod Picatinny Mount Base & Cant-Lock Lever
  const bipodMountGeo = new THREE.BoxGeometry(0.45, 0.2, 0.44);
  const bipodMount = new THREE.Mesh(bipodMountGeo, matDarkAnodized);
  bipodMount.position.set(4.8, -0.32, 0);
  bipodGroup.add(bipodMount);

  // Cant-Lock Tension Knurled Knob
  const cantKnobGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16);
  cantKnobGeo.rotateZ(Math.PI / 2);
  const cantKnob = new THREE.Mesh(cantKnobGeo, matKnurledMetal);
  cantKnob.position.set(4.8, -0.42, 0);
  bipodGroup.add(cantKnob);

  // Bipod Pivot Yoke
  const yokeGeo = new THREE.BoxGeometry(0.3, 0.18, 0.6);
  const yoke = new THREE.Mesh(yokeGeo, matSteelAccents);
  yoke.position.set(4.8, -0.5, 0);
  bipodGroup.add(yoke);

  // Telescoping Legs (Left and Right - angled outwards and forwards)
  [-1, 1].forEach((side) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(4.8, -0.5, side * 0.28);

    // Upper Leg Tube (Heavy aircraft aluminum)
    const upperLegGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.2, 16);
    const upperLeg = new THREE.Mesh(upperLegGeo, matDarkAnodized);
    upperLeg.position.set(0, -0.55, 0);
    legGroup.add(upperLeg);

    // Leg Extension Locking Collar & Detent Ring
    const collarGeo2 = new THREE.CylinderGeometry(0.095, 0.095, 0.2, 16);
    const collar2 = new THREE.Mesh(collarGeo2, matKnurledMetal);
    collar2.position.set(0, -1.05, 0);
    legGroup.add(collar2);

    // Lower Telescoping Inner Leg (Stainless steel)
    const lowerLegGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 16);
    const lowerLeg = new THREE.Mesh(lowerLegGeo, matSteelAccents);
    lowerLeg.position.set(0, -1.45, 0);
    legGroup.add(lowerLeg);

    // Notched Height Detents along lower leg
    for (let d = 0; d < 5; d++) {
      const notchGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12);
      const notch = new THREE.Mesh(notchGeo, matDarkAnodized);
      notch.position.set(0, -1.2 - d * 0.12, 0);
      legGroup.add(notch);
    }

    // Heavy-Duty Rubber Foot with Traction Ring
    const footGeo = new THREE.ConeGeometry(0.12, 0.25, 16);
    const foot = new THREE.Mesh(footGeo, matRubber);
    foot.position.set(0, -1.95, 0);
    legGroup.add(foot);

    // Dual Recoil Springs on each leg
    const springCurve = new THREE.LineCurve3(new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, -0.85, 0));
    const springGeo = new THREE.TubeGeometry(springCurve, 12, 0.02, 8, false);
    const springMesh = new THREE.Mesh(springGeo, matSteelAccents);
    springMesh.position.set(0.05, 0, side * 0.04);
    legGroup.add(springMesh);

    // Splay the leg outward (Z) and forward (X) for authentic bipod stance
    legGroup.rotation.z = -0.25; // angled forward
    legGroup.rotation.x = side * 0.42; // angled outward

    bipodGroup.add(legGroup);
  });

  masterGroup.add(bipodGroup);

  // Enable casting and receiving realistic shadows on all parts
  enableShadows(masterGroup);

  // ==========================================
  // 10. ACCURATE CENTERING OF PHYSICAL GEOMETRY
  // ==========================================
  // Compute the bounding box of the complete assembled rifle
  const bbox = new THREE.Box3().setFromObject(masterGroup);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  // Shift all rifle sub-elements so the center of mass/visual center is at (0, 0, 0)
  masterGroup.position.sub(center);

  // Wrap inside an outer centered parent group so masterGroup's local position offset is baked
  const centeredContainer = new THREE.Group();
  centeredContainer.name = 'SniperCenteredContainer';
  centeredContainer.add(masterGroup);

  return centeredContainer;
}
