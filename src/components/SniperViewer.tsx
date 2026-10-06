import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildSniperRifle } from '../utils/sniperModelBuilder';
import { createStudioEnvironmentMap } from '../utils/textureGenerator';

export const SniperViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);

    // Subtle atmospheric distance depth
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.015);

    // 2. Camera setup - Positioned perfectly to frame the sniper rifle centered
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Initial cinematic 3/4 angle
    camera.position.set(0, 0.8, 14.5);
    camera.lookAt(0, 0, 0);

    // 3. Renderer setup
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

    // 4. Studio Environment Lighting Setup
    const envRenderTarget = createStudioEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

    // Studio Key Light (Top-Front Right)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0002;
    keyLight.shadow.radius = 2.5;
    scene.add(keyLight);

    // Studio Fill Light (Front-Left Cool Light)
    const fillLight = new THREE.DirectionalLight(0xc8e0ff, 1.8);
    fillLight.position.set(-8, 4, 8);
    scene.add(fillLight);

    // Studio Rim / Specular Back Light (High-Intensity Edge Light)
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.2);
    rimLight.position.set(0, 10, -12);
    scene.add(rimLight);

    // Bottom Ambient Bounce Light
    const bounceLight = new THREE.DirectionalLight(0x405570, 0.7);
    bounceLight.position.set(0, -8, 0);
    scene.add(bounceLight);

    // Ambient general baseline light
    const ambientLight = new THREE.AmbientLight(0x222630, 0.8);
    scene.add(ambientLight);

    // 5. Build and attach the centered 3D Sniper Rifle
    const sniperModel = buildSniperRifle();
    scene.add(sniperModel);

    // Soft Studio Shadow Plane underneath the centered rifle
    const shadowPlaneGeo = new THREE.PlaneGeometry(28, 28);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(256, 256, 20, 256, 256, 230);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -3.2;
    scene.add(shadowPlane);

    // 6. Free 360-degree Click & Drag Rotation Controls with Momentum & Inertia
    let isDragging = false;
    let previousPointerPosition = { x: 0, y: 0 };
    let velocityX = 0;
    let velocityY = 0;

    // Quaternion-based free rotation around camera axes
    const currentQuaternion = new THREE.Quaternion();
    sniperModel.quaternion.copy(currentQuaternion);

    // Default gentle presentation pose (slightly angled to showcase 3D depth)
    const initialRotX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.12);
    const initialRotY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.45);
    currentQuaternion.multiplyQuaternions(initialRotY, initialRotX);
    sniperModel.quaternion.copy(currentQuaternion);

    // Camera zoom distance management
    let targetDistance = 14.5;
    let currentDistance = 14.5;
    const minDistance = 5.0;
    const maxDistance = 24.0;

    // Pointer Event Handlers
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousPointerPosition = { x: e.clientX, y: e.clientY };
      velocityX = 0;
      velocityY = 0;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousPointerPosition.x;
      const deltaY = e.clientY - previousPointerPosition.y;

      previousPointerPosition = { x: e.clientX, y: e.clientY };

      // Rotation sensitivity
      const speed = 0.0065;
      const rotY = deltaX * speed;
      const rotX = deltaY * speed;

      velocityX = rotY;
      velocityY = rotX;

      // Apply rotation around camera-relative Y and X axes
      const cameraUp = new THREE.Vector3(0, 1, 0);
      const cameraRight = new THREE.Vector3(1, 0, 0);

      const qY = new THREE.Quaternion().setFromAxisAngle(cameraUp, rotY);
      const qX = new THREE.Quaternion().setFromAxisAngle(cameraRight, rotX);

      // Multiply into current orientation
      qY.multiply(qX);
      currentQuaternion.premultiply(qY);
      sniperModel.quaternion.copy(currentQuaternion);
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';
    };

    // Smooth Wheel Zooming (keeps sniper centered)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.012;
      targetDistance = Math.min(maxDistance, Math.max(minDistance, targetDistance + zoomFactor));
    };

    // Touch pinch-to-zoom support
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (touchStartDist > 0) {
          const delta = (touchStartDist - dist) * 0.03;
          targetDistance = Math.min(maxDistance, Math.max(minDistance, targetDistance + delta));
          touchStartDist = dist;
        }
      }
    };

    // Attach listeners
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });

    // Handle Window Resize
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

    // 7. Animation & Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera zoom interpolation
      currentDistance += (targetDistance - currentDistance) * 0.12;
      camera.position.set(0, 0, currentDistance);
      camera.lookAt(0, 0, 0);

      // Apply smooth momentum damping when released
      if (!isDragging) {
        if (Math.abs(velocityX) > 0.00005 || Math.abs(velocityY) > 0.00005) {
          const cameraUp = new THREE.Vector3(0, 1, 0);
          const cameraRight = new THREE.Vector3(1, 0, 0);

          const qY = new THREE.Quaternion().setFromAxisAngle(cameraUp, velocityX);
          const qX = new THREE.Quaternion().setFromAxisAngle(cameraRight, velocityY);

          qY.multiply(qX);
          currentQuaternion.premultiply(qY);
          sniperModel.quaternion.copy(currentQuaternion);

          // Natural inertia friction decay
          velocityX *= 0.94;
          velocityY *= 0.94;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
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
      className="relative w-screen h-screen overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none bg-[#0a0c10]"
      style={{ touchAction: 'none' }}
    />
  );
};
