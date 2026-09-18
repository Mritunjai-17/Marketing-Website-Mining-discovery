"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MagazineEdition,
  getChronologicalMagazines,
  getLatestMagazine,
} from "@/data/magazines";
import { MagazineSpread } from "./MagazineSpread";
import styles from "./MagazineShowcase.module.css";

interface MagazineShowcaseProps {
  magazine?: MagazineEdition;
  className?: string;
}

type ReaderState = "closed" | "opening" | "open" | "closing";

// In-memory cache for rendered cover data URLs to guarantee instant loads
const coverCache = new Map<string, string>();

function loadPdfJs(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Window undefined"));
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="/pdf.min.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).pdfjsLib));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        resolve(lib);
      } else {
        reject(new Error("pdfjsLib not found on window"));
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/* --------------------------------------------------------------------------
   ShowcaseCardCover - Render cover for the 5-magazine showcase cards
   -------------------------------------------------------------------------- */
export const ShowcaseCardCover: React.FC<{ mag: MagazineEdition }> = ({ mag }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    coverCache.get(mag.pdf) || null
  );
  const [isLoading, setIsLoading] = useState(!coverUrl);

  useEffect(() => {
    if (coverCache.has(mag.pdf)) {
      setCoverUrl(coverCache.get(mag.pdf)!);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    async function renderCover() {
      try {
        const pdfjsLib = await loadPdfJs();
        if (isCancelled) return;

        const doc = await pdfjsLib.getDocument(mag.pdf).promise;
        if (isCancelled) return;

        const page = await doc.getPage(1);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = 800; // Crisp high-res cover
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!isCancelled) {
          try {
            const dataUrl = canvas.toDataURL("image/webp", 0.92);
            coverCache.set(mag.pdf, dataUrl);
            setCoverUrl(dataUrl);
          } catch {
            // canvas remains visible
          }
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) setIsLoading(false);
      }
    }

    renderCover();

    return () => {
      isCancelled = true;
    };
  }, [mag.pdf]);

  return (
    <>
      {isLoading && (
        <div className={styles.coverSkeleton} aria-hidden="true">
          <div className={styles.skeletonShimmer} />
        </div>
      )}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`${mag.month} Edition ${mag.year} Cover`}
          className={styles.coverImage}
        />
      ) : (
        <canvas
          ref={canvasRef}
          className={`${styles.coverCanvas} ${isLoading ? styles.canvasHidden : ""}`}
          aria-label={`${mag.month} Edition ${mag.year} Cover`}
        />
      )}
    </>
  );
};

/* --------------------------------------------------------------------------
   EditionCoverCard - Lazy rendered thumbnail for complete archive library
   -------------------------------------------------------------------------- */
export interface EditionCoverCardProps {
  edition: MagazineEdition;
  isSelected: boolean;
  onSelect: (edition: MagazineEdition) => void;
}

export const EditionCoverCard: React.FC<EditionCoverCardProps> = ({
  edition,
  isSelected,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    coverCache.get(edition.pdf) || null
  );
  const [isLoading, setIsLoading] = useState(!coverUrl);

  useEffect(() => {
    if (coverCache.has(edition.pdf)) {
      setCoverUrl(coverCache.get(edition.pdf)!);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    let observer: IntersectionObserver | null = null;

    async function loadCover() {
      try {
        const pdfjsLib = await loadPdfJs();
        if (isCancelled) return;

        const doc = await pdfjsLib.getDocument(edition.pdf).promise;
        if (isCancelled) return;

        const page = await doc.getPage(1);
        if (isCancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = 360;
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!isCancelled) {
          const dataUrl = canvas.toDataURL("image/webp", 0.85);
          coverCache.set(edition.pdf, dataUrl);
          setCoverUrl(dataUrl);
          setIsLoading(false);
        }
      } catch {
        if (!isCancelled) setIsLoading(false);
      }
    }

    if (containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadCover();
            observer?.disconnect();
          }
        },
        { rootMargin: "250px" }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      isCancelled = true;
      observer?.disconnect();
    };
  }, [edition.pdf]);

  return (
    <div
      ref={containerRef}
      className={`${styles.archiveCard} ${isSelected ? styles.archiveCardSelected : ""}`}
      onClick={() => onSelect(edition)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(edition);
        }
      }}
      aria-label={`Select ${edition.month} Edition ${edition.year}`}
    >
      {isSelected && (
        <span className={styles.selectedBadge} aria-label="Currently Selected">
          Selected
        </span>
      )}

      <div className={styles.thumbWrapper}>
        {isLoading ? (
          <div className={styles.thumbSkeleton} aria-hidden="true">
            <div className={styles.thumbShimmer} />
          </div>
        ) : coverUrl ? (
          <img
            src={coverUrl}
            alt={`${edition.month} Edition ${edition.year} Cover`}
            className={styles.thumbImg}
            loading="lazy"
          />
        ) : (
          <div className={styles.thumbSkeleton} />
        )}

        <div aria-hidden="true" className={styles.thumbSpine} />
      </div>

      <div className={styles.cardMeta}>
        <h4 className={styles.cardMonthYear}>
          {edition.month} {edition.year}
        </h4>
        <span className={styles.cardEditionName}>
          {edition.edition || `Issue ${edition.issueNumber ?? ""}`}
        </span>
        <span className={styles.cardAction}>
          <span>READ EDITION</span>
          <ArrowRight className={styles.cardActionIcon} />
        </span>
      </div>
    </div>
  );
};

export const MagazineShowcase: React.FC<MagazineShowcaseProps> = ({
  magazine,
  className,
}) => {
  const allMagazines = getChronologicalMagazines(false); // All 14 magazines ordered Year -> Month
  const latest5Magazines = allMagazines.slice(0, 5); // Strictly the 5 newest editions

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMagazine, setSelectedMagazine] = useState<MagazineEdition | null>(null);
  const [showAllArchive, setShowAllArchive] = useState(false);

  const activeMagazine = selectedMagazine || latest5Magazines[activeIndex] || latest5Magazines[0];

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const archiveRef = useRef<HTMLDivElement>(null);

  const [readerState, setReaderState] = useState<ReaderState>("closed");
  const [spreadLabel, setSpreadLabel] = useState("INSIDE OPENING SPREAD • PAGES 2–3");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Continuous smooth transform update based on scroll position (0 to 4)
  const updateCardTransforms = useCallback((s: number) => {
    const cardElements = cardRefs.current;
    if (!cardElements) return;

    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    // Spacing factor: percentage of card width
    // On desktop, 82% keeps the incoming and outgoing editions clearly visible in the periphery
    const spacing = isMobile ? 96 : isTablet ? 88 : 82;

    for (let i = 0; i < 5; i++) {
      const el = cardElements[i];
      if (!el) continue;

      const delta = i - s;
      const translateX = delta * spacing;

      // Scale hierarchy:
      // Active (delta = 0): 100%
      // Incoming (delta > 0, e.g. delta = 1): ~80% (75-85% target range)
      // Outgoing (delta < 0, e.g. delta = -1): ~75% (70-80% target range)
      let scale = 1;
      if (delta > 0) {
        scale = Math.max(0.76, 1 - delta * 0.2);
      } else if (delta < 0) {
        scale = Math.max(0.72, 1 + delta * 0.25);
      }

      // Opacity: Active = 1.0; at delta = +/-1, clearly visible (~0.75); fades to 0 beyond +/-1.6
      const absDelta = Math.abs(delta);
      let opacity = 0;
      if (absDelta <= 1.0) {
        opacity = 1 - absDelta * 0.25; // 1.0 at center, 0.75 at delta = +/-1.0
      } else if (absDelta < 1.7) {
        opacity = Math.max(0, 0.75 - (absDelta - 1.0) * 1.07);
      }

      // Depth z-index: Center is highest, incoming slightly behind, outgoing lowest
      const zIndex = Math.round(30 - absDelta * 6);
      const isClickable = absDelta < 0.45;

      el.style.transform = `translate3d(${translateX}%, 0, 0) scale(${scale})`;
      el.style.opacity = `${opacity}`;
      el.style.zIndex = `${zIndex}`;
      el.style.pointerEvents = isClickable ? "auto" : "none";
    }
  }, []);

  // GSAP ScrollTrigger for pure scroll-driven continuous progression
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial positioning at scroll = 0 (July 2026 centered)
    updateCardTransforms(0);

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const scrollPos = self.progress * 4; // Map 0..1 to 0..4
        updateCardTransforms(scrollPos);

        const targetIdx = Math.min(4, Math.max(0, Math.round(scrollPos)));
        setActiveIndex((prev) => {
          if (prev !== targetIdx) {
            // When user scrolls, reset custom selection back to sequence
            setSelectedMagazine(null);
            return targetIdx;
          }
          return prev;
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [updateCardTransforms]);

  // Open & Close handlers for existing reader
  const handleOpen = useCallback(() => {
    if (readerState === "closed") {
      setReaderState("opening");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setReaderState("open");
        });
      });
    }
  }, [readerState]);

  const handleClose = useCallback(() => {
    if (readerState === "open" || readerState === "opening") {
      setReaderState("closing");
      setTimeout(() => {
        setReaderState("closed");
      }, 350);
    }
  }, [readerState]);

  // Scroll locking & Escape key handler
  useEffect(() => {
    if (readerState === "open" || readerState === "opening") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [readerState, handleClose]);

  const handleSelectArchiveEdition = useCallback(
    (edition: MagazineEdition) => {
      setSelectedMagazine(edition);
      handleOpen();
    },
    [handleOpen]
  );

  const handleToggleArchive = useCallback(() => {
    setShowAllArchive((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          archiveRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
      return next;
    });
  }, []);

  const isReaderActive = readerState !== "closed";

  return (
    <div className={`${styles.showcaseStage} ${className || ""}`}>
      {/* ====================================================================
          SCROLL-DRIVEN EDITORIAL SEQUENCE (LATEST 5 EDITIONS)
          Pure scroll controlled right -> left transition with continuous motion
          ==================================================================== */}
      <div ref={scrollContainerRef} className={styles.scrollContainer}>
        <div className={styles.stickyStage}>
          <div className={styles.magazinePresentation}>
            {/* 5-Card Continuous Track */}
            <div className={styles.showcaseCardsTrack}>
              {latest5Magazines.map((mag, idx) => (
                <div
                  key={mag.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className={`${styles.showcaseCard} ${
                    activeIndex === idx ? styles.showcaseCardActive : ""
                  }`}
                  onClick={() => {
                    setSelectedMagazine(mag);
                    handleOpen();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedMagazine(mag);
                      handleOpen();
                    }
                  }}
                  aria-label={`Open ${mag.month} Edition ${mag.year}`}
                >
                  <ShowcaseCardCover mag={mag} />
                  <div aria-hidden="true" className={styles.coverSpine} />
                  <div aria-hidden="true" className={styles.coverSheen} />
                  <div aria-hidden="true" className={styles.coverShield} />
                </div>
              ))}
            </div>

            {/* Active Magazine Metadata */}
            <div className={styles.coverMeta}>
              <div className={styles.editionTag}>
                <span>FEATURED PUBLICATION</span>
                <span className={styles.editionDot} aria-hidden="true" />
                <span>EDITION {activeMagazine.issueNumber ?? (14 - activeIndex)}</span>
              </div>

              <h3 className={styles.editionTitle}>
                {activeMagazine.month} Edition {activeMagazine.year}
              </h3>

              {/* Interactive Open Edition button */}
              <div
                className={styles.openAffordance}
                onClick={() => {
                  setSelectedMagazine(activeMagazine);
                  handleOpen();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedMagazine(activeMagazine);
                    handleOpen();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${activeMagazine.title}`}
              >
                <span>OPEN EDITION</span>
                <ArrowRight className={styles.openAffordanceIcon} />
              </div>

              {/* Progress Indicator Dots */}
              <div className={styles.progressRow} aria-label="Magazine sequence progress">
                {latest5Magazines.map((mag, idx) => (
                  <span
                    key={mag.id}
                    className={`${styles.progressDot} ${
                      activeIndex === idx ? styles.progressDotActive : ""
                    }`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                ))}
              </div>

              {/* View All Magazines CTA */}
              <button
                type="button"
                className={styles.viewAllCtaBtn}
                onClick={handleToggleArchive}
                aria-expanded={showAllArchive}
              >
                <span>
                  {showAllArchive
                    ? "HIDE COMPLETE ARCHIVE"
                    : `VIEW ALL MAGAZINES (${allMagazines.length})`}
                </span>
                <ArrowRight className={styles.viewAllCtaIcon} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          COMPLETE MAGAZINE ARCHIVE (REVEALED ON "VIEW ALL MAGAZINES")
          Chronological grid of all 14 editions with on-demand thumbnail loading
          ==================================================================== */}
      {showAllArchive && (
        <div ref={archiveRef} className={styles.archiveSection}>
          <div className={styles.archiveHeader}>
            <div className={styles.archiveEyebrow}>
              <span className={styles.archiveEyebrowRule} aria-hidden="true" />
              <span>Complete Catalog</span>
              <span className={styles.archiveEyebrowRule} aria-hidden="true" />
            </div>
            <h3 className={styles.archiveTitle}>All Published Editions</h3>
            <p className={styles.archiveSubtitle}>
              Explore all {allMagazines.length} monthly publications from the Mining Discovery library. Select any edition to open the complete magazine reader.
            </p>
          </div>

          <div className={styles.archiveGrid}>
            {allMagazines.map((edition) => (
              <EditionCoverCard
                key={edition.id}
                edition={edition}
                isSelected={activeMagazine.id === edition.id}
                onSelect={handleSelectArchiveEdition}
              />
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ STEP 3: TWO-PAGE SPREAD READER */}
      {isReaderActive && isMounted && createPortal(
        <div
          className={`${styles.readerOverlay} ${
            readerState === "open"
              ? styles.readerOverlayOpen
              : readerState === "opening"
              ? styles.readerOverlayOpening
              : styles.readerOverlayClosing
          }`}
          onClick={(e) => {
            // Close if clicking outside the reader spread
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeMagazine.title} Reader`}
        >
          {/* Header with publication metadata and Close button */}
          <div className={styles.readerHeader}>
            <div className={styles.readerMetaLeft}>
              <span className={styles.readerBrand}>MINING DISCOVERY</span>
              <span className={styles.editionDot} aria-hidden="true" />
              <span className={styles.readerIssue}>
                {activeMagazine.month.toUpperCase()} {activeMagazine.year} • ISSUE{" "}
                {activeMagazine.issueNumber ?? "13"}
              </span>
            </div>

            <button
              type="button"
              className={styles.readerCloseBtn}
              onClick={handleClose}
              aria-label="Close magazine reader"
            >
              <X className={styles.readerCloseIcon} />
              <span>CLOSE</span>
            </button>
          </div>

          {/* Central Reader Stage: Real Two-Page Magazine Spread */}
          <div
            className={styles.readerStage}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleClose();
              }
            }}
          >
            <MagazineSpread
              pdfUrl={activeMagazine.pdf}
              title={activeMagazine.title}
              onSpreadChange={setSpreadLabel}
            />
          </div>

          {/* Subtle footer */}
          <div className={styles.readerFooter}>
            <span>{spreadLabel}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MagazineShowcase;
