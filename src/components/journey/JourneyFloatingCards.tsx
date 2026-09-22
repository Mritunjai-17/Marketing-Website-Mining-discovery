"use client";

import React from "react";
import {
  Mail,
  Monitor,
  Share2,
  BookOpen,
  ArrowRight,
  Play,
  Tag,
  Users,
} from "lucide-react";
import styles from "./JourneyFloatingCards.module.css";
import { useJourneyFrame } from "./journeyScroll";

function smoothstep(min: number, max: number, v: number): number {
  const x = Math.max(0, Math.min(1, (v - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

// Point 2 Schedule (2023 Multi-Channel Media Platform: p = 0.22 to 0.40)
const CARD_SCHEDULE_P2 = [
  { start: 0.220, end: 0.252 }, // Card 0: Digital Media
  { start: 0.245, end: 0.278 }, // Card 1: Newsletters
  { start: 0.270, end: 0.304 }, // Card 2: YouTube
  { start: 0.295, end: 0.330 }, // Card 3: Social Media
  { start: 0.320, end: 0.355 }, // Card 4: Magazines
];

// Point 3 Schedule (2024 Branding & Investor Engagement: p = 0.42 to 0.59)
const CARD_SCHEDULE_P3 = [
  { start: 0.420, end: 0.452 }, // Card 0: Branding
  { start: 0.445, end: 0.478 }, // Card 1: Campaigns & Multi-Channel Reach
  { start: 0.470, end: 0.505 }, // Card 2: Investor Engagement
];

// Point 4 Schedule (2025 Full-Service Digital Media Agency: p = 0.61 to 0.78)
const CARD_SCHEDULE_P4 = [
  { start: 0.610, end: 0.642 }, // Card 0: Social Media
  { start: 0.635, end: 0.668 }, // Card 1: Brand Strategy
  { start: 0.660, end: 0.694 }, // Card 2: SEO & Digital Growth
  { start: 0.685, end: 0.720 }, // Card 3: Video Production
  { start: 0.710, end: 0.745 }, // Card 4: Content Creation
];

interface JourneyFloatingCardsProps {
  onOpenMagazines?: () => void;
}

export const JourneyFloatingCards: React.FC<JourneyFloatingCardsProps> = ({ onOpenMagazines }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Group wrappers
  const p2GroupRef = React.useRef<HTMLDivElement>(null);
  const p3GroupRef = React.useRef<HTMLDivElement>(null);
  const p4GroupRef = React.useRef<HTMLDivElement>(null);

  // Point 2 refs
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Point 3 refs
  const p3CardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const p3SvgRef = React.useRef<SVGSVGElement>(null);

  // Point 4 refs
  const p4CardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const p4SvgRef = React.useRef<SVGSVGElement>(null);

  // Frame loop: Cards emerge ONE BY ONE from the truck cargo bay and settle on screen
  // Distinct sets for Point 2 (Media expansion) and Point 3 (Branding & Investor Engagement)
  useJourneyFrame((scene) => {
    const p = scene.progress;
    const el = containerRef.current;
    if (!el) return;

    const inP2 = p >= 0.218 && p <= 0.418;
    const inP3 = p > 0.418 && p <= 0.605;
    const inP4 = p > 0.605 && p <= 0.790;

    if (!inP2 && !inP3 && !inP4) {
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      return;
    }

    el.style.opacity = "1";
    el.style.pointerEvents = "auto";

    const truckX = window.innerWidth * 0.52;
    const truckY = window.innerHeight * 0.68;

    // ---------------------------------------------------- POINT 2 GROUP
    if (inP2) {
      if (p2GroupRef.current) p2GroupRef.current.style.display = "block";
      if (p3GroupRef.current) p3GroupRef.current.style.display = "none";
      if (p4GroupRef.current) p4GroupRef.current.style.display = "none";

      if (svgRef.current) {
        let svgOpacity = 0;
        if (p >= 0.245 && p <= 0.415) {
          const enter = smoothstep(0.245, 0.340, p);
          const leave = smoothstep(0.390, 0.415, p);
          svgOpacity = enter * (1 - leave);
        }
        svgRef.current.style.opacity = svgOpacity.toFixed(3);
      }

      CARD_SCHEDULE_P2.forEach((sched, idx) => {
        const cardEl = cardRefs.current[idx];
        if (!cardEl) return;

        const cardStart = sched.start;
        const cardEnd = sched.end;

        const targetCenterX = cardEl.offsetLeft + cardEl.offsetWidth / 2;
        const targetCenterY = cardEl.offsetTop + cardEl.offsetHeight / 2;
        const deltaX = truckX - targetCenterX;
        const deltaY = truckY - targetCenterY;

        if (p < cardStart) {
          cardEl.style.opacity = "0";
          cardEl.style.pointerEvents = "none";
          cardEl.style.transform = `translate3d(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px, 0) scale(0.05) rotateZ(0deg)`;
          return;
        }

        if (p >= cardStart && p < cardEnd) {
          const t = smoothstep(cardStart, cardEnd, p);
          const easeOut = 1 - Math.pow(1 - t, 3);
          const burstProgress = Math.pow(t, 0.72);

          const scale = 0.05 + Math.pow(t, 0.78) * 0.95;
          const curX = deltaX * (1 - easeOut);
          const arc = Math.sin(t * Math.PI) * -38;
          const curY = deltaY * (1 - burstProgress) + arc;

          const rotZ = (1 - t) * (deltaX > 0 ? 12 : -12);
          const rotX = (1 - t) * 16;
          const opacity = Math.min(1, t * 4.5);

          cardEl.style.opacity = opacity.toFixed(3);
          cardEl.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotateX(${rotX.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
          cardEl.style.pointerEvents = opacity > 0.8 ? "auto" : "none";
        } else if (p >= cardEnd && p <= 0.390) {
          cardEl.style.opacity = "1";
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
          cardEl.style.pointerEvents = "auto";
        } else if (p > 0.390 && p <= 0.415) {
          const fadeOut = 1 - smoothstep(0.390, 0.415, p);
          cardEl.style.opacity = fadeOut.toFixed(3);
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1)";
          cardEl.style.pointerEvents = fadeOut > 0.5 ? "auto" : "none";
        } else {
          cardEl.style.opacity = "0";
          cardEl.style.pointerEvents = "none";
        }
      });
    }

    // ---------------------------------------------------- POINT 3 GROUP
    if (inP3) {
      if (p2GroupRef.current) p2GroupRef.current.style.display = "none";
      if (p3GroupRef.current) p3GroupRef.current.style.display = "block";
      if (p4GroupRef.current) p4GroupRef.current.style.display = "none";

      if (p3SvgRef.current) {
        let svgOpacity = 0;
        if (p >= 0.440 && p <= 0.605) {
          const enter = smoothstep(0.440, 0.495, p);
          const leave = smoothstep(0.575, 0.605, p);
          svgOpacity = enter * (1 - leave);
        }
        p3SvgRef.current.style.opacity = svgOpacity.toFixed(3);
      }

      CARD_SCHEDULE_P3.forEach((sched, idx) => {
        const cardEl = p3CardRefs.current[idx];
        if (!cardEl) return;

        const cardStart = sched.start;
        const cardEnd = sched.end;

        const targetCenterX = cardEl.offsetLeft + cardEl.offsetWidth / 2;
        const targetCenterY = cardEl.offsetTop + cardEl.offsetHeight / 2;
        const deltaX = truckX - targetCenterX;
        const deltaY = truckY - targetCenterY;

        if (p < cardStart) {
          cardEl.style.opacity = "0";
          cardEl.style.pointerEvents = "none";
          cardEl.style.transform = `translate3d(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px, 0) scale(0.05) rotateZ(0deg)`;
          return;
        }

        if (p >= cardStart && p < cardEnd) {
          const t = smoothstep(cardStart, cardEnd, p);
          const easeOut = 1 - Math.pow(1 - t, 3);
          const burstProgress = Math.pow(t, 0.72);

          const scale = 0.05 + Math.pow(t, 0.78) * 0.95;
          const curX = deltaX * (1 - easeOut);
          const arc = Math.sin(t * Math.PI) * -38;
          const curY = deltaY * (1 - burstProgress) + arc;

          const rotZ = (1 - t) * (deltaX > 0 ? 12 : -12);
          const rotX = (1 - t) * 16;
          const opacity = Math.min(1, t * 4.5);

          cardEl.style.opacity = opacity.toFixed(3);
          cardEl.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotateX(${rotX.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
          cardEl.style.pointerEvents = opacity > 0.8 ? "auto" : "none";
        } else if (p >= cardEnd && p <= 0.575) {
          cardEl.style.opacity = "1";
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
          cardEl.style.pointerEvents = "auto";
        } else if (p > 0.575 && p <= 0.605) {
          const fadeOut = 1 - smoothstep(0.575, 0.605, p);
          cardEl.style.opacity = fadeOut.toFixed(3);
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1)";
          cardEl.style.pointerEvents = fadeOut > 0.5 ? "auto" : "none";
        } else {
          cardEl.style.opacity = "0";
          cardEl.style.pointerEvents = "none";
        }
      });
    }

    // ---------------------------------------------------- POINT 4 GROUP
    if (inP4) {
      if (p2GroupRef.current) p2GroupRef.current.style.display = "none";
      if (p3GroupRef.current) p3GroupRef.current.style.display = "none";
      if (p4GroupRef.current) p4GroupRef.current.style.display = "block";

      if (p4SvgRef.current) {
        let svgOpacity = 0;
        if (p >= 0.635 && p <= 0.790) {
          const enter = smoothstep(0.635, 0.700, p);
          const leave = smoothstep(0.755, 0.790, p);
          svgOpacity = enter * (1 - leave);
        }
        p4SvgRef.current.style.opacity = svgOpacity.toFixed(3);
      }

      CARD_SCHEDULE_P4.forEach((sched, idx) => {
        const cardEl = p4CardRefs.current[idx];
        if (!cardEl) return;

        const cardStart = sched.start;
        const cardEnd = sched.end;

        const targetCenterX = cardEl.offsetLeft + cardEl.offsetWidth / 2;
        const targetCenterY = cardEl.offsetTop + cardEl.offsetHeight / 2;
        const deltaX = truckX - targetCenterX;
        const deltaY = truckY - targetCenterY;

        if (p < cardStart) {
          cardEl.style.opacity = "0";
          cardEl.style.pointerEvents = "none";
          cardEl.style.transform = `translate3d(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px, 0) scale(0.05) rotateZ(0deg)`;
          return;
        }

        if (p >= cardStart && p < cardEnd) {
          const t = smoothstep(cardStart, cardEnd, p);
          const easeOut = 1 - Math.pow(1 - t, 3);
          const burstProgress = Math.pow(t, 0.72);

          const scale = 0.05 + Math.pow(t, 0.78) * 0.95;
          const curX = deltaX * (1 - easeOut);
          const arc = Math.sin(t * Math.PI) * -38;
          const curY = deltaY * (1 - burstProgress) + arc;

          const rotZ = (1 - t) * (deltaX > 0 ? 12 : -12);
          const rotX = (1 - t) * 16;
          const opacity = Math.min(1, t * 4.5);

          cardEl.style.opacity = opacity.toFixed(3);
          cardEl.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotateX(${rotX.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
          cardEl.style.pointerEvents = opacity > 0.8 ? "auto" : "none";
        } else if (p >= cardEnd && p <= 0.755) {
          cardEl.style.opacity = "1";
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
          cardEl.style.pointerEvents = "auto";
        } else if (p > 0.755 && p <= 0.790) {
          const fadeOut = 1 - smoothstep(0.755, 0.790, p);
          cardEl.style.opacity = fadeOut.toFixed(3);
          cardEl.style.transform = "translate3d(0, 0, 0) scale(1)";
          cardEl.style.pointerEvents = fadeOut > 0.5 ? "auto" : "none";
        } else {
          cardEl.style.opacity = "0";
          cardEl.style.pointerEvents = "none";
        }
      });
    }
  });

  return (
    <div ref={containerRef} className={styles.floatingNetworkWrap} style={{ opacity: 0 }}>
      {/* =========================================================================
          POINT 2: MULTI-CHANNEL MEDIA PLATFORM (2023)
          ========================================================================= */}
      <div ref={p2GroupRef} style={{ display: "none" }}>
        {/* Golden Glowing Network Constellation Lines */}
        <svg ref={svgRef} className={styles.constellationSvg} viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 440 215 Q 410 270 380 333"
            className={styles.goldLine}
            filter="url(#goldGlow)"
          />
          <path
            d="M 625 165 Q 690 150 760 135"
            className={styles.goldLine}
            filter="url(#goldGlow)"
          />
          <path
            d="M 940 225 Q 970 245 1000 265"
            className={styles.goldLine}
            filter="url(#goldGlow)"
          />
          <path
            d="M 1060 360 L 1060 415"
            className={styles.goldLine}
            filter="url(#goldGlow)"
          />
          <path
            d="M 470 420 C 570 470, 670 490, 740 480"
            className={styles.goldLineDashed}
          />
          <path
            d="M 740 480 C 820 470, 930 460, 1020 475"
            className={styles.goldLineDashed}
          />

          <circle cx="440" cy="215" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="380" cy="333" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="625" cy="165" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="760" cy="135" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="940" cy="225" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="1000" cy="265" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="470" cy="420" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="1060" cy="360" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="1060" cy="415" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="1020" cy="475" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="740" cy="480" r="4.5" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
        </svg>

        {/* P2 Card 0: DIGITAL MEDIA */}
        <div
          ref={(el) => {
            cardRefs.current[0] = el;
          }}
          className={`${styles.floatingCard} ${styles.digitalMediaCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Monitor className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>DIGITAL MEDIA</span>
          </div>
          <img
            src="/cards/bg_card_1.webp"
            alt="Digital Media"
            className={styles.digitalMediaThumb}
          />
          <div className="flex items-center justify-between">
            <h4 className={styles.cardTitle}>Investing in a Sustainable Future</h4>
            <div className={styles.actionArrowBtn} aria-hidden="true">
              <ArrowRight size={13} />
            </div>
          </div>
        </div>

        {/* P2 Card 1: NEWSLETTERS */}
        <div
          ref={(el) => {
            cardRefs.current[1] = el;
          }}
          className={`${styles.floatingCard} ${styles.newslettersCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Mail className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>NEWSLETTERS</span>
          </div>
          <div className={styles.newslettersRow}>
            <div className={styles.newslettersInfo}>
              <h4 className={styles.cardTitle}>Global Mining Insights</h4>
              <p className={styles.cardBodyText}>
                Latest trends, market updates and industry analysis.
              </p>
            </div>
            <img
              src="/services/04-pit.webp"
              alt="Mining Newsletters"
              className={styles.newslettersThumb}
            />
            <div className={styles.actionArrowBtn} aria-hidden="true">
              <ArrowRight size={13} />
            </div>
          </div>
        </div>

        {/* P2 Card 2: YouTube */}
        <div
          ref={(el) => {
            cardRefs.current[2] = el;
          }}
          className={`${styles.floatingCard} ${styles.youtubeCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="font-mono text-[0.62rem] font-bold tracking-widest uppercase text-white">
              YouTube
            </span>
          </div>
          <div className={styles.youtubeThumbWrap}>
            <img
              src="/cards/bg_card_1.webp"
              alt="The Future of Mining"
              className={styles.youtubeThumbImg}
            />
            <div className={styles.playCenterBtn}>
              <div className={styles.playCircle}>
                <Play size={15} className="ml-0.5 fill-red-600 text-red-600" />
              </div>
            </div>
          </div>
          <div className={styles.youtubeMetaRow}>
            <div>
              <p className={styles.youtubeTitle}>The Future of Mining</p>
              <span className={styles.youtubeViews}>2.4M views · 2 weeks ago</span>
            </div>
            <div className={styles.actionArrowBtn} aria-hidden="true">
              <ArrowRight size={13} />
            </div>
          </div>
        </div>

        {/* P2 Card 3: SOCIAL MEDIA */}
        <div
          ref={(el) => {
            cardRefs.current[3] = el;
          }}
          className={`${styles.floatingCard} ${styles.socialMediaCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Share2 className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>SOCIAL MEDIA</span>
          </div>
          <div className={styles.socialRow}>
            <a
              href="https://www.linkedin.com/company/miningdiscovery/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIconBtn} ${styles.socialLinkedin}`}
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              in
            </a>
            <a
              href="https://x.com/MiningDiscovery"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIconBtn} ${styles.socialX}`}
              title="X"
              aria-label="X"
            >
              𝕏
            </a>
            <a
              href="https://www.instagram.com/miningdiscovery"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIconBtn} ${styles.socialInsta}`}
              title="Instagram"
              aria-label="Instagram"
            >
              📸
            </a>
            <a
              href="https://www.youtube.com/@miningdiscovery"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIconBtn} ${styles.socialYoutube}`}
              title="YouTube"
              aria-label="YouTube"
            >
              ▶
            </a>
          </div>
          <div className="flex items-center justify-between">
            <p className={styles.cardBodyText}>Real stories. Global reach.</p>
            <div className={styles.actionArrowBtn} aria-hidden="true">
              <ArrowRight size={13} />
            </div>
          </div>
        </div>

        {/* P2 Card 4: MAGAZINES */}
        <div
          ref={(el) => {
            cardRefs.current[4] = el;
          }}
          className={`${styles.floatingCard} ${styles.magazinesCard}`}
          onClick={onOpenMagazines}
          role="button"
          tabIndex={0}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <BookOpen className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>MAGAZINES</span>
          </div>
          <div className={styles.magazineCoverMini}>
            <img
              src="/cards/bg_card_4.webp"
              alt="Mining Today Magazine"
              className={styles.magazineCoverImg}
            />
            <div className={styles.magazineCoverOverlay}>
              <p className={styles.magazineTitleMini}>MINING TODAY</p>
              <p className={styles.magazineTagMini}>The Next Wave in Mining Investment</p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          POINT 3: BRANDING & INVESTOR ENGAGEMENT (2024)
          ========================================================================= */}
      <div ref={p3GroupRef} style={{ display: "none" }}>
        {/* Point 3 Golden Constellation Network */}
        <svg ref={p3SvgRef} className={styles.constellationSvg} viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <filter id="goldGlowP3" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Road lead-in line to Branding */}
          <path
            d="M 440 160 L 496 160"
            className={styles.goldLine}
            filter="url(#goldGlowP3)"
          />

          {/* Branding to Campaigns / Reach line */}
          <path
            d="M 784 160 Q 820 240 832 335"
            className={styles.goldLine}
            filter="url(#goldGlowP3)"
          />

          {/* Cross-highway connecting line to Investor Engagement */}
          <path
            d="M 832 385 C 780 470, 750 510, 720 520"
            className={styles.goldLineDashed}
          />
          <path
            d="M 720 520 C 680 530, 620 550, 580 560"
            className={styles.goldLineDashed}
          />

          {/* Glowing Constellation Nodes */}
          <circle cx="440" cy="160" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="496" cy="160" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="784" cy="160" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="832" cy="335" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="832" cy="385" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="580" cy="560" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          {/* Highway waypoint node */}
          <circle cx="720" cy="520" r="4.5" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
        </svg>

        {/* P3 Card 0: BRANDING */}
        <div
          ref={(el) => {
            p3CardRefs.current[0] = el;
          }}
          className={`${styles.floatingCard} ${styles.brandingCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Tag className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>BRANDING</span>
          </div>
          <div className={styles.brandingRow}>
            <div className={styles.brandingInfo}>
              <h4 className={styles.cardTitle}>Build a Recognizable Mining Brand</h4>
              <p className={styles.cardBodyText}>
                From identity to storytelling, we make your brand stand out across global markets.
              </p>
            </div>
            <div className={styles.brandingThumb}>
              <div className={styles.brandingThumbInner}>
                <span className={styles.brandingThumbEyebrow}>BRAND IDENTITY</span>
                <span className={styles.brandingThumbText}>Your Mining Story Matters</span>
                <div className={styles.brandingSwatches}>
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-100" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* P3 Card 1: CAMPAIGNS & MULTI-CHANNEL REACH */}
        <div
          ref={(el) => {
            p3CardRefs.current[1] = el;
          }}
          className={`${styles.floatingCard} ${styles.reachCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.reachRow}>
            <div className={styles.reachSocials}>
              <a
                href="https://www.linkedin.com/company/miningdiscovery/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialIconBtn} ${styles.socialLinkedin}`}
                title="LinkedIn"
                aria-label="LinkedIn"
              >
                in
              </a>
              <a
                href="https://x.com/MiningDiscovery"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialIconBtn} ${styles.socialX}`}
                title="X"
                aria-label="X"
              >
                𝕏
              </a>
              <a
                href="https://www.youtube.com/@miningdiscovery"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.socialIconBtn} ${styles.socialYoutube}`}
                title="YouTube"
                aria-label="YouTube"
              >
                ▶
              </a>
            </div>
            <img
              src="/cards/bg_card_1.webp"
              alt="Global Mining Reach"
              className={styles.reachThumb}
            />
          </div>
        </div>

        {/* P3 Card 2: INVESTOR ENGAGEMENT */}
        <div
          ref={(el) => {
            p3CardRefs.current[2] = el;
          }}
          className={`${styles.floatingCard} ${styles.investorCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Users className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>INVESTOR ENGAGEMENT</span>
          </div>
          <div className={styles.investorGrid}>
            <div className={styles.investorColLeft}>
              <div>
                <h4 className={styles.cardTitle}>Connect with Global Investors</h4>
                <p className={styles.cardBodyText}>
                  Targeted campaigns, investor outreach and strategic storytelling to build trust and drive capital.
                </p>
              </div>
              <div className={styles.investorBtn}>
                View Investor Packages <ArrowRight size={11} />
              </div>
            </div>
            <div className={styles.investorColRight}>
              <div className={styles.investorChartWrap} title="Investor Growth Analytics">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path
                    d="M 5 42 Q 25 38 42 26 T 75 14 T 95 6"
                    fill="none"
                    stroke="#d4af37"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="95" cy="6" r="3" fill="#ffffff" stroke="#d4af37" strokeWidth="2" />
                </svg>
              </div>
              <img
                src="/cards/bg_card_3.webp"
                alt="Mining Asset Preview"
                className={styles.investorMineThumb}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          POINT 4: FULL-SERVICE DIGITAL MEDIA AGENCY (2025)
          ========================================================================= */}
      <div ref={p4GroupRef} style={{ display: "none" }}>
        {/* Golden Constellation Lines for P4 — coordinates match actual card positions at 1024px viewport
            Left card right edges:  Social(714,157)  Brand(697,334)  SEO(705,545)
            Right card left edges:  Video(866,138)   Content(881,386)
            Left shoulder nodes:    LS1(792,185)  LS2(778,350)  LS3(766,530)
            Right shoulder nodes:   RS1(855,168)  RS2(862,380) */}
        <svg ref={p4SvgRef} className={styles.constellationSvg} viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <filter id="goldGlowP4" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── SOLID LINES: card edges → shoulder nodes ── */}
          {/* Social Media right edge → left shoulder node 1 */}
          <path d="M 714 157 Q 750 168 792 185" className={styles.goldLine} filter="url(#goldGlowP4)" />
          {/* Brand Strategy right edge → left shoulder node 2 */}
          <path d="M 697 334 Q 735 342 778 350" className={styles.goldLine} filter="url(#goldGlowP4)" />
          {/* SEO right edge → left shoulder node 3 */}
          <path d="M 705 545 Q 735 537 766 530" className={styles.goldLine} filter="url(#goldGlowP4)" />
          {/* Video Production left edge → right shoulder node 1 */}
          <path d="M 866 138 Q 860 152 855 168" className={styles.goldLine} filter="url(#goldGlowP4)" />
          {/* Content Creation left edge → right shoulder node 2 */}
          <path d="M 881 386 Q 872 383 862 380" className={styles.goldLine} filter="url(#goldGlowP4)" />

          {/* ── DASHED LINES: shoulder nodes connected vertically ── */}
          {/* Left shoulder: LS1 → LS2 → LS3 */}
          <path d="M 792 185 Q 786 265 778 350" className={styles.goldLineDashed} />
          <path d="M 778 350 Q 772 440 766 530" className={styles.goldLineDashed} />
          {/* Right shoulder: RS1 → RS2 */}
          <path d="M 855 168 Q 858 272 862 380" className={styles.goldLineDashed} />
          {/* Top cross-arch: LS1 → RS1 (spans the highway above the truck) */}
          <path d="M 792 185 Q 823 155 855 168" className={styles.goldLineDashed} />

          {/* ── NODES at card connection points (gold pulse dots) ── */}
          {/* Left card right-edge nodes */}
          <circle cx="714" cy="157" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="697" cy="334" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="705" cy="545" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          {/* Right card left-edge nodes */}
          <circle cx="866" cy="138" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="881" cy="386" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          {/* Left shoulder junction nodes */}
          <circle cx="792" cy="185" r="4.5" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="778" cy="350" r="4.5" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="766" cy="530" r="4" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          {/* Right shoulder junction nodes */}
          <circle cx="855" cy="168" r="4.5" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
          <circle cx="862" cy="380" r="4.5" className={`${styles.goldNodeDot} ${styles.goldNodeDotPulse}`} />
        </svg>

        {/* P4 Card 0: SOCIAL MEDIA */}
        <div
          ref={(el) => { p4CardRefs.current[0] = el; }}
          className={`${styles.floatingCard} ${styles.p4SocialCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Share2 className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>SOCIAL MEDIA</span>
          </div>
          <div className={styles.p4SocialInner}>
            <div className={styles.p4SocialText}>
              <p className={styles.cardBodyText}>
                Strategy, Content, Community. Building your brand across every platform.
              </p>
              {/* Platform icons row */}
              <div className={styles.p4SocialIcons}>
                <a
                  href="https://www.instagram.com/miningdiscovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.p4SocialIcon} ${styles.p4Ig}`}
                  title="Instagram"
                  aria-label="Instagram"
                >
                  ig
                </a>
                <a
                  href="https://www.linkedin.com/company/miningdiscovery/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.p4SocialIcon} ${styles.p4Li}`}
                  title="LinkedIn"
                  aria-label="LinkedIn"
                >
                  in
                </a>
                <a
                  href="https://www.youtube.com/@miningdiscovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.p4SocialIcon} ${styles.p4Yt}`}
                  title="YouTube"
                  aria-label="YouTube"
                >
                  ▶
                </a>
                <a
                  href="https://x.com/MiningDiscovery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.p4SocialIcon} ${styles.p4Tw}`}
                  title="X/Twitter"
                  aria-label="X"
                >
                  𝕏
                </a>
                <a
                  href="https://www.facebook.com/share/17woBUaJqG/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.p4SocialIcon} ${styles.p4Fb}`}
                  title="Facebook"
                  aria-label="Facebook"
                >
                  f
                </a>
              </div>
            </div>
            {/* Inline phone thumbnail */}
            <div className={styles.p4PhoneMini}>
              <div className={styles.p4PhoneMiniScreen}>
                <img src="/cards/bg_card_1.webp" alt="Social feed" className={styles.p4PhoneMiniImg} />
              </div>
            </div>
          </div>
        </div>

        {/* P4 Card 1: BRAND STRATEGY */}
        <div
          ref={(el) => { p4CardRefs.current[1] = el; }}
          className={`${styles.floatingCard} ${styles.p4BrandCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Tag className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>BRAND STRATEGY</span>
          </div>
          <div className={styles.p4BrandRow}>
            <div>
              <p className={styles.cardBodyText}>
                Positioning. Identity.<br />Long-term impact.
              </p>
            </div>
            <div className={styles.p4BrandThumb}>
              <div className={styles.p4BrandThumbInner}>
                <span className={styles.p4BrandLogo}>Md</span>
                <div className={styles.p4BrandSwatches}>
                  <span className={styles.p4Swatch1} />
                  <span className={styles.p4Swatch2} />
                  <span className={styles.p4Swatch3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* P4 Card 2: SEO & DIGITAL GROWTH */}
        <div
          ref={(el) => { p4CardRefs.current[2] = el; }}
          className={`${styles.floatingCard} ${styles.p4SeoCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Monitor className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>SEO &amp; DIGITAL GROWTH</span>
          </div>
          <p className={styles.cardBodyText}>
            More visibility.<br />More opportunities.
          </p>
          {/* Growth chart SVG */}
          <div className={styles.p4SeoChart}>
            <svg viewBox="0 0 110 48" className={styles.p4SeoChartSvg}>
              <path d="M 5 42 Q 25 36 45 26 T 80 14 T 105 6"
                fill="none" stroke="#d4af37" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="105" cy="6" r="3" fill="#ffffff" stroke="#d4af37" strokeWidth="1.8" />
              <path d="M 5 42 Q 25 36 45 26 T 80 14 T 105 6 L 105 48 L 5 48 Z"
                fill="url(#p4SeoGrad)" opacity="0.25" />
              <defs>
                <linearGradient id="p4SeoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.p4SeoGrowthBadge}>+124%</span>
          </div>
        </div>

        {/* P4 Card 3: VIDEO PRODUCTION */}
        <div
          ref={(el) => { p4CardRefs.current[3] = el; }}
          className={`${styles.floatingCard} ${styles.p4VideoCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <Play className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>VIDEO PRODUCTION</span>
          </div>
          <p className={styles.cardBodyText}>Powerful stories that showcase your impact.</p>
          {/* Two video thumbnail previews */}
          <div className={styles.p4VideoThumbs}>
            <div className={styles.p4VideoThumb}>
              <img src="/cards/bg_card_2.webp" alt="Video 1" className={styles.p4VideoThumbImg} />
              <div className={styles.p4VideoPlayBtn}>▶</div>
              <span className={styles.p4VideoDuration}>2:08</span>
            </div>
            <div className={styles.p4VideoThumb}>
              <img src="/cards/bg_card_3.webp" alt="Video 2" className={styles.p4VideoThumbImg} />
              <div className={styles.p4VideoPlayBtn}>▶</div>
              <span className={styles.p4VideoDuration}>1:14</span>
            </div>
          </div>
        </div>

        {/* P4 Card 4: CONTENT CREATION */}
        <div
          ref={(el) => { p4CardRefs.current[4] = el; }}
          className={`${styles.floatingCard} ${styles.p4ContentCard}`}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className={styles.cardHeader}>
            <BookOpen className={styles.cardHeaderIcon} />
            <span className={styles.cardHeaderTag}>CONTENT CREATION</span>
          </div>
          <p className={styles.cardBodyText}>
            Articles, visuals, videos and more — tailored to your audience.
          </p>
          <div className={styles.p4ContentDevice}>
            {/* Browser chrome header */}
            <div className={styles.p4ContentDeviceBrow}>
              <span className={styles.p4BrowserDot} />
              <span className={styles.p4BrowserDot} />
              <span className={styles.p4BrowserDot} />
            </div>
            <div className={styles.p4ContentDeviceScreen}>
              <img src="/cards/bg_card_1.webp" alt="Content preview" className={styles.p4ContentDeviceImg} />
            </div>
            <div className={styles.p4ContentDeviceBase} />
            <div className={styles.p4ContentDeviceFoot} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyFloatingCards;
