import React from 'react';

interface ScopeOverlayProps {
  adsProgress: number; // 0 to 1
}

export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({ adsProgress }) => {
  if (adsProgress <= 0.01) return null;

  // Smooth, non-delayed linear opacity transition
  const opacity = Math.min(1, adsProgress * 1.2);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-30 flex items-center justify-center overflow-hidden"
      style={{ opacity }}
    >
      {/* Clean, Bright Roblox FPS-Style Precision Scope Overlay */}
      <svg
        className="w-full h-full absolute inset-0"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle Outer Vignette Mask (Leaves the center crystal clear and bright) */}
          <radialGradient id="clean-vignette" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#000000" stopOpacity="0.0" />
            <stop offset="90%" stopColor="#05070a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
          </radialGradient>
        </defs>

        {/* Soft Outer Edge Vignette (Keeps entire center clear and bright) */}
        <rect width="1920" height="1080" fill="url(#clean-vignette)" />

        {/* Sleek Outer Reticle Ring */}
        <circle
          cx="960"
          cy="540"
          r="420"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeOpacity="0.35"
          strokeDasharray="4 8"
        />

        {/* Inner Precision Aiming Ring */}
        <circle
          cx="960"
          cy="540"
          r="160"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* ======================================================= */}
        {/* CLEAN, CRISP CENTERED CROSSHAIR / RETICLE               */}
        {/* ======================================================= */}
        {/* Main Black High-Contrast Crosshair Lines with Gap at Center */}
        <g stroke="#000000" strokeWidth="2.5" opacity="0.95">
          {/* Left Horizontal */}
          <line x1="420" y1="540" x2="935" y2="540" />
          {/* Right Horizontal */}
          <line x1="985" y1="540" x2="1500" y2="540" />
          {/* Top Vertical */}
          <line x1="960" y1="120" x2="960" y2="515" />
          {/* Bottom Vertical */}
          <line x1="960" y1="565" x2="960" y2="960" />

          {/* Heavy Outer Anchor Bars */}
          <line x1="420" y1="540" x2="600" y2="540" strokeWidth="5" />
          <line x1="1320" y1="540" x2="1500" y2="540" strokeWidth="5" />
          <line x1="960" y1="120" x2="960" y2="280" strokeWidth="5" />
          <line x1="960" y1="800" x2="960" y2="960" strokeWidth="5" />
        </g>

        {/* High-Visibility Crisp Red Inner Crosshair Line Overlays */}
        <g stroke="#ef4444" strokeWidth="1.5">
          <line x1="880" y1="540" x2="935" y2="540" />
          <line x1="985" y1="540" x2="1040" y2="540" />
          <line x1="960" y1="460" x2="960" y2="515" />
          <line x1="960" y1="565" x2="960" y2="620" />

          {/* Center Red Aiming Dot */}
          <circle cx="960" cy="540" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
        </g>

        {/* Precision Mil Hash Ticks */}
        <g stroke="#000000" strokeWidth="1.5" opacity="0.85">
          {/* Horizontal Ticks */}
          {[-120, -80, -40, 40, 80, 120].map((dx) => (
            <line
              key={`htick-${dx}`}
              x1={960 + dx}
              y1={535}
              x2={960 + dx}
              y2={545}
            />
          ))}

          {/* Vertical Drop Ticks */}
          {[40, 80, 120, 160, 200].map((dy) => (
            <line
              key={`vtick-${dy}`}
              x1={954}
              y1={540 + dy}
              x2={966}
              y2={540 + dy}
            />
          ))}
        </g>

        {/* Sleek Corner Framing Brackets */}
        <g stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.6" fill="none">
          {/* Top-Left */}
          <path d="M 640 320 L 600 320 L 600 360" />
          {/* Top-Right */}
          <path d="M 1280 320 L 1320 320 L 1320 360" />
          {/* Bottom-Left */}
          <path d="M 640 760 L 600 760 L 600 720" />
          {/* Bottom-Right */}
          <path d="M 1280 760 L 1320 760 L 1320 720" />
        </g>
      </svg>
    </div>
  );
};
