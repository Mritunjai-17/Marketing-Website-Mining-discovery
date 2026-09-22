"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ==========================================================================
   DATA CONSTANTS
   ========================================================================== */

export interface FocusCard {
  id: string;
  badge: string;
  category: string;
  title: string;
  description: string;
  image: string;
  locationTag?: string;
  ctaText: string;
  ctaHref: string;
}

export const FOCUS_CARDS: FocusCard[] = [
  {
    id: "alliance-1",
    badge: "01 — CONFERENCE & POLICY",
    category: "STRATEGIC ALLIANCE",
    title: "Leading Mining Associations",
    description: "Knowledge sharing, policy alignment, and keynote conference partnerships.",
    image: "/images/cards/card_01_alliances.jpg",
    locationTag: "[ 01 · CONFERENCE & POLICY ]",
    ctaText: "Explore Alliance",
    ctaHref: "/contact",
  },
  {
    id: "alliance-2",
    badge: "02 — TECH & PLATFORMS",
    category: "INTEGRATED INFRASTRUCTURE",
    title: "Service & Technology Providers",
    description: "Co-branded digital campaigns, software integration, and investor showcase events.",
    image: "/images/cards/card_02_technology.jpg",
    locationTag: "[ 02 · TECH & PLATFORMS ]",
    ctaText: "Explore Alliance",
    ctaHref: "/contact",
  },
  {
    id: "alliance-3",
    badge: "03 — GROWTH & CAPITAL",
    category: "CORPORATE EXPANSION",
    title: "Corporate Growth Partners",
    description: "Digital transformation in marketing, corporate re-branding, and liquidity acceleration.",
    image: "/images/cards/card_03_growth.jpg",
    locationTag: "[ 03 · GROWTH & CAPITAL ]",
    ctaText: "Explore Alliance",
    ctaHref: "/contact",
  },
  {
    id: "alliance-4",
    badge: "04 — ESG & GOVERNANCE",
    category: "MARKET INTEGRITY",
    title: "Regulatory & Transparency Bodies",
    description: "Promoting ESG reporting standards, investor trust, and verified market intelligence.",
    image: "/images/cards/card_04_governance.jpg",
    locationTag: "[ 04 · ESG & GOVERNANCE ]",
    ctaText: "Explore Alliance",
    ctaHref: "/contact",
  },
];

export const CLIENT_GROUPS: { name: string; logo: string }[][] = [
  // Group 1 (Strip 2 - exactly 6 logos)
  [
    { name: "Kodiak Copper", logo: "/images/clients/normalized/kodiak.png?v=6" },
    { name: "Pan Global Resources", logo: "/images/clients/normalized/panglobal.png?v=6" },
    { name: "HE Capital Markets", logo: "/images/clients/normalized/hecapital.png?v=6" },
    { name: "Harfang Exploration", logo: "/images/clients/normalized/harfang.png?v=6" },
    { name: "NeoCloudz", logo: "/images/clients/normalized/neocloudz.png?v=6" },
    { name: "West Red Lake Gold Mines", logo: "/images/clients/normalized/westredlake.png?v=6" },
  ],
  // Group 2 (Strip 3 - exactly 6 logos)
  [
    { name: "Astra Exploration", logo: "/images/clients/normalized/astra.png?v=6" },
    { name: "U.S. Gold Corp", logo: "/images/clients/normalized/usgold.png?v=6" },
    { name: "Guanajuato Silver", logo: "/images/clients/normalized/guanajuato.png?v=6" },
    { name: "Arras Minerals", logo: "/images/clients/normalized/arras.png?v=6" },
    { name: "Arizona Gold & Silver", logo: "/images/clients/normalized/arizona.png?v=6" },
    { name: "Power Metallic", logo: "/images/clients/normalized/powermetallic.png?v=6" },
  ],
  // Group 3 (Strip 1 - exactly 6 logos)
  [
    { name: "USDC Data Centers", logo: "/images/clients/normalized/usdc.png?v=6" },
    { name: "Digipower", logo: "/images/clients/normalized/digipower.png?v=6" },
    { name: "Aurion Resources", logo: "/images/clients/normalized/aurion.png?v=6" },
    { name: "Phenom Resources", logo: "/images/clients/normalized/phenom.png?v=6" },
    { name: "Loyalist Exploration", logo: "/images/clients/normalized/loyalist.png?v=6" },
    { name: "BluEnergy SolarMind", logo: "/images/clients/normalized/bluenergies.png?v=6" },
  ],
];

/* ==========================================================================
   SUBCOMPONENT: 3D CLIENT LOGOS FLIP ROW
   ========================================================================== */

const ClientLogosFlipRow: React.FC = () => {
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [displayGroup, setDisplayGroup] = useState(CLIENT_GROUPS[0]);
  const [flippingSlots, setFlippingSlots] = useState<boolean[]>([false, false, false, false, false, false]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveGroupIndex((currentIdx) => {
        const nextIdx = (currentIdx + 1) % CLIENT_GROUPS.length;
        const nextGroup = CLIENT_GROUPS[nextIdx];

        // Staggered 3D flip across all 6 slots in the row
        [0, 1, 2, 3, 4, 5].forEach((slotIdx) => {
          setTimeout(() => {
            setFlippingSlots((prev) => {
              const next = [...prev];
              next[slotIdx] = true;
              return next;
            });

            // At 90-degree turn: update logo and flip back into place
            setTimeout(() => {
              setDisplayGroup((prev) => {
                const updated = [...prev];
                updated[slotIdx] = nextGroup[slotIdx];
                return updated;
              });

              setFlippingSlots((prev) => {
                const next = [...prev];
                next[slotIdx] = false;
                return next;
              });
            }, 320);
          }, slotIdx * 65);
        });

        return nextIdx;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div className="flipRowWrapper">
        {displayGroup.map((client, slotIdx) => (
          <div
            key={`slot-${slotIdx}`}
            className={`flipCard ${flippingSlots[slotIdx] ? "flipCardRotating" : ""}`}
          >
            <div className="flipCardInner">
              <img
                src={client.logo}
                alt={client.name}
                className="finaleLogoImg"
                loading="eager"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Subtle indicator dots for the 3 groups */}
      <div className="flipPaginationDots" aria-hidden="true">
        {CLIENT_GROUPS.map((_, idx) => (
          <div
            key={`dot-${idx}`}
            className={`flipDot ${idx === activeGroupIndex ? "flipDotActive" : ""}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ==========================================================================
   MASTER COMPONENT: MINING DISCOVERY SHOWCASE (ONE FILE)
   ========================================================================== */

export const MiningDiscoveryShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quoteSectionRef = useRef<HTMLElement>(null);
  const zoomFrameRef = useRef<HTMLDivElement>(null);
  const zoomImageRef = useRef<HTMLImageElement>(null);
  const zoomTitleRef = useRef<HTMLHeadingElement>(null);
  const zoomInfoColRef = useRef<HTMLDivElement>(null);
  const landscapeGridOverlayRef = useRef<HTMLDivElement>(null);
  const columnRevealRef = useRef<HTMLDivElement>(null);
  const columnStripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const horizontalStageRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const horizontalCounterRef = useRef<HTMLSpanElement>(null);
  const finaleSlideRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const scrollableDist = rect.height - winH;

    if (scrollableDist <= 0) return;

    // Progress p normalized from 0.00 (entered top) to 1.00 (scrolled to end)
    const rawP = -rect.top / scrollableDist;
    const p = Math.min(1.0, Math.max(0.0, rawP));

    // STAGE 1: FULL PAGE EDITORIAL QUOTE (p: 0.00 -> 0.22)
    if (quoteSectionRef.current) {
      if (p < 0.16) {
        quoteSectionRef.current.style.opacity = "1";
        quoteSectionRef.current.style.transform = "translate3d(0, 0, 0)";
        quoteSectionRef.current.style.pointerEvents = "auto";
      } else if (p < 0.26) {
        const outP = (p - 0.16) / 0.10;
        quoteSectionRef.current.style.opacity = Math.max(0, 1 - outP).toFixed(3);
        quoteSectionRef.current.style.transform = `translate3d(0, ${(-outP * 55).toFixed(1)}px, 0)`;
        quoteSectionRef.current.style.pointerEvents = outP > 0.5 ? "none" : "auto";
      } else {
        quoteSectionRef.current.style.opacity = "0";
        quoteSectionRef.current.style.pointerEvents = "none";
      }
    }

    // STAGE 2: IMAGE COMES FROM DOWN TO UP, THEN EXPANDS AS SCROLLED (p: 0.16 -> 0.48)
    if (zoomFrameRef.current) {
      const isMobile = winW <= 768;
      const baseW = isMobile ? 90 : 70;
      const baseH = isMobile ? 46 : 48;

      if (p < 0.16) {
        // Quote is on full page, image is hidden DOWN below screen
        zoomFrameRef.current.style.opacity = "0";
        zoomFrameRef.current.style.transform = "translate3d(0, 100vh, 0)";
        zoomFrameRef.current.style.width = `${baseW}vw`;
        zoomFrameRef.current.style.height = `${baseH}vh`;
        zoomFrameRef.current.style.borderRadius = "16px";
        zoomFrameRef.current.style.boxShadow = "none";
      } else if (p < 0.32) {
        // IMAGE COMES FROM DOWN TO UP into the center
        const riseP = (p - 0.16) / 0.16;
        const eased = riseP * riseP * (3 - 2 * riseP);
        const yOffset = (1 - eased) * 100; // 100vh -> 0vh

        zoomFrameRef.current.style.opacity = Math.min(1, riseP * 1.5).toFixed(3);
        zoomFrameRef.current.style.transform = `translate3d(0, ${yOffset.toFixed(1)}vh, 0)`;
        zoomFrameRef.current.style.width = `${baseW}vw`;
        zoomFrameRef.current.style.height = `${baseH}vh`;
        zoomFrameRef.current.style.borderRadius = "16px";
        zoomFrameRef.current.style.boxShadow = `0 30px 80px rgba(0, 0, 0, ${(riseP * 0.28).toFixed(3)})`;
      } else if (p < 0.48) {
        // As scrolled down: Image EXPANDS to fill full screen
        const expandP = (p - 0.32) / 0.16;
        const easedExp = expandP * expandP * (3 - 2 * expandP);
        const currentW = (baseW + easedExp * (100 - baseW)).toFixed(1);
        const currentH = (baseH + easedExp * (100 - baseH)).toFixed(1);
        const currentRadius = ((1 - easedExp) * 16).toFixed(1);
        const shadowAlpha = ((1 - easedExp) * 0.28).toFixed(3);

        zoomFrameRef.current.style.opacity = "1";
        zoomFrameRef.current.style.transform = "none";
        zoomFrameRef.current.style.width = `${currentW}vw`;
        zoomFrameRef.current.style.height = `${currentH}vh`;
        zoomFrameRef.current.style.borderRadius = `${currentRadius}px`;
        zoomFrameRef.current.style.boxShadow = `0 30px 80px rgba(0, 0, 0, ${shadowAlpha})`;
      } else {
        // FULL SCREEN EXPANDED
        zoomFrameRef.current.style.opacity = "1";
        zoomFrameRef.current.style.transform = "none";
        zoomFrameRef.current.style.width = "100vw";
        zoomFrameRef.current.style.height = "100vh";
        zoomFrameRef.current.style.borderRadius = "0px";
        zoomFrameRef.current.style.boxShadow = "none";
      }
    }

    // GRID LINES FADE OUT AS FULLSCREEN ARRIVES
    if (landscapeGridOverlayRef.current) {
      if (p < 0.32) {
        landscapeGridOverlayRef.current.style.opacity = "1";
      } else if (p < 0.44) {
        const fade = 1 - (p - 0.32) / (0.44 - 0.32);
        landscapeGridOverlayRef.current.style.opacity = fade.toFixed(3);
      } else {
        landscapeGridOverlayRef.current.style.opacity = "0";
      }
    }

    // SUSTAINABLE MINING HEADLINE FADE
    if (zoomTitleRef.current) {
      if (p >= 0.48) {
        const titleFade = Math.max(0, 1 - (p - 0.48) / 0.05);
        zoomTitleRef.current.style.opacity = titleFade.toFixed(3);
      } else {
        zoomTitleRef.current.style.opacity = "1";
      }
    }

    // SUBTEXT: TRAVELS FROM DOWN TO UP (p: 0.44 -> 0.54)
    if (zoomInfoColRef.current) {
      if (p < 0.44) {
        zoomInfoColRef.current.style.opacity = "0";
        zoomInfoColRef.current.style.transform = "translate3d(0, 400px, 0)";
      } else if (p < 0.54) {
        const subP = (p - 0.44) / 0.10;
        const subtextY = 400 - subP * 850;
        let subtextOpacity = 1;
        if (subP < 0.20) subtextOpacity = subP / 0.20;
        else if (subP > 0.65) subtextOpacity = Math.max(0, 1 - (subP - 0.65) / 0.35);

        zoomInfoColRef.current.style.transform = `translate3d(0, ${subtextY.toFixed(1)}px, 0)`;
        zoomInfoColRef.current.style.opacity = subtextOpacity.toFixed(3);
      } else {
        zoomInfoColRef.current.style.opacity = "0";
        zoomInfoColRef.current.style.transform = "translate3d(0, -450px, 0)";
      }
    }

    // 6-COLUMN REVEAL OF CLIENT LIGHT IMAGE (p: 0.52 -> 0.60)
    if (columnRevealRef.current) {
      if (p < 0.52) {
        columnRevealRef.current.style.opacity = "0";
        columnRevealRef.current.style.filter = "none";
        for (let i = 0; i < 6; i++) {
          if (columnStripRefs.current[i]) columnStripRefs.current[i]!.style.width = "0%";
        }
      } else if (p < 0.64) {
        // Pure image with 100% clarity, NO blur
        columnRevealRef.current.style.opacity = "1";
        columnRevealRef.current.style.filter = "none";
        columnRevealRef.current.style.transform = "none";

        const revealP = Math.min(1, Math.max(0, (p - 0.52) / (0.58 - 0.52)));
        const wOdd = Math.min(100, Math.max(0, (revealP / 0.65) * 100));
        const wEven = revealP < 0.25 ? 0 : Math.min(100, Math.max(0, ((revealP - 0.25) / 0.75) * 100));
        const widths = [wEven, wOdd, wEven, wOdd, wEven, wOdd];
        for (let i = 0; i < 6; i++) {
          if (columnStripRefs.current[i]) {
            columnStripRefs.current[i]!.style.width = `${widths[i].toFixed(2)}%`;
          }
        }
      } else {
        // p >= 0.64: As cards glide from right, apply normal soft blur (max 5.5px)
        columnRevealRef.current.style.opacity = "1";
        for (let i = 0; i < 6; i++) {
          if (columnStripRefs.current[i]) columnStripRefs.current[i]!.style.width = "100%";
        }
        const cardEntryP = Math.min(1, Math.max(0, (p - 0.64) / 0.08));
        const blurPx = (cardEntryP * 5.5).toFixed(1);
        const scaleVal = (1 + cardEntryP * 0.02).toFixed(3);
        columnRevealRef.current.style.filter = cardEntryP <= 0 ? "none" : `blur(${blurPx}px)`;
        columnRevealRef.current.style.transform = cardEntryP <= 0 ? "none" : `scale(${scaleVal})`;
      }
    }

    // STAGE 3: HORIZONTAL CARDS SCROLL & DYNAMIC FINALE (p: 0.62 -> 1.00)
    if (horizontalStageRef.current && horizontalTrackRef.current) {
      if (p < 0.62) {
        horizontalStageRef.current.style.opacity = "0";
        horizontalStageRef.current.style.pointerEvents = "none";
        horizontalTrackRef.current.style.transform = `translate3d(${winW + 60}px, 0, 0)`;
        if (finaleSlideRef.current) {
          finaleSlideRef.current.style.transform = `translate3d(${winW + 20}px, 0, 0)`;
        }
      } else {
        horizontalStageRef.current.style.opacity = "1";
        horizontalStageRef.current.style.pointerEvents = "auto";

        const firstCard = horizontalTrackRef.current.children[0] as HTMLElement | undefined;
        const cardWidth = firstCard ? firstCard.offsetWidth : Math.min(winW * 0.48, 760);
        const gap = Math.max(32, winW * 0.045);
        const stride = cardWidth + gap;
        const centerOffset = (winW - cardWidth) / 2;

        const startX = winW + 40;
        const centerCard4X = centerOffset - (FOCUS_CARDS.length - 1) * stride;
        const exitX = -((FOCUS_CARDS.length - 1) * stride + cardWidth + 50);
        const totalDistance = startX - exitX;

        if (p < 0.65) {
          // Dedicated pure full-screen image window
          horizontalTrackRef.current.style.transform = `translate3d(${startX.toFixed(1)}px, 0, 0)`;
          if (horizontalCounterRef.current) {
            horizontalCounterRef.current.textContent = `01 / 0${FOCUS_CARDS.length}`;
            horizontalCounterRef.current.style.opacity = "1";
          }
          if (finaleSlideRef.current) {
            finaleSlideRef.current.style.transform = `translate3d(${winW + 20}px, 0, 0)`;
          }
        } else {
          // Cards continuously glide to the left
          const scrollP = Math.min(1, Math.max(0, (p - 0.65) / (1.00 - 0.65)));
          const currentX = startX - scrollP * totalDistance;
          horizontalTrackRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, 0, 0)`;

          if (currentX > centerCard4X) {
            // Moving across cards 1 -> 4
            let activeIndex = 1;
            if (currentX <= centerOffset - stride * 2.5) activeIndex = 4;
            else if (currentX <= centerOffset - stride * 1.5) activeIndex = 3;
            else if (currentX <= centerOffset - stride * 0.5) activeIndex = 2;
            else activeIndex = 1;

            if (horizontalCounterRef.current) {
              horizontalCounterRef.current.textContent = `0${activeIndex} / 0${FOCUS_CARDS.length}`;
              horizontalCounterRef.current.style.opacity = "1";
            }
            if (finaleSlideRef.current) {
              finaleSlideRef.current.style.transform = `translate3d(${winW + 20}px, 0, 0)`;
            }
          } else {
            // As Card 4 exits to left, finale slide glides in from right
            const exitP = Math.min(1, Math.max(0, (currentX - centerCard4X) / (exitX - centerCard4X)));
            const slideX = (1 - exitP) * winW;

            if (finaleSlideRef.current) {
              finaleSlideRef.current.style.transform = `translate3d(${slideX.toFixed(1)}px, 0, 0)`;
            }
            if (horizontalCounterRef.current) {
              horizontalCounterRef.current.textContent = `04 / 0${FOCUS_CARDS.length}`;
              horizontalCounterRef.current.style.opacity = Math.max(0, 1 - exitP * 1.5).toFixed(2);
            }
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div ref={containerRef} className="mds-container">
      {/* Embedded Scoped Styles for Complete Standalone Portability */}
      <style dangerouslySetInnerHTML={{ __html: `
/* BASE CONTAINER & SCROLL PIN */
.mds-container {
  position: relative;
  width: 100%;
  height: 480vh;
  background-color: #0d131f;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1a365d;
  box-sizing: border-box;
}

.mds-container *, .mds-container *::before, .mds-container *::after {
  box-sizing: border-box;
}

.mds-sticky-stage {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #FAF7F2;
}

.mds-viewport {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ARCHITECTURAL GRID (Exact 1:1 match to JourneyStory lightGridOverlay across mobile & laptop) */
.landscapeGridOverlay,
.lightGridOverlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 clamp(1rem, 6vw, 6rem);
  box-sizing: border-box;
  pointer-events: none;
  z-index: 5;
  will-change: opacity;
  transition: opacity 0.2s ease-out;
}

.lightGridLine {
  position: relative;
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}


/* WHITE DESERT SEQUENCE & FINALE */
/* ==========================================================================
   WHITE DESERT LUXURY EDITORIAL QUOTE SECTION (CONTINUOUS IN PULLED STAGE)
   ========================================================================== */

.editorialQuoteSection {
  position: relative;
  z-index: 10;
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: clamp(2rem, 5vh, 4rem) 1rem;
  box-sizing: border-box;
}

.quoteBlockWrapper {
  position: relative;
  margin: 0 auto;
  width: 100%;
  max-width: clamp(320px, 46vw, 620px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  box-sizing: border-box;
  padding: 0 1rem;
}

@media (max-width: 960px) {
  .quoteBlockWrapper {
    margin: 0 auto;
    width: 100%;
    max-width: 520px;
    padding: 0 1.25rem;
  }
}

@media (max-width: 640px) {
  .quoteBlockWrapper {
    margin: 0 auto;
    width: 100%;
    max-width: 100%;
    padding: 0 1.25rem;
  }
}

.quoteMarkChar {
  font-family: var(--font-display-custom), Georgia, "Times New Roman", Garamond, serif;
  font-size: clamp(1.85rem, 2.4vw, 2.2rem);
  font-weight: 400;
  color: #1A202C;
  line-height: 1;
  margin-bottom: clamp(0.9rem, 2vh, 1.4rem);
  user-select: none;
}

.quoteClosingMark {
  display: inline-block;
  font-family: var(--font-display-custom), Georgia, "Times New Roman", Garamond, serif;
  font-style: normal;
  font-weight: 400;
  font-size: clamp(1.85rem, 2.4vw, 2.2rem);
  line-height: 0;
  vertical-align: -0.22em;
  margin-left: 0.15em;
  color: #1A202C;
  user-select: none;
}

.quoteBodyText {
  margin: 0 0 clamp(1.2rem, 2.2vh, 1.8rem) 0;
  padding: 0;
  font-family: var(--font-display-custom), Georgia, "Times New Roman", Garamond, serif;
  font-size: clamp(1.02rem, 1.18vw, 1.22rem);
  font-style: italic;
  font-weight: 400;
  line-height: 1.82;
  letter-spacing: -0.005em;
  color: #1A202C;
  text-indent: clamp(2.6rem, 4.2vw, 4rem);
}

.quoteDividerDash {
  font-family: var(--font-display-custom), Georgia, "Times New Roman", serif;
  font-size: 1.1rem;
  color: #94A3B8;
  margin-bottom: clamp(0.4rem, 0.8vh, 0.7rem);
  user-select: none;
}

.quoteSignatureWrap {
  margin-bottom: 0.6rem;
}

.quoteSignatureSvg {
  width: clamp(160px, 18vw, 220px);
  height: auto;
  display: block;
}

.quoteAuthorName {
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  font-size: clamp(0.88rem, 1.05vw, 0.98rem);
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #1A202C;
  margin-bottom: 0.2rem;
}

.quoteAuthorTitle {
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  font-size: clamp(0.74rem, 0.85vw, 0.82rem);
  font-weight: 400;
  letter-spacing: 0.01em;
  text-transform: none;
  color: #64748B;
}

.scrollDownIndicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: clamp(0.5rem, 1.2vh, 1rem) 0 0;
  font-family: var(--font-mono, monospace);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #94A3B8;
  text-transform: uppercase;
  user-select: none;
  animation: bounceDown 2s infinite ease-in-out;
}

@keyframes bounceDown {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(4px); opacity: 1; }
}

/* ==========================================================================
   WHITE DESERT LANDSCAPE ZOOM SECTION (SMALL TO FULL SCREEN ZOOM)
   ========================================================================== */

/* Subtle Architectural Grid Lines Overlay (Matches JourneyStory Exactly) */
.landscapeGridOverlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 clamp(1rem, 6vw, 6rem);
  box-sizing: border-box;
  pointer-events: none;
  z-index: 5;
  will-change: opacity;
  transition: opacity 0.2s ease-out;
}

.zoomLandscapeSection {
  position: relative;
  z-index: 20;
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
  background: transparent;
}

.zoomImageFrame {
  position: relative;
  width: 70vw;
  height: 48vh;
  overflow: hidden;
  will-change: transform, border-radius, width, height, opacity;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
  transition: box-shadow 0.3s ease;
  transform-origin: center center;
  opacity: 0;
  transform: translate3d(0, 100vh, 0);
}

@media (max-width: 768px) {
  .zoomImageFrame {
    width: 90vw;
    height: 46vh;
  }
}

.zoomImage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 42%;
  will-change: transform;
}

.zoomImageOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(15, 23, 42, 0.26) 0%,
    rgba(15, 23, 42, 0.08) 50%,
    rgba(15, 23, 42, 0.32) 100%
  );
  pointer-events: none;
}

.zoomContentWrap {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  max-width: 1440px;
  padding: clamp(2rem, 6vh, 6rem) clamp(2rem, 6vw, 6rem);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.zoomHeadlineCol {
  flex: 1;
  display: flex;
  align-items: center;
}

.zoomTitle {
  font-family: var(--font-display-custom), Georgia, "Times New Roman", serif;
  font-size: clamp(2.8rem, 5.5vw, 5.5rem);
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1.05;
  margin: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  will-change: transform;
  transform-origin: left center;
}

.zoomTitlePrimary {
  color: #FFFFFF;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 0.9);
}

.zoomTitleSecondary {
  color: #FFFFFF;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 0.9);
  display: inline-flex;
  align-items: baseline;
}

.zoomTitleDot {
  display: inline-block;
  width: clamp(6px, 0.7vw, 10px);
  height: clamp(6px, 0.7vw, 10px);
  background-color: #E65100;
  border-radius: 50%;
  margin-left: 0.4rem;
  box-shadow: 0 0 10px rgba(230, 81, 0, 0.8);
}

.zoomInfoCol {
  width: clamp(280px, 28vw, 420px);
  display: flex;
  flex-direction: column;
  gap: clamp(0.6rem, 1.4vh, 1.2rem);
  will-change: opacity, transform;
}

.zoomInfoEyebrow {
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: clamp(0.75rem, 0.9vw, 0.88rem);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #FFFFFF;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9);
}

.zoomInfoText {
  margin: 0;
  padding: 0;
  font-family: var(--font-sans, system-ui, sans-serif);
  font-size: clamp(0.85rem, 1.0vw, 0.98rem);
  font-weight: 400;
  line-height: 1.72;
  color: #FFFFFF;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9);
}

@media (max-width: 900px) {
  .zoomContentWrap {
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 2rem;
  }
  .zoomInfoCol {
    width: 100%;
    max-width: 500px;
  }
}

/* ==========================================================================
   WHITE DESERT 6-COLUMN VERTICAL SLICE REVEAL (NEW TOPIC IMAGE COVERAGE)
   ========================================================================== */

.columnRevealStage {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
  opacity: 0;
  will-change: opacity, filter, transform;
  transform-origin: center center;
  transition: filter 0.15s ease-out, transform 0.15s ease-out;
}

.revealColumnSlot {
  position: absolute;
  top: 0;
  bottom: 0;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.revealColumnStrip {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  height: 100%;
  width: 0%;
  overflow: hidden;
  will-change: width;
}

.revealImage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: none;
  object-fit: cover;
  object-position: center center;
  display: block;
  pointer-events: none;
}

.revealStripBorder {
  display: none !important;
}

/* ==========================================================================
   WHITE DESERT HORIZONTAL CARDS SLIDER OVER LIGHT CLIENT BACKGROUND
   ========================================================================== */

.horizontalCardsStage {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 60;
  pointer-events: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0;
  box-sizing: border-box;
  opacity: 0;
  will-change: opacity;
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  /* When cards arrive, soften, brighten, and blur the background image for maximum card clarity */
  background: rgba(248, 250, 252, 0.42);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Horizontal Track Viewport */
.horizontalCardsViewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  overflow: visible;
  pointer-events: auto;
  min-height: 0;
  z-index: 60;
}

.horizontalCardsTrack {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: clamp(2rem, 4.5vw, 5rem);
  padding: 0;
  margin: 0;
  will-change: transform;
  pointer-events: auto;
  box-sizing: border-box;
}

/* Individual Focus Card - Exact Match to Pic 1 (Frosted blurred glass perimeter shell) */
.horizontalCardItem {
  width: clamp(340px, 46vw, 720px);
  height: clamp(500px, 72vh, 670px);
  flex-shrink: 0;
  border-radius: 26px;
  /* Frosted blurred glass frame on the sides / perimeter of the card */
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  padding: clamp(14px, 1.8vw, 24px);
  box-shadow: 0 32px 85px rgba(0, 0, 0, 0.32), 0 10px 28px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;
  display: flex;
  position: relative;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  pointer-events: auto;
}

.horizontalCardItem:hover {
  transform: translateY(-5px);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.42), 0 14px 35px rgba(0, 0, 0, 0.25);
}

/* Inner card container framed inside the frosted blurred shell */
.horizontalCardInner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #8a8e96;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}

/* Background image filling the entire inner card */
.horizontalCardBgImage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
  z-index: 1;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.horizontalCardItem:hover .horizontalCardBgImage {
  transform: scale(1.03);
}

/* Subtle overlay that enhances seamless blend at top without blocking */
.horizontalCardOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(138, 142, 150, 0.4) 0%,
    transparent 35%,
    rgba(15, 23, 42, 0.35) 100%
  );
  z-index: 2;
  pointer-events: none;
}

/* Upper Section with text - floats naturally over the seamlessly blended gray top */
.horizontalCardUpper {
  position: relative;
  z-index: 3;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: clamp(0.9rem, 1.8vh, 1.35rem) clamp(1.4rem, 2.5vw, 2.2rem) 0;
  box-sizing: border-box;
  background: transparent;
  pointer-events: auto;
}

/* Top bar with Learn More + matching Pic 2 upper-left */
.horizontalCardTopBar {
  position: relative;
  width: 100%;
  padding: 0 clamp(1.2rem, 2.2vw, 2rem);
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  margin-bottom: clamp(0.15rem, 0.3vh, 0.25rem);
  pointer-events: auto;
}

/* Upper sky content with title and short description */
.horizontalCardTop {
  position: relative;
  padding: 0 clamp(1.2rem, 2.2vw, 2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 540px;
  margin: 0 auto;
  pointer-events: auto;
}

.horizontalCardCategory {
  font-family: var(--font-sans, -apple-system, sans-serif);
  font-size: clamp(0.64rem, 0.72vw, 0.76rem);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #F59E0B;
  margin-bottom: 0.15rem;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
}

.horizontalCardTitle {
  font-family: var(--font-display-custom), Georgia, "Times New Roman", serif;
  font-size: clamp(1.4rem, 1.9vw, 2.1rem);
  font-weight: 400;
  color: #FFFFFF;
  line-height: 1.15;
  margin: 0;
  letter-spacing: 0.02em;
  text-transform: none;
  text-align: center;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.7);
}

.horizontalCardDesc {
  font-family: var(--font-sans, -apple-system, sans-serif);
  font-size: clamp(0.8rem, 0.86vw, 0.9rem);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.94);
  margin: clamp(0.2rem, 0.4vh, 0.35rem) auto 0;
  max-width: 460px;
  text-align: center;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.65);
}

.horizontalCardAction {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-family: var(--font-sans, -apple-system, sans-serif);
  font-size: clamp(0.82rem, 0.92vw, 0.94rem);
  font-weight: 500;
  letter-spacing: 0.03em;
  color: #FFFFFF;
  text-decoration: none;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.horizontalCardAction:hover {
  transform: translateY(-1px);
  color: #FFFFFF;
}

.horizontalCardPlus {
  color: #F59E0B;
  font-weight: 700;
  font-size: 1.05em;
  line-height: 1;
}

/* Bottom full-width coordinate tag matching Pic 2 */
.horizontalCardFooter {
  position: relative;
  z-index: 3;
  width: 100%;
  padding: 0 clamp(1.4rem, 2.5vw, 2.2rem) clamp(1.2rem, 2.2vh, 1.8rem);
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.horizontalCardLocationTag {
  color: rgba(255, 255, 255, 0.92);
  font-family: var(--font-mono, monospace);
  font-size: clamp(0.68rem, 0.76vw, 0.8rem);
  font-weight: 500;
  letter-spacing: 0.16em;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.7);
}

/* Footer Pagination floating at bottom */
.horizontalCardsFooter {
  position: absolute;
  bottom: clamp(1.2rem, 2.5vh, 2rem);
  left: 0;
  width: 100%;
  padding: 0 clamp(2rem, 6vw, 5rem);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 70;
  pointer-events: none;
}

.horizontalCardsCounter {
  font-family: var(--font-mono, monospace);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.horizontalCardsPrompt {
  font-family: var(--font-mono, monospace);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

@media (max-width: 768px) {
  .horizontalCardItem {
    width: 86vw;
    height: 68vh;
  }
  .horizontalCardsTrack {
    padding-left: 7vw;
    padding-right: 7vw;
  }
}

/* ==========================================================================
   FINALE FULL-SCREEN LIGHT BLUE PREMIUM SLIDE (AFTER CARDS FINISH)
   Enters from right to left (x: 100vw -> 0) as cards exit to the left.
   Features: Light blue premium look, mining marketing quote, client logos.
   ========================================================================== */

.horizontalCardsFinaleSlide {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 55;
  pointer-events: auto;
  overflow: hidden;
  will-change: transform;
  transform: translate3d(100vw, 0, 0);
  box-shadow: -24px 0 60px rgba(15, 35, 65, 0.12);
  background: #f6f1e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.horizontalCardsFinaleImage {
  position: absolute;
  inset: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.horizontalCardsFinaleOverlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(246, 241, 233, 0.15) 50%,
    rgba(228, 220, 208, 0.25) 100%
  );
  pointer-events: none;
}

.finaleEditorialContainer {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vh, 3.5rem) clamp(1.2rem, 3.5vw, 3rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: auto;
}

.finaleBrandHeader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: clamp(0.5rem, 1.4vh, 1.1rem);
}

.finaleBrandKicker {
  font-family: var(--font-mono, monospace);
  font-size: clamp(0.64rem, 0.74vw, 0.78rem);
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #1a365d;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0.3rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 10px rgba(30, 60, 95, 0.05);
}

.finaleQuoteBlock {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.finaleQuoteMark {
  font-family: var(--font-display-custom), Georgia, serif;
  font-size: clamp(2.6rem, 4.8vw, 4.4rem);
  line-height: 0.75;
  color: rgba(26, 54, 93, 0.4);
  margin-bottom: clamp(0.35rem, 0.8vh, 0.65rem);
  user-select: none;
}

.finaleQuoteBody {
  font-family: var(--font-display-custom), Georgia, "Times New Roman", serif;
  font-style: italic;
  font-size: clamp(1.25rem, 2.1vw, 2.2rem);
  font-weight: 400;
  line-height: 1.34;
  letter-spacing: -0.01em;
  color: #0c2038;
  margin: 0;
  text-shadow: 0 1px 16px rgba(255, 255, 255, 0.85);
}

.finaleQuoteDash {
  font-family: var(--font-sans), sans-serif;
  font-size: 1.1rem;
  color: #1a365d;
  margin: clamp(0.5rem, 1.1vh, 0.85rem) 0 clamp(0.15rem, 0.3vh, 0.3rem);
}

.finaleQuoteAuthor {
  font-family: var(--font-sans), sans-serif;
  font-size: clamp(0.68rem, 0.78vw, 0.82rem);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-weight: 700;
  color: #1a365d;
}

/* Logos Section */
.finaleClientsSection {
  width: 100%;
  max-width: 1140px;
  margin-top: clamp(1.8rem, 3.8vh, 3.2rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
}

.finaleClientsEyebrow {
  font-family: var(--font-mono, monospace);
  font-size: clamp(0.6rem, 0.68vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(26, 54, 93, 0.65);
  margin-bottom: 0.2rem;
}

/* 6-Card Single Row 3D Flip Display - Equal Grid Distance & Proportions */
.flipRowWrapper {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  align-items: center;
  justify-items: center;
  gap: clamp(0.8rem, 1.8vw, 2.2rem);
  width: 100%;
  max-width: 1260px;
  margin: 0 auto;
  perspective: 1200px;
}

.flipCard {
  width: 100%;
  height: clamp(56px, 7vh, 74px);
  padding: 0 clamp(4px, 0.6vw, 10px);
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 800px;
  transition: transform 0.25s ease;
  box-sizing: border-box;
}

.flipCard:hover {
  transform: translateY(-2px);
}

.flipCardInner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
  transform-style: preserve-3d;
  will-change: transform, opacity;
}

.flipCardRotating .flipCardInner {
  transform: perspective(600px) rotateX(90deg) scale(0.9);
  opacity: 0;
}

.finaleLogoImg {
  width: auto;
  max-width: clamp(140px, 15vw, 185px);
  height: clamp(42px, 5.4vh, 54px);
  max-height: clamp(42px, 5.4vh, 54px);
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(15, 35, 65, 0.05));
  transition: transform 0.2s ease;
}

.flipPaginationDots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: clamp(0.7rem, 1.5vh, 1.2rem);
}

.flipDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(26, 54, 93, 0.22);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.flipDotActive {
  width: 24px;
  border-radius: 9999px;
  background: #1a365d;
}

@media (max-width: 900px) {
  .flipRowWrapper {
    gap: 0.8rem;
    max-width: 100%;
  }
  .flipCard {
    height: 52px;
    padding: 0 4px;
  }
  .finaleLogoImg {
    height: 38px;
    max-height: 38px;
    max-width: 135px;
  }
}

@media (max-width: 768px) {
  .finaleEditorialContainer {
    padding: 1.5rem 1rem;
  }
  .finaleQuoteBody {
    font-size: 1.15rem;
    line-height: 1.4;
  }
  .flipRowWrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
  .flipCard {
    height: 48px;
    padding: 0 4px;
  }
  .finaleLogoImg {
    height: 34px;
    max-height: 34px;
    max-width: 115px;
  }
}

` }} />

      {/* Pinned Sticky Viewport Window */}
      <div className="mds-sticky-stage">
        <div className="mds-viewport">
          {/* Architectural Grid Lines (Exact 1:1 match to JourneyStory across Mobile & Laptop) */}
          <div ref={landscapeGridOverlayRef} className="landscapeGridOverlay" aria-hidden="true">
            <div className="lightGridLine" />
            <div className="lightGridLine" />
            <div className="lightGridLine" />
            <div className="lightGridLine" />
            <div className="lightGridLine" />
            <div className="lightGridLine" />
          </div>

          {/* SECTION 1: WHITE DESERT-STYLE EDITORIAL QUOTE SECTION (FULL PAGE CENTERED) */}
          <section
            ref={quoteSectionRef}
            className="editorialQuoteSection"
            aria-label="Mining Marketing Editorial Vision"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
              pointerEvents: "auto",
            }}
          >
            <div className="quoteBlockWrapper">
              <div className="quoteMarkChar" aria-hidden="true">“</div>

              <blockquote className="quoteBodyText">
                Discovery is only the beginning. Strategic marketing is the catalyst that transforms mineral discovery into global market conviction. In an era where critical resources define industrial progress, exploration without visibility remains buried. Through authoritative media and focused capital outreach, we turn subsurface potential into lasting enterprise value.<span className="quoteClosingMark" aria-hidden="true">”</span>
              </blockquote>
            </div>
          </section>

          {/* SECTION 2: WHITE DESERT-STYLE LANDSCAPE ZOOM SECTION */}
          <section
            className="zoomLandscapeSection"
            aria-label="Mining Discovery Landscape Showcase"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
            }}
          >

            {/* 6-Column Architectural Vertical Reveal of New Topic Image */}
            <div ref={columnRevealRef} className="columnRevealStage" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((colIndex) => (
                <div
                  key={colIndex}
                  className="revealColumnSlot"
                  style={{
                    left: `${(colIndex * 16.666667).toFixed(4)}%`,
                    width: "16.666667%",
                  }}
                >
                  <div
                    ref={(el) => {
                      columnStripRefs.current[colIndex] = el;
                    }}
                    className="revealColumnStrip"
                  >
                    <img
                      src="/images/client_mining_discovery_light.jpg"
                      alt="Mining Discovery Client Strategic Presentation"
                      className="revealImage"
                      style={{
                        transform: `translate3d(${(-colIndex * 16.666667).toFixed(4)}vw, 0, 0)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Sustainable Mining Hero Frame (Comes from down to up, then expands) */}
            <div
              ref={zoomFrameRef}
              className="zoomImageFrame"
              style={{
                opacity: 0,
                transform: "translate3d(0, 100vh, 0)",
              }}
            >
              <img
                ref={zoomImageRef}
                src="/images/white_desert_mining_landscape.jpg"
                alt="Mining Discovery Landscape"
                className="zoomImage"
              />
              <div className="zoomImageOverlay" />

              <div className="zoomContentWrap">
                <div className="zoomHeadlineCol">
                  <h2 ref={zoomTitleRef} className="zoomTitle">
                    <span className="zoomTitlePrimary">SUSTAINABLE</span>
                    <span className="zoomTitleSecondary">
                      MINING
                      <span className="zoomTitleDot" />
                    </span>
                  </h2>
                </div>

                <div ref={zoomInfoColRef} className="zoomInfoCol">
                  <span className="zoomInfoEyebrow">OUR FOCUS AREAS</span>
                  <p className="zoomInfoText">
                    We connect industry leaders, foster strategic global collaboration, and unlock capital opportunities for a stronger, more resilient and sustainable mining future across critical mineral supply chains worldwide.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3 & 4: HORIZONTAL SLIDING GLASS CARDS & SAND FINALE SLIDE */}
            <div
              ref={horizontalStageRef}
              className="horizontalCardsStage"
              aria-label="Our Focus Areas"
            >
              {/* Full-Screen Sand Finale Slide with Closing Quote & 3D Client Logos */}
              <div
                ref={finaleSlideRef}
                className="horizontalCardsFinaleSlide"
              >
                <img
                  src="/images/premium_light_sand_bg.jpg"
                  alt="Mining Discovery Global"
                  className="horizontalCardsFinaleImage"
                  loading="eager"
                />
                <div className="horizontalCardsFinaleOverlay" />

                <div className="finaleEditorialContainer">
                  <div className="finaleBrandHeader">
                    <span className="finaleBrandKicker">
                      Global Mining Marketing &amp; Capital
                    </span>
                  </div>

                  <div className="finaleQuoteBlock">
                    <span className="finaleQuoteMark" aria-hidden="true">
                      &ldquo;
                    </span>
                    <blockquote className="finaleQuoteBody">
                      &ldquo;...in the world&rsquo;s most demanding resource markets, visibility is capital. We transform complex mineral assets into global market dominance.<span className="quoteClosingMark" aria-hidden="true">&rdquo;</span>
                    </blockquote>
                  </div>

                  <div className="finaleClientsSection">
                    <ClientLogosFlipRow />
                  </div>
                </div>
              </div>

              {/* Horizontal Cards Track */}
              <div className="horizontalCardsViewport">
                <div ref={horizontalTrackRef} className="horizontalCardsTrack">
                  {FOCUS_CARDS.map((card) => (
                    <article key={card.id} className="horizontalCardItem">
                      <div className="horizontalCardInner">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="horizontalCardBgImage"
                          loading="eager"
                        />
                        <div className="horizontalCardOverlay" />

                        <div className="horizontalCardUpper">
                          <div className="horizontalCardTopBar">
                            <Link
                              href={card.ctaHref}
                              className="horizontalCardAction"
                            >
                              <span>{card.ctaText}</span>
                              <span className="horizontalCardPlus">✦</span>
                            </Link>
                          </div>

                          <div className="horizontalCardTop">
                            {card.category && (
                              <span className="horizontalCardCategory">
                                {card.category}
                              </span>
                            )}
                            <h3 className="horizontalCardTitle">
                              {card.title}
                            </h3>
                            <p className="horizontalCardDesc">
                              {card.description}
                            </p>
                          </div>
                        </div>

                        {card.locationTag && (
                          <div className="horizontalCardFooter">
                            <span className="horizontalCardLocationTag">
                              {card.locationTag}
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Track Counter */}
              <div className="horizontalCardsFooter">
                <span ref={horizontalCounterRef} className="horizontalCardsCounter">
                  01 / 04
                </span>
                <span className="horizontalCardsPrompt">
                  SCROLL TO EXPLORE &rarr;
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MiningDiscoveryShowcase;
