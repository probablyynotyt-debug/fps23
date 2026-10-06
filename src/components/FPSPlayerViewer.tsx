import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildFPSViewmodelRig, buildBaseplateEnvironment, TargetDummy } from '../utils/fpsRigBuilder';
import { createStudioEnvironmentMap } from '../utils/textureGenerator';
import { ScopeOverlay } from './ScopeOverlay';
import { soundEngine } from '../utils/audioSystem';

interface HitParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface EjectedCasing {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  life: number;
}

export const FPSPlayerViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [adsProgress, setAdsProgress] = useState(0);
  const [hitmarkerActive, setHitmarkerActive] = useState(false);
  const [hitDistance, setHitDistance] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.006);

    // 2. Camera Setup (First Person)
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.02,
      1200
    );

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Environment & Lighting Setup
    const envRenderTarget = createStudioEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

    // Sun / Key Sky Light
    const sunLight = new THREE.DirectionalLight(0xfff5ea, 2.6);
    sunLight.position.set(40, 90, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 300;
    const shadowDist = 55;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.radius = 2.0;
    scene.add(sunLight);

    // Sky Fill Light
    const skyFill = new THREE.DirectionalLight(0xa5c8ff, 1.4);
    skyFill.position.set(-50, 45, -60);
    scene.add(skyFill);

    const ambientLight = new THREE.AmbientLight(0x242a36, 0.85);
    scene.add(ambientLight);

    // 5. Build Baseplate Proving Grounds & Shooting Dummies
    const { envGroup, targets } = buildBaseplateEnvironment();
    scene.add(envGroup);

    // Flatten all target hit meshes for fast raycasting
    const targetMeshes: { mesh: THREE.Mesh; dummy: TargetDummy }[] = [];
    targets.forEach((dummy) => {
      dummy.hitMeshes.forEach((mesh) => {
        targetMeshes.push({ mesh, dummy });
      });
    });

    // 6. Build First-Person Viewmodel Rig (Sniper + Tactical Arms)
    const { viewmodel: viewmodelRig, boltAssembly } = buildFPSViewmodelRig();
    camera.add(viewmodelRig);
    scene.add(camera);

    // ==========================================
    // MUZZLE FLASH & PARTICLES
    // ==========================================
    // Muzzle Flash Light
    const flashLight = new THREE.PointLight(0xffaa44, 0, 15);
    flashLight.position.set(0.14, -0.15, -1.05);
    camera.add(flashLight);

    // Muzzle Flash Visual Star
    const flashGeo = new THREE.OctahedronGeometry(0.14, 0);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.set(0.14, -0.14, -1.1);
    camera.add(flashMesh);

    // Particle Pools
    const hitParticles: HitParticle[] = [];
    const particleGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const dustMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true });

    // Ejected Brass Casings
    const ejectedCasings: EjectedCasing[] = [];
    const casingGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 10);
    const casingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });

    // ==========================================
    // 7. FPS PLAYER MOVEMENT & PHYSICS STATE
    // ==========================================
    const STAND_EYE_HEIGHT = 1.72;
    const SLIDE_EYE_HEIGHT = 0.85;

    const playerState = {
      position: new THREE.Vector3(0, STAND_EYE_HEIGHT, 12),
      velocity: new THREE.Vector3(0, 0, 0),
      currentEyeHeight: STAND_EYE_HEIGHT,
      targetEyeHeight: STAND_EYE_HEIGHT,
      yaw: 0,
      pitch: 0,
      isGrounded: true,
      isSprinting: false,
      isSliding: false,
      slideTimer: 0,
      slideDirection: new THREE.Vector3(),
    };

    // ADS (Aim Down Sights) State
    let isAiming = false;
    let currentAds = 0; // 0 to 1

    // Shooting & Bolt Action State
    let canShoot = true;
    let boltActionTimer = 0;
    let recoilIntensity = 0;
    let cameraRecoilPitch = 0;
    let cameraRecoilYaw = 0;
    let muzzleFlashLife = 0;
    let boltState: 'idle' | 'unlock' | 'pull' | 'push' | 'lock' = 'idle';

    // Base Hipfire & ADS Viewmodel Offsets (scaled, natural FPS positioning)
    const hipfirePos = new THREE.Vector3(0, 0, 0);
    const hipfireRot = new THREE.Euler(0, 0, 0);

    // ADS Viewmodel Center Alignment (places the optic bore directly in camera line-of-sight)
    const adsTargetPos = new THREE.Vector3(-0.14, 0.048, 0.12);
    const adsTargetRot = new THREE.Euler(0, 0, 0);

    // Smooth Mouse Look
    let mouseDeltaX = 0;
    let mouseDeltaY = 0;
    const baseSensitivity = 0.0022;

    // Keyboard state
    const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
      slide: false,
      space: false,
    };

    let bobTime = 0;
    const vmOffsetPos = new THREE.Vector3();
    const vmOffsetRot = new THREE.Euler();
    let landingDip = 0;

    // Raycaster for hitscan shooting
    const raycaster = new THREE.Raycaster();

    // Spawn sparks and dust at hit point
    const spawnHitImpact = (point: THREE.Vector3, normal: THREE.Vector3) => {
      for (let i = 0; i < 12; i++) {
        const pMesh = new THREE.Mesh(particleGeo, Math.random() > 0.4 ? sparkMat : dustMat);
        pMesh.position.copy(point);
        scene.add(pMesh);

        const spread = 2.5;
        const vel = new THREE.Vector3(
          normal.x * 2.0 + (Math.random() - 0.5) * spread,
          normal.y * 2.0 + Math.random() * spread + 1.0,
          normal.z * 2.0 + (Math.random() - 0.5) * spread
        );

        hitParticles.push({
          mesh: pMesh,
          velocity: vel,
          life: 0,
          maxLife: 0.35 + Math.random() * 0.25,
        });
      }
    };

    // Eject Brass Casing from chamber
    const spawnEjectedCasing = () => {
      const casingMesh = new THREE.Mesh(casingGeo, casingMat);
      // Spawn slightly to the right of camera
      const spawnPos = new THREE.Vector3(0.18, -0.12, -0.3).applyMatrix4(camera.matrixWorld);
      casingMesh.position.copy(spawnPos);
      casingMesh.castShadow = true;
      scene.add(casingMesh);

      // Eject right and slightly back/up relative to camera
      const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      const backDir = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);

      const vel = new THREE.Vector3()
        .addScaledVector(rightDir, 2.8 + Math.random() * 0.8)
        .addScaledVector(upDir, 1.8 + Math.random() * 0.6)
        .addScaledVector(backDir, 0.8 + Math.random() * 0.5);

      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );

      ejectedCasings.push({
        mesh: casingMesh,
        velocity: vel,
        rotVelocity: rotVel,
        life: 0,
      });
    };

    // Fire Weapon Function
    const fireWeapon = () => {
      if (!canShoot || boltState !== 'idle') return;

      // 1. Trigger High-Caliber Sound
      soundEngine.playGunshot();

      // 2. Recoil & Camera Kick
      recoilIntensity = 1.0;
      cameraRecoilPitch = 0.055 + Math.random() * 0.015; // Visceral upward kick
      cameraRecoilYaw = (Math.random() - 0.5) * 0.015;

      // 3. Muzzle Flash
      muzzleFlashLife = 0.07;
      flashLight.intensity = 8.0;
      flashMat.opacity = 1.0;
      flashMesh.rotation.z = Math.random() * Math.PI;

      // 4. Raycast Shooting Ballistics
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hitCandidates = targetMeshes.map((t) => t.mesh);
      const intersects = raycaster.intersectObjects(hitCandidates, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const match = targetMeshes.find((t) => t.mesh === hit.object);
        if (match) {
          // Trigger Dummy Flinch
          match.dummy.flinchVelocity = 12.5; // Strong spring recoil
          spawnHitImpact(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0));

          // Audio & Visual Hitmarker
          soundEngine.playHitmarker();
          setHitmarkerActive(true);
          setHitDistance(match.dummy.distance);
          setTimeout(() => setHitmarkerActive(false), 160);
        }
      }

      // 5. Start Bolt-Action Cycle
      canShoot = false;
      boltActionTimer = 1.35; // 1.35s total cycle
      boltState = 'unlock';
    };

    // Input Listeners
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== container) {
        container.requestPointerLock();
        return;
      }

      if (e.button === 0) {
        // Left Click: Shoot
        fireWeapon();
      } else if (e.button === 2) {
        // Right Click: Toggle/Hold ADS
        isAiming = !isAiming;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.shift = true;
          break;
        case 'KeyC':
        case 'ControlLeft':
        case 'ControlRight':
          keys.slide = true;
          break;
        case 'Space':
          keys.space = true;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.shift = false;
          break;
        case 'KeyC':
        case 'ControlLeft':
        case 'ControlRight':
          keys.slide = false;
          break;
        case 'Space':
          keys.space = false;
          break;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== container) return;
      // Precision mouse sensitivity scaling when scoped in
      const scopedSensitivityMult = THREE.MathUtils.lerp(1.0, 0.28, currentAds);
      mouseDeltaX += e.movementX * scopedSensitivityMult;
      mouseDeltaY += e.movementY * scopedSensitivityMult;
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === container;
      setIsLocked(locked);
      if (!locked) isAiming = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    // ==========================================
    // 8. MAIN RENDER & PHYSICS LOOP
    // ==========================================
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. ADS Interpolation (Smooth 0 <-> 1 transition)
      const adsSpeed = isAiming ? 8.5 : 9.5;
      currentAds = THREE.MathUtils.lerp(currentAds, isAiming ? 1.0 : 0.0, Math.min(1, adsSpeed * dt));
      setAdsProgress(currentAds);

      // 2. Mouse Look Updates
      playerState.yaw -= mouseDeltaX * baseSensitivity;
      playerState.pitch -= mouseDeltaY * baseSensitivity;

      // Apply and decay Camera Recoil Kick
      playerState.pitch += cameraRecoilPitch;
      playerState.yaw += cameraRecoilYaw;
      cameraRecoilPitch *= Math.exp(-18 * dt);
      cameraRecoilYaw *= Math.exp(-18 * dt);

      // Clamped Pitch (-85 deg to +85 deg)
      const maxPitch = Math.PI / 2 - 0.05;
      playerState.pitch = Math.max(-maxPitch, Math.min(maxPitch, playerState.pitch));

      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.y = playerState.yaw;
      euler.x = playerState.pitch;
      euler.z = playerState.isSliding ? -0.04 : 0;
      camera.quaternion.setFromEuler(euler);

      // 3. Movement Physics (WASD, Sprint, Slide, Jump)
      const moveDir = new THREE.Vector3();
      if (keys.forward) moveDir.z -= 1;
      if (keys.backward) moveDir.z += 1;
      if (keys.left) moveDir.x -= 1;
      if (keys.right) moveDir.x += 1;

      const isMovingInput = moveDir.lengthSq() > 0.01;
      if (isMovingInput) moveDir.normalize();

      const forwardVec = new THREE.Vector3(-Math.sin(playerState.yaw), 0, -Math.cos(playerState.yaw));
      const rightVec = new THREE.Vector3(Math.cos(playerState.yaw), 0, -Math.sin(playerState.yaw));
      const desiredWorldDir = new THREE.Vector3()
        .addScaledVector(forwardVec, -moveDir.z)
        .addScaledVector(rightVec, moveDir.x);

      // Sprinting (disabled while aiming down sight)
      const isMovingForward = keys.forward && !keys.backward;
      playerState.isSprinting = keys.shift && isMovingForward && playerState.isGrounded && !playerState.isSliding && !isAiming;

      // Slide Trigger
      if (keys.slide && (playerState.isSprinting || playerState.isSliding || desiredWorldDir.lengthSq() > 0) && playerState.isGrounded && !isAiming) {
        if (!playerState.isSliding) {
          playerState.isSliding = true;
          playerState.slideTimer = 1.05;
          playerState.slideDirection.copy(desiredWorldDir.lengthSq() > 0 ? desiredWorldDir : forwardVec).normalize();
          playerState.velocity.x = playerState.slideDirection.x * 13.5;
          playerState.velocity.z = playerState.slideDirection.z * 13.5;
        }
      }

      if (playerState.isSliding) {
        playerState.slideTimer -= dt;
        playerState.targetEyeHeight = SLIDE_EYE_HEIGHT;
        const slideFriction = Math.exp(-2.2 * dt);
        playerState.velocity.x *= slideFriction;
        playerState.velocity.z *= slideFriction;

        if (playerState.slideTimer <= 0 || !playerState.isGrounded || (!keys.slide && playerState.slideTimer < 0.6)) {
          playerState.isSliding = false;
        }
      } else {
        playerState.targetEyeHeight = STAND_EYE_HEIGHT;
      }

      playerState.currentEyeHeight += (playerState.targetEyeHeight - playerState.currentEyeHeight) * Math.min(1, 14 * dt);

      // Ground Speed & Friction
      if (!playerState.isSliding && playerState.isGrounded) {
        let maxSpeed = isAiming ? 3.0 : playerState.isSprinting ? 10.5 : isMovingInput ? 5.8 : 0;
        const targetVelX = desiredWorldDir.x * maxSpeed;
        const targetVelZ = desiredWorldDir.z * maxSpeed;

        const accelRate = isMovingInput ? 16.0 : 18.0;
        playerState.velocity.x += (targetVelX - playerState.velocity.x) * Math.min(1, accelRate * dt);
        playerState.velocity.z += (targetVelZ - playerState.velocity.z) * Math.min(1, accelRate * dt);
      } else if (!playerState.isGrounded) {
        const airControl = 4.5;
        playerState.velocity.x += desiredWorldDir.x * airControl * dt;
        playerState.velocity.z += desiredWorldDir.z * airControl * dt;
      }

      // Jump & Gravity
      const GRAVITY = -24.0;
      const JUMP_FORCE = 8.5;

      if (keys.space && playerState.isGrounded) {
        playerState.velocity.y = JUMP_FORCE;
        playerState.isGrounded = false;
        playerState.isSliding = false;
      }

      playerState.velocity.y += GRAVITY * dt;
      playerState.position.x += playerState.velocity.x * dt;
      playerState.position.z += playerState.velocity.z * dt;
      playerState.position.y += playerState.velocity.y * dt;

      // Ground Floor Collision
      const floorY = playerState.currentEyeHeight;
      if (playerState.position.y <= floorY) {
        if (!playerState.isGrounded && playerState.velocity.y < -3.0) {
          landingDip = Math.min(0.06, Math.abs(playerState.velocity.y) * 0.006);
        }
        playerState.position.y = floorY;
        playerState.velocity.y = 0;
        playerState.isGrounded = true;
      } else {
        playerState.isGrounded = false;
      }

      camera.position.copy(playerState.position);

      // Sun shadow following
      sunLight.position.set(playerState.position.x + 40, 90, playerState.position.z + 60);
      sunLight.target.position.set(playerState.position.x, 0, playerState.position.z);
      sunLight.target.updateMatrixWorld();

      // Dynamic Optical Zoom FOV (75 deg base down to 18 deg high-power scope magnification)
      const baseFOV = playerState.isSliding ? 84 : playerState.isSprinting ? 82 : 75;
      const targetFOV = THREE.MathUtils.lerp(baseFOV, 18, currentAds);
      camera.fov += (targetFOV - camera.fov) * Math.min(1, 14 * dt);
      camera.updateProjectionMatrix();

      // ==========================================
      // 4. BOLT ACTION SEQUENCING & RECOIL RECOVERY
      // ==========================================
      if (muzzleFlashLife > 0) {
        muzzleFlashLife -= dt;
        if (muzzleFlashLife <= 0) {
          flashLight.intensity = 0;
          flashMat.opacity = 0;
        }
      }

      recoilIntensity *= Math.exp(-12 * dt);

      // Bolt Action State Machine
      if (boltActionTimer > 0) {
        boltActionTimer -= dt;
        const cycleProgress = 1.0 - boltActionTimer / 1.35; // 0 to 1

        if (cycleProgress < 0.25) {
          // Recoil settling phase
          boltState = 'idle';
        } else if (cycleProgress < 0.42) {
          // Unlock & Lift Bolt Handle
          if (boltState !== 'unlock') {
            boltState = 'unlock';
            soundEngine.playBoltUnlock();
          }
          if (boltAssembly) {
            const tLift = (cycleProgress - 0.25) / 0.17;
            boltAssembly.rotation.x = THREE.MathUtils.lerp(0, -Math.PI * 0.35, tLift);
          }
        } else if (cycleProgress < 0.65) {
          // Pull Bolt Backwards & Eject Casing
          if (boltState !== 'pull') {
            boltState = 'pull';
            soundEngine.playBoltSlideBack();
            spawnEjectedCasing();
          }
          if (boltAssembly) {
            const tPull = (cycleProgress - 0.42) / 0.23;
            boltAssembly.position.z = THREE.MathUtils.lerp(0, -0.65, tPull);
          }
        } else if (cycleProgress < 0.85) {
          // Push Bolt Forward
          if (boltState !== 'push') {
            boltState = 'push';
            soundEngine.playBoltSlideForward();
          }
          if (boltAssembly) {
            const tPush = (cycleProgress - 0.65) / 0.2;
            boltAssembly.position.z = THREE.MathUtils.lerp(-0.65, 0, tPush);
          }
        } else if (cycleProgress < 1.0) {
          // Lock Bolt Handle Down
          if (boltState !== 'lock') {
            boltState = 'lock';
            soundEngine.playBoltLock();
          }
          if (boltAssembly) {
            const tLock = (cycleProgress - 0.85) / 0.15;
            boltAssembly.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.35, 0, tLock);
          }
        }

        if (boltActionTimer <= 0) {
          canShoot = true;
          boltState = 'idle';
          if (boltAssembly) {
            boltAssembly.rotation.x = 0;
            boltAssembly.position.z = 0;
          }
        }
      }

      // ==========================================
      // 5. VIEWMODEL KINEMATICS & ADS BLEND
      // ==========================================
      const horizSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z);
      const isMoving = horizSpeed > 0.5 && playerState.isGrounded;
      const bobFreq = playerState.isSprinting ? 12.5 : isMoving ? 8.5 : 2.0;
      bobTime += dt * bobFreq;

      const targetVmPos = new THREE.Vector3();
      const targetVmRot = new THREE.Euler();

      // Blend between Hipfire and ADS Base Poses
      targetVmPos.lerpVectors(hipfirePos, adsTargetPos, currentAds);
      targetVmRot.x = THREE.MathUtils.lerp(hipfireRot.x, adsTargetRot.x, currentAds);
      targetVmRot.y = THREE.MathUtils.lerp(hipfireRot.y, adsTargetRot.y, currentAds);
      targetVmRot.z = THREE.MathUtils.lerp(hipfireRot.z, adsTargetRot.z, currentAds);

      // Dampen sway and bobbing when aiming down sights
      const adsSwayDamping = THREE.MathUtils.lerp(1.0, 0.12, currentAds);

      // Mouse Sway
      targetVmPos.x -= mouseDeltaX * 0.0003 * adsSwayDamping;
      targetVmPos.y += mouseDeltaY * 0.0003 * adsSwayDamping;
      targetVmRot.y -= mouseDeltaX * 0.0005 * adsSwayDamping;
      targetVmRot.x -= mouseDeltaY * 0.0005 * adsSwayDamping;
      targetVmRot.z += mouseDeltaX * 0.0004 * adsSwayDamping;

      mouseDeltaX *= Math.exp(-20 * dt);
      mouseDeltaY *= Math.exp(-20 * dt);

      // Locomotion Bobbing
      if (playerState.isGrounded) {
        if (isMoving) {
          const bobAmp = (playerState.isSprinting ? 0.015 : 0.008) * adsSwayDamping;
          targetVmPos.x += Math.cos(bobTime * 0.5) * bobAmp * 0.8;
          targetVmPos.y += Math.abs(Math.sin(bobTime)) * bobAmp;
          targetVmRot.z += Math.cos(bobTime * 0.5) * (bobAmp * 1.2);
          targetVmRot.x += Math.sin(bobTime) * (bobAmp * 1.0);
        } else {
          targetVmPos.y += Math.sin(bobTime) * 0.001 * adsSwayDamping;
          targetVmRot.x += Math.cos(bobTime) * 0.001 * adsSwayDamping;
        }
      }

      // Landing Dip
      landingDip *= Math.exp(-12 * dt);
      targetVmPos.y -= landingDip * adsSwayDamping;

      // Sprint & Slide Poses (only apply in hipfire)
      if (playerState.isSprinting && currentAds < 0.1) {
        targetVmPos.x += 0.03;
        targetVmPos.y -= 0.05;
        targetVmPos.z -= 0.02;
        targetVmRot.x -= 0.22;
        targetVmRot.y += 0.28;
        targetVmRot.z -= 0.24;
      }

      if (playerState.isSliding && currentAds < 0.1) {
        targetVmPos.x += 0.04;
        targetVmPos.y -= 0.03;
        targetVmRot.x += 0.1;
        targetVmRot.z += 0.2;
      }

      // Gunshot Recoil Kick Impulse (Viewmodel snaps backward & tilts up)
      targetVmPos.z += recoilIntensity * 0.08;
      targetVmPos.y += recoilIntensity * 0.03;
      targetVmRot.x += recoilIntensity * 0.14;

      // Smooth Viewmodel Position/Rotation Integration
      const vmInterpSpeed = isAiming ? 18.0 : 15.0;
      vmOffsetPos.lerp(targetVmPos, Math.min(1, vmInterpSpeed * dt));
      vmOffsetRot.x += (targetVmRot.x - vmOffsetRot.x) * Math.min(1, vmInterpSpeed * dt);
      vmOffsetRot.y += (targetVmRot.y - vmOffsetRot.y) * Math.min(1, vmInterpSpeed * dt);
      vmOffsetRot.z += (targetVmRot.z - vmOffsetRot.z) * Math.min(1, vmInterpSpeed * dt);

      viewmodelRig.position.copy(vmOffsetPos);
      viewmodelRig.rotation.set(vmOffsetRot.x, vmOffsetRot.y, vmOffsetRot.z);

      // ==========================================
      // 6. TARGET DUMMIES SPRING REACTION PHYSICS
      // ==========================================
      targets.forEach((dummy) => {
        if (Math.abs(dummy.flinchVelocity) > 0.001 || Math.abs(dummy.flinchAngle) > 0.001) {
          // Spring damper equation: F = -k*x - c*v
          const kSpring = 65.0; // Spring stiffness
          const cDamper = 7.5; // Damping
          const springForce = -kSpring * dummy.flinchAngle - cDamper * dummy.flinchVelocity;

          dummy.flinchVelocity += springForce * dt;
          dummy.flinchAngle += dummy.flinchVelocity * dt;

          dummy.pivot.rotation.x = -dummy.flinchAngle;
        }
      });

      // ==========================================
      // 7. PARTICLES & EJECTED BRASS CASING PHYSICS
      // ==========================================
      // Spark/Dust Particles
      for (let i = hitParticles.length - 1; i >= 0; i--) {
        const p = hitParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          hitParticles.splice(i, 1);
          continue;
        }

        p.velocity.y += -18.0 * dt; // Gravity
        p.mesh.position.addScaledVector(p.velocity, dt);
        const scaleProgress = 1.0 - p.life / p.maxLife;
        p.mesh.scale.setScalar(scaleProgress);
      }

      // Brass Casings
      for (let i = ejectedCasings.length - 1; i >= 0; i--) {
        const c = ejectedCasings[i];
        c.life += dt;
        if (c.life >= 3.0) {
          scene.remove(c.mesh);
          ejectedCasings.splice(i, 1);
          continue;
        }

        c.velocity.y += -18.0 * dt;
        c.mesh.position.addScaledVector(c.velocity, dt);
        c.mesh.rotation.x += c.rotVelocity.x * dt;
        c.mesh.rotation.y += c.rotVelocity.y * dt;
        c.mesh.rotation.z += c.rotVelocity.z * dt;

        // Ground collision bounce
        if (c.mesh.position.y <= 0.03) {
          c.mesh.position.y = 0.03;
          c.velocity.y = -c.velocity.y * 0.35;
          c.velocity.x *= 0.6;
          c.velocity.z *= 0.6;
          c.rotVelocity.multiplyScalar(0.5);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);

      hitParticles.forEach((p) => scene.remove(p.mesh));
      ejectedCasings.forEach((c) => scene.remove(c.mesh));

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      envRenderTarget.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none touch-none bg-[#0a0c10] cursor-crosshair"
    >
      {/* Scope Reticle & Lens Aperture Overlay during ADS */}
      <ScopeOverlay adsProgress={adsProgress} />

      {/* Dynamic Hitmarker Crosshair Feedback */}
      {hitmarkerActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="relative w-8 h-8 flex items-center justify-center animate-ping duration-150">
            {/* Tactical 4-Bar Hitmarker Indicator */}
            <div className="absolute w-2.5 h-[2px] bg-red-500 transform -rotate-45 translate-x-2 -translate-y-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div className="absolute w-2.5 h-[2px] bg-red-500 transform rotate-45 -translate-x-2 -translate-y-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div className="absolute w-2.5 h-[2px] bg-red-500 transform rotate-45 translate-x-2 translate-y-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div className="absolute w-2.5 h-[2px] bg-red-500 transform -rotate-45 -translate-x-2 translate-y-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </div>
          {hitDistance && (
            <div className="absolute translate-y-8 text-[11px] font-mono font-bold text-red-400/90 tracking-wider">
              {hitDistance}M
            </div>
          )}
        </div>
      )}

      {/* Pointer Lock Helper Prompt */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 z-50 pointer-events-none">
          <div className="text-center space-y-2.5 px-6 py-5 bg-slate-900/85 border border-slate-700/60 rounded-xl shadow-2xl backdrop-blur-md max-w-sm">
            <div className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Tactical Sniper Range
            </div>
            <p className="text-xs text-slate-400">
              Click anywhere to lock mouse & engage
            </p>
            <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono text-left">
              <div><span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded mr-1">L-Click</span> Shoot</div>
              <div><span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded mr-1">R-Click</span> Scope (ADS)</div>
              <div><span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded mr-1">WASD</span> Move</div>
              <div><span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded mr-1">Shift</span> Sprint</div>
              <div><span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded mr-1">C/Ctrl</span> Slide</div>
              <div><span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded mr-1">Space</span> Jump</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
