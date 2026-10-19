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
  {
    id: "research-articles",
    num: "07",
    category: "RESEARCH & ARTICLES",
    title: "Research & Articles",
    description: "Authoritative technical teardowns, commodity deep-dives, and drill-result coverage published daily for mining executives.",
    image: "/images/services/service_08_articles_light.webp",
    alt: "Technical mining research and executive market reports",
    ctaText: "View Articles",
    ctaHref: "/contact",
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
  onOpenArticles?: () => void;
}> = ({ item, idx, onOpenFlipbook, onOpenArchive, onOpenArticles }) => {
  // First 4 cards are initialized visible so there is zero initial blank delay
  const [isVisible, setIsVisible] = useState(idx < 4);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || isVisible) return;
    const scrollContainer = el.closest(`.${styles.settleMountainStage}`);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        root: scrollContainer || null,
        rootMargin: "250px 0px 250px 0px",
        threshold: 0.02,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

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
        {item.id === "research-articles" ? (
          <div className={styles.editorialActionRow}>
            <button
              type="button"
              className={styles.editorialActionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onOpenArticles?.();
              }}
              aria-label="Open technical research articles"
            >
              <span>VIEW ARTICLES</span>
              <span className={styles.editorialActionStar}>✦</span>
            </button>
          </div>
        ) : item.id === "news-publications" ? (
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

export interface ServiceCardItem {
  id: string;
  num: string;
  category: string;
  title: string;
  italicTitle: string;
  metaPrice: string;
  metaSeason: string;
  summary: string;
  description: string;
  image: string;
  badge: string;
  features: {
    title: string;
    text: string;
  }[];
  ctaText: string;
  ctaHref: string;
  titleWhite?: string;
  titleGold?: string;
}

export const SERVICE_CARDS: ServiceCardItem[] = [
  {
    id: "brand-visual-identity",
    num: "01",
    category: "STRATEGIC POSITIONING",
    title: "Brand Identity & Visual Design",
    titleWhite: "BRAND IDENTITY\u00A0&",
    titleGold: "VISUAL DESIGN",
    italicTitle: "Brand Identity & Visual Design",
    metaPrice: "BRAND STRATEGY",
    metaSeason: "LOGO DESIGN",
    summary: "BUILD A CLEAR, CONSISTENT BRAND IDENTITY THAT REFLECTS WHO YOU ARE.",
    description:
      "We help mining and industrial companies build a clear, consistent brand identity that reflects who they are, what they do, and what sets them apart.",
    image: "/images/services/service_card_01_brand.webp?v=2",
    badge: "01 / STRATEGIC POSITIONING",
    features: [
      {
        title: "DIGITAL BRANDING",
        text: "From your website to your digital materials, we create a consistent brand presence that helps people recognize and understand your business.",
      },
      {
        title: "LOGO & VISUAL DESIGN",
        text: "We design logos, color systems, and visual assets that give your company a distinctive, professional look across every platform.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "social-media-marketing",
    num: "02",
    category: "AUDIENCE ENGAGEMENT",
    title: "Social Media & Audience Reach",
    titleWhite: "SOCIAL MEDIA\u00A0&",
    titleGold: "AUDIENCE REACH",
    italicTitle: "Social Media & Audience Reach",
    metaPrice: "CONTENT STRATEGY",
    metaSeason: "COMMUNITY ENGAGEMENT",
    summary: "BUILD AN ACTIVE, CREDIBLE PRESENCE ACROSS SOCIAL PLATFORMS.",
    description:
      "We help resource companies build an active, credible presence across social platforms to engage investors, industry leaders, and commercial partners.",
    image: "/images/services/service_card_02_social.webp?v=2",
    badge: "02 / AUDIENCE ENGAGEMENT",
    features: [
      {
        title: "DATA-BACKED CAMPAIGNS",
        text: "We craft targeted, sector-specific campaigns that translate complex mining milestones into compelling narratives that drive sustained audience interest.",
      },
      {
        title: "BRAND VOICE & ENGAGEMENT",
        text: "From executive thought leadership to daily community updates, we maintain an authentic, professional voice that strengthens trust in your brand.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "paid-campaigns-ads",
    num: "03",
    category: "PERFORMANCE MARKETING",
    title: "Targeted Ads & Performance Growth",
    titleWhite: "TARGETED ADS\u00A0&",
    titleGold: "PERFORMANCE GROWTH",
    italicTitle: "Targeted Ads & Performance Growth",
    metaPrice: "SEARCH & SOCIAL ADS",
    metaSeason: "INVESTOR ACQUISITION",
    summary: "CONNECT WITH QUALIFIED INVESTORS AND KEY INDUSTRY DECISION-MAKERS.",
    description:
      "We manage high-performing paid campaigns across Google, LinkedIn, and Meta that connect your company with qualified investors and key industry decision-makers.",
    image: "/images/services/service_card_03_ads.webp?v=2",
    badge: "03 / PERFORMANCE MARKETING",
    features: [
      {
        title: "GOOGLE SEARCH & DISPLAY",
        text: "Capture high-intent interest at the exact moment investors and partners search for resource opportunities, commodity analysis, and project updates.",
      },
      {
        title: "LINKEDIN & META TARGETING",
        text: "Reach institutional executives, retail shareholders, and industry professionals with precisely tailored creative that drives measurable engagement and leads.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "pr-events",
    num: "04",
    category: "INDUSTRY AUTHORITY",
    title: "Public Relations & Executive Webinars",
    titleWhite: "PUBLIC RELATIONS\u00A0&",
    titleGold: "EXECUTIVE WEBINARS",
    italicTitle: "Public Relations & Executive Webinars",
    metaPrice: "MEDIA OUTREACH",
    metaSeason: "VIRTUAL SUMMITS",
    summary: "ELEVATE LEADERSHIP AND CORPORATE ANNOUNCEMENTS ACROSS GLOBAL MEDIA.",
    description:
      "We elevate your leadership and corporate announcements through top-tier media coverage, strategic press distribution, and high-impact digital events.",
    image: "/images/services/service_card_04_pr.webp",
    badge: "04 / INDUSTRY AUTHORITY",
    features: [
      {
        title: "STRATEGIC MEDIA RELATIONS",
        text: "We secure prominent editorial coverage across global mining journals, financial press, and industry publications to establish lasting market authority.",
      },
      {
        title: "INTERACTIVE WEBINARS & EVENTS",
        text: "We produce and broadcast polished virtual briefings that allow leadership to present directly to analysts, fund managers, and shareholders worldwide.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "web-app-development",
    num: "05",
    category: "DIGITAL INFRASTRUCTURE",
    title: "Web Platforms & App Development",
    titleWhite: "WEB PLATFORMS\u00A0&",
    titleGold: "APP DEVELOPMENT",
    italicTitle: "Web Platforms & App Development",
    metaPrice: "ENTERPRISE WEB",
    metaSeason: "CUSTOM APPLICATIONS",
    summary: "HIGH-SPEED WEBSITES AND INTERACTIVE DIGITAL TOOLS FOR MINING.",
    description:
      "We build modern, high-speed websites and interactive digital tools tailored specifically for the technical demands of mining enterprises.",
    image: "/images/services/service_card_05_web.webp",
    badge: "05 / DIGITAL INFRASTRUCTURE",
    features: [
      {
        title: "CORPORATE WEB PLATFORMS",
        text: "Engineered for performance and clarity, our websites deliver drill results, interactive site maps, and regulatory filings with intuitive navigation.",
      },
      {
        title: "INTELLIGENT WEB & MOBILE APPS",
        text: "We create custom data dashboards, project portals, and mobile-friendly applications that simplify stakeholder communication and data access.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
];

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

  // Settle stage, controls, and interactive elements
  const settleStageRef = useRef<HTMLDivElement>(null);

  const cardsTrackRef = useRef<HTMLDivElement>(null);
  // Active full-screen card index (0 to SERVICE_CARDS.length - 1)
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const activeCardIndexRef = useRef(0);
  
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
  
    const scrollToCard = useCallback((targetIdx: number) => {
      if (typeof window === "undefined") return;
      const section = document.querySelector("[data-journey-prototype]");
      if (!section) return;
      const totalCards = SERVICE_CARDS.length;
      const clamped = Math.max(0, Math.min(totalCards - 1, targetIdx));
      const startP = 0.928;
      const endP = 0.998;
      const cardFraction = clamped / (totalCards - 1);
      const targetProgress = startP + cardFraction * (endP - startP);
      const rect = section.getBoundingClientRect();
      const startScrollY = window.scrollY + rect.top;
      const scrollDistance = section.clientHeight - window.innerHeight;
      const targetScrollY = startScrollY + targetProgress * scrollDistance;
      window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    }, []);
  
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
  const spotlightRef = useRef<HTMLDivElement>(null);



  useJourneyFrame((scene) => {
    // Mobile: cards sit in standard vertical document flow without virtual scrub transforms
    const isMobile = typeof window !== "undefined" && (window.innerWidth <= 900 || window.matchMedia("(pointer: coarse)").matches);
    if (isMobile) {
      if (settleStageRef.current) {
        settleStageRef.current.style.opacity = "1";
        settleStageRef.current.style.transform = "none";
        settleStageRef.current.style.visibility = "visible";
      }
      if (cardsTrackRef.current) {
        const cardEls = cardsTrackRef.current.children;
        for (let i = 0; i < cardEls.length; i++) {
          const el = cardEls[i] as HTMLElement | undefined;
          if (el) {
            el.style.transform = "none";
            el.style.visibility = "visible";
            el.style.opacity = "1";
          }
        }
      }
      return;
    }

    const p = scene.progress;

    // ====================================================================
    // CINEMATIC SERVICES SECTION (SOLID PINNED STAGE WITH DEDICATED DWELL READING ZONES)
    // ====================================================================
    if (settleStageRef.current) {
      const winW = typeof window !== "undefined" ? window.innerWidth : 1440;
      const totalCards = SERVICE_CARDS.length;

      // Pinned stage is fully opaque with zero background bleed
      settleStageRef.current.style.opacity = "1";
      settleStageRef.current.style.pointerEvents = "auto";
      settleStageRef.current.style.transform = "translate3d(0, 0, 0)";
      settleStageRef.current.style.clipPath = "none";

      // 5 cards, 4 transitions:
      // Card 0 dwell: p in [0.00, 0.16] -> Card 0 locked & fully readable
      // Trans 0->1:   p in [0.16, 0.25] -> Card 1 slides in smoothly
      // Card 1 dwell: p in [0.25, 0.38] -> Card 1 locked & fully readable
      // Trans 1->2:   p in [0.38, 0.47] -> Card 2 slides in smoothly
      // Card 2 dwell: p in [0.47, 0.60] -> Card 2 locked & fully readable
      // Trans 2->3:   p in [0.60, 0.69] -> Card 3 slides in smoothly
      // Card 3 dwell: p in [0.69, 0.82] -> Card 3 locked & fully readable
      // Trans 3->4:   p in [0.82, 0.91] -> Card 4 slides in smoothly
      // Card 4 dwell: p in [0.91, 1.00] -> Card 4 locked & fully readable

      let cardFloat = 0;
      let currentIdx = 0;

      if (p < 0.16) {
        cardFloat = 0;
        currentIdx = 0;
      } else if (p < 0.25) {
        const t0 = (p - 0.16) / 0.09;
        const ease = t0 * t0 * (3 - 2 * t0);
        cardFloat = 0 + ease;
        currentIdx = t0 >= 0.5 ? 1 : 0;
      } else if (p < 0.38) {
        cardFloat = 1;
        currentIdx = 1;
      } else if (p < 0.47) {
        const t1 = (p - 0.38) / 0.09;
        const ease = t1 * t1 * (3 - 2 * t1);
        cardFloat = 1 + ease;
        currentIdx = t1 >= 0.5 ? 2 : 1;
      } else if (p < 0.60) {
        cardFloat = 2;
        currentIdx = 2;
      } else if (p < 0.69) {
        const t2 = (p - 0.60) / 0.09;
        const ease = t2 * t2 * (3 - 2 * t2);
        cardFloat = 2 + ease;
        currentIdx = t2 >= 0.5 ? 3 : 2;
      } else if (p < 0.82) {
        cardFloat = 3;
        currentIdx = 3;
      } else if (p < 0.91) {
        const t3 = (p - 0.82) / 0.09;
        const ease = t3 * t3 * (3 - 2 * t3);
        cardFloat = 3 + ease;
        currentIdx = t3 >= 0.5 ? 4 : 3;
      } else {
        cardFloat = 4;
        currentIdx = 4;
      }

      if (currentIdx !== activeCardIndexRef.current) {
        activeCardIndexRef.current = currentIdx;
        setActiveCardIndex(currentIdx);
      }

      if (cardsTrackRef.current) {
        const cardEls = cardsTrackRef.current.children;
        for (let i = 0; i < totalCards; i++) {
          const el = cardEls[i] as HTMLElement | undefined;
          if (!el) continue;
          if (i === 0) {
            // First card remains stationary in place on screen
            el.style.transform = "translate3d(0, 0, 0)";
            el.style.visibility = "visible";
          } else {
            // Subsequent cards overlay on top from right to left
            if (cardFloat <= i - 1) {
              el.style.transform = `translate3d(${winW}px, 0, 0)`;
              el.style.visibility = "hidden";
            } else if (cardFloat >= i) {
              el.style.transform = "translate3d(0, 0, 0)";
              el.style.visibility = "visible";
            } else {
              const overlayP = cardFloat - (i - 1);
              const cardX = (1 - overlayP) * winW;
              el.style.transform = `translate3d(${cardX.toFixed(1)}px, 0, 0)`;
              el.style.visibility = "visible";
            }
          }
        }
      }
    }
  });

  return (
    <>
      {/* FULL-SCREEN SERVICES STAGE (slides normally from right to left) */}
        <div ref={settleStageRef} className={styles.settleMountainStage}>
          {/* Subtle Architectural Grid Lines Overlay */}
          <div className={styles.lightGridOverlay} aria-hidden="true">
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
            <div className={styles.lightGridLine} />
          </div>



          {/* Full-Screen Horizontal Cards Slider Wrap */}
          <div className={styles.fullScreenSliderWrap} role="region" aria-label="Services Showcase">
            <div ref={cardsTrackRef} className={styles.fullScreenSliderTrack}>
              {SERVICE_CARDS.map((card, idx) => {
                const isActive = activeCardIndex === idx;

                return (
                  <div
                    key={card.id}
                    className={`${styles.fullScreenCardItem} ${isActive ? styles.fullScreenCardActive : ""}`}
                    style={{
                      zIndex: idx + 1,
                    }}
                    role="tabpanel"
                    aria-selected={isActive}
                    tabIndex={0}
                  >
                    {/* Full-bleed Background Image */}
                    <div className={styles.cardFlickImage}>
                      <img
                        src={card.image}
                        alt={card.title}
                        loading="lazy"
                      />
                      <div className={styles.cardFlickGradient} />
                    </div>

                    {/* Content on the Full Screen Card - Distributed Equally Across Both Sides */}
                    <div className={styles.fullScreenCardContent}>
                      {/* Left Column: Heading (Category Badge, Main Title, Meta Tags) on Top */}
                      <div className={styles.fullScreenColLeft}>
                        <div className={styles.cardFlickHeaderRow}>
                          <div className={styles.cardFlickEyebrowRow}>
                            <span className={styles.cardFlickEyebrowRule} aria-hidden="true" />
                            <span className={styles.cardFlickEyebrowText}>
                              <span className={styles.cardFlickEyebrowPip}>✦</span>
                              <span className={styles.cardFlickEyebrowNum}>{card.num}</span>
                              <span className={styles.cardFlickEyebrowDivider}>//</span>
                              <span>{card.category}</span>
                              <span className={styles.cardFlickEyebrowPip}>✦</span>
                            </span>
                            <span className={styles.cardFlickEyebrowRuleRight} aria-hidden="true" />
                          </div>
                        </div>

                        <h3 className={styles.cardFlickTitle}>
                          {card.titleWhite ? (
                            <>
                              <span className={styles.titleWhiteSpan}>{card.titleWhite} </span>
                              <span className={styles.titleGoldSpan}>{card.titleGold}</span>
                            </>
                          ) : (
                            card.title
                          )}
                        </h3>

                        <div className={styles.cardFlickMeta}>
                          <span className={styles.cardFlickMetaItem}>{card.metaPrice}</span>
                          <span className={styles.cardFlickMetaDivider} aria-hidden="true" />
                          <span className={styles.cardFlickMetaItem}>{card.metaSeason}</span>
                        </div>

                        <p className={styles.cardFlickExcerpt}>
                          {card.description}
                        </p>
                      </div>

                      {/* Right Column: Sub Text & Feature Breakdown on Bottom */}
                      <div className={styles.fullScreenColRight}>
                        {card.features && card.features.length > 0 ? (
                          <div className={styles.cardFlickFeaturesList}>
                            {card.features.map((feat, fIdx) => (
                              <div key={fIdx} className={styles.cardFlickFeatureItem}>
                                <span className={styles.cardFlickFeatureBullet}>◆</span>
                                <div className={styles.cardFlickFeatureBody}>
                                  <strong className={styles.cardFlickFeatureTitle}>{feat.title}</strong>
                                  <p className={styles.cardFlickFeatureText}>{feat.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.cardFlickExcerpt}>
                            {card.description}
                          </p>
                        )}
                      </div>
                    </div>
                    </div>
                  );
                })}
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
