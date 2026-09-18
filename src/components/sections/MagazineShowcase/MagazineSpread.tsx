"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./MagazineSpread.module.css";

interface MagazineSpreadProps {
  pdfUrl: string;
  title: string;
  onSpreadChange?: (label: string) => void;
}

// In-memory cache for rendered spread data URLs to guarantee instant navigation
const spreadCache = new Map<string, string>();

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

export const MagazineSpread: React.FC<MagazineSpreadProps> = ({
  pdfUrl,
  title,
  onSpreadChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const isAnimatingRef = useRef(false);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spread Index: 0 = First inside spread (PDF page 2 = Pages 2-3)
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [totalSpreads, setTotalSpreads] = useState(1);
  const [cachedImg, setCachedImg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Mobile single-page side tracking
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSide, setMobileSide] = useState<"left" | "right">("left");

  // Track viewport size for mobile single-page presentation
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Compute page numbers
  const leftPageNum = currentSpreadIndex * 2 + 2;
  const rightPageNum = currentSpreadIndex * 2 + 3;

  // Notify parent of current label
  useEffect(() => {
    if (onSpreadChange) {
      if (isMobile) {
        const singlePage = mobileSide === "left" ? leftPageNum : rightPageNum;
        onSpreadChange(`PAGE ${singlePage}`);
      } else {
        onSpreadChange(`PAGES ${leftPageNum}–${rightPageNum}`);
      }
    }
  }, [currentSpreadIndex, mobileSide, isMobile, leftPageNum, rightPageNum, onSpreadChange]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  // Reset spread index when magazine changes
  useEffect(() => {
    setCurrentSpreadIndex(0);
    setCachedImg(null);
    setFlipState(null);
    setIsAnimating(false);
    isAnimatingRef.current = false;
    setMobileSide("left");
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
  }, [pdfUrl]);

  // Load PDF document and discover spread count
  useEffect(() => {
    let isCancelled = false;

    async function initPdf() {
      try {
        const pdfjsLib = await loadPdfJs();
        if (isCancelled) return;

        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        if (isCancelled) return;

        pdfDocRef.current = doc;

        // Spread pages start at PDF page 2.
        // If last page is a back cover (single page), spreads = doc.numPages - 1
        const availableSpreads = Math.max(1, doc.numPages - 1);
        setTotalSpreads(availableSpreads);
      } catch (err) {
        console.error("Failed to load PDF document:", err);
        if (!isCancelled) setHasError(true);
      }
    }

    initPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  // Animation & Flip State
  interface FlipAnimationState {
    direction: "forward" | "backward";
    fromImg: string;
    toImg: string;
    targetSpreadIndex: number;
    targetMobileSide?: "left" | "right";
  }
  const [flipState, setFlipState] = useState<FlipAnimationState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Render and cache a specific spread
  const renderSpreadImage = useCallback(
    async (spreadIdx: number): Promise<string | null> => {
      if (spreadIdx < 0 || spreadIdx >= totalSpreads) return null;
      const cacheKey = `${pdfUrl}_spread_${spreadIdx}`;
      if (spreadCache.has(cacheKey)) {
        return spreadCache.get(cacheKey)!;
      }

      let doc = pdfDocRef.current;
      if (!doc) {
        try {
          const pdfjsLib = await loadPdfJs();
          doc = await pdfjsLib.getDocument(pdfUrl).promise;
          pdfDocRef.current = doc;
        } catch {
          return null;
        }
      }
      if (!doc) return null;

      try {
        const pdfPageNum = Math.min(spreadIdx + 2, doc.numPages);
        if (pdfPageNum > doc.numPages) return null;

        const page = await doc.getPage(pdfPageNum);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = unscaledViewport.width > unscaledViewport.height * 1.2 ? 2448 : 1224;
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const ctx = offscreenCanvas.getContext("2d", { alpha: false });
        if (!ctx) return null;

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = offscreenCanvas.toDataURL("image/webp", 0.92);
        spreadCache.set(cacheKey, dataUrl);
        return dataUrl;
      } catch (err) {
        console.error("Failed to render spread:", err);
        return null;
      }
    },
    [pdfUrl, totalSpreads]
  );

  const preloadSpread = useCallback(
    (spreadIdx: number) => {
      renderSpreadImage(spreadIdx).catch(() => {});
    },
    [renderSpreadImage]
  );

  // Render current spread on load or spread index change
  useEffect(() => {
    let isCancelled = false;
    const cacheKey = `${pdfUrl}_spread_${currentSpreadIndex}`;

    if (spreadCache.has(cacheKey)) {
      setCachedImg(spreadCache.get(cacheKey)!);
      setIsLoading(false);
      preloadSpread(currentSpreadIndex + 1);
      preloadSpread(currentSpreadIndex - 1);
      return;
    }

    async function renderCurrentSpread() {
      try {
        setIsLoading(true);
        setHasError(false);

        const dataUrl = await renderSpreadImage(currentSpreadIndex);
        if (!isCancelled) {
          if (dataUrl) {
            setCachedImg(dataUrl);
            setIsLoading(false);
            preloadSpread(currentSpreadIndex + 1);
            preloadSpread(currentSpreadIndex - 1);
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    renderCurrentSpread();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl, currentSpreadIndex, renderSpreadImage, preloadSpread]);

  // Navigation Handlers
  const hasNext = isMobile
    ? mobileSide === "left" || currentSpreadIndex < totalSpreads - 1
    : currentSpreadIndex < totalSpreads - 1;

  const hasPrev = isMobile
    ? mobileSide === "right" || currentSpreadIndex > 0
    : currentSpreadIndex > 0;

  // Complete page flip transition atomically
  const finishFlip = useCallback(() => {
    setFlipState((currentFlip) => {
      if (!currentFlip) return null;

      // 1. Immediately set the new spread image as cachedImg to prevent any reversion
      setCachedImg(currentFlip.toImg);

      // 2. Update current spread index to target spread index
      setCurrentSpreadIndex(currentFlip.targetSpreadIndex);

      if (isMobile && currentFlip.targetMobileSide) {
        setMobileSide(currentFlip.targetMobileSide);
      }

      isAnimatingRef.current = false;
      setIsAnimating(false);
      return null;
    });
  }, [isMobile]);

  const handleNext = useCallback(async () => {
    if (isAnimatingRef.current || isAnimating || isLoading) return;
    if (!hasNext) return;

    let targetSpreadIdx = currentSpreadIndex;
    let targetMobileSide: "left" | "right" = mobileSide;

    if (isMobile) {
      if (mobileSide === "left") {
        targetMobileSide = "right";
      } else if (currentSpreadIndex < totalSpreads - 1) {
        targetSpreadIdx = currentSpreadIndex + 1;
        targetMobileSide = "left";
      }
    } else {
      if (currentSpreadIndex < totalSpreads - 1) {
        targetSpreadIdx = currentSpreadIndex + 1;
      }
    }

    if (targetSpreadIdx === currentSpreadIndex && targetMobileSide === mobileSide) return;
    if (targetSpreadIdx >= totalSpreads) return;

    const currentImg = cachedImg;
    if (!currentImg) {
      setCurrentSpreadIndex(targetSpreadIdx);
      if (isMobile) setMobileSide(targetMobileSide);
      return;
    }

    isAnimatingRef.current = true;
    setIsAnimating(true);

    let targetImg = await renderSpreadImage(targetSpreadIdx);
    if (!targetImg) {
      targetImg = currentImg;
    }

    // Trigger physical 3D page turn
    setFlipState({
      direction: "forward",
      fromImg: currentImg,
      toImg: targetImg,
      targetSpreadIndex: targetSpreadIdx,
      targetMobileSide,
    });

    // Safety timeout in case animationend is skipped
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      finishFlip();
    }, 720);
  }, [
    isAnimating,
    isLoading,
    hasNext,
    cachedImg,
    currentSpreadIndex,
    totalSpreads,
    isMobile,
    mobileSide,
    renderSpreadImage,
    finishFlip,
  ]);

  const handlePrev = useCallback(async () => {
    if (isAnimatingRef.current || isAnimating || isLoading) return;
    if (!hasPrev) return;

    let targetSpreadIdx = currentSpreadIndex;
    let targetMobileSide: "left" | "right" = mobileSide;

    if (isMobile) {
      if (mobileSide === "right") {
        targetMobileSide = "left";
      } else if (currentSpreadIndex > 0) {
        targetSpreadIdx = currentSpreadIndex - 1;
        targetMobileSide = "right";
      }
    } else {
      if (currentSpreadIndex > 0) {
        targetSpreadIdx = currentSpreadIndex - 1;
      }
    }

    if (targetSpreadIdx === currentSpreadIndex && targetMobileSide === mobileSide) return;
    if (targetSpreadIdx < 0) return;

    const currentImg = cachedImg;
    if (!currentImg) {
      setCurrentSpreadIndex(targetSpreadIdx);
      if (isMobile) setMobileSide(targetMobileSide);
      return;
    }

    isAnimatingRef.current = true;
    setIsAnimating(true);

    let targetImg = await renderSpreadImage(targetSpreadIdx);
    if (!targetImg) {
      targetImg = currentImg;
    }

    // Trigger physical reverse 3D page turn
    setFlipState({
      direction: "backward",
      fromImg: currentImg,
      toImg: targetImg,
      targetSpreadIndex: targetSpreadIdx,
      targetMobileSide,
    });

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => {
      finishFlip();
    }, 720);
  }, [
    isAnimating,
    isLoading,
    hasPrev,
    cachedImg,
    currentSpreadIndex,
    isMobile,
    mobileSide,
    renderSpreadImage,
    finishFlip,
  ]);

  // Keyboard navigation for page turning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div className={styles.spreadWrapper}>
      <div className={styles.spreadFrame}>
        {/* Loading skeleton */}
        {isLoading && !cachedImg && !flipState && (
          <div className={styles.spreadSkeleton} aria-hidden="true">
            <div className={styles.skeletonShimmer} />
            <div className={styles.spreadSpine} />
          </div>
        )}

        {/* Error fallback */}
        {hasError ? (
          <div className={styles.spreadError}>
            <span>MAGAZINE SPREAD CURRENTLY UNAVAILABLE</span>
          </div>
        ) : flipState ? (
          /* ================= STEP 5: 3D REALISTIC PAGE TURN ================= */
          <div
            className={styles.flipContainer}
            aria-hidden="true"
          >
            {/* Underneath Base Left Page */}
            <div className={`${styles.baseHalf} ${styles.baseLeft}`}>
              <img
                src={flipState.direction === "forward" ? flipState.fromImg : flipState.toImg}
                alt="Left Page"
                className={styles.halfImgLeft}
              />
              {flipState.direction === "backward" && (
                <div className={`${styles.castShadow} ${styles.castShadowLeft}`} />
              )}
            </div>

            {/* Underneath Base Right Page */}
            <div className={`${styles.baseHalf} ${styles.baseRight}`}>
              <img
                src={flipState.direction === "forward" ? flipState.toImg : flipState.fromImg}
                alt="Right Page"
                className={styles.halfImgRight}
              />
              {flipState.direction === "forward" && (
                <div className={`${styles.castShadow} ${styles.castShadowRight}`} />
              )}
            </div>

            {/* The physical turning leaf rotating around the spine */}
            <div
              className={`${styles.turningLeaf} ${
                flipState.direction === "forward" ? styles.leafForward : styles.leafBackward
              }`}
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) {
                  if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
                  finishFlip();
                }
              }}
            >
              {/* Front Face: Current page turning away */}
              <div className={`${styles.leafFace} ${styles.leafFaceFront}`}>
                <img
                  src={flipState.fromImg}
                  alt="Turning leaf front"
                  className={
                    flipState.direction === "forward"
                      ? styles.halfImgRight
                      : styles.halfImgLeft
                  }
                />
                <div className={styles.dynamicShadowFront} />
              </div>

              {/* Back Face: New page landing into place */}
              <div className={`${styles.leafFace} ${styles.leafFaceBack}`}>
                <img
                  src={flipState.toImg}
                  alt="Turning leaf back"
                  className={
                    flipState.direction === "forward"
                      ? styles.halfImgLeft
                      : styles.halfImgRight
                  }
                />
                <div className={styles.dynamicShadowBack} />
              </div>
            </div>
          </div>
        ) : cachedImg ? (
          /* Static Two-Page Spread */
          <img
            src={cachedImg}
            alt={`${title} Spread ${currentSpreadIndex + 1}`}
            className={`${styles.spreadImage} ${
              isMobile
                ? mobileSide === "left"
                  ? styles.mobileShowLeft
                  : styles.mobileShowRight
                : ""
            }`}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className={`${styles.spreadCanvas} ${isLoading ? styles.canvasHidden : ""} ${
              isMobile
                ? mobileSide === "left"
                  ? styles.mobileShowLeft
                  : styles.mobileShowRight
                : ""
            }`}
            aria-label={`${title} Spread ${currentSpreadIndex + 1}`}
          />
        )}

        {/* Tactile Center Spine Shadow (Desktop/Tablet) */}
        <div aria-hidden="true" className={styles.spreadSpine} />

        {/* Outer binding edge shadows */}
        <div aria-hidden="true" className={styles.spreadEdgeLeft} />
        <div aria-hidden="true" className={styles.spreadEdgeRight} />

        {/* Subtle satin paper sheen */}
        <div aria-hidden="true" className={styles.spreadSheen} />

        {/* ----------------- INTERACTIVE TWO-PAGE CLICK ZONES ----------------- */}
        <div className={styles.spreadClickZones}>
          {/* Left Page Zone (Click -> Previous Spread) */}
          <button
            type="button"
            className={`${styles.zoneLeft} ${
              hasPrev && !isAnimating ? styles.zoneActive : styles.zoneDisabled
            }`}
            onClick={handlePrev}
            disabled={!hasPrev || isAnimating}
            aria-label={hasPrev ? "Previous spread" : "First spread reached"}
          >
            {hasPrev && !isAnimating && (
              <span className={styles.navHintLeft} aria-hidden="true">
                <ChevronLeft className={styles.hintIcon} />
              </span>
            )}
          </button>

          {/* Right Page Zone (Click -> Next Spread) */}
          <button
            type="button"
            className={`${styles.zoneRight} ${
              hasNext && !isAnimating ? styles.zoneActive : styles.zoneDisabled
            }`}
            onClick={handleNext}
            disabled={!hasNext || isAnimating}
            aria-label={hasNext ? "Next spread" : "Last spread reached"}
          >
            {hasNext && !isAnimating && (
              <span className={styles.navHintRight} aria-hidden="true">
                <ChevronRight className={styles.hintIcon} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagazineSpread;
