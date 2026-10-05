"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import styles from "./OurServicesSection.module.css";
import {
  X,
  Newspaper,
  BookOpen,
  TrendingUp,
  Globe,
  Sparkles,
  ArrowRight,
  Maximize2,
  FileText,
  Calendar,
} from "lucide-react";
import {
  ShowcaseCardCover,
  EditionCoverCard,
} from "@/components/sections/MagazineShowcase/MagazineShowcase";
import { MagazineSpread } from "@/components/sections/MagazineShowcase/MagazineSpread";
import {
  getChronologicalMagazines,
  getLatestMagazine,
  type MagazineEdition,
} from "@/data/magazines";
import {
  INITIAL_NEWSLETTERS,
  INITIAL_ARTICLES,
  getProxiedPdfUrl,
  type PublicationItem,
} from "@/data/publications";

export interface DeliveredService {
  id: string;
  num: string;
  category: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText?: string;
  actionType?: "flipbook" | "newsletters" | "articles" | "link";
}

export const DELIVERED_SERVICES: DeliveredService[] = [
  {
    id: "investor-reach",
    num: "01",
    category: "INVESTOR REACH",
    title: "INVESTOR REACH",
    description:
      "Connect mining stories with the audiences that matter through focused investor campaigns and global industry outreach.",
    image: "/images/services/service_01_investor_light.webp",
    alt: "Investor reach boardroom executive presentation",
    ctaText: "Explore Outreach",
    ctaHref: "/contact",
    actionType: "link",
  },
  {
    id: "brand-digital",
    num: "02",
    category: "BRAND & DIGITAL",
    title: "BRAND & DIGITAL",
    description:
      "Build a stronger digital presence for mining companies with distinctive visual and technical assets.",
    image: "/images/services/service_03_brand_light.webp",
    alt: "Distinctive mining branding and digital visual assets",
    ctaText: "Explore Brand",
    ctaHref: "/contact",
    actionType: "link",
  },
  {
    id: "monthly-magazines",
    num: "03",
    category: "MONTHLY MAGAZINES",
    title: "MONTHLY MAGAZINES",
    description:
      "Our flagship monthly publication delivered worldwide to institutional resource funds, Tier-1 operators, and mining executives.",
    image: "/images/services/service_06_magazines_light.webp",
    alt: "Mining Discovery monthly magazine publication",
    ctaText: "Read Flipbook",
    ctaHref: "/magazines",
    secondaryCtaText: "All Editions",
    actionType: "flipbook",
  },
  {
    id: "weekly-newsletter",
    num: "04",
    category: "WEEKLY NEWSLETTER",
    title: "WEEKLY NEWSLETTER",
    description:
      "High-conviction weekly mineral discovery dispatches and capital digests sent directly to institutional resource investors.",
    image: "/images/services/service_07_newspaper_light.webp",
    alt: "Weekly market intelligence newspaper and executive briefings",
    ctaText: "Read Newsletter",
    ctaHref: "/magazines",
    secondaryCtaText: "All Dispatches",
    actionType: "newsletters",
  },
  {
    id: "technical-articles",
    num: "05",
    category: "TECHNICAL ARTICLES & RESEARCH",
    title: "TECHNICAL ARTICLES",
    description:
      "Authoritative technical teardowns, commodity deep-dives, and drill-result coverage published daily for mining executives.",
    image: "/images/services/service_08_articles_light.webp",
    alt: "Technical mining research, drill results and geology articles",
    ctaText: "View Articles",
    ctaHref: "/contact",
    secondaryCtaText: "Research Archive",
    actionType: "articles",
  },
  {
    id: "global-pr-media",
    num: "06",
    category: "GLOBAL PR & MEDIA SYNDICATION",
    title: "GLOBAL PR & MEDIA",
    description:
      "Turn company developments into compelling industry stories through Tier-1 press syndication, executive interviews, and media visibility.",
    image: "/images/services/service_02_media_light.webp",
    alt: "Authoritative mining media coverage and Tier-1 press syndication",
    ctaText: "Elevate Media",
    ctaHref: "/contact",
    actionType: "link",
  },
  {
    id: "mining-intelligence",
    num: "07",
    category: "MINING INTELLIGENCE",
    title: "MINING INTELLIGENCE",
    description:
      "Surface the information investors and industry professionals care about with proprietary commodity market analytics and peer benchmarking.",
    image: "/images/services/service_05_intelligence_light.webp",
    alt: "Proprietary market intelligence and commodity analytics",
    ctaText: "Access Intelligence",
    ctaHref: "/contact",
    actionType: "link",
  },
  {
    id: "conferences-summits",
    num: "08",
    category: "CONFERENCES & SUMMITS",
    title: "CONFERENCES & SUMMITS",
    description:
      "Put important mining developments directly in front of resource funds, institutional deal-makers, and family offices at premier summits.",
    image: "/images/services/service_04_reach_light.webp",
    alt: "Global mining conferences, keynote stages and summits",
    ctaText: "Scale Reach",
    ctaHref: "/contact",
    actionType: "link",
  },
];

export interface OurServicesSectionProps {
  isEmbedded?: boolean;
  trackRef?: React.RefObject<HTMLDivElement | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const OurServicesSection: React.FC<OurServicesSectionProps> = ({
  isEmbedded = false,
  trackRef,
  containerRef,
}) => {
  const allMagazines = useMemo(() => getChronologicalMagazines(false), []);
  const [selectedMagazine, setSelectedMagazine] = useState<MagazineEdition | null>(null);
  const [readerState, setReaderState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [spreadLabel, setSpreadLabel] = useState("INSIDE OPENING SPREAD • PAGES 2–3");
  const [activeCatalogModal, setActiveCatalogModal] = useState<"magazines" | "newsletters" | "articles" | null>(null);
  const [newsletters] = useState<PublicationItem[]>(INITIAL_NEWSLETTERS);
  const [articles] = useState<PublicationItem[]>(INITIAL_ARTICLES);
  const [activeReaderDoc, setActiveReaderDoc] = useState<{
    title: string;
    subtitle: string;
    pdfUrl: string;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setIsMounted(true);

    let animId: number;
    const checkVisibility = () => {
      const windowH = window.innerHeight || 800;
      // Trigger threshold: card top reaches 94% of viewport height
      const threshold = windowH * 0.94;

      cardsRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold && rect.bottom >= -150) {
          el.classList.add(styles.serviceCardVisible);
        } else if (rect.top > windowH + 150) {
          el.classList.remove(styles.serviceCardVisible);
        }
      });
      animId = requestAnimationFrame(checkVisibility);
    };

    animId = requestAnimationFrame(checkVisibility);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleOpenReader = useCallback((mag: MagazineEdition) => {
    setSelectedMagazine(mag);
    setActiveReaderDoc({
      title: mag.title,
      subtitle: `${mag.month?.toUpperCase()} ${mag.year} • ISSUE ${mag.issueNumber ?? "13"}`,
      pdfUrl: mag.pdf,
    });
    setReaderState("opening");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReaderState("open");
      });
    });
  }, []);

  const handleOpenDocReader = useCallback((doc: { title: string; subtitle: string; pdfUrl: string }) => {
    setSelectedMagazine(null);
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
        setSelectedMagazine(null);
        setActiveReaderDoc(null);
      }, 350);
    }
  }, [readerState]);

  const contentJsx = (
    <>
      {/* Dynamic Curved Horizon Crest Transition at Top of Services */}
      <div
        className="relative w-full h-[65px] sm:h-[110px] overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
          className="w-full h-full block"
        >
          <defs>
            <linearGradient id="crestStrokeTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#C5A059" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path
            d="M 0 0 C 420 160, 1020 160, 1440 0"
            fill="none"
            stroke="url(#crestStrokeTop)"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* Subtle Architectural Grid Lines Overlay (White Desert Light Theme) */}
      <div
        className="pointer-events-none absolute inset-0 flex justify-between px-4 sm:px-12 md:px-24"
        aria-hidden="true"
      >
        <div className="w-[1px] h-full bg-black/[0.04]" />
        <div className="w-[1px] h-full bg-black/[0.04]" />
        <div className="w-[1px] h-full bg-black/[0.04]" />
        <div className="w-[1px] h-full bg-black/[0.04]" />
        <div className="w-[1px] h-full bg-black/[0.04]" />
        <div className="w-[1px] h-full bg-black/[0.04]" />
      </div>

      {/* Section Content Wrapper */}
      <div
        ref={trackRef}
        className="relative z-10 mx-auto w-full max-w-[1360px] px-4 sm:px-8 md:px-12 pt-4 pb-24 sm:pb-32"
        style={{ willChange: "transform" }}
      >
        {/* Prominent Editorial Header matching Image 1 */}
        <div className="flex flex-col items-center justify-center text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-4 sm:gap-6 w-full max-w-xl mb-2">
            <span
              className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent to-[#C5A059]/70"
              aria-hidden="true"
            />
            <h2
              className="font-space-grotesk text-[2.2rem] sm:text-[3.2rem] md:text-[3.8rem] font-bold tracking-tight text-[#0c2038] uppercase"
              style={{
                fontFamily:
                  'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                letterSpacing: "-0.015em",
                lineHeight: 1.05,
              }}
            >
              OUR SERVICES
            </h2>
            <span
              className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent to-[#C5A059]/70"
              aria-hidden="true"
            />
          </div>
          <p className="font-mono text-xs sm:text-sm tracking-[0.22em] text-[#7A5E22] uppercase font-bold">
            Institutional Mineral Marketing &amp; Global Capital Dispatches
          </p>
        </div>

        {/* 2-Column Editorial Grid (All 8 Cards in 4 Rows) */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-x-10 lg:gap-x-14 gap-y-14 sm:gap-y-20"
          role="region"
          aria-label="Delivered Mining Services"
        >
          {DELIVERED_SERVICES.map((item, idx) => (
            <article
              key={item.id}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              className={styles.serviceCard}
            >
              {/* Card Upper Section: Metadata Eyebrow + Bold Title Above Image (Matching Image 1) */}
              <div className="mb-3">
                <div className={styles.cardMeta}>
                  <span className="font-mono text-xs sm:text-[0.8rem] font-bold text-[#997A3D] tracking-[0.2em]">
                    {item.num}
                  </span>
                  <span className="text-black/30 font-light text-xs">/</span>
                  <span className="font-mono text-[0.72rem] sm:text-[0.78rem] font-bold text-[#475569] tracking-[0.18em] uppercase">
                    {item.category}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>
                  {item.title}
                </h3>
              </div>

              {/* Card Image Block: Rounded Corners + Luxury Shadow + Hover Zoom (Matching Image 1) */}
              <div className={styles.cardImageWrap}>
                <img
                  src={item.image}
                  alt={item.alt}
                  className={styles.cardImg}
                  loading="lazy"
                />
                <div className={styles.cardOverlay} />
              </div>

              {/* Card Lower Section: Description Text below image */}
              <p className={styles.cardDesc}>
                {item.description}
              </p>

              {/* Interactive CTA Buttons Row */}
              <div className={styles.cardActions}>
                {item.actionType === "flipbook" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenReader(getLatestMagazine())}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c2038] text-white hover:bg-[#1A365D] font-sans text-xs sm:text-[0.82rem] font-semibold tracking-[0.14em] uppercase transition-all duration-200 shadow-sm hover:shadow"
                      aria-label="Open latest monthly magazine flipbook reader"
                    >
                      <BookOpen size={14} className="text-[#C5A059]" />
                      <span>{item.ctaText}</span>
                      <span className="text-[#C5A059]">✦</span>
                    </button>
                    {item.secondaryCtaText && (
                      <button
                        type="button"
                        onClick={() => setActiveCatalogModal("magazines")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/15 bg-white/60 hover:bg-white text-[#0c2038] font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200"
                        aria-label="View all monthly magazine editions"
                      >
                        <span>{item.secondaryCtaText}</span>
                      </button>
                    )}
                  </>
                ) : item.actionType === "newsletters" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const latest = newsletters[0];
                        if (latest) {
                          handleOpenDocReader({
                            title: "Weekly Newspaper Dispatch",
                            subtitle: latest.title.toUpperCase(),
                            pdfUrl: getProxiedPdfUrl(latest.pdf),
                          });
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c2038] text-white hover:bg-[#1A365D] font-sans text-xs sm:text-[0.82rem] font-semibold tracking-[0.14em] uppercase transition-all duration-200 shadow-sm hover:shadow"
                      aria-label="Read latest weekly newsletter dispatch"
                    >
                      <Newspaper size={14} className="text-[#C5A059]" />
                      <span>{item.ctaText}</span>
                      <span className="text-[#C5A059]">✦</span>
                    </button>
                    {item.secondaryCtaText && (
                      <button
                        type="button"
                        onClick={() => setActiveCatalogModal("newsletters")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/15 bg-white/60 hover:bg-white text-[#0c2038] font-sans text-xs font-semibold tracking-[0.1em] uppercase transition-all duration-200"
                        aria-label="View weekly newsletter archive"
                      >
                        <span>{item.secondaryCtaText}</span>
                      </button>
                    )}
                  </>
                ) : item.actionType === "articles" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveCatalogModal("articles")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0c2038] text-white hover:bg-[#1A365D] font-sans text-xs sm:text-[0.82rem] font-semibold tracking-[0.14em] uppercase transition-all duration-200 shadow-sm hover:shadow"
                      aria-label="Open technical research articles catalog"
                    >
                      <FileText size={14} className="text-[#C5A059]" />
                      <span>{item.ctaText}</span>
                      <span className="text-[#C5A059]">✦</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href={item.ctaHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0c2038]/20 bg-white/70 hover:bg-[#0c2038] hover:text-white text-[#0c2038] font-sans text-xs sm:text-[0.82rem] font-semibold tracking-[0.14em] uppercase transition-all duration-200 group/btn"
                  >
                    <span>{item.ctaText}</span>
                    <span className="text-[#997A3D] group-hover/btn:text-[#C5A059] transition-colors">
                      ✦
                    </span>
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* MODAL 1: Complete Magazine Archive Catalog */}
      {activeCatalogModal === "magazines" && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCatalogModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Monthly Magazines Archive"
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-6 border-b border-black/10 mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#997A3D] font-bold">
                  MONTHLY MAGAZINE LIBRARY
                </span>
                <h3 className="font-space-grotesk text-2xl sm:text-3xl font-bold uppercase text-[#0c2038] mt-1">
                  All Published Editions ({allMagazines.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCatalogModal(null)}
                className="p-2 rounded-full hover:bg-black/5 text-[#0c2038] transition-colors"
                aria-label="Close archive"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {allMagazines.map((edition) => (
                <div
                  key={edition.id}
                  onClick={() => {
                    setActiveCatalogModal(null);
                    handleOpenReader(edition);
                  }}
                  className="cursor-pointer group flex flex-col items-center text-center"
                >
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-[#E8E2D8]">
                    <img
                      src={edition.cover}
                      alt={edition.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="mt-3 font-space-grotesk font-bold text-sm sm:text-base text-[#0c2038] group-hover:text-[#997A3D] transition-colors line-clamp-1">
                    {edition.title}
                  </h4>
                  <span className="font-mono text-[0.7rem] text-[#64748B] uppercase">
                    {edition.month} {edition.year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: Complete Weekly Newsletters Catalog */}
      {activeCatalogModal === "newsletters" && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCatalogModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Weekly Newsletters Archive"
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-6 border-b border-black/10 mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#997A3D] font-bold">
                  WEEKLY DISPATCH ARCHIVE
                </span>
                <h3 className="font-space-grotesk text-2xl sm:text-3xl font-bold uppercase text-[#0c2038] mt-1">
                  Weekly Newspaper Editions ({newsletters.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCatalogModal(null)}
                className="p-2 rounded-full hover:bg-black/5 text-[#0c2038] transition-colors"
                aria-label="Close archive"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {newsletters.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveCatalogModal(null);
                    handleOpenDocReader({
                      title: "Weekly Newspaper Dispatch",
                      subtitle: item.title.toUpperCase(),
                      pdfUrl: getProxiedPdfUrl(item.pdf),
                    });
                  }}
                  className="cursor-pointer group flex flex-col items-center text-center"
                >
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-[#E8E2D8]">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="mt-3 font-space-grotesk font-bold text-sm sm:text-base text-[#0c2038] group-hover:text-[#997A3D] transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <span className="font-sans text-[0.72rem] text-[#64748B] flex items-center gap-1 mt-0.5">
                    <span>Read Issue</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: Published Technical Articles Catalog */}
      {activeCatalogModal === "articles" && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCatalogModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Technical Articles Archive"
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FAF7F2] rounded-3xl p-6 sm:p-10 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-6 border-b border-black/10 mb-8">
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#997A3D] font-bold">
                  TECHNICAL RESEARCH &amp; EDITORIAL
                </span>
                <h3 className="font-space-grotesk text-2xl sm:text-3xl font-bold uppercase text-[#0c2038] mt-1">
                  Published Technical Articles ({articles.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCatalogModal(null)}
                className="p-2 rounded-full hover:bg-black/5 text-[#0c2038] transition-colors"
                aria-label="Close archive"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {articles.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveCatalogModal(null);
                    handleOpenDocReader({
                      title: "Technical Research Article",
                      subtitle: item.title.toUpperCase(),
                      pdfUrl: getProxiedPdfUrl(item.pdf),
                    });
                  }}
                  className="cursor-pointer group flex flex-col items-center text-center"
                >
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-[#E8E2D8]">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="mt-3 font-space-grotesk font-bold text-sm sm:text-base text-[#0c2038] group-hover:text-[#997A3D] transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <span className="font-sans text-[0.72rem] text-[#64748B] flex items-center gap-1 mt-0.5">
                    <span>Read Article</span>
                    <ArrowRight size={10} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: Interactive Two-Page Flipbook Reader */}
      {readerState !== "closed" && isMounted && createPortal(
        <div
          className={`fixed inset-0 z-[220] flex flex-col bg-[#070b12]/95 backdrop-blur-xl transition-opacity duration-300 ${
            readerState === "open"
              ? "opacity-100 pointer-events-auto"
              : readerState === "opening"
              ? "opacity-0 pointer-events-none"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseReader();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeReaderDoc?.title || "Publication"} Flipbook Reader`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/10 text-white">
            <div className="flex items-center gap-3">
              <span className="font-editorial-serif font-bold tracking-wider text-base sm:text-lg text-[#C5A059]">
                MINING DISCOVERY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="font-mono text-xs tracking-widest text-white/70 uppercase">
                {activeReaderDoc?.subtitle || "DIGITAL PUBLICATION"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseReader}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-wider transition-colors"
              aria-label="Close reader"
            >
              <X size={16} />
              <span>CLOSE</span>
            </button>
          </div>

          {/* Reader Body */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseReader();
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

          {/* Footer */}
          <div className="py-3 px-6 text-center border-t border-white/10 font-mono text-xs tracking-wider text-white/60">
            <span>{spreadLabel}</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-[#FAF7F2] text-[#0c2038] overflow-hidden"
        aria-label="Our Delivered Services"
      >
        {contentJsx}
      </div>
    );
  }

  return (
    <section
      id="our-services"
      className="relative w-full bg-[#FAF7F2] text-[#0c2038] overflow-hidden"
      aria-label="Our Delivered Services"
      style={{ zIndex: 15 }}
    >
      {contentJsx}
    </section>
  );
};

export default OurServicesSection;
