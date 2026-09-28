"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { X, Newspaper, BookOpen, TrendingUp, Globe, Sparkles, ChevronLeft, ChevronRight, ArrowRight, Maximize2 } from "lucide-react";
import styles from "./Journey2D.module.css";
import magStyles from "@/components/sections/MagazineShowcase/MagazineShowcase.module.css";
import { smoothstep } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";
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

const MILESTONE_ICONS = [TrendingUp, Newspaper, BookOpen, Globe, Sparkles, Sparkles];

export interface EditorialServiceItem {
  id: string;
  num: string;
  category: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  ctaText?: string;
  ctaHref?: string;
}

export const EDITORIAL_SERVICES: EditorialServiceItem[] = [
  {
    id: "investor-reach",
    num: "01",
    category: "INVESTOR REACH",
    title: "Investor Reach",
    description: "Connect mining stories with the audiences that matter through focused investor campaigns and global industry outreach.",
    image: "/images/services/service_01_investor_light.webp",
    alt: "Investor outreach boardroom and strategic capital meetings",
    ctaText: "Explore Outreach",
    ctaHref: "/contact",
  },
  {
    id: "brand-digital",
    num: "02",
    category: "BRAND & DIGITAL",
    title: "Brand & Digital",
    description: "Build a stronger digital presence for mining companies with distinctive visual and technical assets.",
    image: "/images/services/service_03_brand_light.webp",
    alt: "Distinctive mining branding and digital visual assets",
    ctaText: "Explore Brand",
    ctaHref: "/contact",
  },
  {
    id: "audience-reach",
    num: "03",
    category: "AUDIENCE REACH",
    title: "Audience Reach",
    description: "Put important mining developments in front of relevant audiences and family offices worldwide.",
    image: "/images/services/service_04_reach_light.webp",
    alt: "Audience network and global distribution campaigns",
    ctaText: "Scale Reach",
    ctaHref: "/contact",
  },
  {
    id: "media-editorial",
    num: "04",
    category: "MEDIA & EDITORIAL",
    title: "Media & Editorial",
    description: "Turn company developments into compelling industry stories through Tier-1 syndication and conference visibility.",
    image: "/images/services/service_02_media_light.webp",
    alt: "Authoritative mining media coverage and Tier-1 press office",
    ctaText: "Elevate Media",
    ctaHref: "/contact",
  },
  {
    id: "mining-intelligence",
    num: "05",
    category: "MINING INTELLIGENCE",
    title: "Mining Intelligence",
    description: "Surface the information investors and industry professionals care about with proprietary market analytics.",
    image: "/images/services/service_05_intelligence_light.webp",
    alt: "Proprietary market intelligence and commodity analytics",
    ctaText: "Access Intelligence",
    ctaHref: "/contact",
  },
  {
    id: "news-publications",
    num: "06",
    category: "NEWS & PUBLICATIONS",
    title: "News & Publications",
    description: "Extend company visibility through relevant mining media, monthly magazines, and weekly market dispatches.",
    image: "/images/services/service_06_magazines_light.webp",
    alt: "Mining Discovery monthly magazines and weekly newspapers",
    ctaText: "Read Flipbook",
    ctaHref: "/magazines",
  },
];


export interface TopDownFeature {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
  title: string;
  description: string;
}

export const TOP_DOWN_FEATURES: TopDownFeature[] = [
  {
    id: "intelligence",
    icon: Sparkles,
    title: "REAL-TIME MINING INTELLIGENCE",
    description: "Know exactly where investor and market attention sits at every stage. Live intelligence means faster capital decisions and zero guesswork.",
  },
  {
    id: "network",
    icon: Globe,
    title: "GLOBAL INVESTOR NETWORK",
    description: "From APAC resource funds to international financial corridors, our partner network spans every major mining trade route your business relies on.",
  },
  {
    id: "support",
    icon: Newspaper,
    title: "24/7 STRATEGIC MEDIA DESK",
    description: "Dedicated editorial team, always available. From drill-hole releases to Tier-1 publications, we manage every story from origin to delivery.",
  },
  {
    id: "authority",
    icon: TrendingUp,
    title: "8+ YEARS INDUSTRY AUTHORITY",
    description: "From early-stage exploration to Tier-1 global producers, delivering sustained market conviction and verifiable liquidity across critical mineral supply chains.",
  },
];

const EditorialGridCard: React.FC<{
  item: EditorialServiceItem;
  idx: number;
  onOpenFlipbook?: () => void;
  onOpenArchive?: () => void;
}> = ({ item, idx, onOpenFlipbook, onOpenArchive }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`${styles.editorialGridItem} ${isVisible ? styles.editorialGridItemVisible : ""}`}
      style={{
        transitionDelay: `${(idx % 2) * 120}ms`,
      }}
    >
      <div className={styles.editorialItemMeta}>
        <span className={styles.editorialItemNum}>{item.num}</span>
        <span className={styles.editorialItemDivider} aria-hidden="true">/</span>
        <span className={styles.editorialItemCategory}>{item.category}</span>
      </div>

      <h3 className={styles.editorialItemTitle}>
        {item.title}
      </h3>

      <div className={styles.editorialImageBlock}>
        <img
          src={item.image}
          alt={item.alt}
          className={styles.editorialImage}
          loading="lazy"
        />
        <div className={styles.editorialImageOverlay} />
      </div>

      <div className={styles.editorialItemFooter}>
        <p className={styles.editorialItemDesc}>{item.description}</p>
        {item.id === "news-publications" ? (
          <div className={styles.editorialActionRow}>
            <button
              type="button"
              className={styles.editorialActionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFlipbook?.();
              }}
              aria-label="Open latest monthly magazine in interactive flipbook"
            >
              <span>READ FLIPBOOK</span>
              <span className={styles.editorialActionStar}>✦</span>
            </button>
            <button
              type="button"
              className={styles.editorialSecondaryBtn}
              onClick={(e) => {
                e.stopPropagation();
                onOpenArchive?.();
              }}
              aria-label="Explore all magazine editions"
            >
              <span>ALL EDITIONS</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <Link
            href={item.ctaHref || "/contact"}
            className={styles.editorialActionLink}
          >
            <span>{item.ctaText || "Explore"}</span>
            <span className={styles.editorialActionArrow} aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>
    </article>
  );
};




export interface StoryPoint {
  id: string;
  index: number;
  year: string;
  tag: string;
  shortTitle: string;
  eyebrow: string;
  headline: string;
  emphasis: string;
  description: string;
  meta: string;
  image: string;
  badge: string;
  from: number;
  to: number;
}

export const STORY_POINTS: StoryPoint[] = [
  {
    id: "evolution",
    index: 0,
    year: "OUR EVOLUTION",
    tag: "OUR EVOLUTION",
    shortTitle: "From Mining News to Global Influence",
    eyebrow: "OUR EVOLUTION",
    headline: "FROM MINING NEWS TO GLOBAL INFLUENCE",
    emphasis: "EVOLUTION",
    description: "The strategic journey of Mining Discovery from a dedicated digital news outlet into an international full-service media authority.",
    meta: "GLOBAL MEDIA · STRATEGIC REACH · INDUSTRY AUTHORITY",
    image: "/cards/bg_card_1.webp",
    badge: "ORIGIN",
    from: 0.0,
    to: 0.14,
  },
  {
    id: "2022",
    index: 1,
    year: "2022",
    tag: "2022 · FOUNDATION",
    shortTitle: "Foundation of Mining Media",
    eyebrow: "01 — FOUNDATION · 2022",
    headline: "FOUNDATION OF MINING MEDIA",
    emphasis: "FOUNDATION",
    description: "Mining Discovery launched as a digital mining news platform in Chandigarh, establishing our foothold in trusted resource reporting.",
    meta: "DIGITAL NEWS · INDUSTRY INSIGHTS · CHANDIGARH",
    image: "/cards/bg_card_1.webp",
    badge: "2022",
    from: 0.14,
    to: 0.28,
  },
  {
    id: "2023",
    index: 2,
    year: "2023",
    tag: "2023 · EXPANSION",
    shortTitle: "Multi-Channel Media Platform",
    eyebrow: "02 — MEDIA EXPANSION · 2023",
    headline: "MULTI-CHANNEL MEDIA PLATFORM",
    emphasis: "PLATFORM",
    description: "Expanded into newsletters, monthly magazines, and an interactive digital platform for global mining stakeholders.",
    meta: "MONTHLY MAGAZINES · NEWSLETTERS · DIGITAL SUITE",
    image: "/cards/bg_card_2.webp",
    badge: "2023",
    from: 0.28,
    to: 0.44,
  },
  {
    id: "2024",
    index: 3,
    year: "2024",
    tag: "2024 · ENGAGEMENT",
    shortTitle: "Branding & Investor Engagement",
    eyebrow: "03 — INDUSTRY ENGAGEMENT · 2024",
    headline: "BRANDING & INVESTOR ENGAGEMENT",
    emphasis: "ENGAGEMENT",
    description: "Began offering targeted investor campaigns, digital branding, and international conference media coverage.",
    meta: "INVESTOR CAMPAIGNS · CONFERENCES · BRAND STRATEGY",
    image: "/cards/bg_card_3.webp",
    badge: "2024",
    from: 0.44,
    to: 0.60,
  },
  {
    id: "2025",
    index: 4,
    year: "2025",
    tag: "2025 · FULL-SERVICE",
    shortTitle: "Full-Service Digital Media Agency",
    eyebrow: "04 — FULL-SERVICE EVOLUTION · 2025",
    headline: "FULL-SERVICE DIGITAL AGENCY",
    emphasis: "FULL-SERVICE",
    description: "Operating as a full-service digital media, global syndication, and investor-engagement agency.",
    meta: "FULL-SERVICE AGENCY · GLOBAL REACH · 360° DIGITAL",
    image: "/cards/bg_card_4.webp",
    badge: "2025",
    from: 0.60,
    to: 0.74,
  },
  {
    id: "future",
    index: 5,
    year: "FUTURE",
    tag: "FUTURE · HORIZON",
    shortTitle: "The Journey Continues",
    eyebrow: "05 — WHAT COMES NEXT · FUTURE",
    headline: "THE JOURNEY CONTINUES",
    emphasis: "JOURNEY",
    description: "Expanding global investor networks, AI-driven mining intelligence, and strategic media operations worldwide.",
    meta: "GLOBAL INVESTOR NETWORKS · AI INTELLIGENCE · STRATEGIC MEDIA",
    image: "/about/open-pit-golden-hour.webp",
    badge: "FUTURE",
    from: 0.74,
    to: 0.88,
  },
];

/** Splits a line so one word can carry the accent style. */
function renderLine(line: string, emphasis: string | null): React.ReactNode {
  if (!emphasis || !line.includes(emphasis)) return line;
  const at = line.indexOf(emphasis);
  return (
    <>
      {line.slice(0, at)}
      <em>{emphasis}</em>
      {line.slice(at + emphasis.length)}
    </>
  );
}

/**
 * Renders text broken into individual scrub words with data attributes
 * for 60-120fps direct DOM text illumination in lockstep with the truck (Reference Recording).
 */
function renderScrubText(
  text: string,
  keyPrefix: string,
  emphasisWord?: string | null
): React.ReactNode {
  const words = text.split(" ");
  return words.map((word, i) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isEmphasis =
      emphasisWord &&
      cleanWord === emphasisWord.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      <span
        key={`${keyPrefix}-${i}`}
        className={styles.scrubWord}
        data-scrub-word
        data-emphasis={isEmphasis ? "true" : undefined}
      >
        {word}
        {i < words.length - 1 ? " " : ""}
      </span>
    );
  });
}

/**
 * Updates individual word illumination from muted to active theme colors
 * based on the truck's exact scroll position.
 */
function updateWordScrub(
  container: HTMLElement | null,
  progress: number,
  baseColor: string,
  activeColor: string,
  emphasisColor?: string,
  baseOpacity: number = 0.22
) {
  if (!container) return;
  const words = container.querySelectorAll<HTMLElement>("[data-scrub-word]");
  const total = words.length;
  if (total === 0) return;

  const currentIdx = progress * total;

  for (let i = 0; i < total; i++) {
    const el = words[i];
    const isEmphasis = el.getAttribute("data-emphasis") === "true";
    const targetActiveColor = isEmphasis && emphasisColor ? emphasisColor : activeColor;

    const wordP = Math.max(0, Math.min(1, (currentIdx - i) * 1.6));

    if (wordP >= 1.0) {
      el.style.color = targetActiveColor;
      el.style.opacity = "1";
    } else if (wordP <= 0.0) {
      el.style.color = baseColor;
      el.style.opacity = baseOpacity.toString();
    } else {
      el.style.color = targetActiveColor;
      el.style.opacity = (baseOpacity + wordP * (1 - baseOpacity)).toFixed(2);
    }
  }
}

export const JourneyStory: React.FC = () => {
  const underRoadRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const secondPartRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const leftSubtextRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const rightTrackRef = useRef<HTMLDivElement>(null);
  const speedometerRef = useRef<HTMLSpanElement>(null);
  const statsTrackRef = useRef<HTMLDivElement>(null);
  const industriesTitleRef = useRef<HTMLDivElement>(null);

  // Settle stage, controls, and interactive elements
  const settleStageRef = useRef<HTMLDivElement>(null);
  const settleWrapperRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Interactive mouse tracker for spotlight and mountain parallax
  const mousePosRef = useRef({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    px: 600,
    py: 400,
    targetPx: 600,
    targetPy: 400,
    active: false,
  });

  // All 14 magazines and the 5 latest editions
  const allMagazines = useMemo(() => getChronologicalMagazines(false), []);
  const showcaseMagazines = useMemo(() => allMagazines.slice(0, 5), [allMagazines]);

  const [activeIndex, setActiveIndex] = useState(1);
  const [selectedMagazine, setSelectedMagazine] = useState<MagazineEdition | null>(null);
  const [readerState, setReaderState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const [spreadLabel, setSpreadLabel] = useState("INSIDE OPENING SPREAD • PAGES 2–3");
  const [activeCatalogModal, setActiveCatalogModal] = useState<"magazines" | "newsletters" | "articles" | null>(null);
  const [newsletters, setNewsletters] = useState<PublicationItem[]>(INITIAL_NEWSLETTERS);
  const [articles, setArticles] = useState<PublicationItem[]>(INITIAL_ARTICLES);
  const [activeReaderDoc, setActiveReaderDoc] = useState<{
    title: string;
    subtitle: string;
    pdfUrl: string;
  } | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const shelfTrackRef = useRef<HTMLDivElement>(null);
  const newsletterShelfTrackRef = useRef<HTMLDivElement>(null);
  const articleShelfTrackRef = useRef<HTMLDivElement>(null);
  const totalTravelRef = useRef(3200);



  const activeMagazine = selectedMagazine || showcaseMagazines[activeIndex] || showcaseMagazines[0];

  useEffect(() => {
    setIsMounted(true);
    const measure = () => {
      const trackEl = trackRef.current;
      if (!trackEl) return;
      const firstCard = trackEl.firstElementChild as HTMLElement | null;
      const lastCard = trackEl.lastElementChild as HTMLElement | null;
      if (firstCard && lastCard) {
        totalTravelRef.current = Math.max(600, lastCard.offsetLeft - firstCard.offsetLeft);
      }
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    const timer = setTimeout(measure, 400);
    const handlePointerMove = (e: PointerEvent) => {
      const m = mousePosRef.current;
      const w = window.innerWidth || 1200;
      const h = window.innerHeight || 800;
      m.targetX = Math.max(0, Math.min(1, e.clientX / w));
      m.targetY = Math.max(0, Math.min(1, e.clientY / h));
      m.targetPx = e.clientX;
      m.targetPy = e.clientY;
      m.active = true;
    };
    const handlePointerLeave = () => {
      const m = mousePosRef.current;
      m.targetX = 0.5;
      m.targetY = 0.5;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      clearTimeout(timer);
    };
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

  const handleOpenDocReader = useCallback(
    (doc: { title: string; subtitle: string; pdfUrl: string }) => {
      setSelectedMagazine(null);
      setActiveReaderDoc(doc);
      setReaderState("opening");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setReaderState("open");
        });
      });
    },
    []
  );

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

  const handleCardClick = useCallback((idx: number, mag: MagazineEdition) => {
    setActiveIndex(idx);
    handleOpenReader(mag);
  }, [handleOpenReader]);

  // Background refresh publications from internal Next.js proxy routes
  useEffect(() => {
    fetch("/api/newsletters")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setNewsletters(res.data);
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

  // Lock scroll & handle Escape key when catalog modal or reader is active
  useEffect(() => {
    if (activeCatalogModal !== null || readerState === "open" || readerState === "opening") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (readerState === "open" || readerState === "opening") {
            handleCloseReader();
          } else if (activeCatalogModal !== null) {
            setActiveCatalogModal(null);
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeCatalogModal, readerState, handleCloseReader]);



  useJourneyFrame((scene) => {
    const p = scene.progress;

    // 1. Under-road horizontal milestone cards:
    // Smoothly reveals as the truck journey scene arrives (descentP 0.0 -> 0.30)
    // and fades out as road turns downward (p >= 0.82 to 0.86)
    if (underRoadRef.current) {
      const descentP = scene.descent ?? 1.0;
      const zoomReveal = smoothstep(0.0, 0.30, descentP);
      const underRoadFade = (1 - smoothstep(0.82, 0.86, p)) * zoomReveal;
      underRoadRef.current.style.opacity = underRoadFade.toFixed(3);
      underRoadRef.current.style.pointerEvents = underRoadFade > 0.1 ? "auto" : "none";
      underRoadRef.current.style.transform = `translate3d(0, ${((1 - underRoadFade) * 16).toFixed(1)}px, 0)`;
    }

    // 2. Roadside Milestone Track (horizontal travel)
    if (trackRef.current) {
      const roadProgress = Math.min(1.0, Math.max(0.0, p / 0.82));
      const currentX = -roadProgress * totalTravelRef.current;
      trackRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;

      // Progressive text scrub on road milestone cards (connected to horizontal truck travel)
      const roadCards = trackRef.current.querySelectorAll<HTMLElement>(`.${styles.roadCard}`);
      STORY_POINTS.forEach((pt, idx) => {
        const cardEl = roadCards[idx];
        if (!cardEl) return;
        const cardP = Math.max(0, Math.min(1, (p - (pt.from - 0.03)) / (pt.to - pt.from + 0.04)));
        const headlineEl = cardEl.querySelector<HTMLElement>(`.${styles.milestoneHeadline}`);
        const descEl = cardEl.querySelector<HTMLElement>(`.${styles.milestoneDescription}`);
        const barEl = cardEl.querySelector<HTMLElement>(`.${styles.milestoneBar}`);

        // Card 0 ("OUR EVOLUTION") is the starting milestone on the left side.
        // Prevent it from immediately sliding offscreen as the truck starts moving:
        // Hold Card 0 gracefully in view until Milestone 1 approaches from the right (p >= 0.08 - 0.135),
        // then smoothly glide it away to the left with an organic silky fade-out.
        if (idx === 0) {
          const exitP = smoothstep(0.08, 0.135, p);
          const pinHold = (1 - exitP) * Math.min(Math.abs(currentX), 450);
          cardEl.style.transform = `translate3d(${pinHold.toFixed(1)}px, 0, 0)`;
          cardEl.style.opacity = (1 - exitP * 0.95).toFixed(3);
        } else {
          cardEl.style.transform = "translate3d(0, 0, 0)";
          cardEl.style.opacity = "1";
        }

        // Text illumination: Card 0 starts fully illuminated; upcoming cards scrub in as truck travels
        const headP = idx === 0 ? 1.0 : cardP;
        const descP = idx === 0 ? 1.0 : Math.max(0, (cardP - 0.10) / 0.90);

        updateWordScrub(headlineEl, headP, "rgba(255, 255, 255, 0.35)", "#FFFFFF", "#FFFFFF", 0.35);
        updateWordScrub(descEl, descP, "rgba(255, 255, 255, 0.45)", "#F1F5F9", undefined, 0.38);

        // Organic silver line draw-in animation:
        // Card 0 line starts fully drawn.
        // Cards 1 to 5: smoothly expand from left to right as each card enters from the right side.
        if (barEl) {
          const lineProgress = idx === 0 ? 1.0 : smoothstep(0.02, 0.30, cardP);
          barEl.style.transform = `scaleX(${lineProgress.toFixed(3)})`;
          barEl.style.opacity = (0.35 + lineProgress * 0.65).toFixed(2);

          const activeGlow = Math.sin(lineProgress * Math.PI * 0.5);
          barEl.style.filter = `drop-shadow(0 0 ${(activeGlow * 6).toFixed(1)}px rgba(255, 255, 255, ${(0.3 + activeGlow * 0.5).toFixed(2)}))`;
        }
      });
    }

    // 3. Second Part roadside text (vertical highway run):
    // ONLY starts and scrolls AFTER the road has completely finished rotating (p >= 0.890)
    // and the road is 100% straight and vertical.
    if (secondPartRef.current) {
      let opacity = 0;
      if (p >= 0.890 && p <= 0.962) {
        // Smooth fade-in strictly after camera rotation completes
        const fadeIn = smoothstep(0.890, 0.902, p);
        const fadeOut = 1 - smoothstep(0.930, 0.940, p);
        opacity = fadeIn * fadeOut;

        // Normalized scroll progress starts at 0.0 when road is straight (p >= 0.900)
        // so Card 1 ("REAL-TIME MINING INTELLIGENCE") starts right at the top and never disappears prematurely!
        const sectionP = Math.max(0, Math.min(1, (p - 0.900) / (0.936 - 0.900)));

        // Live dynamic speedometer update
        if (speedometerRef.current) {
          const speed = Math.round(24 + sectionP * 34 + Math.sin(sectionP * Math.PI * 5) * 4);
          speedometerRef.current.textContent = `${speed} KM/H`;
        }

        // LEFT SIDE: Synchronized vertical scroll starting after road is straight
        if (leftColRef.current) {
          const scrollY = (0.5 - sectionP) * 160;
          leftColRef.current.style.transform = `translate3d(0, calc(-50% + ${scrollY.toFixed(1)}px), 0)`;
        }

        // RIGHT SIDE: Continuously stream feature cards upward as truck drives
        if (rightTrackRef.current) {
          const maxScrollRight = 640;
          const rightY = sectionP * maxScrollRight;
          rightTrackRef.current.style.transform = `translate3d(0, -${rightY.toFixed(1)}px, 0)`;

          const cards = rightTrackRef.current.children;
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const cardCenter = 0.12 + i * 0.26;
            const dist = Math.abs(sectionP - cardCenter);
            const cardOpacity = Math.max(0.35, 1 - dist * 2.2);
            card.style.opacity = cardOpacity.toFixed(3);
          }
        }
      } else {
        opacity = 0;
      }

      secondPartRef.current.style.opacity = opacity.toFixed(3);
      secondPartRef.current.style.pointerEvents = "none";
    }

    // Smooth mouse lerp for interactive dynamic spotlight and parallax
    const m = mousePosRef.current;
    m.x += (m.targetX - m.x) * 0.08;
    m.y += (m.targetY - m.y) * 0.08;
    m.px += (m.targetPx - m.px) * 0.08;
    m.py += (m.targetPy - m.py) * 0.08;

    if (spotlightRef.current) {
      if (p < 0.962) {
        spotlightRef.current.style.opacity = "0";
      } else {
        const spotAlpha = Math.min(1, (p - 0.962) / 0.015);
        spotlightRef.current.style.opacity = spotAlpha.toFixed(3);
        spotlightRef.current.style.background = `radial-gradient(circle 540px at ${(m.x * 100).toFixed(1)}% ${(m.y * 100).toFixed(1)}%, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.05) 45%, transparent 75%)`;
      }
    }

    // ====================================================================
    // CINEMATIC SERVICES SECTION REVEAL (CLEAN EDITORIAL SLIDE-IN)
    // ====================================================================
    // Settle Stage ("Our Services"): Curved off-white horizon rises from the BOTTOM
    // Sides rise first, center has dip for truck passage, then smoothly overtakes full screen
    if (settleWrapperRef.current) {
      if (p < 0.936) {
        settleWrapperRef.current.style.visibility = "hidden";
        settleWrapperRef.current.style.pointerEvents = "none";
        settleWrapperRef.current.style.transform = "translate3d(0, 100%, 0)";
      } else if (p >= 0.936 && p < 0.976) {
        const progress = Math.max(0, Math.min(1, (p - 0.936) / (0.976 - 0.936)));
        // Smooth natural easing matching truck downward travel
        const ease = 1 - Math.pow(1 - progress, 2.4);
        const panelY = (1 - ease) * 100;
        settleWrapperRef.current.style.visibility = "visible";
        // 100% SOLID OPAQUE MASK: Never transparent so truck/road can NEVER bleed through!
        settleWrapperRef.current.style.opacity = "1";
        settleWrapperRef.current.style.transform = `translate3d(0, ${panelY.toFixed(2)}%, 0)`;
        settleWrapperRef.current.style.pointerEvents = progress > 0.85 ? "auto" : "none";
      } else {
        settleWrapperRef.current.style.visibility = "visible";
        settleWrapperRef.current.style.opacity = "1";
        settleWrapperRef.current.style.transform = "translate3d(0, 0, 0)";
        settleWrapperRef.current.style.pointerEvents = "auto";
      }
    }
  });

  return (
    <>
      <div className={styles.overlay}>
      {/* 00 KM/H Speedometer HUD (visible in top-left matching reference pictures) */}
      <div className={styles.speedometerBadge} aria-hidden="true">
        00 KM/H
      </div>

      {/* Circular Hotspot indicator for side view (matching Pic 2) */}
      <div className={styles.sideHotspot} aria-hidden="true">
        <div className={styles.hotspotRing} />
        <div className={styles.hotspotDot} />
      </div>

      {/* BLACK PART: ROADSIDE MILESTONE TRACK
          Text cards enter from the right side of the screen and travel across
          to the left side as the truck moves forward along the road */}
      <div ref={underRoadRef} className={styles.underRoadSection} aria-live="polite">
        <div ref={trackRef} className={styles.roadTextTrack}>
          {STORY_POINTS.map((point, index) => {
            const Icon = MILESTONE_ICONS[index] || Globe;
            return (
              <div
                key={point.id}
                className={styles.roadCard}
              >
                <div className={styles.milestoneIconRow}>
                  <Icon className={styles.milestoneIcon} strokeWidth={1.5} />
                  <span className={styles.milestoneTag}>{point.eyebrow}</span>
                </div>
                <h3 className={styles.milestoneHeadline}>
                  {renderScrubText(point.headline, `mhead-${point.id}`, point.emphasis)}
                </h3>
                <div className={styles.milestoneBar} />
                <p className={styles.milestoneDescription}>
                  {renderScrubText(point.description, `mdesc-${point.id}`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECOND PART (VERTICAL ROAD HERO): UNITED CARRIERS STYLE EDITORIAL SCROLL */}
      <div
        ref={secondPartRef}
        className={styles.secondPartSidesWrap}
        aria-label="Visibility at every milestone. Every major mining audience."
      >
        {/* Left Side: Pinned Headline & Supporting Copy (Matching United Carriers Reference Video) */}
        <div ref={leftColRef} className={styles.ucLeftBlock}>
          <div className={styles.ucSpeedIndicator}>
            <span ref={speedometerRef}>43 KM/H</span>
          </div>

          <h2 className={styles.ucLeftHeadline}>
            <span className={styles.ucHeadlineMuted}>VISIBILITY</span><br />
            <span>AT EVERY</span><br />
            <span>MILESTONE</span>
          </h2>

          <p className={styles.ucLeftDesc}>
            With every service under one roof and an authoritative editorial team, your company moves the way the global market demands: visibly, strategically, and with sustained investor conviction.
          </p>
        </div>

        {/* Right Side: Vertically Scrolling Feature Track (Matching Reference Video) */}
        <div className={styles.ucRightViewport}>
          <div ref={rightTrackRef} className={styles.ucRightTrack}>
            {TOP_DOWN_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={styles.ucFeatureCard}>
                  <div className={styles.ucFeatureIconWrap}>
                    <Icon className={styles.ucFeatureIcon} strokeWidth={1.75} />
                  </div>
                  <h3 className={styles.ucFeatureTitle}>{item.title}</h3>
                  <p className={styles.ucFeatureDesc}>{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* EDITORIAL SETTLE STAGE (OUR SERVICES) - Direct un-padded layer covering 100% of viewport */}
      <div ref={settleWrapperRef} className={styles.settleStageWrapper}>
        {/* Dynamic Curved Off-White Crest (rising on both sides, center dip for truck passage) */}
        <div className={styles.curvedHorizonCrest} aria-hidden="true">
          <svg
            viewBox="0 0 1440 240"
            preserveAspectRatio="none"
            className={styles.curvedHorizonSvg}
          >
            <defs>
              <linearGradient id="crestStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C5A059" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#C5A059" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#C5A059" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <path
              d="M 0 0 C 420 210, 1020 210, 1440 0 L 1440 240 L 0 240 Z"
              fill="#FAF7F2"
            />
            <path
              d="M 0 0 C 420 210, 1020 210, 1440 0"
              fill="none"
              stroke="url(#crestStroke)"
              strokeWidth="2.5"
            />
          </svg>
          <div className={styles.curvedAtmosphereGlow} />
        </div>

        {/* Scrollable Services Section */}
        <div ref={settleStageRef} className={styles.settleMountainStage}>

          {/* Subtle Architectural Grid Lines Overlay (White Desert Light Theme) */}
          <div className={styles.lightGridOverlay} aria-hidden="true">
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
          </div>

          {/* Light Theme Services Section Container */}
          <div className={styles.lightServicesContainer}>
            {/* Top Centered Header */}
            {/* Top Centered Header - Big Prominent "OUR SERVICES" */}
            <div className={styles.lightServicesHeader}>
              <div className={styles.lightEyebrowRow}>
                <span className={styles.lightEyebrowRule} aria-hidden="true" />
                <h2 className={styles.lightServicesBigTitle}>OUR SERVICES</h2>
                <span className={styles.lightEyebrowRule} aria-hidden="true" />
              </div>
            </div>

            {/* Premium Two-Column Editorial Grid (Reference Video 1 Visual Structure) */}
            <div className={styles.editorialGrid} role="region" aria-label="Our Services">
              {EDITORIAL_SERVICES.map((item, idx) => (
                <EditorialGridCard
                  key={item.id}
                  item={item}
                  idx={idx}
                  onOpenFlipbook={() => handleOpenReader(getLatestMagazine())}
                  onOpenArchive={() => setActiveCatalogModal("magazines")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Magazine Archive Modal */}
      {activeCatalogModal === "magazines" && isMounted && createPortal(
        <div
          className={styles.archiveModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCatalogModal(null);
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Complete Monthly Magazines Catalog"
        >
          <div className={styles.archiveModalContent}>
            <div className={styles.archiveModalHeader}>
              <div className={magStyles.archiveEyebrow}>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
                <span>Monthly Magazine Library</span>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
              </div>
              <button
                type="button"
                className={magStyles.readerCloseBtn}
                onClick={() => setActiveCatalogModal(null)}
                aria-label="Close archive"
              >
                <X className={magStyles.readerCloseIcon} />
                <span>CLOSE</span>
              </button>
            </div>
            <h3 className={magStyles.archiveTitle}>All Published Editions</h3>
            <p className={magStyles.archiveSubtitle}>
              Explore all {allMagazines.length} monthly publications from the Mining Discovery library. Select any edition to open the complete magazine reader.
            </p>
            <div className={magStyles.archiveGrid}>
              {allMagazines.map((edition) => (
                <EditionCoverCard
                  key={edition.id}
                  edition={edition}
                  isSelected={activeMagazine.id === edition.id}
                  onSelect={(ed) => {
                    setActiveCatalogModal(null);
                    handleOpenReader(ed);
                  }}
                />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Complete Weekly Newsletters Catalog Modal */}
      {activeCatalogModal === "newsletters" && isMounted && createPortal(
        <div
          className={styles.archiveModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCatalogModal(null);
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Complete Weekly Newsletters Catalog"
        >
          <div className={styles.archiveModalContent}>
            <div className={styles.archiveModalHeader}>
              <div className={magStyles.archiveEyebrow}>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
                <span>Weekly Newspaper Dispatches</span>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
              </div>
              <button
                type="button"
                className={magStyles.readerCloseBtn}
                onClick={() => setActiveCatalogModal(null)}
                aria-label="Close archive"
              >
                <X className={magStyles.readerCloseIcon} />
                <span>CLOSE</span>
              </button>
            </div>
            <h3 className={magStyles.archiveTitle}>Weekly Newspaper Archive</h3>
            <p className={magStyles.archiveSubtitle}>
              Browse through all {newsletters.length} weekly dispatches and executive market briefings. Select any edition to open in the interactive flipbook.
            </p>
            <div className={magStyles.archiveGrid}>
              {newsletters.map((item) => (
                <div
                  key={item.id}
                  className={styles.publicationArchiveCard}
                  onClick={() => {
                    setActiveCatalogModal(null);
                    handleOpenDocReader({
                      title: "Weekly Newspaper Dispatch",
                      subtitle: item.title.toUpperCase(),
                      pdfUrl: getProxiedPdfUrl(item.pdf),
                    });
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCatalogModal(null);
                      handleOpenDocReader({
                        title: "Weekly Newspaper Dispatch",
                        subtitle: item.title.toUpperCase(),
                        pdfUrl: getProxiedPdfUrl(item.pdf),
                      });
                    }
                  }}
                >
                  <div className={styles.publicationArchiveCover}>
                    <img src={item.cover} alt={item.title} loading="lazy" />
                  </div>
                  <div className={styles.publicationArchiveMeta}>
                    <span className={styles.publicationArchiveTitle}>{item.title}</span>
                    <span className={styles.publicationArchiveCta}>
                      <span>READ ISSUE</span>
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Complete Articles & Research Catalog Modal */}
      {activeCatalogModal === "articles" && isMounted && createPortal(
        <div
          className={styles.archiveModalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCatalogModal(null);
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Complete Research Articles Catalog"
        >
          <div className={styles.archiveModalContent}>
            <div className={styles.archiveModalHeader}>
              <div className={magStyles.archiveEyebrow}>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
                <span>Editorial & Research Library</span>
                <span className={magStyles.archiveEyebrowRule} aria-hidden="true" />
              </div>
              <button
                type="button"
                className={magStyles.readerCloseBtn}
                onClick={() => setActiveCatalogModal(null)}
                aria-label="Close archive"
              >
                <X className={magStyles.readerCloseIcon} />
                <span>CLOSE</span>
              </button>
            </div>
            <h3 className={magStyles.archiveTitle}>Published Articles & Features</h3>
            <p className={magStyles.archiveSubtitle}>
              Explore our library of {articles.length} in-depth research articles and exploration features. Select any article to read the full publication.
            </p>
            <div className={magStyles.archiveGrid}>
              {articles.map((item) => (
                <div
                  key={item.id}
                  className={styles.publicationArchiveCard}
                  onClick={() => {
                    setActiveCatalogModal(null);
                    handleOpenDocReader({
                      title: "Research & Editorial Article",
                      subtitle: item.title.toUpperCase(),
                      pdfUrl: getProxiedPdfUrl(item.pdf),
                    });
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveCatalogModal(null);
                      handleOpenDocReader({
                        title: "Research & Editorial Article",
                        subtitle: item.title.toUpperCase(),
                        pdfUrl: getProxiedPdfUrl(item.pdf),
                      });
                    }
                  }}
                >
                  <div className={styles.publicationArchiveCover}>
                    <img src={item.cover} alt={item.title} loading="lazy" />
                  </div>
                  <div className={styles.publicationArchiveMeta}>
                    <span className={styles.publicationArchiveTitle}>{item.title}</span>
                    <span className={styles.publicationArchiveCta}>
                      <span>READ ARTICLE</span>
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Unified Two-Page Flipbook Reader Modal */}
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
    </>
  );
};

export default JourneyStory;
