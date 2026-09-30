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
}

export const SERVICE_CARDS: ServiceCardItem[] = [
  {
    id: "brand-visual-identity",
    num: "01",
    category: "BRAND & VISUAL IDENTITY",
    title: "Brand & Visual Identity",
    italicTitle: "Brand & Visual Identity",
    metaPrice: "DIGITAL BRANDING",
    metaSeason: "LOGO & VISUAL DESIGN",
    summary: "YOUR BRAND'S VISIBILITY IS NOT ENOUGH; IT SHOULD ALSO BE ACKNOWLEDGED.",
    description:
      "Your brand's visibility is not enough; it should also be acknowledged. We create brand identities and visual assets designed to make mining and industrial enterprises recognized, trusted, and remembered across global capital and industrial markets.",
    image: "/images/services/service_03_brand_light.webp",
    badge: "01 / BRAND & VISUAL IDENTITY",
    features: [
      {
        title: "DIGITAL BRANDING",
        text: "We create brand identities with layout, value, and recognition as their main characteristics, thus making the mining and industrial fields remember the company.",
      },
      {
        title: "LOGO & VISUAL DESIGN",
        text: "The logo is the marketing element that brands use the most. Our team of designers will create visuals that define and portray your brand accurately and with much imagination and skill.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "social-media-marketing",
    num: "02",
    category: "SOCIAL MEDIA MARKETING",
    title: "Social Media Marketing",
    italicTitle: "Social Media Marketing",
    metaPrice: "CAMPAIGN STRATEGY",
    metaSeason: "DATA-BACKED CONTENT",
    summary: "CREATE DEBATES THAT ARE SIGNIFICANT FOR BOTH YOU AND YOUR CUSTOMERS.",
    description:
      "Create debates that are significant for both you and your customers. Our team takes care of your social media by inventing campaigns, applying strategies backed with data, and producing the kind of content that will resonate with your audience and strengthen your brand's voice.",
    image: "/images/services/service_07_newspaper_light.webp",
    badge: "02 / SOCIAL MEDIA MARKETING",
    features: [
      {
        title: "DATA-BACKED CAMPAIGNS",
        text: "Inventing data-driven social campaigns that foster constructive dialogue and continuous audience interest across the mining sector.",
      },
      {
        title: "BRAND VOICE & REACH",
        text: "Producing content that resonates with decision-makers, retail investors, and resource professionals worldwide.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "paid-campaigns-ads",
    num: "03",
    category: "PAID CAMPAIGNS & TARGETED ADS",
    title: "Google, LinkedIn & Meta Ads",
    italicTitle: "Google, LinkedIn & Meta Ads",
    metaPrice: "GOOGLE ADS",
    metaSeason: "LINKEDIN & META ADS",
    summary: "GET TO YOUR CUSTOMERS WHERE IT IS MOST EFFECTIVE.",
    description:
      "Get to your customers where it is most effective. We create and manage targeted ad campaigns across Google, LinkedIn, and Meta that connect with professionals and large audiences to drive brand visibility, qualified leads, and measurable growth.",
    image: "/images/services/service_08_articles_light.webp",
    badge: "03 / PAID CAMPAIGNS & TARGETED ADS",
    features: [
      {
        title: "GOOGLE ADS & PAID CAMPAIGNS",
        text: "Get to your customers where it is most effective. The Google Ads that we create and manage will lead to clicks, sales, and your company's growth that can be tracked and quantified.",
      },
      {
        title: "LINKEDIN & META ADS",
        text: "We create and maintain ad campaigns on LinkedIn and Meta for different purposes, from connecting with professionals to engaging with a large audience that will lead to brand visibility, leads, and awareness of the brand.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "pr-events",
    num: "04",
    category: "PUBLIC RELATIONS & EVENTS",
    title: "Public Relations & Webinars",
    italicTitle: "Public Relations & Webinars",
    metaPrice: "PUBLIC RELATIONS (PR)",
    metaSeason: "WEBINARS & EVENTS",
    summary: "PUT YOUR COMPANY IN THE LIMELIGHT THROUGH CREDIBILITY & INTERACTIONS.",
    description:
      "We make sure that your company is in the limelight not by spending money but by gaining it. Through media contacts, press releases, thought leadership, and proficient webinars and events, we build industry authority and capture audience attention.",
    image: "/images/services/service_02_media_light.webp",
    badge: "04 / PUBLIC RELATIONS & EVENTS",
    features: [
      {
        title: "PUBLIC RELATIONS (PR)",
        text: "We make sure that your company is in the limelight not by spending money but by gaining it. Through media contacts, press releases, and thought leadership, we create credibility and influence the way your story is told.",
      },
      {
        title: "WEBINARS & EVENTS",
        text: "Capture the attention of your audience through significant digital interactions. We organize and conduct proficient webinars and events that provide education, motivation, and development of your position in the industry.",
      },
    ],
    ctaText: "",
    ctaHref: "",
  },
  {
    id: "web-app-development",
    num: "05",
    category: "WEBSITE & APP DEVELOPMENT",
    title: "Website & App Development",
    italicTitle: "Website & App Development",
    metaPrice: "WEBSITE DEVELOPMENT",
    metaSeason: "APP DEVELOPMENT",
    summary: "THE CORNERSTONE OF YOUR ONLINE PRESENCE & INTELLIGENT APPLICATIONS.",
    description:
      "Your website is the cornerstone of your online presence. We create quick, user-friendly, and good-looking websites paired with intelligent, easy-to-use mobile and web applications that improve interaction, make operations easier, and bring actual value to your company.",
    image: "/images/services/service_05_web_development.webp",
    badge: "05 / WEBSITE & APP DEVELOPMENT",
    features: [
      {
        title: "WEBSITE DEVELOPMENT",
        text: "Your website is the cornerstone of your online presence. We create and produce quick, user-friendly, and good-looking websites that turn visitors into customers and business allies.",
      },
      {
        title: "APP DEVELOPMENT",
        text: "Be in the lead with intelligent, easy-to-use mobile and web applications. We design and launch apps that improve interaction, make operations easier, and bring actual value to the company from beginning to end.",
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
    const p = scene.progress;

    // ====================================================================
    // CINEMATIC SERVICES SECTION REVEAL (CLEAN EDITORIAL SLIDE-IN)
    // ====================================================================
    if (settleStageRef.current) {
      const winW = typeof window !== "undefined" ? window.innerWidth : 1440;
      const totalCards = SERVICE_CARDS.length;

      if (p <= 0.005) {
        settleStageRef.current.style.opacity = "0";
        settleStageRef.current.style.pointerEvents = "none";
        settleStageRef.current.style.transform = `translate3d(${winW}px, 0, 0)`;
        settleStageRef.current.style.clipPath = "none";
        if (cardsTrackRef.current) {
          const cardEls = cardsTrackRef.current.children;
          for (let i = 0; i < cardEls.length; i++) {
            const el = cardEls[i] as HTMLElement | undefined;
            if (!el) continue;
            if (i === 0) {
              el.style.transform = "translate3d(0, 0, 0)";
              el.style.visibility = "visible";
            } else {
              el.style.transform = `translate3d(${winW}px, 0, 0)`;
              el.style.visibility = "hidden";
            }
          }
        }
      } else if (p < 0.08) {
        // Stage slides in smoothly from right to left
        const enterP = Math.max(0, Math.min(1, p / 0.08));
        const ease = 1 - Math.pow(1 - enterP, 3);
        const stageX = (1 - ease) * winW;

        settleStageRef.current.style.opacity = "1";
        settleStageRef.current.style.pointerEvents = "auto";
        settleStageRef.current.style.transform = `translate3d(${stageX.toFixed(1)}px, 0, 0)`;
        settleStageRef.current.style.clipPath = "none";

        if (cardsTrackRef.current) {
          const cardEls = cardsTrackRef.current.children;
          for (let i = 0; i < cardEls.length; i++) {
            const el = cardEls[i] as HTMLElement | undefined;
            if (!el) continue;
            if (i === 0) {
              el.style.transform = "translate3d(0, 0, 0)";
              el.style.visibility = "visible";
            } else {
              el.style.transform = `translate3d(${winW}px, 0, 0)`;
              el.style.visibility = "hidden";
            }
          }
        }
        if (activeCardIndexRef.current !== 0) {
          activeCardIndexRef.current = 0;
          setActiveCardIndex(0);
        }
      } else {
        // Stage is fully pinned covering the screen; first card is locked and subsequent cards overlay from right to left on scroll
        settleStageRef.current.style.opacity = "1";
        settleStageRef.current.style.pointerEvents = "auto";
        settleStageRef.current.style.transform = "translate3d(0, 0, 0)";
        settleStageRef.current.style.clipPath = "none";

        const cardsP = Math.max(0, Math.min(1, (p - 0.08) / (0.96 - 0.08)));
        const cardFloat = cardsP * (totalCards - 1);
        const currentIdx = Math.min(totalCards - 1, Math.round(cardFloat));

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
              // First card / image remains locked in place on screen
              el.style.transform = "translate3d(0, 0, 0)";
              el.style.visibility = "visible";
            } else {
              // Subsequent cards overlay on top from right to left as user scrolls
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
                      transform: idx === 0 ? "translate3d(0, 0, 0)" : "translate3d(100vw, 0, 0)",
                      visibility: idx === 0 ? "visible" : "hidden",
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
                          <span className={styles.cardFlickBadge}>
                            <span className={styles.cardFlickBadgeNum}>{card.num}</span>
                            <span className={styles.cardFlickBadgeText}>{card.category}</span>
                          </span>
                        </div>

                        <h3 className={styles.cardFlickTitle}>
                          {card.title}
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

            {/* Bottom Card Navigation & Indicator Bar */}
            <div className={styles.fullScreenNavControls} aria-label="Services Navigation">
              <button
                type="button"
                className={styles.fullScreenNavBtn}
                onClick={() => scrollToCard(Math.max(0, activeCardIndex - 1))}
                disabled={activeCardIndex === 0}
                aria-label="Previous service card"
              >
                <ChevronLeft size={16} />
              </button>

              <div className={styles.fullScreenDots} aria-hidden="true">
                {SERVICE_CARDS.map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={`${styles.fullScreenDot} ${dotIdx === activeCardIndex ? styles.fullScreenDotActive : ""}`}
                    onClick={() => scrollToCard(dotIdx)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>

              <div className={styles.fullScreenCounter}>
                <span className={styles.fullScreenCounterActive}>
                  {String(activeCardIndex + 1).padStart(2, "0")}
                </span>
                <span>/</span>
                <span>{String(SERVICE_CARDS.length).padStart(2, "0")}</span>
              </div>

              <button
                type="button"
                className={styles.fullScreenNavBtn}
                onClick={() => scrollToCard(Math.min(SERVICE_CARDS.length - 1, activeCardIndex + 1))}
                disabled={activeCardIndex === SERVICE_CARDS.length - 1}
                aria-label="Next service card"
              >
                <ChevronRight size={16} />
              </button>
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
