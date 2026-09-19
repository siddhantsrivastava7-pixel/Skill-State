import React from "react";

export interface HillBackgroundSvgProps {
  className?: string;
}

/**
 * Calm layered SVG background conforming to 04_DESIGN_SYSTEM.md:
 * - distant pale blue-gray hills,
 * - closer desaturated green hills,
 * - subtle warm sun disk,
 * - no photorealism, no fantasy buildings, no people,
 * - opacity low enough for high text contrast.
 */
export function HillBackgroundSvg({ className = "" }: HillBackgroundSvgProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1400 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover"
      >
        <defs>
          <linearGradient id="skyWash" x1="700" y1="0" x2="700" y2="420" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBFBFD" stopOpacity="0.8" />
            <stop offset="0.6" stopColor="#F5F7FA" stopOpacity="0.4" />
            <stop offset="1" stopColor="#EBF2ED" stopOpacity="0.2" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="62%" cy="32%" r="20%" fx="62%" fy="32%">
            <stop stopColor="#FFECCF" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#FFF4E8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFF4E8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky wash */}
        <rect width="1400" height="420" fill="url(#skyWash)" />

        {/* Subtle warm sun disk */}
        <circle cx="860" cy="130" r="75" fill="url(#sunGlow)" />
        <circle cx="860" cy="130" r="38" fill="#FFF2DF" fillOpacity="0.55" />

        {/* Layer 1: Distant pale blue-gray hills */}
        <path
          d="M0 240 Q 220 180 440 220 T 920 200 T 1400 230 L 1400 420 L 0 420 Z"
          fill="#DDE5EF"
          fillOpacity="0.38"
        />

        {/* Layer 2: Mid distant blue-green rolling hills */}
        <path
          d="M0 270 Q 180 230 360 255 T 840 240 T 1200 250 T 1400 265 L 1400 420 L 0 420 Z"
          fill="#CEDCD5"
          fillOpacity="0.42"
        />

        {/* Layer 3: Closer desaturated green hills */}
        <path
          d="M0 310 Q 280 270 560 300 T 1040 285 T 1400 305 L 1400 420 L 0 420 Z"
          fill="#BDD5C8"
          fillOpacity="0.38"
        />

        {/* Layer 4: Foreground gentle slope */}
        <path
          d="M0 355 Q 380 325 780 350 T 1400 340 L 1400 420 L 0 420 Z"
          fill="#E2EEE6"
          fillOpacity="0.45"
        />
      </svg>
    </div>
  );
}
