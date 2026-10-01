"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ArrowRight, X, BookOpen } from "lucide-react";
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

interface PublicationCardConfig {
  id: "magazines" | "newsletter" | "articles" | "ceo-profile";
  category: string;
  title: string;
  description: string;
  image: string;
  badge: string;
  ctaText: string;
}

const PUBLICATIONS_SUBTITLE_WORDS = [
  "We",
  "deliver",
  "continuous",
  "market",
  "visibility",
  "for",
  "natural",
  "resource",
  "companies",
  "through",
  "monthly",
  "magazines,",
  "weekly",
  "newspaper",
  "dispatches,",
  "technical",
  "research",
  "articles,",
  "and",
  "executive",
  "CEO",
  "profiles.",
];

export const PublicationsShowcase: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const headingWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const subheadingWordRefs = useRef<(HTMLSpanElement | null)[]>([]);

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
    const y = window.scrollY;

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
      window.scrollTo(0, y);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeCategoryModal, readerState, handleCloseReader]);

  // Scroll-tied word-by-word reveal for Publications Heading & Subheading
  useEffect(() => {
    let rafId: number | null = null;
    let isTicking = false;

    const updateWords = () => {
      if (!headerRef.current) return;
      const clientH = window.innerHeight || 800;
      const hRect = headerRef.current.getBoundingClientRect();
      const revealProgress = Math.max(0, Math.min(1, (clientH * 0.88 - hRect.top) / (clientH * 0.88 - clientH * 0.38)));

      // Heading words: reveal from 0.00 to 0.45
      const hProg = Math.max(0, Math.min(1, revealProgress / 0.45));
      headingWordRefs.current.forEach((el, idx) => {
        if (!el) return;
        const start = (idx / 3) * 0.65;
        const end = start + 0.35;
        const wProg = Math.max(0, Math.min(1, (hProg - start) / (end - start)));
        el.style.opacity = (0.20 + 0.80 * wProg).toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - wProg) * 5).toFixed(1)}px, 0)`;
        el.style.filter = wProg >= 0.99 ? "none" : `blur(${((1 - wProg) * 1.2).toFixed(1)}px)`;
      });

      // Subheading words: reveal from 0.28 to 1.00
      const subProg = Math.max(0, Math.min(1, (revealProgress - 0.28) / 0.72));
      const subCount = PUBLICATIONS_SUBTITLE_WORDS.length;
      subheadingWordRefs.current.forEach((el, idx) => {
        if (!el) return;
        const start = (idx / subCount) * 0.75;
        const end = start + 0.25;
        const wProg = Math.max(0, Math.min(1, (subProg - start) / (end - start)));
        el.style.opacity = (0.20 + 0.80 * wProg).toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - wProg) * 4).toFixed(1)}px, 0)`;
        el.style.filter = wProg >= 0.99 ? "none" : `blur(${((1 - wProg) * 1.0).toFixed(1)}px)`;
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

    requestTick();

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    window.addEventListener("wheel", requestTick, { passive: true });
    window.addEventListener("touchmove", requestTick, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      window.removeEventListener("wheel", requestTick);
      window.removeEventListener("touchmove", requestTick);
    };
  }, []);

  const allMagazines: MagazineApiItem[] = magazines;
  const latestMag = allMagazines[0];
  const allCeos = ceoProfiles;
  const latestCeo = allCeos[0];
  const latestNewsletter = newsletters[0] || INITIAL_NEWSLETTERS[0];
  const latestArticle = articles[0] || INITIAL_ARTICLES[0];

  const publicationCards: PublicationCardConfig[] = [
    {
      id: "magazines",
      category: "MONTHLY PRINT & DIGITAL",
      title: "MAGAZINE",
      description:
        "Official published editions featuring in-depth mineral asset teardowns, full-color drill layouts, and c-suite market interviews.",
      image: latestMag?.cover || INITIAL_MAGAZINES[0].cover,
      badge: `${allMagazines.length} EDITIONS`,
      ctaText: `BROWSE ALL ${allMagazines.length} EDITIONS`,
    },
    {
      id: "newsletter",
      category: "WEEKLY NEWSPAPER DISPATCH",
      title: "NEWSLETTER",
      description:
        "High-frequency weekly discovery dispatches distributed directly to institutional desks, commodity desks, and family offices.",
      image:
        latestNewsletter?.cover ||
        "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_17_NOV_converted_25e305b198.webp",
      badge: `${newsletters.length} ISSUES`,
      ctaText: `BROWSE ALL ${newsletters.length} ISSUES`,
    },
    {
      id: "articles",
      category: "TECHNICAL RESEARCH",
      title: "ARTICLES",
      description:
        "Geological assay breakdowns, maiden mineral resource evaluations, and verified QP project discovery reports.",
      image:
        articles[2]?.cover ||
        "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Pan_Global_Resources_Inc_1b6b03beef.png",
      badge: `${articles.length} REPORTS`,
      ctaText: `BROWSE ALL ${articles.length} REPORTS`,
    },
    {
      id: "ceo-profile",
      category: "EXECUTIVE INTERVIEWS",
      title: "CEO PROFILE",
      description:
        "One-on-one leadership interviews, project vision features, and strategic broadcasts with mining executives across the globe.",
      image: latestCeo?.cover || latestCeo?.ceoImage || "/cards/bg_card_2.webp",
      badge: `${allCeos.length} PROFILES`,
      ctaText: `BROWSE ALL ${allCeos.length} PROFILES`,
    },
  ];

  return (
    <section className={styles.publicationsSection} aria-label="Explore Our Publications">
      {/* Editorial Header */}
      <header ref={headerRef} className={styles.header}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          <span className={styles.eyebrowText}>
            <span className={styles.eyebrowPip}>✦</span> GLOBAL MEDIA DISTRIBUTION // MULTI-PLATFORM REACH <span className={styles.eyebrowPip}>✦</span>
          </span>
          <span className={styles.eyebrowRule} aria-hidden="true" />
        </div>

        <h2 className={styles.mainTitle}>
          <span
            ref={(el) => {
              headingWordRefs.current[0] = el;
            }}
            className={styles.wordSpan}
          >
            EXPLORE
          </span>{" "}
          <span
            ref={(el) => {
              headingWordRefs.current[1] = el;
            }}
            className={styles.wordSpan}
          >
            OUR
          </span>{" "}
          <span
            ref={(el) => {
              headingWordRefs.current[2] = el;
            }}
            className={styles.goldWordSpan}
          >
            PUBLICATIONS
          </span>
        </h2>

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

      {/* 4 Publications Cards */}
      <div className={styles.publicationsGrid}>
        {publicationCards.map((card) => (
          <article
            key={card.id}
            className={styles.pubCard}
            onClick={() => setActiveCategoryModal(card.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveCategoryModal(card.id);
              }
            }}
          >
            {/* Visual Cover Header */}
            <div className={styles.pubCoverWrap}>
              <img
                src={card.image}
                alt={card.title}
                className={styles.pubCoverImg}
                loading="lazy"
              />
              <div className={styles.pubCoverOverlay} aria-hidden="true" />
              <span className={styles.pubBadge}>{card.badge}</span>
            </div>

            {/* Card Content Body */}
            <div className={styles.pubBody}>
              <div className={styles.pubTopMeta}>
                <span className={styles.pubCategory}>{card.category}</span>
                <div className={styles.pubTitleRow}>
                  <h3 className={styles.pubTitle}>{card.title}</h3>
                  <div className={styles.pubArrowPill} aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
                <p className={styles.pubDescription}>{card.description}</p>
              </div>

              <div className={styles.pubFooter}>
                <span className={styles.pubActionTag}>
                  <span>{card.ctaText}</span>
                  <span>↗</span>
                </span>
              </div>
            </div>
          </article>
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
