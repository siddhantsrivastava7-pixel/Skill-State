import React from "react";

export interface HillBackgroundSvgProps {
  className?: string;
}

/**
 * Calm illustrated landscape SVG conforming to 04_DESIGN_SYSTEM.md and skillstate-reference-ui.png:
 * - distant pale blue-gray mountain ridges,
 * - closer rolling sage green foothills,
 * - pine tree silhouettes on flanking ridges,
 * - soft morning sun glow,
 * - calm valley mist wash,
 * - low opacity for crisp contrast with the interactive journey path and text.
 */
export function HillBackgroundSvg({ className = "" }: HillBackgroundSvgProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover"
      >
        <defs>
          {/* Morning Sky Wash */}
          <linearGradient id="morningSky" x1="600" y1="0" x2="600" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#F5F7F8" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#EBF3EE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E2EDE7" stopOpacity="0.4" />
          </linearGradient>

          {/* Morning Sun Glow */}
          <radialGradient id="sunGlow" cx="68%" cy="28%" r="24%" fx="68%" fy="28%">
            <stop offset="0%" stopColor="#FFEAD0" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#FFF2E2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0" />
          </radialGradient>

          {/* Valley Mist Gradient */}
          <linearGradient id="valleyMist" x1="600" y1="260" x2="600" y2="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#F4F8F5" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EAF2ED" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky wash */}
        <rect width="1200" height="420" fill="url(#morningSky)" />

        {/* Soft morning sun disk and haze */}
        <circle cx="820" cy="115" r="95" fill="url(#sunGlow)" />
        <circle cx="820" cy="115" r="42" fill="#FFF4E6" fillOpacity="0.65" />

        {/* Layer 1: Distant soft blue mountain range */}
        <path
          d="M0 210 L80 180 L160 205 L260 160 L380 215 L480 175 L590 220 L720 150 L840 210 L960 165 L1080 200 L1200 175 L1200 420 L0 420 Z"
          fill="#D6E2ED"
          fillOpacity="0.38"
        />

        {/* Layer 2: Mid distant blue-gray peaks with softer ridges */}
        <path
          d="M0 240 L110 205 L220 230 L340 185 L460 235 L580 195 L690 230 L800 180 L920 225 L1040 190 L1140 220 L1200 205 L1200 420 L0 420 Z"
          fill="#CAD9DF"
          fillOpacity="0.42"
        />

        {/* Layer 3: Rolling sage green hills */}
        <path
          d="M0 275 Q 160 230 320 255 T 660 240 T 980 250 T 1200 260 L 1200 420 L 0 420 Z"
          fill="#BDD5CA"
          fillOpacity="0.45"
        />

        {/* Layer 4: Flanking pine tree silhouettes on left ridge */}
        <g fill="#466A59" fillOpacity="0.4">
          {/* Cluster of pines on left slope */}
          <polygon points="40,290 32,315 48,315" />
          <polygon points="40,300 30,325 50,325" />
          <polygon points="65,280 57,308 73,308" />
          <polygon points="65,295 55,322 75,322" />
          <polygon points="90,295 83,318 97,318" />
          <polygon points="115,305 108,326 122,326" />
          <polygon points="140,310 134,330 146,330" />
          <polygon points="170,315 163,334 177,334" />
          <polygon points="210,320 204,338 216,338" />
        </g>

        {/* Layer 5: Flanking pine tree silhouettes on right ridge */}
        <g fill="#466A59" fillOpacity="0.38">
          <polygon points="1020,315 1014,334 1026,334" />
          <polygon points="1050,305 1043,326 1057,326" />
          <polygon points="1080,295 1073,318 1087,318" />
          <polygon points="1110,285 1102,310 1118,310" />
          <polygon points="1110,298 1100,324 1120,324" />
          <polygon points="1145,290 1138,314 1152,314" />
          <polygon points="1175,298 1169,320 1181,320" />
        </g>

        {/* Layer 6: Soft valley mist overlay */}
        <rect x="0" y="270" width="1200" height="150" fill="url(#valleyMist)" />

        {/* Layer 7: Foreground calm meadow slope */}
        <path
          d="M0 355 Q 300 325 600 345 T 1200 340 L 1200 420 L 0 420 Z"
          fill="#E5EFE9"
          fillOpacity="0.5"
        />
      </svg>
    </div>
  );
}
