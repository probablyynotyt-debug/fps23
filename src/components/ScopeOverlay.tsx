import React from 'react';

interface ScopeOverlayProps {
  adsProgress: number; // 0 (hipfire) to 1 (full ADS)
}

export const ScopeOverlay: React.FC<ScopeOverlayProps> = ({ adsProgress }) => {
  if (adsProgress <= 0.01) return null;

  // Non-linear threshold for blacking out the outer view when looking down the optic
  const scopeOpacity = Math.max(0, (adsProgress - 0.25) / 0.75);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-30 flex items-center justify-center overflow-hidden"
      style={{ opacity: scopeOpacity }}
    >
      {/* Outer Lens Housing Shroud (Dark Tactical Vignette Mask with Circular Clear Viewport) */}
      <svg
        className="w-full h-full absolute inset-0"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Circular Scope Aperture Mask */}
          <mask id="scope-aperture-mask">
            <rect width="1920" height="1080" fill="white" />
            <circle cx="960" cy="540" r="460" fill="black" />
          </mask>

          {/* Optical Glass Radial Tint Gradient */}
          <radialGradient id="glass-sheen" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#102535" stopOpacity="0.0" />
            <stop offset="85%" stopColor="#082032" stopOpacity="0.12" />
            <stop offset="98%" stopColor="#00ffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#05070a" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* Heavy Black Outer Housing (Masked to circular viewport) */}
        <rect
          width="1920"
          height="1080"
          fill="#060709"
          mask="url(#scope-aperture-mask)"
        />

        {/* Optical Glass Lens Bevel & Shadow Rings */}
        <circle
          cx="960"
          cy="540"
          r="460"
          fill="url(#glass-sheen)"
        />
        <circle
          cx="960"
          cy="540"
          r="460"
          fill="none"
          stroke="#0f172a"
          strokeWidth="12"
        />
        <circle
          cx="960"
          cy="540"
          r="454"
          fill="none"
          stroke="#00ffff"
          strokeWidth="1"
          strokeOpacity="0.35"
        />

        {/* ======================================================= */}
        {/* TACTICAL MIL-DOT RETICLE (High Precision Stadiametric)   */}
        {/* ======================================================= */}
        <g stroke="#000000" strokeWidth="2.5" opacity="0.95">
          {/* Main Crosshair Lines */}
          {/* Horizontal left bar */}
          <line x1="500" y1="540" x2="940" y2="540" />
          {/* Horizontal right bar */}
          <line x1="980" y1="540" x2="1420" y2="540" />
          {/* Vertical top bar */}
          <line x1="960" y1="100" x2="960" y2="520" />
          {/* Vertical bottom bar */}
          <line x1="960" y1="560" x2="960" y2="980" />

          {/* Outer Heavy Posts */}
          <line x1="500" y1="540" x2="680" y2="540" strokeWidth="6" />
          <line x1="1240" y1="540" x2="1420" y2="540" strokeWidth="6" />
          <line x1="960" y1="100" x2="960" y2="280" strokeWidth="6" />
          <line x1="960" y1="800" x2="960" y2="980" strokeWidth="6" />

          {/* Fine Center Hairlines */}
          <line x1="940" y1="540" x2="980" y2="540" strokeWidth="1" stroke="#ef4444" />
          <line x1="960" y1="520" x2="960" y2="560" strokeWidth="1" stroke="#ef4444" />

          {/* Center Illuminated Aiming Dot */}
          <circle cx="960" cy="540" r="2.5" fill="#ef4444" stroke="none" />
          <circle cx="960" cy="540" r="5" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />

          {/* Horizontal Mil Ticks (Left & Right) */}
          {[-8, -6, -4, -2, 2, 4, 6, 8].map((mil) => {
            const x = 960 + mil * 32;
            const isMajor = Math.abs(mil) % 4 === 0;
            const h = isMajor ? 16 : 9;
            return (
              <g key={`h-mil-${mil}`}>
                <line x1={x} y1={540 - h} x2={x} y2={540 + h} strokeWidth="1.5" />
                {isMajor && (
                  <text
                    x={x}
                    y={540 - 20}
                    fill="#111111"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {Math.abs(mil)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertical Elevation Mil Ticks (Bottom Drop Compensation) */}
          {[2, 4, 6, 8, 10, 12].map((mil) => {
            const y = 540 + mil * 30;
            const isMajor = mil % 4 === 0;
            const w = isMajor ? 20 : 11;
            return (
              <g key={`v-mil-${mil}`}>
                <line x1={960 - w} y1={y} x2={960 + w} y2={y} strokeWidth="1.5" />
                {isMajor && (
                  <text
                    x={960 + 30}
                    y={y + 4}
                    fill="#111111"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    {mil}
                  </text>
                )}
              </g>
            );
          })}

          {/* Sub-Mil Windage Tree Dots (Christmas tree style) */}
          {[
            { yM: 4, xM: 2 },
            { yM: 4, xM: -2 },
            { yM: 6, xM: 3 },
            { yM: 6, xM: -3 },
            { yM: 8, xM: 4 },
            { yM: 8, xM: -4 },
            { yM: 10, xM: 5 },
            { yM: 10, xM: -5 },
          ].map((dot, idx) => (
            <circle
              key={`dot-${idx}`}
              cx={960 + dot.xM * 32}
              cy={540 + dot.yM * 30}
              r="2"
              fill="#111111"
              stroke="none"
            />
          ))}

          {/* Stadiametric Rangefinder Bracket (Lower-Left) */}
          <path
            d="M 620 740 Q 720 740 820 620"
            fill="none"
            stroke="#111111"
            strokeWidth="1.5"
          />
          <text x="630" y="760" fill="#111111" fontSize="10" fontFamily="monospace">1.7m SHOULDER HEIGHT</text>
          <text x="815" y="615" fill="#111111" fontSize="10" fontFamily="monospace">800M</text>
          <text x="735" y="690" fill="#111111" fontSize="10" fontFamily="monospace">400M</text>
          <text x="655" y="735" fill="#111111" fontSize="10" fontFamily="monospace">200M</text>

          {/* Optic Spec Engravings */}
          <text x="960" y="240" fill="#333333" fontSize="11" fontFamily="monospace" textAnchor="middle" letterSpacing="2">
            TAC-OPTIC 25X56 // 0.1 MRAD
          </text>
        </g>
      </svg>
    </div>
  );
};
