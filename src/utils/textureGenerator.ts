import * as THREE from 'three';

/**
 * Creates high-fidelity procedural PBR textures for gunmetal, polymer, carbon, and optical glass
 */

// Generate a high-resolution brushed dark steel / gunmetal texture with micro-imperfections
export function createGunmetalTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base dark charcoal / graphite gunmetal
  ctx.fillStyle = '#1b1d22';
  ctx.fillRect(0, 0, size, size);

  // Micro brushed steel streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 10 + Math.random() * 40;
    ctx.fillRect(x, y, len, 0.8);
  }

  // Subtle dark anodized noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n + 1));
  }
  ctx.putImageData(imgData, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  // Roughness Map (matte gunmetal with subtle sheen variations)
  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#484848'; // Roughness ~ 0.28
  rCtx.fillRect(0, 0, size, size);

  rCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    rCtx.fillRect(x, y, 15 + Math.random() * 30, 1);
  }

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  // Bump Map for micro-machining grain
  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    bCtx.fillRect(x, y, 4 + Math.random() * 20, 0.5);
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, bumpMap };
}

// Tactical Stippled Polymer Texture (for pistol grip & cheek rest)
export function createPolymerStippleTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141517';
  ctx.fillRect(0, 0, size, size);

  // Stippling micro-dots
  for (let i = 0; i < 25000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.5 + 0.5;
    const shade = Math.floor(Math.random() * 30 + 15);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);

  // Bump map for grip depth
  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 25000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.4 + 0.6;
    const val = Math.random() > 0.5 ? 255 : 0;
    bCtx.fillStyle = `rgba(${val},${val},${val},0.2)`;
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fill();
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  // High roughness
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 128;
  rCanvas.height = 128;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#aaaaaa'; // Roughness ~ 0.68
  rCtx.fillRect(0, 0, 128, 128);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);

  return { map, bumpMap, roughnessMap };
}

// Tactical Diamond Knurling Texture (for Turret dials, bolt knob, barrel nut)
export function createKnurlingTexture(): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const step = 8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;

  // Diamond grid lines 45 deg
  for (let d = -size; d < size * 2; d += step) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(d, size);
    ctx.lineTo(d + size, 0);
    ctx.stroke();
  }

  // Dark shadow troughs
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1.0;
  for (let d = -size + step / 2; d < size * 2; d += step) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(d, size);
    ctx.lineTo(d + size, 0);
    ctx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(canvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 2);

  const rCanvas = document.createElement('canvas');
  rCanvas.width = 128;
  rCanvas.height = 128;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#555555';
  rCtx.fillRect(0, 0, 128, 128);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);

  return { bumpMap, roughnessMap };
}

// Precision Scope Turret Dial Markings Texture
export function createTurretDialTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1e22';
  ctx.fillRect(0, 0, width, height);

  // Subtle metallic horizontal grain
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 500; i++) {
    ctx.fillRect(0, Math.random() * height, width, 1);
  }

  // Graduation hash marks & numbers (0 to 10 MRAD clicks)
  const totalTicks = 100;
  const tickSpacing = width / totalTicks;

  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';

  for (let i = 0; i < totalTicks; i++) {
    const x = i * tickSpacing;
    if (i % 10 === 0) {
      // Major tick mark
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 1.5, 45, 3, 50);
      const val = (i / 10).toString();
      ctx.fillText(val, x, 32);
    } else if (i % 5 === 0) {
      // Medium tick
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x - 1, 55, 2, 40);
    } else {
      // Minor tick
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - 0.75, 68, 1.5, 25);
    }
  }

  // Red zero indicator alignment line
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(0, 115, width, 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Carbon Fiber Weave Texture (for stock inserts & handguard struts)
export function createCarbonFiberTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#121316';
  ctx.fillRect(0, 0, size, size);

  const step = 16;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const isEven = ((x / step) + (y / step)) % 2 === 0;
      if (isEven) {
        // Horizontal carbon fibers
        const grad = ctx.createLinearGradient(x, y, x + step, y);
        grad.addColorStop(0, '#1c1e22');
        grad.addColorStop(0.5, '#32363e');
        grad.addColorStop(1, '#18191c');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, step, step);
      } else {
        // Vertical carbon fibers
        const grad = ctx.createLinearGradient(x, y, x, y + step);
        grad.addColorStop(0, '#1c1e22');
        grad.addColorStop(0.5, '#282b32');
        grad.addColorStop(1, '#151619');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, step, step);
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 6);

  const bumpMap = new THREE.CanvasTexture(canvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);

  return { map, bumpMap };
}

// Precision Tactical Laser Markings & Serial Numbers Texture
export function createReceiverLaserMarkingsTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 0, width, height);

  // Subtle surface variation
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 3000; i++) {
    ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 20 + 5, 1);
  }

  // Laser engraved text & safety markings
  ctx.font = 'bold 24px "SF Mono", "JetBrains Mono", Consolas, monospace';
  ctx.fillStyle = '#8b949e';
  ctx.textAlign = 'left';
  ctx.fillText('TAC-500 PRECISION .338 LM', 80, 180);

  ctx.font = '16px "SF Mono", "JetBrains Mono", Consolas, monospace';
  ctx.fillStyle = '#6e7681';
  ctx.fillText('MIL-SPEC CHASSIS // MOD 4', 80, 220);
  ctx.fillText('SERIAL NO. PX-9048-26', 80, 250);
  ctx.fillText('CAGE CODE: 1V372', 80, 280);

  // Safety Selector Indicators (SAFE / FIRE)
  ctx.font = 'bold 22px "SF Mono", "JetBrains Mono", Consolas, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SAFE', 720, 220);
  ctx.fillStyle = '#ef4444';
  ctx.fillText('FIRE', 720, 290);

  // Alignment arc
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(680, 255, 45, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Studio Lighting Equirectangular Environment Map
export function createStudioEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Smooth dark studio vignette gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0a0c10');
  bgGrad.addColorStop(0.5, '#12151c');
  bgGrad.addColorStop(1, '#08090d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Softbox 1: Overhead key strip light (crisp cool white highlight)
  const strip1 = ctx.createLinearGradient(width * 0.2, 0, width * 0.8, 0);
  strip1.addColorStop(0, 'rgba(230, 240, 255, 0)');
  strip1.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
  strip1.addColorStop(1, 'rgba(230, 240, 255, 0)');
  ctx.fillStyle = strip1;
  ctx.fillRect(width * 0.2, height * 0.1, width * 0.6, height * 0.15);

  // Softbox 2: Large side fill light (diffused cool light)
  const rad1 = ctx.createRadialGradient(width * 0.25, height * 0.45, 10, width * 0.25, height * 0.45, 180);
  rad1.addColorStop(0, 'rgba(200, 220, 255, 0.7)');
  rad1.addColorStop(0.6, 'rgba(150, 180, 220, 0.25)');
  rad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rad1;
  ctx.fillRect(0, 0, width * 0.5, height);

  // Softbox 3: Rear rim light (warm golden rim highlight)
  const rad2 = ctx.createRadialGradient(width * 0.8, height * 0.4, 10, width * 0.8, height * 0.4, 200);
  rad2.addColorStop(0, 'rgba(255, 235, 210, 0.85)');
  rad2.addColorStop(0.5, 'rgba(220, 180, 140, 0.3)');
  rad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rad2;
  ctx.fillRect(width * 0.5, 0, width * 0.5, height);

  // Floor bounce light
  const floorGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
  floorGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  floorGrad.addColorStop(1, 'rgba(40, 50, 65, 0.4)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const renderTarget = pmremGenerator.fromEquirectangular(texture);
  pmremGenerator.dispose();
  texture.dispose();

  return renderTarget;
}

// Procedural Proving Grounds / Dev Baseplate Grid Texture
export function createBaseplateTexture(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base dark tactical graphite slab
  ctx.fillStyle = '#1e222b';
  ctx.fillRect(0, 0, size, size);

  // Subtle concrete / composite grain
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Sub-grid lines
  ctx.strokeStyle = '#2d3340';
  ctx.lineWidth = 2;
  const subDiv = 8;
  const step = size / subDiv;
  for (let i = 0; i <= subDiv; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }

  // Major border grid lines
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, size, size);

  // Corner tactical markers & crosshairs
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  const markerLen = 32;
  // 4 corners
  [[12, 12], [size - 12, 12], [12, size - 12], [size - 12, size - 12]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx - markerLen, cy);
    ctx.lineTo(cx + markerLen, cy);
    ctx.moveTo(cx, cy - markerLen);
    ctx.lineTo(cx, cy + markerLen);
    ctx.stroke();
  });

  // Center subtle circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 48, 0, Math.PI * 2);
  ctx.stroke();

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(50, 50); // Repeat across a large 500x500 baseplate

  // Roughness texture
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 256;
  rCanvas.height = 256;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#bbbbbb';
  rCtx.fillRect(0, 0, 256, 256);
  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(50, 50);

  return { map, roughnessMap };
}

// Tactical Combat Glove & Fabric Textures
export function createTacticalFabricTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1e24';
  ctx.fillRect(0, 0, size, size);

  // Ripstop grid
  ctx.strokeStyle = '#282c35';
  ctx.lineWidth = 1.5;
  const step = 16;
  for (let i = 0; i < size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);
  bCtx.strokeStyle = '#ffffff';
  bCtx.lineWidth = 1;
  for (let i = 0; i < 256; i += 8) {
    bCtx.strokeRect(i, 0, 1, 256);
    bCtx.strokeRect(0, i, 256, 1);
  }
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(8, 8);

  return { map, bumpMap };
}

