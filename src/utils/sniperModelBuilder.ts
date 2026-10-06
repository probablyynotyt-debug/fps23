import * as THREE from 'three';
import {
  createGunmetalTexture,
  createPolymerStippleTexture,
  createCarbonFiberTexture,
} from './textureGenerator';

/**
 * Builds a clean, sleek, futuristic precision sniper rifle (minimalist, modern high-tech aesthetic)
 */
export function buildSniperRifle(): THREE.Group {
  const masterGroup = new THREE.Group();
  masterGroup.name = 'SleekFuturisticSniper';

  // Load PBR Textures
  const gunmetal = createGunmetalTexture();
  const polymer = createPolymerStippleTexture();
  const carbon = createCarbonFiberTexture();

  // Clean, high-tech PBR materials
  const matBody = new THREE.MeshStandardMaterial({
    color: 0x1a1d24,
    map: gunmetal.map,
    roughnessMap: gunmetal.roughnessMap,
    bumpMap: gunmetal.bumpMap,
    bumpScale: 0.005,
    metalness: 0.9,
    roughness: 0.22,
    envMapIntensity: 1.3,
  });

  const matChassisDark = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.35,
    metalness: 0.8,
    envMapIntensity: 1.1,
  });

  const matAccents = new THREE.MeshStandardMaterial({
    color: 0x2b303c,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 1.5,
  });

  const matCarbon = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    map: carbon.map,
    bumpMap: carbon.bumpMap,
    bumpScale: 0.01,
    roughness: 0.4,
    metalness: 0.5,
  });

  const matGrip = new THREE.MeshStandardMaterial({
    color: 0x15171b,
    map: polymer.map,
    bumpMap: polymer.bumpMap,
    bumpScale: 0.02,
    roughness: 0.7,
    metalness: 0.08,
  });

  const matNeonGlow = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const matScopeLens = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    transmission: 0.75,
    opacity: 0.95,
    transparent: true,
    roughness: 0.02,
    metalness: 0.08,
    ior: 1.55,
    clearcoat: 1.0,
    envMapIntensity: 2.0,
  });

  const enableShadows = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  // ==========================================
  // 1. SLEEK MONOLITHIC CHASSIS & RECEIVER
  // ==========================================
  const chassisGroup = new THREE.Group();
  chassisGroup.name = 'Chassis_Group';

  // Main Upper Receiver Body (Sleek faceted geometric body)
  const upperGeo = new THREE.BoxGeometry(4.2, 0.65, 0.44);
  const upperMesh = new THREE.Mesh(upperGeo, matBody);
  upperMesh.position.set(0.6, 0.15, 0);
  chassisGroup.add(upperMesh);

  // Top Aerodynamic Chamfer Spine
  const spineGeo = new THREE.CylinderGeometry(0.18, 0.22, 4.4, 4);
  spineGeo.rotateZ(Math.PI / 2);
  spineGeo.rotateX(Math.PI / 4);
  const spineMesh = new THREE.Mesh(spineGeo, matChassisDark);
  spineMesh.position.set(0.6, 0.46, 0);
  chassisGroup.add(spineMesh);

  // Sleek Side Inset Carbon Panels (Left & Right)
  const panelGeo = new THREE.BoxGeometry(3.6, 0.32, 0.03);
  const panelL = new THREE.Mesh(panelGeo, matCarbon);
  panelL.position.set(0.6, 0.15, -0.225);
  const panelR = new THREE.Mesh(panelGeo, matCarbon);
  panelR.position.set(0.6, 0.15, 0.225);
  chassisGroup.add(panelL, panelR);

  // Futuristic Cyan Energy Stripe along side chassis
  const stripeGeo = new THREE.BoxGeometry(2.8, 0.03, 0.02);
  const stripeL = new THREE.Mesh(stripeGeo, matNeonGlow);
  stripeL.position.set(0.8, 0.12, -0.235);
  const stripeR = new THREE.Mesh(stripeGeo, matNeonGlow);
  stripeR.position.set(0.8, 0.12, 0.235);
  chassisGroup.add(stripeL, stripeR);

  // Clean Lower Receiver & Trigger Frame
  const lowerGeo = new THREE.BoxGeometry(2.4, 0.45, 0.42);
  const lowerMesh = new THREE.Mesh(lowerGeo, matChassisDark);
  lowerMesh.position.set(0.1, -0.28, 0);
  chassisGroup.add(lowerMesh);

  // Sleek Minimal Trigger Guard
  const guardGeo = new THREE.BoxGeometry(0.7, 0.06, 0.12);
  const guardBottom = new THREE.Mesh(guardGeo, matAccents);
  guardBottom.position.set(-0.65, -0.7, 0);
  const guardFront = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.12), matAccents);
  guardFront.position.set(-0.32, -0.52, 0);
  guardFront.rotation.z = -0.3;
  chassisGroup.add(guardBottom, guardFront);

  // Precision Skeletonized Trigger
  const triggerGeo = new THREE.BoxGeometry(0.04, 0.24, 0.06);
  const trigger = new THREE.Mesh(triggerGeo, matAccents);
  trigger.position.set(-0.6, -0.54, 0);
  trigger.rotation.z = 0.25;
  chassisGroup.add(trigger);

  // Sleek Flush High-Tech Magazine
  const magGeo = new THREE.BoxGeometry(0.85, 0.95, 0.36);
  const magMesh = new THREE.Mesh(magGeo, matChassisDark);
  magMesh.position.set(0.4, -0.8, 0);
  magMesh.rotation.z = -0.15;
  chassisGroup.add(magMesh);

  // Magazine Baseplate Accent
  const magBaseGeo = new THREE.BoxGeometry(0.92, 0.1, 0.4);
  const magBase = new THREE.Mesh(magBaseGeo, matAccents);
  magBase.position.set(0.48, -1.28, 0);
  magBase.rotation.z = -0.15;
  chassisGroup.add(magBase);

  // Magazine Energy Indicator
  const magStripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.38), matNeonGlow);
  magStripe.position.set(0.42, -0.8, 0);
  magStripe.rotation.z = -0.15;
  chassisGroup.add(magStripe);

  masterGroup.add(chassisGroup);

  // ==========================================
  // 2. TAPERED MATCH BARREL & INTEGRATED MUZZLE BRAKE
  // ==========================================
  const barrelGroup = new THREE.Group();
  barrelGroup.name = 'Barrel_Group';

  // Sleek Hexagonal Forend Extension
  const forendGeo = new THREE.CylinderGeometry(0.24, 0.28, 3.2, 6);
  forendGeo.rotateZ(Math.PI / 2);
  const forendMesh = new THREE.Mesh(forendGeo, matBody);
  forendMesh.position.set(4.0, 0.15, 0);
  barrelGroup.add(forendMesh);

  // Tapered Precision Match Barrel
  const barrelLength = 4.8;
  const barrelGeo = new THREE.CylinderGeometry(0.12, 0.15, barrelLength, 24);
  barrelGeo.rotateZ(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeo, matAccents);
  barrelMesh.position.set(7.6, 0.15, 0);
  barrelGroup.add(barrelMesh);

  // Sleek Integrated Futuristic Muzzle Brake
  const brakeGeo = new THREE.BoxGeometry(1.1, 0.28, 0.36);
  const brakeMesh = new THREE.Mesh(brakeGeo, matBody);
  brakeMesh.position.set(10.2, 0.15, 0);
  barrelGroup.add(brakeMesh);

  // Muzzle Gas Port Cutouts
  for (let b = 0; b < 2; b++) {
    const portGeo = new THREE.BoxGeometry(0.18, 0.32, 0.4);
    const port = new THREE.Mesh(portGeo, matChassisDark);
    port.position.set(9.9 + b * 0.35, 0.15, 0);
    port.rotation.y = -0.2;
    barrelGroup.add(port);
  }

  // Muzzle Crown & Bore
  const boreGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.2, 16);
  boreGeo.rotateZ(Math.PI / 2);
  const boreMesh = new THREE.Mesh(boreGeo, matChassisDark);
  boreMesh.position.set(10.75, 0.15, 0);
  barrelGroup.add(boreMesh);

  masterGroup.add(barrelGroup);

  // ==========================================
  // 3. ONE MAIN SLEEK INTEGRATED OPTICAL SCOPE
  // ==========================================
  const scopeGroup = new THREE.Group();
  scopeGroup.name = 'Scope_Group';

  // Integrated Aerodynamic Scope Base Mount (Seamlessly part of top spine)
  const scopeMountGeo = new THREE.BoxGeometry(2.4, 0.25, 0.34);
  const scopeMount = new THREE.Mesh(scopeMountGeo, matChassisDark);
  scopeMount.position.set(0.6, 0.68, 0);
  scopeGroup.add(scopeMount);

  // Sleek Main Scope Housing Tube
  const scopeBodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.8, 24);
  scopeBodyGeo.rotateZ(Math.PI / 2);
  const scopeBody = new THREE.Mesh(scopeBodyGeo, matBody);
  scopeBody.position.set(0.6, 0.95, 0);
  scopeGroup.add(scopeBody);

  // Front Objective Housing Cone
  const frontConeGeo = new THREE.CylinderGeometry(0.28, 0.2, 0.9, 24);
  frontConeGeo.rotateZ(-Math.PI / 2);
  const frontCone = new THREE.Mesh(frontConeGeo, matBody);
  frontCone.position.set(2.4, 0.95, 0);
  scopeGroup.add(frontCone);

  // Front Objective Lens (Glowing Cyan Glass)
  const frontLensGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24);
  frontLensGeo.rotateZ(Math.PI / 2);
  const frontLens = new THREE.Mesh(frontLensGeo, matScopeLens);
  frontLens.position.set(2.85, 0.95, 0);
  scopeGroup.add(frontLens);

  // Rear Ocular Eyepiece Bell
  const rearConeGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.7, 24);
  rearConeGeo.rotateZ(-Math.PI / 2);
  const rearCone = new THREE.Mesh(rearConeGeo, matBody);
  rearCone.position.set(-1.1, 0.95, 0);
  scopeGroup.add(rearCone);

  // Rear Ocular Lens
  const rearLensGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24);
  rearLensGeo.rotateZ(Math.PI / 2);
  const rearLens = new THREE.Mesh(rearLensGeo, matScopeLens);
  rearLens.position.set(-1.45, 0.95, 0);
  scopeGroup.add(rearLens);

  // Clean Low-Profile Elevation Turret (Single sleek top dial)
  const turretGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.18, 20);
  const turret = new THREE.Mesh(turretGeo, matAccents);
  turret.position.set(0.6, 1.2, 0);
  scopeGroup.add(turret);

  // Futuristic Scope Blue Accent Ring
  const ringGeo = new THREE.TorusGeometry(0.282, 0.015, 8, 24);
  ringGeo.rotateY(Math.PI / 2);
  const scopeRing = new THREE.Mesh(ringGeo, matNeonGlow);
  scopeRing.position.set(2.84, 0.95, 0);
  scopeGroup.add(scopeRing);

  masterGroup.add(scopeGroup);

  // ==========================================
  // 4. SLEEK BOLT ACTION HANDLE & BREECH
  // ==========================================
  const boltGroup = new THREE.Group();
  boltGroup.name = 'Bolt_Group';

  // Smooth Bolt Shroud
  const boltShroudGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.6, 20);
  boltShroudGeo.rotateZ(Math.PI / 2);
  const boltShroud = new THREE.Mesh(boltShroudGeo, matAccents);
  boltShroud.position.set(-1.4, 0.18, 0);
  boltGroup.add(boltShroud);

  // Minimalist Swept Bolt Handle Stem
  const handleStemGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.5, 16);
  handleStemGeo.rotateX(-Math.PI / 3.2);
  handleStemGeo.rotateY(0.15);
  const handleStem = new THREE.Mesh(handleStemGeo, matAccents);
  handleStem.position.set(-1.25, 0.06, 0.24);
  boltGroup.add(handleStem);

  // Teardrop Bolt Knob
  const knobGeo = new THREE.SphereGeometry(0.1, 16, 16);
  knobGeo.scale(1.0, 1.3, 1.0);
  const boltKnob = new THREE.Mesh(knobGeo, matChassisDark);
  boltKnob.position.set(-1.2, -0.12, 0.44);
  boltGroup.add(boltKnob);

  masterGroup.add(boltGroup);

  // ==========================================
  // 5. ERGONOMIC FUTURISTIC PISTOL GRIP
  // ==========================================
  const gripGroup = new THREE.Group();
  gripGroup.name = 'PistolGrip_Group';

  const gripGeo = new THREE.BoxGeometry(0.48, 1.25, 0.36);
  const gripMesh = new THREE.Mesh(gripGeo, matGrip);
  gripMesh.position.set(-1.1, -0.85, 0);
  gripMesh.rotation.z = 0.36; // 20 deg ergonomic rake
  gripGroup.add(gripMesh);

  // Grip Base Cap
  const gripCapGeo = new THREE.BoxGeometry(0.52, 0.08, 0.38);
  const gripCap = new THREE.Mesh(gripCapGeo, matAccents);
  gripCap.position.set(-1.3, -1.45, 0);
  gripCap.rotation.z = 0.36;
  gripGroup.add(gripCap);

  masterGroup.add(gripGroup);

  // ==========================================
  // 6. SLEEK SKELETONIZED FUTURISTIC STOCK
  // ==========================================
  const stockGroup = new THREE.Group();
  stockGroup.name = 'Stock_Group';

  // Upper Stock Spine Tube
  const stockSpineGeo = new THREE.BoxGeometry(2.4, 0.28, 0.32);
  const stockSpine = new THREE.Mesh(stockSpineGeo, matChassisDark);
  stockSpine.position.set(-2.6, 0.15, 0);
  stockGroup.add(stockSpine);

  // Diagonal Lower Strut
  const diagStrutGeo = new THREE.BoxGeometry(2.1, 0.16, 0.24);
  const diagStrut = new THREE.Mesh(diagStrutGeo, matChassisDark);
  diagStrut.position.set(-2.5, -0.42, 0);
  diagStrut.rotation.z = 0.38;
  stockGroup.add(diagStrut);

  // Sleek Aerodynamic Cheek Riser
  const cheekGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.4, 16, 1, false, 0, Math.PI);
  cheekGeo.rotateZ(Math.PI / 2);
  cheekGeo.rotateX(-Math.PI / 2);
  const cheekMesh = new THREE.Mesh(cheekGeo, matGrip);
  cheekMesh.position.set(-2.5, 0.34, 0);
  stockGroup.add(cheekMesh);

  // Modern Ergonomic Recoil Buttpad
  const buttpadGeo = new THREE.BoxGeometry(0.28, 1.3, 0.38);
  const buttpad = new THREE.Mesh(buttpadGeo, matGrip);
  buttpad.position.set(-3.85, -0.15, 0);
  stockGroup.add(buttpad);

  // Buttpad Carbon Trim
  const padTrimGeo = new THREE.BoxGeometry(0.08, 1.2, 0.36);
  const padTrim = new THREE.Mesh(padTrimGeo, matAccents);
  padTrim.position.set(-3.7, -0.15, 0);
  stockGroup.add(padTrim);

  masterGroup.add(stockGroup);

  // Enable realistic shadows
  enableShadows(masterGroup);

  // Center the physical geometry
  const bbox = new THREE.Box3().setFromObject(masterGroup);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  masterGroup.position.sub(center);

  const centeredContainer = new THREE.Group();
  centeredContainer.name = 'SniperCenteredContainer';
  centeredContainer.add(masterGroup);

  return centeredContainer;
}
