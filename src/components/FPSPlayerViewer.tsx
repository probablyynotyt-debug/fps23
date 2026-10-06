import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildFPSViewmodelRig, buildBaseplateEnvironment } from '../utils/fpsRigBuilder';
import { createStudioEnvironmentMap } from '../utils/textureGenerator';

export const FPSPlayerViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1117);
    scene.fog = new THREE.FogExp2(0x0e1117, 0.008);

    // 2. Camera Setup (First Person)
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.05,
      1000
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
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Environment & Lighting Setup
    const envRenderTarget = createStudioEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

    // Sun / Key Sky Light
    const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.5);
    sunLight.position.set(40, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 250;
    const shadowDist = 45;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    sunLight.shadow.bias = -0.0002;
    sunLight.shadow.radius = 2.0;
    scene.add(sunLight);

    // Cool Sky Fill Light
    const skyFill = new THREE.DirectionalLight(0xaad0ff, 1.4);
    skyFill.position.set(-40, 40, -50);
    scene.add(skyFill);

    // Ambient Baseline Light
    const ambientLight = new THREE.AmbientLight(0x283040, 0.9);
    scene.add(ambientLight);

    // 5. Build Baseplate Proving Grounds
    const baseplateEnv = buildBaseplateEnvironment();
    scene.add(baseplateEnv);

    // 6. Build First-Person Viewmodel Rig (Sniper + Tactical Arms)
    const viewmodelRig = buildFPSViewmodelRig();
    // Attach viewmodel directly as child of camera for flawless viewmodel tracking
    camera.add(viewmodelRig);
    scene.add(camera);

    // Store default base transform of the viewmodel relative to camera
    const baseVmPos = new THREE.Vector3(0, 0, 0);
    const baseVmRot = new THREE.Euler(0, 0, 0);

    // ==========================================
    // 7. FPS PLAYER MOVEMENT & PHYSICS STATE
    // ==========================================
    const STAND_EYE_HEIGHT = 1.72;
    const SLIDE_EYE_HEIGHT = 0.85;

    const playerState = {
      position: new THREE.Vector3(0, STAND_EYE_HEIGHT, 10),
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
      jumpQueued: false,
      lastImpactY: 0,
    };

    // Smooth mouse look interpolation
    let mouseDeltaX = 0;
    let mouseDeltaY = 0;
    const mouseSensitivity = 0.002;

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

    // Viewmodel animation dynamics
    let bobTime = 0;
    const vmOffsetPos = new THREE.Vector3();
    const vmOffsetRot = new THREE.Euler();
    let landingDip = 0;

    // Input Event Listeners
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
      mouseDeltaX += e.movementX;
      mouseDeltaY += e.movementY;
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === container;
      setIsLocked(locked);
    };

    const onClickToLock = () => {
      if (document.pointerLockElement !== container) {
        container.requestPointerLock();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    container.addEventListener('click', onClickToLock);

    // Resize Handler
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
    // 8. MAIN ENGINE & PHYSICS TICK LOOP
    // ==========================================
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1); // Clamp max dt
      lastTime = now;

      // 1. Mouse Look Updates (Smooth Pitch & Yaw)
      playerState.yaw -= mouseDeltaX * mouseSensitivity;
      playerState.pitch -= mouseDeltaY * mouseSensitivity;

      // Clamp vertical pitch (-85 deg to +85 deg)
      const maxPitch = Math.PI / 2 - 0.05;
      playerState.pitch = Math.max(-maxPitch, Math.min(maxPitch, playerState.pitch));

      // Calculate camera look orientation
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.y = playerState.yaw;
      euler.x = playerState.pitch;

      // Apply camera tilt when sliding
      let rollAngle = 0;
      if (playerState.isSliding) {
        rollAngle = -0.05; // 3 deg dynamic slide roll
      }
      euler.z = rollAngle;
      camera.quaternion.setFromEuler(euler);

      // 2. Movement Input Calculation in Player Coordinates
      const moveDir = new THREE.Vector3();
      if (keys.forward) moveDir.z -= 1;
      if (keys.backward) moveDir.z += 1;
      if (keys.left) moveDir.x -= 1;
      if (keys.right) moveDir.x += 1;

      const isMovingInput = moveDir.lengthSq() > 0.01;
      if (isMovingInput) moveDir.normalize();

      // Transform movement direction by Yaw only (flat horizontal plane)
      const forwardVec = new THREE.Vector3(-Math.sin(playerState.yaw), 0, -Math.cos(playerState.yaw));
      const rightVec = new THREE.Vector3(Math.cos(playerState.yaw), 0, -Math.sin(playerState.yaw));
      const desiredWorldDir = new THREE.Vector3()
        .addScaledVector(forwardVec, -moveDir.z)
        .addScaledVector(rightVec, moveDir.x);

      // 3. Movement States (Sprint / Slide / Walk / Jump)
      const isMovingForward = keys.forward && !keys.backward;
      playerState.isSprinting = keys.shift && isMovingForward && playerState.isGrounded && !playerState.isSliding;

      // Trigger Slide
      if (keys.slide && (playerState.isSprinting || playerState.isSliding || desiredWorldDir.lengthSq() > 0) && playerState.isGrounded) {
        if (!playerState.isSliding) {
          // Initiate slide burst
          playerState.isSliding = true;
          playerState.slideTimer = 1.1; // 1.1s slide duration
          // Slide in currently held direction or facing forward
          playerState.slideDirection.copy(desiredWorldDir.lengthSq() > 0 ? desiredWorldDir : forwardVec).normalize();
          // Initial high-speed slide impulse
          playerState.velocity.x = playerState.slideDirection.x * 13.8;
          playerState.velocity.z = playerState.slideDirection.z * 13.8;
        }
      }

      // Handle ongoing Slide
      if (playerState.isSliding) {
        playerState.slideTimer -= dt;
        playerState.targetEyeHeight = SLIDE_EYE_HEIGHT;

        // Slide ground friction decay
        const slideFriction = Math.exp(-2.2 * dt);
        playerState.velocity.x *= slideFriction;
        playerState.velocity.z *= slideFriction;

        if (playerState.slideTimer <= 0 || !playerState.isGrounded || (!keys.slide && playerState.slideTimer < 0.6)) {
          playerState.isSliding = false;
        }
      } else {
        playerState.targetEyeHeight = STAND_EYE_HEIGHT;
      }

      // Smooth eye-height transition (Standing <-> Slide)
      playerState.currentEyeHeight += (playerState.targetEyeHeight - playerState.currentEyeHeight) * Math.min(1, 14 * dt);

      // Normal Ground Movement Physics (when not sliding)
      if (!playerState.isSliding && playerState.isGrounded) {
        const targetSpeed = playerState.isSprinting ? 10.5 : isMovingInput ? 5.8 : 0;
        const targetVelX = desiredWorldDir.x * targetSpeed;
        const targetVelZ = desiredWorldDir.z * targetSpeed;

        const accelRate = isMovingInput ? 16.0 : 18.0;
        playerState.velocity.x += (targetVelX - playerState.velocity.x) * Math.min(1, accelRate * dt);
        playerState.velocity.z += (targetVelZ - playerState.velocity.z) * Math.min(1, accelRate * dt);
      } else if (!playerState.isGrounded) {
        // In-air directional control
        const airControl = 4.5;
        playerState.velocity.x += desiredWorldDir.x * airControl * dt;
        playerState.velocity.z += desiredWorldDir.z * airControl * dt;
      }

      // 4. Jumping & Gravity Physics
      const GRAVITY = -24.0;
      const JUMP_FORCE = 8.6;

      if (keys.space && playerState.isGrounded) {
        playerState.velocity.y = JUMP_FORCE;
        playerState.isGrounded = false;
        playerState.isSliding = false; // Jump cancels slide into air jump
      }

      // Apply Gravity
      playerState.velocity.y += GRAVITY * dt;

      // Integrate Position
      playerState.position.x += playerState.velocity.x * dt;
      playerState.position.z += playerState.velocity.z * dt;
      playerState.position.y += playerState.velocity.y * dt;

      // Ground Collision Plane (Y = 0)
      const groundFloorY = playerState.currentEyeHeight;
      if (playerState.position.y <= groundFloorY) {
        if (!playerState.isGrounded && playerState.velocity.y < -3.0) {
          // Landing impact dip impulse
          landingDip = Math.min(0.08, Math.abs(playerState.velocity.y) * 0.007);
        }
        playerState.position.y = groundFloorY;
        playerState.velocity.y = 0;
        playerState.isGrounded = true;
      } else {
        playerState.isGrounded = false;
      }

      // Update camera position
      camera.position.copy(playerState.position);

      // Follow sun shadow frustum with player
      sunLight.position.set(playerState.position.x + 40, 80, playerState.position.z + 50);
      sunLight.target.position.set(playerState.position.x, 0, playerState.position.z);
      sunLight.target.updateMatrixWorld();

      // Dynamic FOV (Speed & Slide punch)
      const horizSpeed = Math.hypot(playerState.velocity.x, playerState.velocity.z);
      let targetFOV = 75;
      if (playerState.isSliding) {
        targetFOV = 84;
      } else if (playerState.isSprinting) {
        targetFOV = 82;
      }
      camera.fov += (targetFOV - camera.fov) * Math.min(1, 10 * dt);
      camera.updateProjectionMatrix();

      // ==========================================
      // 9. PROCEDURAL WEAPON VIEWMODEL DYNAMICS & ALIGNMENT
      // ==========================================
      // Bobbing Frequency & Amplitude
      const isMoving = horizSpeed > 0.5 && playerState.isGrounded;
      const bobFreq = playerState.isSprinting ? 12.5 : isMoving ? 8.5 : 2.0;
      bobTime += dt * bobFreq;

      // Calculate Target Viewmodel Offsets
      const targetVmPos = new THREE.Vector3(0, 0, 0);
      const targetVmRot = new THREE.Euler(0, 0, 0);

      // A. Weapon Sway (Inertia from mouse look)
      const swayStrength = 0.0004;
      const swayRotStrength = 0.0007;
      targetVmPos.x -= mouseDeltaX * swayStrength;
      targetVmPos.y += mouseDeltaY * swayStrength;
      targetVmRot.y -= mouseDeltaX * swayRotStrength;
      targetVmRot.x -= mouseDeltaY * swayRotStrength;
      targetVmRot.z += mouseDeltaX * swayRotStrength * 0.6;

      // Decay mouse deltas
      mouseDeltaX *= Math.exp(-20 * dt);
      mouseDeltaY *= Math.exp(-20 * dt);

      // B. Procedural Bobbing & Breathing
      if (playerState.isGrounded) {
        if (isMoving) {
          const bobAmp = playerState.isSprinting ? 0.022 : 0.012;
          targetVmPos.x += Math.cos(bobTime * 0.5) * bobAmp * 0.8;
          targetVmPos.y += Math.abs(Math.sin(bobTime)) * bobAmp;
          targetVmRot.z += Math.cos(bobTime * 0.5) * (bobAmp * 1.5);
          targetVmRot.x += Math.sin(bobTime) * (bobAmp * 1.2);
        } else {
          // Subtle breathing idle
          targetVmPos.y += Math.sin(bobTime) * 0.0018;
          targetVmRot.x += Math.cos(bobTime) * 0.002;
        }
      } else {
        // In-air weapon hang
        targetVmPos.y -= 0.02;
        targetVmRot.x += 0.06;
      }

      // C. Landing Dip Recovery
      landingDip *= Math.exp(-12 * dt);
      targetVmPos.y -= landingDip;
      targetVmRot.x -= landingDip * 1.5;

      // D. Tactical Sprint Carry Pose
      if (playerState.isSprinting) {
        targetVmPos.x += 0.04;
        targetVmPos.y -= 0.08;
        targetVmPos.z -= 0.03;
        targetVmRot.x -= 0.25;
        targetVmRot.y += 0.32;
        targetVmRot.z -= 0.28;
      }

      // E. Dynamic Slide Pose
      if (playerState.isSliding) {
        targetVmPos.x += 0.06;
        targetVmPos.y -= 0.04;
        targetVmPos.z += 0.02;
        targetVmRot.x += 0.12;
        targetVmRot.y += 0.18;
        targetVmRot.z += 0.24;
      }

      // Smooth interpolation of viewmodel offsets
      const lerpSpeed = 16.0;
      vmOffsetPos.lerp(targetVmPos, Math.min(1, lerpSpeed * dt));
      vmOffsetRot.x += (targetVmRot.x - vmOffsetRot.x) * Math.min(1, lerpSpeed * dt);
      vmOffsetRot.y += (targetVmRot.y - vmOffsetRot.y) * Math.min(1, lerpSpeed * dt);
      vmOffsetRot.z += (targetVmRot.z - vmOffsetRot.z) * Math.min(1, lerpSpeed * dt);

      // Apply smoothly to the viewmodel rig attached to the camera
      viewmodelRig.position.copy(baseVmPos).add(vmOffsetPos);
      viewmodelRig.rotation.set(
        baseVmRot.x + vmOffsetRot.x,
        baseVmRot.y + vmOffsetRot.y,
        baseVmRot.z + vmOffsetRot.z
      );

      // 10. Render the scene
      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      container.removeEventListener('click', onClickToLock);
      window.removeEventListener('resize', onResize);

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
      {/* Pointer Lock Helper Prompt (Only displayed before user clicks to engage) */}
      {!isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 z-50 pointer-events-none">
          <div className="text-center space-y-2 px-6 py-4 bg-slate-900/80 border border-slate-700/60 rounded-xl shadow-2xl backdrop-blur-md max-w-sm">
            <div className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              First-Person Baseplate
            </div>
            <p className="text-xs text-slate-400">
              Click anywhere to lock camera & move
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">WASD</span>
              <span>Move</span>
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">Shift</span>
              <span>Sprint</span>
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">C / Ctrl</span>
              <span>Slide</span>
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded">Space</span>
              <span>Jump</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
