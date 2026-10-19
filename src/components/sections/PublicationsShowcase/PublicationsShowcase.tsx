"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ArrowRight, X, BookOpen, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { MagazineSpread } from "@/components/sections/MagazineShowcase/MagazineSpread";
import {
  INITIAL_MAGAZINES,
  type MagazineApiItem,
} from "@/data/magazinesApiData";
import {
  INITIAL_NEWSLETTERS,
  INITIAL_ARTICLES,
  INITIAL_CEO_PROFILES,
  PublicationItem,
  CeoProfileItem,
  getProxiedPdfUrl,
} from "@/data/publications";
import styles from "./PublicationsShowcase.module.css";
import magStyles from "@/components/sections/MagazineShowcase/MagazineShowcase.module.css";


const PUBLICATIONS_SUBTITLE_WORDS = [
  "From",
  "our",
  "magazine",
  "and",
  "weekly",
  "newsletter",
  "to",
  "industry",
  "articles",
  "and",
  "CEO",
  "profiles,",
  "we",
  "create",
  "opportunities",
  "for",
  "mining",
  "companies",
  "and",
  "leaders",
  "to",
  "share",
  "their",
  "stories",
  "with",
  "an",
  "audience",
  "that",
  "follows",
  "the",
  "resource",
  "sector.",
];

export interface PublicationSectionItem {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  doc: {
    title: string;
    subtitle: string;
    pdfUrl: string;
  };
}

export interface PublicationSectionConfig {
  id: "magazines" | "newsletter" | "articles" | "ceo-profile";
  kicker: string;
  location: string;
  title: string;
  description: string;
  stats: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
    label3: string;
    value3: string;
  };
  ctaText: string;
  items: PublicationSectionItem[];
}

interface InteractiveCardsRailProps {
  sec: PublicationSectionConfig;
  allMagazinesCount: number;
  newslettersCount: number;
  articlesCount: number;
  allCeosCount: number;
  onOpenDoc: (doc: { title: string; subtitle: string; pdfUrl: string }) => void;
  onOpenCategoryModal: (id: "magazines" | "newsletter" | "articles" | "ceo-profile") => void;
}

const InteractiveCardsRail: React.FC<InteractiveCardsRailProps> = ({
  sec,
  allMagazinesCount,
  newslettersCount,
  articlesCount,
  allCeosCount,
  onOpenDoc,
  onOpenCategoryModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Wheel handling: converts explicit horizontal gestures (trackpad deltaX or Shift+Wheel) into rail gliding
  // Natural vertical scrolling is untouched so normal page scrolling never jumps, stalls or oscillates
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const handleWheel = (e: WheelEvent) => {
      const isExplicitHorizontal = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!isExplicitHorizontal) {
        // Allow uninterrupted natural vertical page scrolling
        return;
      }

      const delta = e.shiftKey ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 0.5) return;

      const maxScroll = rail.scrollWidth - rail.clientWidth;
      if (maxScroll <= 4) return;

      const atEnd = rail.scrollLeft >= maxScroll - 6 && delta > 0;
      const atStart = rail.scrollLeft <= 6 && delta < 0;

      if (!atEnd && !atStart) {
        e.preventDefault();
        if (Math.abs(delta) >= 28) {
          rail.scrollBy({ left: delta * 1.2, behavior: "smooth" });
        } else {
          rail.scrollLeft += delta;
        }
      }
    };

    rail.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      rail.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Global mouseup to release grab state even if pointer leaves window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        if (railRef.current) {
          railRef.current.style.cursor = "grab";
          railRef.current.style.removeProperty("user-select");
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Left & right button navigation
  const handleScrollStep = (direction: "left" | "right") => {
    if (!railRef.current) return;
    const offset = direction === "left" ? -280 : 280;
    railRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Mouse Grab-to-Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !railRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    startScrollLeftRef.current = railRef.current.scrollLeft;
    railRef.current.style.cursor = "grabbing";
    railRef.current.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !railRef.current) return;
    const dx = e.pageX - startXRef.current;
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true;
    }
    railRef.current.scrollLeft = startScrollLeftRef.current - dx;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (railRef.current) {
      railRef.current.style.cursor = "grab";
      railRef.current.style.removeProperty("user-select");
    }
  };

  const handleCardClick = (doc: { title: string; subtitle: string; pdfUrl: string }) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onOpenDoc(doc);
  };

  const handleViewAllClick = () => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onOpenCategoryModal(sec.id);
  };

  return (
    <div ref={containerRef} className={styles.cardsShowcaseCol}>
      <div className={styles.cardsRailHeader}>
        <span className={styles.railLabel}>
          {sec.id === "magazines"
            ? "LATEST EDITIONS"
            : sec.id === "newsletter"
            ? "LATEST DISPATCHES"
            : sec.id === "articles"
            ? "LATEST REPORTS"
            : "LATEST PROFILES"}
        </span>
        <div className={styles.railHeaderControls}>
          <span className={styles.railScrollHint}>Scroll or drag to explore</span>
          <div className={styles.railNavBtns}>
            <button
              type="button"
              className={styles.railNavBtn}
              onClick={() => handleScrollStep("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.railNavBtn}
              onClick={() => handleScrollStep("right")}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className={styles.cardsRail}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {sec.items.map((item, idx) => (
          <div
            key={item.id}
            className={styles.railCard}
            onClick={() => handleCardClick(item.doc)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenDoc(item.doc);
              }
            }}
            aria-label={`Open ${item.title}`}
          >
            <div className={styles.railCoverWrap}>
              <img
                src={item.cover}
                alt={item.title}
                className={styles.railCoverImg}
                loading="lazy"
                draggable={false}
              />
              {idx === 0 && (
                <span className={styles.railLatestBadge}>LATEST</span>
              )}
              <div className={styles.railHoverOverlay}>
                <span className={styles.railReadBtn}>
                  <BookOpen size={14} />
                  <span>OPEN READER</span>
                </span>
              </div>
            </div>

            <div className={styles.railCardBody}>
              <span className={styles.railCardSubtitle}>{item.subtitle}</span>
              <h4 className={styles.railCardTitle}>{item.title}</h4>
              <div className={styles.railCardFooter}>
                <span className={styles.railReadAction}>
                  <span>
                    {sec.id === "magazines"
                      ? "Read Edition"
                      : sec.id === "newsletter"
                      ? "Read Dispatch"
                      : sec.id === "articles"
                      ? "Read Report"
                      : "View Profile"}
                  </span>
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Dedicated End-of-Rail View All CTA Card with Arrow */}
        <div
          className={styles.railViewAllCard}
          onClick={handleViewAllClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenCategoryModal(sec.id);
            }
          }}
          aria-label={sec.ctaText}
        >
          <div className={styles.railViewAllWrap}>
            <div className={styles.railViewAllIconCircle}>
              <ArrowRight size={22} className={styles.railViewAllArrow} />
            </div>
            <span className={styles.railViewAllKicker}>COMPLETE CATALOG</span>
            <h4 className={styles.railViewAllTitle}>
              {sec.id === "magazines"
                ? `View All ${allMagazinesCount} Magazines`
                : sec.id === "newsletter"
                ? `View All ${newslettersCount} Newsletters`
                : sec.id === "articles"
                ? `View All ${articlesCount} Reports`
                : `View All ${allCeosCount} Profiles`}
            </h4>
            <p className={styles.railViewAllDesc}>
              Browse every published volume & archived release.
            </p>
            <div className={styles.railViewAllBtn}>
              <span>OPEN ARCHIVE</span>
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PublicationsShowcaseProps {
  scrollProgress?: number;
}

export const PublicationsShowcase: React.FC<PublicationsShowcaseProps> = ({
  scrollProgress = 0,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const headingWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const subheadingWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const requestTickRef = useRef<(() => void) | null>(null);
  const [headerInView, setHeaderInView] = useState(false);

  const [activeCategoryModal, setActiveCategoryModal] = useState<
    "magazines" | "newsletter" | "articles" | "ceo-profile" | null
  >(null);

  const [activeReaderDoc, setActiveReaderDoc] = useState<{
    title: string;
    subtitle: string;
    pdfUrl: string;
  } | null>(null);

  const [readerState, setReaderState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [spreadLabel, setSpreadLabel] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [magazines, setMagazines] = useState<MagazineApiItem[]>(INITIAL_MAGAZINES);
  const [newsletters, setNewsletters] = useState<PublicationItem[]>(INITIAL_NEWSLETTERS);
  const [articles, setArticles] = useState<PublicationItem[]>(INITIAL_ARTICLES);
  const [ceoProfiles, setCeoProfiles] = useState<CeoProfileItem[]>(INITIAL_CEO_PROFILES);

  const handleOpenDoc = useCallback((doc: { title: string; subtitle: string; pdfUrl: string }) => {
    setActiveReaderDoc(doc);
    setReaderState("opening");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReaderState("open");
      });
    });
  }, []);

  const handleCloseReader = useCallback(() => {
    if (readerState === "open" || readerState === "opening") {
      setReaderState("closing");
      setTimeout(() => {
        setReaderState("closed");
        setActiveReaderDoc(null);
      }, 350);
    }
  }, [readerState]);

  useEffect(() => {
    setIsMounted(true);

    // Preload PDF engine in background for zero-latency flipbook & report rendering
    if (typeof window !== "undefined") {
      const preloadPdfJs = () => {
        if (!(window as any).pdfjsLib && !document.querySelector('script[src="/pdf.min.js"]')) {
          const script = document.createElement("script");
          script.src = "/pdf.min.js";
          script.async = true;
          script.onload = () => {
            if ((window as any).pdfjsLib) {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
            }
          };
          document.head.appendChild(script);
        }
      };
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(preloadPdfJs);
      } else {
        setTimeout(preloadPdfJs, 1000);
      }
    }

    fetch("/api/magazines")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setMagazines(res.data);
        }
      })
      .catch(() => {});

    fetch("/api/ceo-profiles")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setCeoProfiles(res.data);
        }
      })
      .catch(() => {});

    fetch("/api/newsletters")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const sorted = [...res.data].sort((a: any, b: any) => {
            const timeA = new Date(a.date || 0).getTime();
            const timeB = new Date(b.date || 0).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return Number(b.id) - Number(a.id);
          });
          setNewsletters(sorted);
        }
      })
      .catch(() => {});

    fetch("/api/articles")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setArticles(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // When catalog modal opens, ensure it starts cleanly at the top
  useEffect(() => {
    if (activeCategoryModal && overlayRef.current) {
      overlayRef.current.scrollTop = 0;
    }
  }, [activeCategoryModal]);

  // Lock background scroll, pause Lenis & handle Escape key
  useEffect(() => {
    const isModalOpen =
      activeCategoryModal !== null ||
      readerState === "open" ||
      readerState === "opening";

    if (!isModalOpen) return;

    const lenis = typeof window !== "undefined" ? (window as any).lenis : null;

    if (lenis && typeof lenis.stop === "function") {
      lenis.stop();
    }

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (readerState === "open" || readerState === "opening") {
          handleCloseReader();
        } else if (activeCategoryModal !== null) {
          setActiveCategoryModal(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (lenis && typeof lenis.start === "function") {
        lenis.start();
      }
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCategoryModal, readerState, handleCloseReader]);

  // IntersectionObserver guarantee: trigger full reveal once header enters viewport
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHeaderInView(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll-tied word-by-word reveal for Publications Heading & Subheading
  useEffect(() => {
    let rafId: number | null = null;
    let isTicking = false;

    const updateWords = () => {
      if (!headerRef.current) return;
      const isMobile = typeof window !== "undefined" && window.innerWidth <= 840;
      if (isMobile) {
        setHeaderInView(true);
        headingWordRefs.current.forEach((el) => {
          if (!el) return;
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.filter = "none";
        });
        subheadingWordRefs.current.forEach((el) => {
          if (!el) return;
          el.style.opacity = "1";
          el.style.transform = "none";
          el.style.filter = "none";
        });
        return;
      }

      const clientH = window.innerHeight || 800;
      const hRect = headerRef.current.getBoundingClientRect();

      // Trigger full reveal as soon as header enters viewport
      if (hRect.top < clientH * 0.90 && hRect.bottom > 0) {
        setHeaderInView(true);
        return;
      }

      // Responsive scrub range: words reveal quickly and smoothly as section enters
      const revealProgress = Math.max(0, Math.min(1, (clientH * 0.92 - hRect.top) / (clientH * 0.40)));

      if (revealProgress >= 1 || hRect.top < clientH * 0.70) {
        setHeaderInView(true);
        return;
      }

      // Heading words: reveal quickly across 0.00 to 0.40
      const hProg = Math.max(0, Math.min(1, revealProgress / 0.40));
      const headCount = headingWordRefs.current.length || 9;
      headingWordRefs.current.forEach((el, idx) => {
        if (!el) return;
        const start = (idx / headCount) * 0.50;
        const end = start + 0.35;
        const wProg = Math.max(0, Math.min(1, (hProg - start) / (end - start)));
        el.style.opacity = (0.20 + 0.80 * wProg).toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - wProg) * 5).toFixed(1)}px, 0)`;
        el.style.filter = wProg >= 0.98 ? "none" : `blur(${((1 - wProg) * 1.2).toFixed(1)}px)`;
      });

      // Subheading words: reveal from 0.08 to 0.65
      const subProg = Math.max(0, Math.min(1, (revealProgress - 0.08) / 0.60));
      const subCount = PUBLICATIONS_SUBTITLE_WORDS.length;
      subheadingWordRefs.current.forEach((el, idx) => {
        if (!el) return;
        const start = (idx / subCount) * 0.60;
        const end = start + 0.25;
        const wProg = Math.max(0, Math.min(1, (subProg - start) / (end - start)));
        el.style.opacity = (0.20 + 0.80 * wProg).toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - wProg) * 4).toFixed(1)}px, 0)`;
        el.style.filter = wProg >= 0.98 ? "none" : `blur(${((1 - wProg) * 1.0).toFixed(1)}px)`;
      });
    };

    const tick = () => {
      updateWords();
      isTicking = false;
    };

    const requestTick = () => {
      if (!isTicking) {
        isTicking = true;
        rafId = requestAnimationFrame(tick);
      }
    };
    requestTickRef.current = requestTick;

    requestTick();

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    window.addEventListener("wheel", requestTick, { passive: true });
    window.addEventListener("touchmove", requestTick, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      requestTickRef.current = null;
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      window.removeEventListener("wheel", requestTick);
      window.removeEventListener("touchmove", requestTick);
    };
  }, [headerInView]);

  // Scrub words when scrollProgress updates
  useEffect(() => {
    if (!headerInView) {
      requestTickRef.current?.();
    }
  }, [scrollProgress, headerInView]);

  const allMagazines: MagazineApiItem[] = magazines;
  const latestMag = allMagazines[0];
  const allCeos = ceoProfiles;
  const latestCeo = allCeos[0];
  const latestNewsletter = newsletters[0] || INITIAL_NEWSLETTERS[0];
  const latestArticle = articles[0] || INITIAL_ARTICLES[0];

  const publicationSections: PublicationSectionConfig[] = [
    {
      id: "magazines",
      kicker: "MONTHLY PRINT & DIGITAL",
      location: "Global Mining & Exploration",
      title: "Monthly Mining Magazines",
      description:
        "Official published monthly editions featuring in-depth mineral asset teardowns, full-color drill layouts, and c-suite market interviews.",
      stats: {
        label1: "Editions",
        value1: `${allMagazines.length} Vol`,
        label2: "Cadence",
        value2: "Monthly",
        label3: "Reach",
        value3: "45K+",
      },
      ctaText: `VIEW ALL ${allMagazines.length} MAGAZINES`,
      items: allMagazines.slice(0, 5).map((mag) => ({
        id: mag.id,
        title: mag.title || "Mining Discovery Magazine",
        subtitle: `${mag.month?.toUpperCase() || ""} ${mag.year || ""}`,
        cover: mag.cover || INITIAL_MAGAZINES[0].cover,
        doc: {
          title: "Monthly Magazine Edition",
          subtitle: `${mag.month?.toUpperCase() || ""} ${mag.year || ""}`,
          pdfUrl: getProxiedPdfUrl(mag.pdf),
        },
      })),
    },
    {
      id: "newsletter",
      kicker: "WEEKLY NEWSPAPER DISPATCH",
      location: "Global Commodity Desks",
      title: "Weekly Discovery Newsletters",
      description:
        "High-frequency weekly discovery dispatches distributed directly to institutional desks, commodity desks, and family offices.",
      stats: {
        label1: "Issues",
        value1: `${newsletters.length} Ed`,
        label2: "Cadence",
        value2: "Weekly",
        label3: "Reach",
        value3: "28K+",
      },
      ctaText: `VIEW ALL ${newsletters.length} NEWSLETTERS`,
      items: newsletters.slice(0, 5).map((nl) => ({
        id: nl.id,
        title: nl.title || "Weekly Dispatch",
        subtitle: nl.date
          ? new Date(nl.date)
              .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()
          : "WEEKLY ISSUE",
        cover: nl.cover || "/cards/bg_card_1.webp",
        doc: {
          title: "Weekly Newspaper Dispatch",
          subtitle: (nl.title || "Weekly Dispatch").toUpperCase(),
          pdfUrl: getProxiedPdfUrl(nl.pdf),
        },
      })),
    },
    {
      id: "articles",
      kicker: "TECHNICAL RESEARCH",
      location: "Verified QP Technical Research",
      title: "Technical Research & Articles",
      description:
        "Geological assay breakdowns, maiden mineral resource evaluations, and verified QP project discovery reports.",
      stats: {
        label1: "Reports",
        value1: `${articles.length} Tech`,
        label2: "Standard",
        value2: "QP-Assayed",
        label3: "Reach",
        value3: "Global",
      },
      ctaText: `VIEW ALL ${articles.length} REPORTS`,
      items: articles.slice(0, 5).map((art) => ({
        id: art.id,
        title: art.title || "Technical Report",
        subtitle: "QP TECHNICAL RESEARCH",
        cover: art.cover || "/cards/bg_card_3.webp",
        doc: {
          title: "Technical Research Report",
          subtitle: (art.title || "Technical Report").toUpperCase(),
          pdfUrl: getProxiedPdfUrl(art.pdf),
        },
      })),
    },
    {
      id: "ceo-profile",
      kicker: "EXECUTIVE INTERVIEWS",
      location: "Global C-Suite Leadership",
      title: "Executive CEO Profiles",
      description:
        "One-on-one leadership interviews, project vision features, and strategic broadcasts with mining executives across the globe.",
      stats: {
        label1: "Profiles",
        value1: `${allCeos.length} Exec`,
        label2: "Access",
        value2: "C-Suite",
        label3: "Reach",
        value3: "Tier-1",
      },
      ctaText: `VIEW ALL ${allCeos.length} PROFILES`,
      items: allCeos.slice(0, 5).map((ceo) => ({
        id: ceo.id,
        title: ceo.name,
        subtitle: (ceo.designation || "C-SUITE EXECUTIVE").toUpperCase(),
        cover: ceo.cover || ceo.ceoImage || "/cards/bg_card_2.webp",
        doc: {
          title: "Executive CEO Interview",
          subtitle: `${ceo.name.toUpperCase()} — ${ceo.designation || "EXECUTIVE"}`,
          pdfUrl: getProxiedPdfUrl(ceo.pdf),
        },
      })),
    },
  ];

  return (
    <section id="publications-showcase" className={styles.publicationsSection} aria-label="Put Your Mining Story in Front of the Industry">
      {/* Editorial Header */}
      <header ref={headerRef} className={`${styles.header} ${headerInView ? styles.inView : ""}`}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          <span className={styles.eyebrowText}>
            <span className={styles.eyebrowPip}>✦</span>
            <span className={styles.eyebrowChunk}>GLOBAL MEDIA DISTRIBUTION</span>
            <span className={styles.eyebrowDivider}>//</span>
            <span className={styles.eyebrowChunk}>MULTI-PLATFORM REACH</span>
            <span className={styles.eyebrowPip}>✦</span>
          </span>
          <span className={styles.eyebrowRule} aria-hidden="true" />
        </div>

        <h1 className={styles.mainTitle}>
          <span className={styles.titleLine}>
            {["PUT", "YOUR", "MINING", "STORY"].map((word, idx) => (
              <span
                key={idx}
                ref={(el) => {
                  headingWordRefs.current[idx] = el;
                }}
                className={styles.wordSpan}
              >
                {word}{" "}
              </span>
            ))}
          </span>
          <span className={styles.titleLine}>
            {["IN", "FRONT", "OF"].map((word, idx) => (
              <span
                key={idx + 4}
                ref={(el) => {
                  headingWordRefs.current[idx + 4] = el;
                }}
                className={styles.wordSpan}
              >
                {word}{" "}
              </span>
            ))}
            {["THE", "INDUSTRY"].map((word, idx) => (
              <span
                key={idx + 7}
                ref={(el) => {
                  headingWordRefs.current[idx + 7] = el;
                }}
                className={styles.goldWordSpan}
              >
                {word}{" "}
              </span>
            ))}
          </span>
        </h1>

        <p className={styles.description}>
          {PUBLICATIONS_SUBTITLE_WORDS.map((word, idx) => (
            <span
              key={idx}
              ref={(el) => {
                subheadingWordRefs.current[idx] = el;
              }}
              className={styles.subWordSpan}
            >
              {word}{" "}
            </span>
          ))}
        </p>
      </header>

      {/* 4 Dedicated Publication Blocks (Sequential on Scroll) */}
      <div className={styles.categoriesContainer}>
        {publicationSections.map((sec) => (
          <div key={sec.id} className={styles.categoryBlock}>
            {/* Left Column: Editorial Overview & Action */}
            <div className={styles.categoryInfoCol}>
              <div className={styles.categoryTopInfo}>
                <div className={styles.categoryBadgeRow}>
                  <span className={styles.categoryDot} />
                  <span className={styles.categoryKicker}>{sec.kicker}</span>
                </div>

                <h2 className={styles.categoryTitle}>{sec.title}</h2>

                <div className={styles.categoryLocationRow}>
                  <MapPin size={13} className={styles.categoryLocationIcon} />
                  <span>{sec.location}</span>
                </div>

                <p className={styles.categoryDescription}>{sec.description}</p>
              </div>

              {/* Key Stats Strip */}
              <div className={styles.categoryStatsRow}>
                <div className={styles.categoryStatCol}>
                  <span className={styles.categoryStatLabel}>{sec.stats.label1}</span>
                  <span className={styles.categoryStatValue}>{sec.stats.value1}</span>
                </div>
                <div className={styles.categoryStatCol}>
                  <span className={styles.categoryStatLabel}>{sec.stats.label2}</span>
                  <span className={styles.categoryStatValue}>{sec.stats.value2}</span>
                </div>
                <div className={styles.categoryStatCol}>
                  <span className={styles.categoryStatLabel}>{sec.stats.label3}</span>
                  <span className={styles.categoryStatValue}>{sec.stats.value3}</span>
                </div>
              </div>

              {/* View All Button */}
              <button
                type="button"
                className={styles.viewAllArchiveBtn}
                onClick={() => setActiveCategoryModal(sec.id)}
                aria-label={sec.ctaText}
              >
                <span>{sec.ctaText}</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Right Column: Interactive 4-5 Issues Showcase Rail */}
            <InteractiveCardsRail
              sec={sec}
              allMagazinesCount={allMagazines.length}
              newslettersCount={newsletters.length}
              articlesCount={articles.length}
              allCeosCount={allCeos.length}
              onOpenDoc={handleOpenDoc}
              onOpenCategoryModal={setActiveCategoryModal}
            />
          </div>
        ))}
      </div>

      {/* ====================================================================
          CATEGORY CATALOG MODAL: SHOWS LATEST FIRST, THEN SCROLL FOR ALL
          ==================================================================== */}
      {activeCategoryModal && isMounted && createPortal(
        <div
          ref={overlayRef}
          className={styles.catalogModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCategoryModal(null);
          }}
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label="Publications Archive Library"
        >
          <div className={styles.catalogModalContent}>
            {/* Modal Header */}
            <div className={styles.catalogModalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalEyebrow}>
                  <span className={styles.modalEyebrowRule} aria-hidden="true" />
                  <span>
                    {activeCategoryModal === "magazines"
                      ? "Monthly Magazine Catalog"
                      : activeCategoryModal === "newsletter"
                      ? "Weekly Newspaper Dispatches"
                      : activeCategoryModal === "articles"
                      ? "Technical Research Library"
                      : "Executive C-Suite Profiles"}
                  </span>
                </div>
                <h3 className={styles.modalTitle}>
                  {activeCategoryModal === "magazines"
                    ? "Published Monthly Magazines"
                    : activeCategoryModal === "newsletter"
                    ? "Weekly Newspaper Archive"
                    : activeCategoryModal === "articles"
                    ? "Published Research Reports"
                    : "Executive Leadership Interviews"}
                </h3>
              </div>

              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveCategoryModal(null)}
                aria-label="Close archive"
              >
                <X size={15} />
                <span>CLOSE</span>
              </button>
            </div>

            {/* PART 1: FEATURED LATEST ISSUE SPOTLIGHT */}
            {activeCategoryModal === "magazines" && latestMag && (
              <div className={styles.featuredLatestCard}>
                <div className={styles.featuredCoverBox}>
                  <img
                    src={latestMag.cover}
                    alt={latestMag.title}
                    className={styles.featuredCoverImg}
                  />
                  <span className={styles.featuredCoverBadge}>LATEST ISSUE</span>
                </div>
                <div className={styles.featuredDetails}>
                  <span className={styles.featuredSubKicker}>
                    {latestMag.month?.toUpperCase()} {latestMag.year || ""}
                  </span>
                  <h4 className={styles.featuredHeadline}>{latestMag.title}</h4>
                  <p className={styles.featuredText}>
                    {latestMag.description ||
                      "Read the newest complete edition featuring in-depth market forecasts, Tier-1 corporate development highlights, and detailed drill hole assay mappings."}
                  </p>
                  <button
                    type="button"
                    className={styles.featuredReadBtn}
                    onClick={() => {
                      handleOpenDoc({
                        title: "Monthly Magazine Edition",
                        subtitle: `${latestMag.month?.toUpperCase() || ""} ${latestMag.year || ""}`,
                        pdfUrl: getProxiedPdfUrl(latestMag.pdf),
                      });
                    }}
                  >
                    <BookOpen size={16} />
                    <span>READ LATEST FLIPBOOK ✦</span>
                  </button>
                </div>
              </div>
            )}

            {activeCategoryModal === "newsletter" && (
              <div className={styles.featuredLatestCard}>
                <div className={styles.featuredCoverBox}>
                  <img
                    src={
                      latestNewsletter.cover ||
                      "/cards/bg_card_1.webp"
                    }
                    alt={latestNewsletter.title}
                    className={styles.featuredCoverImg}
                  />
                  <span className={styles.featuredCoverBadge}>LATEST DISPATCH</span>
                </div>
                <div className={styles.featuredDetails}>
                  <span className={styles.featuredSubKicker}>WEEKLY TRADING DESK BRIEF</span>
                  <h4 className={styles.featuredHeadline}>{latestNewsletter.title}</h4>
                  <p className={styles.featuredText}>
                    Our most recent rapid-fire weekly dispatch highlighting active exploration milestones, drilling catalysts, and mining finance updates.
                  </p>
                  <button
                    type="button"
                    className={styles.featuredReadBtn}
                    onClick={() => {
                      handleOpenDoc({
                        title: "Weekly Newspaper Dispatch",
                        subtitle: latestNewsletter.title.toUpperCase(),
                        pdfUrl: getProxiedPdfUrl(latestNewsletter.pdf),
                      });
                    }}
                  >
                    <BookOpen size={16} />
                    <span>READ LATEST ISSUE ✦</span>
                  </button>
                </div>
              </div>
            )}

            {activeCategoryModal === "articles" && (
              <div className={styles.featuredLatestCard}>
                <div className={styles.featuredCoverBox}>
                  <img
                    src={latestArticle.cover}
                    alt={latestArticle.title}
                    className={styles.featuredCoverImg}
                  />
                  <span className={styles.featuredCoverBadge}>LATEST REPORT</span>
                </div>
                <div className={styles.featuredDetails}>
                  <span className={styles.featuredSubKicker}>QUALIFIED PERSON RESEARCH</span>
                  <h4 className={styles.featuredHeadline}>{latestArticle.title}</h4>
                  <p className={styles.featuredText}>
                    Technical assay teardown and geological continuity breakdown covering mineralized drill intercepts and resource expansion.
                  </p>
                  <button
                    type="button"
                    className={styles.featuredReadBtn}
                    onClick={() => {
                      handleOpenDoc({
                        title: "Technical Research Report",
                        subtitle: latestArticle.title.toUpperCase(),
                        pdfUrl: getProxiedPdfUrl(latestArticle.pdf),
                      });
                    }}
                  >
                    <BookOpen size={16} />
                    <span>READ LATEST REPORT ✦</span>
                  </button>
                </div>
              </div>
            )}

            {activeCategoryModal === "ceo-profile" && latestCeo && (
              <div className={styles.featuredLatestCard}>
                <div className={styles.featuredCoverBox}>
                  <img
                    src={latestCeo.cover}
                    alt={latestCeo.name}
                    className={styles.featuredCoverImg}
                  />
                  <span className={styles.featuredCoverBadge}>LATEST SPOTLIGHT</span>
                </div>
                <div className={styles.featuredDetails}>
                  <span className={styles.featuredSubKicker}>EXECUTIVE INTERVIEW</span>
                  <h4 className={styles.featuredHeadline}>{latestCeo.name}</h4>
                  <p
                    className={styles.featuredSubKicker}
                    style={{
                      color: "#D6A84F",
                      marginTop: "-0.25rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {latestCeo.designation}
                  </p>
                  <p className={styles.featuredText}>
                    {latestCeo.description ||
                      "Strategic leadership interview discussing jurisdictional advantages, corporate milestones, and upcoming drill catalyst programs."}
                  </p>
                  {latestCeo.pdf && (
                    <button
                      type="button"
                      className={styles.featuredReadBtn}
                      onClick={() => {
                        handleOpenDoc({
                          title: "CEO Executive Spotlight",
                          subtitle: `${latestCeo.name.toUpperCase()} • ${latestCeo.designation.toUpperCase()}`,
                          pdfUrl: getProxiedPdfUrl(latestCeo.pdf),
                        });
                      }}
                    >
                      <BookOpen size={16} />
                      <span>VIEW LATEST PROFILE ✦</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PART 2: SCROLLABLE ARCHIVE OF ALL EDITIONS */}
            <div className={styles.archiveSection}>
              <div className={styles.archiveHeaderRow}>
                <h4 className={styles.archiveSectionTitle}>
                  {activeCategoryModal === "magazines"
                    ? `ALL PUBLISHED EDITIONS (${allMagazines.length} ISSUES)`
                    : activeCategoryModal === "newsletter"
                    ? `ALL WEEKLY DISPATCHES (${newsletters.length} ISSUES)`
                    : activeCategoryModal === "articles"
                    ? `ALL RESEARCH ARTICLES (${articles.length} REPORTS)`
                    : `ALL CEO PROFILES (${allCeos.length} LEADERS)`}
                </h4>
                <span className={styles.archiveScrollHint}>
                  SCROLL DOWN TO EXPLORE ALL &darr;
                </span>
              </div>

              <div className={styles.archiveGrid}>
                {activeCategoryModal === "magazines" &&
                  allMagazines.map((mag) => (
                    <div
                      key={mag.id}
                      className={styles.archiveCard}
                      onClick={() => {
                        handleOpenDoc({
                          title: "Monthly Magazine Edition",
                          subtitle: `${mag.month?.toUpperCase() || ""} ${mag.year || ""}`,
                          pdfUrl: getProxiedPdfUrl(mag.pdf),
                        });
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.archiveCoverBox}>
                        <img
                          src={mag.cover}
                          alt={mag.title}
                          className={styles.archiveCoverImg}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.archiveMeta}>
                        <h5 className={styles.archiveItemTitle}>{mag.title}</h5>
                        <p className={styles.archiveItemSubtitle}>
                          {mag.month} {mag.year}
                        </p>
                        <span className={styles.archiveItemAction}>
                          <span>READ FLIPBOOK</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}

                {activeCategoryModal === "newsletter" &&
                  newsletters.map((item) => (
                    <div
                      key={item.id}
                      className={styles.archiveCard}
                      onClick={() => {
                        handleOpenDoc({
                          title: "Weekly Newspaper Dispatch",
                          subtitle: item.title.toUpperCase(),
                          pdfUrl: getProxiedPdfUrl(item.pdf),
                        });
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.archiveCoverBox}>
                        <img
                          src={
                            item.cover ||
                            "/cards/bg_card_1.webp"
                          }
                          alt={item.title}
                          className={styles.archiveCoverImg}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.archiveMeta}>
                        <h5 className={styles.archiveItemTitle}>{item.title}</h5>
                        <p className={styles.archiveItemSubtitle}>Weekly Dispatch</p>
                        <span className={styles.archiveItemAction}>
                          <span>READ ISSUE</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}

                {activeCategoryModal === "articles" &&
                  articles.map((item) => (
                    <div
                      key={item.id}
                      className={styles.archiveCard}
                      onClick={() => {
                        handleOpenDoc({
                          title: "Technical Research Report",
                          subtitle: item.title.toUpperCase(),
                          pdfUrl: getProxiedPdfUrl(item.pdf),
                        });
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.archiveCoverBox}>
                        <img
                          src={
                            item.cover ||
                            "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Pan_Global_Resources_Inc_1b6b03beef.png"
                          }
                          alt={item.title}
                          className={styles.archiveCoverImg}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.archiveMeta}>
                        <h5 className={styles.archiveItemTitle}>{item.title}</h5>
                        <p className={styles.archiveItemSubtitle}>Assay Breakdown</p>
                        <span className={styles.archiveItemAction}>
                          <span>READ REPORT</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}

                {activeCategoryModal === "ceo-profile" &&
                  allCeos.map((item) => (
                    <div
                      key={item.id}
                      className={styles.archiveCard}
                      onClick={() => {
                        if (item.pdf) {
                          handleOpenDoc({
                            title: "CEO Executive Spotlight",
                            subtitle: `${item.name.toUpperCase()} • ${item.designation.toUpperCase()}`,
                            pdfUrl: getProxiedPdfUrl(item.pdf),
                          });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.archiveCoverBox}>
                        <img
                          src={item.cover}
                          alt={item.name}
                          className={styles.archiveCoverImg}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.archiveMeta}>
                        <h5 className={styles.archiveItemTitle}>{item.name}</h5>
                        <p className={styles.archiveItemSubtitle}>{item.designation}</p>
                        <span className={styles.archiveItemAction}>
                          <span>VIEW PROFILE</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====================================================================
          TWO-PAGE INTERACTIVE FLIPBOOK READER MODAL
          ==================================================================== */}
      {readerState !== "closed" && isMounted && createPortal(
        <div
          className={`${magStyles.readerOverlay} ${
            readerState === "open"
              ? magStyles.readerOverlayOpen
              : readerState === "opening"
              ? magStyles.readerOverlayOpening
              : magStyles.readerOverlayClosing
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseReader();
            }
          }}
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label={`${activeReaderDoc?.title || "Publication"} Reader`}
        >
          <div className={magStyles.readerHeader}>
            <div className={magStyles.readerMetaLeft}>
              <span className={magStyles.readerBrand}>MINING DISCOVERY</span>
              <span className={magStyles.editionDot} aria-hidden="true" />
              <span className={magStyles.readerIssue}>
                {activeReaderDoc?.subtitle || "DIGITAL PUBLICATION"}
              </span>
            </div>
            <button
              type="button"
              className={magStyles.readerCloseBtn}
              onClick={handleCloseReader}
              aria-label="Close reader"
            >
              <X className={magStyles.readerCloseIcon} />
              <span>CLOSE</span>
            </button>
          </div>
          <div
            className={magStyles.readerStage}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseReader();
              }
            }}
          >
            {activeReaderDoc && (
              <MagazineSpread
                pdfUrl={activeReaderDoc.pdfUrl}
                title={activeReaderDoc.title}
                onSpreadChange={setSpreadLabel}
              />
            )}
          </div>
          <div className={magStyles.readerFooter}>
            <span>{spreadLabel}</span>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default PublicationsShowcase;
