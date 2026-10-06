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
    scene.background = new THREE.Color(0x0e1117);
    scene.fog = new THREE.FogExp2(0x0e1117, 0.005);

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
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Environment Lighting
    const envRenderTarget = createStudioEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

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

    const skyFill = new THREE.DirectionalLight(0xa5c8ff, 1.4);
    skyFill.position.set(-50, 45, -60);
    scene.add(skyFill);

    const ambientLight = new THREE.AmbientLight(0x283040, 0.9);
    scene.add(ambientLight);

    // 5. Build Baseplate Proving Grounds & Shooting Dummies
    const { envGroup, targets } = buildBaseplateEnvironment();
    scene.add(envGroup);

    const targetMeshes: { mesh: THREE.Mesh; dummy: TargetDummy }[] = [];
    targets.forEach((dummy) => {
      dummy.hitMeshes.forEach((mesh) => {
        targetMeshes.push({ mesh, dummy });
      });
    });

    // 6. Build Sleek Futuristic Viewmodel Rig
    const { viewmodel: viewmodelRig, boltAssembly } = buildFPSViewmodelRig();
    camera.add(viewmodelRig);
    scene.add(camera);

    // Muzzle Flash
    const flashLight = new THREE.PointLight(0x38bdf8, 0, 15);
    flashLight.position.set(0.14, -0.15, -1.05);
    camera.add(flashLight);

    const flashGeo = new THREE.OctahedronGeometry(0.12, 0);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0 });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.set(0.14, -0.14, -1.1);
    camera.add(flashMesh);

    // Particle Pools
    const hitParticles: HitParticle[] = [];
    const particleGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const dustMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true });

    const ejectedCasings: EjectedCasing[] = [];
    const casingGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.07, 10);
    const casingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });

    // ==========================================
    // 7. FPS PLAYER & MOVEMENT STATE
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

    let isAiming = false;
    let currentAds = 0;

    let canShoot = true;
    let boltActionTimer = 0;
    let recoilIntensity = 0;
    let cameraRecoilPitch = 0;
    let cameraRecoilYaw = 0;
    let muzzleFlashLife = 0;
    let boltState: 'idle' | 'unlock' | 'pull' | 'push' | 'lock' = 'idle';

    const hipfirePos = new THREE.Vector3(0, 0, 0);
    const hipfireRot = new THREE.Euler(0, 0, 0);

    const adsTargetPos = new THREE.Vector3(-0.14, 0.048, 0.12);
    const adsTargetRot = new THREE.Euler(0, 0, 0);

    let mouseDeltaX = 0;
    let mouseDeltaY = 0;
    const baseSensitivity = 0.0022;

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

    const raycaster = new THREE.Raycaster();

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

    const spawnEjectedCasing = () => {
      const casingMesh = new THREE.Mesh(casingGeo, casingMat);
      const spawnPos = new THREE.Vector3(0.18, -0.12, -0.3).applyMatrix4(camera.matrixWorld);
      casingMesh.position.copy(spawnPos);
      casingMesh.castShadow = true;
      scene.add(casingMesh);

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

    const fireWeapon = () => {
      if (!canShoot || boltState !== 'idle') return;

      soundEngine.playGunshot();

      recoilIntensity = 1.0;
      cameraRecoilPitch = 0.055 + Math.random() * 0.015;
      cameraRecoilYaw = (Math.random() - 0.5) * 0.015;

      muzzleFlashLife = 0.07;
      flashLight.intensity = 8.0;
      flashMat.opacity = 1.0;
      flashMesh.rotation.z = Math.random() * Math.PI;

      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hitCandidates = targetMeshes.map((t) => t.mesh);
      const intersects = raycaster.intersectObjects(hitCandidates, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const match = targetMeshes.find((t) => t.mesh === hit.object);
        if (match) {
          match.dummy.flinchVelocity = 12.5;
          spawnHitImpact(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0));

          soundEngine.playHitmarker();
          setHitmarkerActive(true);
          setHitDistance(match.dummy.distance);
          setTimeout(() => setHitmarkerActive(false), 160);
        }
      }

      canShoot = false;
      boltActionTimer = 1.35;
      boltState = 'unlock';
    };

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== container) {
        container.requestPointerLock();
        return;
      }

      if (e.button === 0) {
        fireWeapon();
      } else if (e.button === 2) {
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
      const scopedSensitivityMult = THREE.MathUtils.lerp(1.0, 0.32, currentAds);
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
    // 8. MAIN RENDER & PHYSICS TICK
    // ==========================================
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. ADS Interpolation
      const adsSpeed = isAiming ? 8.5 : 9.5;
      currentAds = THREE.MathUtils.lerp(currentAds, isAiming ? 1.0 : 0.0, Math.min(1, adsSpeed * dt));
      setAdsProgress(currentAds);

      // 2. Mouse Look Updates
      playerState.yaw -= mouseDeltaX * baseSensitivity;
      playerState.pitch -= mouseDeltaY * baseSensitivity;

      // =======================================================
      // SMOOTH MAGNETIC AIM ASSIST (Only active while scoped)
      // =======================================================
      if (currentAds > 0.3) {
        let bestTarget: TargetDummy | null = null;
        let minScreenDist = 0.32; // Aim assist cone radius in NDC

        const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

        targets.forEach((dummy) => {
          // Target center point (chest height)
          const targetWorldPos = new THREE.Vector3();
          dummy.group.getWorldPosition(targetWorldPos);
          targetWorldPos.y += 1.45; // Center chest/head height

          const toTarget = targetWorldPos.clone().sub(camera.position);
          const distForward = toTarget.dot(cameraForward);

          if (distForward > 1.0) {
            // Project into screen space (-1 to 1)
            const ndc = targetWorldPos.clone().project(camera);
            const screenDist = Math.hypot(ndc.x, ndc.y);

            if (screenDist < minScreenDist) {
              minScreenDist = screenDist;
              bestTarget = dummy;
            }
          }
        });

        if (bestTarget) {
          const targetWorldPos = new THREE.Vector3();
          (bestTarget as TargetDummy).group.getWorldPosition(targetWorldPos);
          targetWorldPos.y += 1.45;

          const toTarget = targetWorldPos.clone().sub(camera.position);
          const desiredYaw = Math.atan2(-toTarget.x, -toTarget.z);
          const horizDist = Math.hypot(toTarget.x, toTarget.z);
          const desiredPitch = Math.atan2(toTarget.y, horizDist);

          // Wrap angle difference to [-PI, PI]
          let yawDiff = desiredYaw - playerState.yaw;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;

          const pitchDiff = desiredPitch - playerState.pitch;

          // Smooth magnetic pull strength (gentle assistance, not a hard snap)
          const assistProximityFactor = Math.max(0, 1.0 - minScreenDist / 0.32);
          const pullSpeed = 4.2 * dt * currentAds * assistProximityFactor;

          playerState.yaw += yawDiff * THREE.MathUtils.clamp(pullSpeed, 0, 0.35);
          playerState.pitch += pitchDiff * THREE.MathUtils.clamp(pullSpeed, 0, 0.35);
        }
      }

      // Camera Recoil Recovery
      playerState.pitch += cameraRecoilPitch;
      playerState.yaw += cameraRecoilYaw;
      cameraRecoilPitch *= Math.exp(-18 * dt);
      cameraRecoilYaw *= Math.exp(-18 * dt);

      // Clamped Pitch (-85 to +85 deg)
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

      const isMovingForward = keys.forward && !keys.backward;
      playerState.isSprinting = keys.shift && isMovingForward && playerState.isGrounded && !playerState.isSliding && !isAiming;

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

      sunLight.position.set(playerState.position.x + 40, 90, playerState.position.z + 60);
      sunLight.target.position.set(playerState.position.x, 0, playerState.position.z);
      sunLight.target.updateMatrixWorld();

      // Dynamic FOV (75 base down to 22 scoped magnification)
      const baseFOV = playerState.isSliding ? 84 : playerState.isSprinting ? 82 : 75;
      const targetFOV = THREE.MathUtils.lerp(baseFOV, 22, currentAds);
      camera.fov += (targetFOV - camera.fov) * Math.min(1, 14 * dt);
      camera.updateProjectionMatrix();

      // 4. Bolt Action & Recoil
      if (muzzleFlashLife > 0) {
        muzzleFlashLife -= dt;
        if (muzzleFlashLife <= 0) {
          flashLight.intensity = 0;
          flashMat.opacity = 0;
        }
      }

      recoilIntensity *= Math.exp(-12 * dt);

      if (boltActionTimer > 0) {
        boltActionTimer -= dt;
        const cycleProgress = 1.0 - boltActionTimer / 1.35;

        if (cycleProgress < 0.25) {
          boltState = 'idle';
        } else if (cycleProgress < 0.42) {
          if (boltState !== 'unlock') {
            boltState = 'unlock';
            soundEngine.playBoltUnlock();
          }
          if (boltAssembly) {
            const tLift = (cycleProgress - 0.25) / 0.17;
            boltAssembly.rotation.x = THREE.MathUtils.lerp(0, -Math.PI * 0.35, tLift);
          }
        } else if (cycleProgress < 0.65) {
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
          if (boltState !== 'push') {
            boltState = 'push';
            soundEngine.playBoltSlideForward();
          }
          if (boltAssembly) {
            const tPush = (cycleProgress - 0.65) / 0.2;
            boltAssembly.position.z = THREE.MathUtils.lerp(-0.65, 0, tPush);
          }
        } else if (cycleProgress < 1.0) {
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

      // 5. Viewmodel Dynamics
      const horizSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z);
      const isMoving = horizSpeed > 0.5 && playerState.isGrounded;
      const bobFreq = playerState.isSprinting ? 12.5 : isMoving ? 8.5 : 2.0;
      bobTime += dt * bobFreq;

      const targetVmPos = new THREE.Vector3();
      const targetVmRot = new THREE.Euler();

      targetVmPos.lerpVectors(hipfirePos, adsTargetPos, currentAds);
      targetVmRot.x = THREE.MathUtils.lerp(hipfireRot.x, adsTargetRot.x, currentAds);
      targetVmRot.y = THREE.MathUtils.lerp(hipfireRot.y, adsTargetRot.y, currentAds);
      targetVmRot.z = THREE.MathUtils.lerp(hipfireRot.z, adsTargetRot.z, currentAds);

      const adsSwayDamping = THREE.MathUtils.lerp(1.0, 0.12, currentAds);

      targetVmPos.x -= mouseDeltaX * 0.0003 * adsSwayDamping;
      targetVmPos.y += mouseDeltaY * 0.0003 * adsSwayDamping;
      targetVmRot.y -= mouseDeltaX * 0.0005 * adsSwayDamping;
      targetVmRot.x -= mouseDeltaY * 0.0005 * adsSwayDamping;
      targetVmRot.z += mouseDeltaX * 0.0004 * adsSwayDamping;

      mouseDeltaX *= Math.exp(-20 * dt);
      mouseDeltaY *= Math.exp(-20 * dt);

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

      landingDip *= Math.exp(-12 * dt);
      targetVmPos.y -= landingDip * adsSwayDamping;

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

      targetVmPos.z += recoilIntensity * 0.08;
      targetVmPos.y += recoilIntensity * 0.03;
      targetVmRot.x += recoilIntensity * 0.14;

      const vmInterpSpeed = isAiming ? 18.0 : 15.0;
      vmOffsetPos.lerp(targetVmPos, Math.min(1, vmInterpSpeed * dt));
      vmOffsetRot.x += (targetVmRot.x - vmOffsetRot.x) * Math.min(1, vmInterpSpeed * dt);
      vmOffsetRot.y += (targetVmRot.y - vmOffsetRot.y) * Math.min(1, vmInterpSpeed * dt);
      vmOffsetRot.z += (targetVmRot.z - vmOffsetRot.z) * Math.min(1, vmInterpSpeed * dt);

      viewmodelRig.position.copy(vmOffsetPos);
      viewmodelRig.rotation.set(vmOffsetRot.x, vmOffsetRot.y, vmOffsetRot.z);

      // 6. Target Dummies Spring Physics
      targets.forEach((dummy) => {
        if (Math.abs(dummy.flinchVelocity) > 0.001 || Math.abs(dummy.flinchAngle) > 0.001) {
          const kSpring = 65.0;
          const cDamper = 7.5;
          const springForce = -kSpring * dummy.flinchAngle - cDamper * dummy.flinchVelocity;

          dummy.flinchVelocity += springForce * dt;
          dummy.flinchAngle += dummy.flinchVelocity * dt;

          dummy.pivot.rotation.x = -dummy.flinchAngle;
        }
      });

      // 7. Particles & Casings
      for (let i = hitParticles.length - 1; i >= 0; i--) {
        const p = hitParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          hitParticles.splice(i, 1);
          continue;
        }

        p.velocity.y += -18.0 * dt;
        p.mesh.position.addScaledVector(p.velocity, dt);
        const scaleProgress = 1.0 - p.life / p.maxLife;
        p.mesh.scale.setScalar(scaleProgress);
      }

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
      className="relative w-screen h-screen overflow-hidden select-none touch-none bg-[#0e1117] cursor-crosshair"
    >
      {/* Clean Roblox FPS-Style Precision Scope Overlay */}
      <ScopeOverlay adsProgress={adsProgress} />

      {/* Dynamic Hitmarker Crosshair Feedback */}
      {hitmarkerActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="relative w-8 h-8 flex items-center justify-center animate-ping duration-150">
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
