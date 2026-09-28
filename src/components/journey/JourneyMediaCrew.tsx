"use client";

import React from "react";
import styles from "./JourneyMediaCrew.module.css";
import { useJourneyFrame } from "./journeyScroll";
import type { SceneState } from "./journeySideView";

// Point 1 range: p = 0.04 → 0.21
const P1_START = 0.04;
const P1_END = 0.21;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstep(min: number, max: number, v: number): number {
  const x = clamp((v - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

export const JourneyMediaCrew: React.FC = () => {
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // Individual crew member refs
  const cameramanRef = React.useRef<HTMLDivElement>(null);
  const reporterRef = React.useRef<HTMLDivElement>(null);
  const boomRef = React.useRef<HTMLDivElement>(null);

  // Flash / shutter refs
  const flashRef = React.useRef<HTMLDivElement>(null);
  const lastFlashTime = React.useRef<number>(0);
  const flashActive = React.useRef(false);

  // Speech bubble ref
  const bubbleRef = React.useRef<HTMLDivElement>(null);

  useJourneyFrame((scene: SceneState) => {
    const p = scene.progress;
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Outside Point 1 → fully hidden
    if (p < P1_START - 0.005 || p > P1_END + 0.015) {
      wrap.style.opacity = "0";
      wrap.style.pointerEvents = "none";
      return;
    }

    // Fade in during first 15% of Point 1 window, fade out during last 10%
    const winLen = P1_END - P1_START;
    const localP = (p - P1_START) / winLen; // 0→1 within point 1

    const fadeIn = smoothstep(0, 0.15, localP);
    const fadeOut = 1 - smoothstep(0.85, 1.0, localP);
    const alpha = fadeIn * fadeOut;

    wrap.style.opacity = alpha.toFixed(3);
    wrap.style.pointerEvents = alpha > 0.05 ? "none" : "none";

    // --- CREW APPROACH ANIMATION ---
    // Each crew member starts off-screen right, runs toward the truck (left)
    // Approach progress: they sprint during first 40% of the point window

    const approachT = clamp(localP / 0.40, 0, 1);
    const approachEased = approachT * approachT * (3 - 2 * approachT);

    // Cameraman: starts at translateX(+160px), arrives at translateX(-10px)
    if (cameramanRef.current) {
      const tx = 160 - approachEased * 170;
      // slight bob while running
      const bobY = approachT < 1 ? Math.sin(localP * 120) * 4 : 0;
      cameramanRef.current.style.transform = `translateX(${tx.toFixed(1)}px) translateY(${bobY.toFixed(1)}px)`;
    }

    // Reporter: starts at translateX(+220px), slightly delayed
    if (reporterRef.current) {
      const delayedT = clamp((localP - 0.04) / 0.40, 0, 1);
      const de = delayedT * delayedT * (3 - 2 * delayedT);
      const tx = 220 - de * 225;
      const bobY = delayedT < 1 ? Math.sin(localP * 130 + 1) * 4 : 0;
      reporterRef.current.style.transform = `translateX(${tx.toFixed(1)}px) translateY(${bobY.toFixed(1)}px)`;
    }

    // Boom operator: starts at translateX(+280px), most delayed
    if (boomRef.current) {
      const delayedT = clamp((localP - 0.08) / 0.40, 0, 1);
      const de = delayedT * delayedT * (3 - 2 * delayedT);
      const tx = 280 - de * 270;
      const bobY = delayedT < 1 ? Math.sin(localP * 125 + 2) * 4 : 0;
      boomRef.current.style.transform = `translateX(${tx.toFixed(1)}px) translateY(${bobY.toFixed(1)}px)`;
    }

    // --- CAMERA FLASH ---
    // Flash once crew arrives (localP > 0.42) every ~2 seconds
    if (flashRef.current) {
      const now = performance.now();
      if (localP > 0.42 && now - lastFlashTime.current > 2000) {
        lastFlashTime.current = now;
        flashRef.current.style.opacity = "1";
        flashActive.current = true;
        setTimeout(() => {
          if (flashRef.current) flashRef.current.style.opacity = "0";
          flashActive.current = false;
        }, 120);
      }
    }

    // --- SPEECH BUBBLE ---
    // Show "Mining Media on the Scene!" after crew arrives
    if (bubbleRef.current) {
      const bubbleT = smoothstep(0.44, 0.52, localP);
      bubbleRef.current.style.opacity = (bubbleT * alpha).toFixed(3);
      bubbleRef.current.style.transform = `scale(${(0.7 + 0.3 * bubbleT).toFixed(3)}) translateY(${(20 - 20 * bubbleT).toFixed(1)}px)`;
    }
  });

  return (
    <div ref={wrapRef} className={styles.crewWrap}>
      {/* Camera Flash overlay */}
      <div ref={flashRef} className={styles.cameraFlash} />

      {/* The three crew members */}

      {/* CAMERAMAN (left) */}
      <div ref={cameramanRef} className={styles.crewMember}>
        <svg viewBox="0 0 72 120" width="72" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="36" cy="40" rx="13" ry="16" fill="#2c3e50" />
          {/* Head */}
          <circle cx="36" cy="18" r="11" fill="#f4a460" />
          {/* Hair */}
          <ellipse cx="36" cy="10" rx="11" ry="6" fill="#2c1a0e" />
          {/* Legs */}
          <rect x="28" y="54" width="8" height="30" rx="4" fill="#1a252f" />
          <rect x="38" y="54" width="8" height="30" rx="4" fill="#1a252f" />
          {/* Shoes */}
          <ellipse cx="32" cy="84" rx="6" ry="3.5" fill="#111" />
          <ellipse cx="42" cy="84" rx="6" ry="3.5" fill="#111" />
          {/* Arms holding camera */}
          <rect x="14" y="38" width="22" height="8" rx="4" fill="#2c3e50" />
          {/* Camera body */}
          <rect x="4" y="34" width="22" height="14" rx="3" fill="#222" />
          {/* Camera lens */}
          <circle cx="6" cy="41" r="5" fill="#111" />
          <circle cx="6" cy="41" r="3" fill="#2980b9" opacity="0.8" />
          {/* Camera flash unit */}
          <rect x="10" y="30" width="10" height="5" rx="2" fill="#555" />
          {/* Viewfinder */}
          <rect x="22" y="31" width="6" height="5" rx="1" fill="#333" />
          {/* Tripod */}
          <line x1="13" y1="48" x2="2" y2="90" stroke="#555" strokeWidth="2" />
          <line x1="13" y1="48" x2="13" y2="90" stroke="#555" strokeWidth="2" />
          <line x1="13" y1="48" x2="24" y2="90" stroke="#555" strokeWidth="2" />
          {/* PRESS badge */}
          <rect x="28" y="38" width="18" height="10" rx="2" fill="#e74c3c" />
          <text x="30" y="46" fontSize="5.5" fill="white" fontWeight="bold" fontFamily="Arial">PRESS</text>
        </svg>
      </div>

      {/* REPORTER (center) */}
      <div ref={reporterRef} className={styles.crewMember}>
        <svg viewBox="0 0 60 120" width="60" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body - yellow blazer */}
          <ellipse cx="30" cy="42" rx="12" ry="15" fill="#f1c40f" />
          {/* Collar / shirt */}
          <ellipse cx="30" cy="38" rx="5" ry="8" fill="#ecf0f1" />
          {/* Head */}
          <circle cx="30" cy="18" r="11" fill="#f4a460" />
          {/* Hair */}
          <ellipse cx="30" cy="10" rx="11" ry="7" fill="#8B4513" />
          <ellipse cx="30" cy="8" rx="9" ry="4" fill="#8B4513" />
          {/* Microphone hand */}
          <rect x="38" y="30" width="8" height="26" rx="4" fill="#f1c40f" />
          {/* Microphone */}
          <rect x="40" y="18" width="8" height="16" rx="4" fill="#555" />
          <ellipse cx="44" cy="16" rx="5" ry="4" fill="#333" />
          {/* Mic logo */}
          <text x="39" y="29" fontSize="5" fill="#f1c40f" fontWeight="bold" fontFamily="Arial">MM</text>
          {/* Legs */}
          <rect x="23" y="55" width="8" height="30" rx="4" fill="#2c3e50" />
          <rect x="32" y="55" width="8" height="30" rx="4" fill="#2c3e50" />
          {/* Shoes */}
          <ellipse cx="27" cy="85" rx="6" ry="3.5" fill="#111" />
          <ellipse cx="36" cy="85" rx="6" ry="3.5" fill="#111" />
          {/* Earpiece */}
          <circle cx="19" cy="22" r="3" fill="#555" />
          <line x1="20" y1="24" x2="22" y2="30" stroke="#333" strokeWidth="1" />
        </svg>
      </div>

      {/* BOOM OPERATOR (right) */}
      <div ref={boomRef} className={styles.crewMember}>
        <svg viewBox="0 0 80 130" width="80" height="130" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <ellipse cx="38" cy="44" rx="13" ry="16" fill="#34495e" />
          {/* Head */}
          <circle cx="38" cy="20" r="11" fill="#f4a460" />
          {/* Headphones */}
          <path d="M27 18 Q38 8 49 18" stroke="#333" strokeWidth="3" fill="none" />
          <rect x="24" y="16" width="6" height="8" rx="2" fill="#222" />
          <rect x="46" y="16" width="6" height="8" rx="2" fill="#222" />
          {/* Hair */}
          <ellipse cx="38" cy="13" rx="10" ry="5" fill="#1a1a1a" />
          {/* Arms holding boom pole up */}
          <rect x="40" y="20" width="8" height="30" rx="4" fill="#34495e" transform="rotate(-70 44 35)" />
          {/* Boom pole */}
          <line x1="50" y1="10" x2="78" y2="4" stroke="#888" strokeWidth="2.5" />
          {/* Boom mic at end */}
          <ellipse cx="78" cy="4" rx="8" ry="4" fill="#444" />
          <ellipse cx="78" cy="4" rx="6" ry="2.5" fill="#666" />
          {/* Windscreen */}
          <ellipse cx="78" cy="4" rx="8" ry="4" fill="none" stroke="#999" strokeWidth="0.8" strokeDasharray="2,1" />
          {/* Cable */}
          <path d="M50 10 Q55 30 51 40" stroke="#333" strokeWidth="1" fill="none" />
          {/* Legs */}
          <rect x="30" y="58" width="8" height="30" rx="4" fill="#1a252f" />
          <rect x="40" y="58" width="8" height="30" rx="4" fill="#1a252f" />
          {/* Shoes */}
          <ellipse cx="34" cy="88" rx="6" ry="3.5" fill="#111" />
          <ellipse cx="44" cy="88" rx="6" ry="3.5" fill="#111" />
          {/* Vest */}
          <rect x="29" y="38" width="18" height="14" rx="2" fill="#2ecc71" opacity="0.6" />
        </svg>
      </div>

      {/* Speech bubble — "Mining Media on the Scene!" */}
      <div ref={bubbleRef} className={styles.speechBubble}>
        <span>📷 Mining Media</span>
        <strong>on the Scene!</strong>
      </div>
    </div>
  );
};
