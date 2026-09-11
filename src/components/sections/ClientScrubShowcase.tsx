"use client";

import React, { useEffect, useRef, useState, useId, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TrendingUp, ShieldCheck, MapPin, Layers, ArrowUpRight, ArrowRight } from "lucide-react";

/*
 * Detailed Portfolio Case Data
 */
interface ClientPortfolioCard {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  commodity: string;
  category: "Precious Metals" | "Base & Critical Metals" | "Energy & Compute" | "Institutional Capital";
  jurisdiction: string;
  flagship: string;
  stage: string;
  partner: string;
  thesis: string;
  metric: string;
  metricLabel: string;
  summary: string;
  accentColor: string;
  sparklineSeed: number;
}

const FEATURED_PORTFOLIO: ClientPortfolioCard[] = [
  {
    id: "astra",
    name: "Astra Exploration",
    ticker: "ASTR",
    exchange: "TSX.V",
    commodity: "Gold & Silver",
    category: "Precious Metals",
    jurisdiction: "Chile (Maricunga Belt)",
    flagship: "Pampa Paciencia Project",
    stage: "Advanced Drilling",
    partner: "Chilean Mining Alliances",
    thesis: "High-grade low-sulphidation epithermal gold & silver vein discoveries with multi-ounce intervals in Chile's mining heartland.",
    metric: "High-Grade",
    metricLabel: "Epithermal Vein System",
    summary: "Targeting high-grade gold-silver veins in one of the most prolific mining jurisdictions in northern Chile.",
    accentColor: "#E53E3E",
    sparklineSeed: 1,
  },
  {
    id: "us-gold",
    name: "U.S. Gold Corp.",
    ticker: "USAU",
    exchange: "NASDAQ",
    commodity: "Gold & Copper",
    category: "Precious Metals",
    jurisdiction: "Wyoming, USA",
    flagship: "CK Gold Project",
    stage: "State Permitted / Feasibility Complete",
    partner: "Wyoming Industrial Alliances",
    thesis: "De-risked tier-one copper-gold project with over 1.4M oz AuEq in an ultra-stable, pro-mining US jurisdiction.",
    metric: "1.4M+ oz",
    metricLabel: "AuEq Gold Resources",
    summary: "Advanced-stage gold-copper project with key state mining permits approved and feasibility studies complete.",
    accentColor: "#B8860B",
    sparklineSeed: 2,
  },
  {
    id: "guanajuato",
    name: "Guanajuato Silver",
    ticker: "GSVR",
    exchange: "TSX.V / OTCQX",
    commodity: "Silver & Gold",
    category: "Precious Metals",
    jurisdiction: "Guanajuato & Durango, Mexico",
    flagship: "El Cubo & Valenciana Mines",
    stage: "Active Underground Production",
    partner: "Ocean Partners & Offtakers",
    thesis: "Consolidating Mexico's historic silver belts across four operating underground production complexes with central milling.",
    metric: "4 Mines",
    metricLabel: "Active Producing Operations",
    summary: "Rapidly expanding Mexican silver producer operating historic, high-margin underground mines with central milling facilities.",
    accentColor: "#D4AF37",
    sparklineSeed: 3,
  },
  {
    id: "arras",
    name: "Arras Minerals",
    ticker: "ARS",
    exchange: "TSX.V",
    commodity: "Copper & Gold",
    category: "Base & Critical Metals",
    jurisdiction: "Kazakhstan",
    flagship: "Beskauga Deposit",
    stage: "District Porphyry Exploration",
    partner: "Teck Resources Strategic Alliance",
    thesis: "Exploring massive porphyry copper-gold systems across underexplored Paleozoic belts in strategic partnership with global major Teck.",
    metric: "Teck Alliance",
    metricLabel: "Tier-1 Strategic Partner",
    summary: "Exploring massive porphyry copper-gold deposits across underexplored Paleozoic belts with global major Teck Resources.",
    accentColor: "#0284C7",
    sparklineSeed: 4,
  },
  {
    id: "arizona-gold-silver",
    name: "Arizona Gold & Silver Inc.",
    ticker: "AZS",
    exchange: "TSX.V / OTCQB",
    commodity: "Gold & Silver",
    category: "Precious Metals",
    jurisdiction: "Arizona & Nevada, USA",
    flagship: "Philadelphia Gold Project",
    stage: "Expanding Resource Drilling",
    partner: "Mohave District Landholders",
    thesis: "Continuous near-surface epithermal mineralization with high-grade vein strikes open in all directions in Mohave County.",
    metric: "High-Grade",
    metricLabel: "Expanding Drill Intercepts",
    summary: "Actively drilling expanding high-grade epithermal gold-silver vein systems with continuous drill intercepts in Mohave County.",
    accentColor: "#1E3A8A",
    sparklineSeed: 5,
  },
  {
    id: "power-metallic",
    name: "Power Metallic",
    ticker: "PNPN",
    exchange: "TSX.V",
    commodity: "Nickel, Copper & PGM",
    category: "Base & Critical Metals",
    jurisdiction: "Quebec, Canada",
    flagship: "NISK Polymetallic Deposit",
    stage: "PEA / Resource Expansion",
    partner: "North American Clean Tech Supply",
    thesis: "High-grade polymetallic nickel-copper-PGE deposit strategically positioned for the North American clean tech supply chain.",
    metric: "Class-1 Nickel",
    metricLabel: "Critical Minerals Resource",
    summary: "Advancing the NISK high-grade nickel-copper-cobalt-PGE sulphide project strategically located for the North American clean tech supply chain.",
    accentColor: "#EAB308",
    sparklineSeed: 6,
  },
  {
    id: "usdc",
    name: "USDC (US Data Centers)",
    ticker: "INFRA",
    exchange: "PRIVATE",
    commodity: "Compute Infrastructure",
    category: "Energy & Compute",
    jurisdiction: "United States",
    flagship: "High-Density Campuses",
    stage: "Direct-to-Grid Development",
    partner: "Utility Interconnects & Hyperscalers",
    thesis: "Institutional data center campuses co-located with high-voltage utility interconnects and dedicated power generation.",
    metric: "150+ MW",
    metricLabel: "Secured Power Pipeline",
    summary: "Developing institutional-grade high-density data centers directly paired with high-voltage utility interconnects and dedicated power generation.",
    accentColor: "#06B6D4",
    sparklineSeed: 7,
  },
  {
    id: "digipower",
    name: "DigiPower X",
    ticker: "CLEAN POWER",
    exchange: "PRIVATE",
    commodity: "Grid-Scale Power & HPC",
    category: "Energy & Compute",
    jurisdiction: "North America",
    flagship: "Direct-to-Grid Energy Sites",
    stage: "Operational Grid Infrastructure",
    partner: "Tier-1 Industrial Energy Partners",
    thesis: "Modular high-density power generation bridging critical energy deficits for enterprise computational workloads.",
    metric: "100+ MW",
    metricLabel: "Critical Energy Infrastructure",
    summary: "Direct-to-grid digital compute and modular power generation facilities supporting enterprise computational workloads.",
    accentColor: "#111827",
    sparklineSeed: 8,
  },
  {
    id: "aurion",
    name: "Aurion Resources",
    ticker: "AU",
    exchange: "TSX.V",
    commodity: "High-Grade Gold",
    category: "Precious Metals",
    jurisdiction: "Lapland, Finland",
    flagship: "Risti & Helmi Discoveries",
    stage: "Joint Venture Exploration",
    partner: "B2Gold Corp & Kinross Gold",
    thesis: "Unlocking multi-million-ounce gold discoveries in the Central Lapland Greenstone Belt backed by major strategic partnerships.",
    metric: "Tier-1 JVs",
    metricLabel: "B2Gold & Kinross Alliances",
    summary: "Unlocking multi-million-ounce gold discoveries in the Central Lapland Greenstone Belt backed by major strategic joint-venture partnerships.",
    accentColor: "#D97706",
    sparklineSeed: 9,
  },
  {
    id: "phenom",
    name: "Phenom Resources",
    ticker: "PHNM",
    exchange: "TSX.V / OTCQX",
    commodity: "Vanadium & Gold",
    category: "Base & Critical Metals",
    jurisdiction: "Carlin Trend, Nevada, USA",
    flagship: "Carlin Vanadium Project",
    stage: "NI 43-101 Feasibility Stage",
    partner: "US Critical Minerals Supply Chain",
    thesis: "North America's largest primary vanadium deposit alongside deep high-impact Carlin-style gold targets.",
    metric: "Largest in NA",
    metricLabel: "Primary Vanadium Deposit",
    summary: "Controlling the largest and highest-grade primary vanadium resource in North America alongside deep high-potential Carlin-type gold targets.",
    accentColor: "#B45309",
    sparklineSeed: 10,
  },
  {
    id: "loyalist",
    name: "Loyalist Exploration",
    ticker: "PNGC",
    exchange: "CSE",
    commodity: "Gold & Base Metals",
    category: "Base & Critical Metals",
    jurisdiction: "Ontario, Canada",
    flagship: "Millen Mountain & Abitibi",
    stage: "Target Delineation & Sampling",
    partner: "Ontario Mining Alliances",
    thesis: "Systematic evaluation of under-explored greenstone claim blocks in historic Ontario mining camps.",
    metric: "District Scale",
    metricLabel: "Exploration Portfolio",
    summary: "Junior exploration firm targeting high-grade gold, silver, and copper asset discoveries across premier Canadian geological greenstone belts.",
    accentColor: "#D4AF37",
    sparklineSeed: 11,
  },
  {
    id: "bluenergy",
    name: "BluEnergy Solarwind",
    ticker: "CLEANTECH",
    exchange: "PRIVATE",
    commodity: "Renewable Microgrids",
    category: "Energy & Compute",
    jurisdiction: "Global Operations",
    flagship: "Hybrid Industrial Systems",
    stage: "Commercial Cleantech Deployments",
    partner: "Remote Industrial Mining Operators",
    thesis: "Turnkey hybrid solar-wind microgrids reducing fuel costs and carbon intensity for off-grid operations.",
    metric: "Off-Grid Power",
    metricLabel: "Hybrid Solar-Wind Tech",
    summary: "Providing turnkey hybrid renewable microgrid installations engineered to slash operating diesel costs for remote commercial mining sites.",
    accentColor: "#0284C7",
    sparklineSeed: 12,
  },
  {
    id: "kodiak",
    name: "Kodiak Copper",
    ticker: "KDK",
    exchange: "TSX.V / OTCQB",
    commodity: "Copper & Gold",
    category: "Base & Critical Metals",
    jurisdiction: "British Columbia, Canada",
    flagship: "MPD Copper-Gold Project",
    stage: "Aggressive Exploration Drilling",
    partner: "Teck Strategic Cornerstone",
    thesis: "High-grade copper-gold porphyry discoveries in southern BC with strong infrastructure, backed by Teck Resources.",
    metric: "Teck Strategic",
    metricLabel: "Discovery Group Member",
    summary: "High-grade copper-gold porphyry exploration in southern BC, backed by Teck Resources as a strategic cornerstone shareholder.",
    accentColor: "#C86D51",
    sparklineSeed: 13,
  },
  {
    id: "pan-global",
    name: "Pan Global Resources Inc.",
    ticker: "PGZ",
    exchange: "TSX.V / OTCQB",
    commodity: "Copper, Tin & Gold",
    category: "Base & Critical Metals",
    jurisdiction: "Iberian Pyrite Belt, Spain",
    flagship: "Escacena Project (La Romana)",
    stage: "Resource Delineation Drilling",
    partner: "Andalusia Regional Authorities",
    thesis: "Near-surface high-grade copper, tin, and gold discoveries in Spain's world-renowned Iberian Pyrite Belt.",
    metric: "High-Grade Cu",
    metricLabel: "Near-Surface Mineralization",
    summary: "Actively drilling shallow high-grade volcanogenic massive sulphide copper, tin, and gold discoveries in the tier-one mining jurisdiction of Spain.",
    accentColor: "#B45309",
    sparklineSeed: 14,
  },
  {
    id: "he-capital",
    name: "HE Capital Markets",
    ticker: "ADVISORY",
    exchange: "GLOBAL",
    commodity: "Institutional Syndication",
    category: "Institutional Capital",
    jurisdiction: "London & Vancouver",
    flagship: "Global Capital Advisory",
    stage: "Active Institutional Syndication",
    partner: "European & North American Desks",
    thesis: "Global syndication and capital advisory executing over $500M in natural resource financing.",
    metric: "$500M+",
    metricLabel: "Transaction Network",
    summary: "Specialized resource advisory connecting international mining companies with institutional European, UK, and North American capital pools.",
    accentColor: "#2563EB",
    sparklineSeed: 15,
  },
  {
    id: "harfang",
    name: "Harfang Exploration",
    ticker: "HAR",
    exchange: "TSX.V",
    commodity: "Gold & Critical Minerals",
    category: "Precious Metals",
    jurisdiction: "James Bay, Quebec, Canada",
    flagship: "Serpent-Radisson & Egan",
    stage: "District Multi-Commodity Exploration",
    partner: "Quebec Exploration Funds",
    thesis: "Systematic exploration in Quebec discovering district-scale gold and lithium mineralization with strong institutional backing.",
    metric: "District Scale",
    metricLabel: "James Bay Mineral Claims",
    summary: "Technically disciplined exploration leader discovering district-scale gold and critical minerals across prolific northern Quebec greenstone belts.",
    accentColor: "#0F172A",
    sparklineSeed: 16,
  },
  {
    id: "neocloudz",
    name: "NeoCloudz",
    ticker: "CLOUD AI",
    exchange: "PRIVATE",
    commodity: "Cloud Infrastructure",
    category: "Energy & Compute",
    jurisdiction: "North America",
    flagship: "High-Density AI Clusters",
    stage: "HPC Cloud Compute",
    partner: "Enterprise AI Infrastructure",
    thesis: "Specialized cloud computing infrastructure engineered for complex geological data processing and 3D modeling.",
    metric: "AI Workloads",
    metricLabel: "Scalable Compute Infra",
    summary: "Enterprise cloud computing infrastructure delivering high-throughput processing for geological exploration modeling and AI computing.",
    accentColor: "#10B981",
    sparklineSeed: 17,
  },
  {
    id: "west-red-lake",
    name: "West Red Lake Gold",
    ticker: "WRLG",
    exchange: "TSX.V",
    commodity: "Ultra High-Grade Gold",
    category: "Precious Metals",
    jurisdiction: "Red Lake, Ontario, Canada",
    flagship: "Madsen Mine & Rowan Deposit",
    stage: "Mine Restart & Resource Expansion",
    partner: "Red Lake Strategic Alliances",
    thesis: "Restarting the fully built 800+ tpd Madsen mill in Ontario's premier high-grade gold camp.",
    metric: "1.65M oz",
    metricLabel: "High-Grade Indicated",
    summary: "Restarting the fully built 800+ tpd Madsen mill in the premier high-grade gold camp of Red Lake, Ontario.",
    accentColor: "#B8860B",
    sparklineSeed: 18,
  },
];

function getCategoryBadgeStyle(category: string) {
  switch (category) {
    case "Precious Metals":
      return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
    case "Base & Critical Metals":
      return "bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]";
    case "Energy & Compute":
      return "bg-[#FAF5FF] text-[#7E22CE] border-[#F3E8FF]";
    case "Institutional Capital":
      return "bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]";
    default:
      return "bg-neutral-50 text-neutral-700 border-neutral-200";
  }
}

/*
 * Dynamic Discovery Momentum Sparkline
 */
function ExplorationSparkline({ seed = 1 }: { seed: number }) {
  const curves = [
    "M 0,28 Q 30,26 55,20 T 110,14 T 160,6",
    "M 0,26 Q 40,28 75,18 T 130,12 T 160,4",
    "M 0,30 Q 35,24 80,22 T 125,10 T 160,6",
    "M 0,25 Q 45,26 85,16 T 135,14 T 160,5",
  ];
  const curvePath = curves[seed % curves.length];
  const areaPath = `${curvePath} L 160,32 L 0,32 Z`;

  return (
    <div className="w-24 h-7 relative shrink-0">
      <svg viewBox="0 0 160 32" className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`goldSparkGrad-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B8860B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#goldSparkGrad-${seed})`} />
        <path d={curvePath} fill="none" stroke="#B8860B" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="160" cy="5" r="2.5" fill="#FFFFFF" stroke="#B8860B" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/*
 * 3D FULL HD CRYSTAL CLEAR VECTOR LOGO GRAPHICS
 */
function Logo3DFullHD({ id, theme = "dark" }: { id: string; theme?: "light" | "dark" }) {
  const uid = useId();
  const textPri = theme === "dark" ? "#FFFFFF" : "#0E1E36";
  const textSec = theme === "dark" ? "#94A3B8" : "#475569";
  const textItalic = theme === "dark" ? "#E2E8F0" : "#334155";
  const strokePri = theme === "dark" ? "#E2E8F0" : "#0F172A";
  const darkShape = theme === "dark" ? "#1E293B" : "#0F172A";

  switch (id) {
    case "astra":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`astraRed-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF4D4D" />
              <stop offset="45%" stopColor="#E53935" />
              <stop offset="100%" stopColor="#B71C1C" />
            </linearGradient>
            <linearGradient id={`astraGold-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="50%" stopColor="#FBC02D" />
              <stop offset="100%" stopColor="#F57F17" />
            </linearGradient>
            <linearGradient id={`astraArc-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E53935" />
              <stop offset="70%" stopColor="#880E4F" />
              <stop offset="100%" stopColor="#263238" />
            </linearGradient>
          </defs>
          <path d="M 80,75 Q 170,10 320,38 Q 180,24 105,68 Z" fill={`url(#astraArc-${uid})`} />
          <polygon points="58,18 69,54 105,64 72,78 80,118 52,90 20,110 32,74 4,56 42,50" fill={`url(#astraRed-${uid})`} />
          <polygon points="58,32 64,54 85,62 67,72 72,94 54,80 36,92 42,70 24,58 48,54" fill="#FFFFFF" opacity="0.3" />
          <polygon points="58,40 62,56 75,62 64,68 68,82 56,72 44,80 48,66 36,58 50,56" fill={`url(#astraGold-${uid})`} />
          <text x="120" y="85" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="56" letterSpacing="0.08em">
            ASTRA
          </text>
          <text x="122" y="118" fill="#EF4444" fontFamily="var(--font-geist-mono), monospace" fontWeight="800" fontSize="16" letterSpacing="0.35em">
            EXPLORATION
          </text>
        </svg>
      );

    case "us-gold":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`goldBar1-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF9C4" />
              <stop offset="25%" stopColor="#FDD835" />
              <stop offset="60%" stopColor="#C69214" />
              <stop offset="100%" stopColor="#7A5306" />
            </linearGradient>
            <linearGradient id={`goldBar2-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFDE7" />
              <stop offset="35%" stopColor="#FBC02D" />
              <stop offset="75%" stopColor="#B78103" />
              <stop offset="100%" stopColor="#5D3E02" />
            </linearGradient>
          </defs>
          <polygon points="40,118 64,32 82,32 58,118" fill={`url(#goldBar1-${uid})`} />
          <polygon points="58,118 82,32 86,34 62,120" fill="#FFE082" opacity="0.6" />
          <polygon points="76,118 100,32 118,32 94,118" fill={`url(#goldBar2-${uid})`} />
          <polygon points="94,118 118,32 122,34 98,120" fill="#FFE082" opacity="0.6" />
          <text x="145" y="82" fill={textPri} fontFamily="serif" fontWeight="900" fontSize="48" letterSpacing="0.04em">
            U.S. GOLD
          </text>
          <line x1="145" y1="98" x2="225" y2="98" stroke="#D4AF37" strokeWidth="2.5" />
          <text x="238" y="104" fill={textPri} fontFamily="serif" fontWeight="700" fontSize="20" letterSpacing="0.2em">
            CORP
          </text>
          <line x1="315" y1="98" x2="395" y2="98" stroke="#D4AF37" strokeWidth="2.5" />
        </svg>
      );

    case "guanajuato":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`gsGold-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8C6D1F" />
            </linearGradient>
            <linearGradient id={`gsPlinth-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B111E" />
            </linearGradient>
          </defs>
          <rect x="25" y="30" width="85" height="85" rx="16" fill={`url(#gsPlinth-${uid})`} stroke="#D4AF37" strokeWidth="2.5" />
          <polygon points="67,46 95,94 39,94" fill="none" stroke={`url(#gsGold-${uid})`} strokeWidth="4.5" strokeLinejoin="round" />
          <polygon points="67,58 83,86 51,86" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="67" cy="74" r="3.5" fill="#D4AF37" />
          <text x="130" y="74" fill={textPri} fontFamily="serif" fontWeight="900" fontSize="38" letterSpacing="0.02em">
            Guanajuato
          </text>
          <text x="132" y="108" fill={textItalic} fontFamily="serif" fontStyle="italic" fontWeight="600" fontSize="30" letterSpacing="0.04em">
            Silver <tspan fontSize="18" fontStyle="normal" fontWeight="800">CO.</tspan>
          </text>
        </svg>
      );

    case "arras":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`crystalTop-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id={`crystalMid-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id={`crystalBase-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          <path d="M 65,30 L 80,50 L 50,50 Z" fill={`url(#crystalTop-${uid})`} />
          <path d="M 40,55 L 60,55 L 52,72 L 32,72 Z" fill={`url(#crystalMid-${uid})`} />
          <path d="M 70,55 L 90,55 L 98,72 L 78,72 Z" fill={`url(#crystalMid-${uid})`} />
          <path d="M 22,78 L 44,78 L 36,104 L 14,104 Z" fill={`url(#crystalBase-${uid})`} />
          <path d="M 52,78 L 78,78 L 78,104 L 52,104 Z" fill={`url(#crystalMid-${uid})`} />
          <path d="M 86,78 L 108,78 L 116,104 L 94,104 Z" fill={`url(#crystalBase-${uid})`} />
          <text x="140" y="80" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="52" letterSpacing="0.08em">
            ARRAS
          </text>
          <text x="142" y="112" fill="#38BDF8" fontFamily="var(--font-geist-mono), monospace" fontWeight="800" fontSize="18" letterSpacing="0.3em">
            MINERALS CORP.
          </text>
        </svg>
      );

    case "arizona-gold-silver":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`azNavy-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B1120" />
            </linearGradient>
            <linearGradient id={`azGold-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
          </defs>
          <polygon points="65,24 35,116 54,116 65,72 76,116 95,116" fill={theme === "dark" ? "#D4AF37" : `url(#azNavy-${uid})`} />
          <polygon points="65,40 50,86 80,86" fill={`url(#azGold-${uid})`} />
          <polygon points="65,24 76,72 65,72" fill="#FDE047" opacity="0.6" />
          <text x="120" y="76" fill={textPri} fontFamily="serif" fontWeight="900" fontSize="36" letterSpacing="0.22em">
            ARIZONA
          </text>
          <text x="122" y="108" fill="#F59E0B" fontFamily="serif" fontWeight="800" fontSize="17" letterSpacing="0.18em">
            GOLD &amp; SILVER INC.
          </text>
        </svg>
      );

    case "power-metallic":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`pmVolt-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <path d="M 28,32 L 85,32 L 85,62 L 58,62 L 50,118 L 35,118 L 44,58 L 28,58 Z" fill={`url(#pmVolt-${uid})`} />
          <polygon points="60,62 88,62 55,118 62,80 48,80" fill="#A16207" />
          <polygon points="60,62 70,62 48,105 52,80" fill="#FFFFFF" opacity="0.4" />
          <text x="110" y="68" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="36" letterSpacing="0.08em">
            POWER
          </text>
          <text x="110" y="108" fill="#FBBF24" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="32" letterSpacing="0.12em">
            METALLIC
          </text>
        </svg>
      );

    case "usdc":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`usdcCyan-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id={`usdcTeal-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#14B8A6" />
              <stop offset="100%" stopColor="#0F766E" />
            </linearGradient>
          </defs>
          <rect x="30" y="44" width="18" height="66" rx="5" fill={`url(#usdcCyan-${uid})`} />
          <rect x="56" y="28" width="22" height="98" rx="6" fill={`url(#usdcTeal-${uid})`} />
          <rect x="86" y="44" width="18" height="66" rx="5" fill={`url(#usdcCyan-${uid})`} />
          <text x="130" y="80" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="56" letterSpacing="0.05em">
            USDC
          </text>
          <text x="132" y="112" fill="#22D3EE" fontFamily="var(--font-geist-mono), monospace" fontWeight="700" fontSize="16" letterSpacing="0.15em">
            US Data Centers Inc.
          </text>
        </svg>
      );

    case "digipower":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <circle cx="58" cy="78" r="32" stroke={strokePri} strokeWidth="10" fill="none" />
          <rect x="74" y="60" width="30" height="12" rx="3" fill={strokePri} />
          <rect x="74" y="84" width="30" height="12" rx="3" fill={strokePri} />
          <circle cx="58" cy="78" r="10" fill="#EAB308" />
          <text x="130" y="90" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="42" letterSpacing="0.08em">
            DIGIPOWER <tspan fill="#EAB308">X</tspan>
          </text>
        </svg>
      );

    case "aurion":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <rect x="25" y="65" width="10" height="38" rx="5" fill="#D97706" />
          <rect x="42" y="48" width="10" height="66" rx="5" fill="#B45309" />
          <rect x="59" y="32" width="10" height="96" rx="5" fill="#D97706" />
          <rect x="76" y="24" width="10" height="108" rx="5" fill="#0284C7" />
          <rect x="93" y="48" width="10" height="66" rx="5" fill="#0369A1" />
          <rect x="110" y="65" width="10" height="38" rx="5" fill="#0284C7" />
          <text x="145" y="85" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="52" letterSpacing="0.02em">
            <tspan fill="#F59E0B">Au</tspan><tspan fill="#38BDF8">rion</tspan>
          </text>
          <text x="148" y="112" fill={textSec} fontFamily="var(--font-geist-mono), monospace" fontWeight="700" fontSize="16" letterSpacing="0.3em">
            RESOURCES
          </text>
        </svg>
      );

    case "phenom":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`phenomGold-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="40%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          <rect x="25" y="32" width="80" height="80" rx="18" fill={`url(#phenomGold-${uid})`} />
          <rect x="28" y="35" width="74" height="74" rx="15" fill="#FFFFFF" opacity="0.2" />
          <text x="65" y="86" textAnchor="middle" fill="#FFFFFF" fontFamily="serif" fontWeight="900" fontSize="48">
            PR
          </text>
          <text x="130" y="74" fill="#F59E0B" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="40" letterSpacing="0.12em">
            PHENOM
          </text>
          <text x="132" y="108" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="24" letterSpacing="0.22em">
            RESOURCES
          </text>
        </svg>
      );

    case "loyalist":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <rect x="25" y="32" width="80" height="80" rx="16" fill="#0B1329" stroke="#B8860B" strokeWidth="2.5" />
          <path d="M 45,50 L 76,50 L 76,60 L 57,60 L 57,66 L 72,66 L 72,74 L 57,74 L 57,82 L 76,82 L 76,92 L 45,92 Z" fill="#D4AF37" />
          <rect x="80" y="50" width="5" height="42" rx="1.5" fill="#FFFFFF" />
          <text x="130" y="74" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="34" letterSpacing="0.15em">
            LOYALIST
          </text>
          <text x="132" y="108" fill="#D4AF37" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="22" letterSpacing="0.22em">
            EXPLORATION
          </text>
        </svg>
      );

    case "bluenergy":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`blueVortex-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <circle cx="65" cy="74" r="36" stroke={`url(#blueVortex-${uid})`} strokeWidth="5" strokeDasharray="42 16" fill="none" />
          <path d="M 65,48 C 50,48 40,58 40,74 C 40,88 52,98 65,98 C 76,98 84,90 84,80 C 84,72 76,68 70,68" stroke={`url(#blueVortex-${uid})`} strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="65" cy="74" r="7" fill="#38BDF8" />
          <text x="125" y="78" fill="#38BDF8" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="44" letterSpacing="0.02em">
            BluEnergy
          </text>
          <text x="128" y="108" fill={textSec} fontFamily="var(--font-geist-mono), monospace" fontWeight="700" fontSize="18" letterSpacing="0.25em">
            SOLARWIND
          </text>
        </svg>
      );

    case "kodiak":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <rect x="25" y="42" width="180" height="66" rx="14" fill="#334155" />
          <rect x="185" y="42" width="200" height="66" rx="14" fill="#C86D51" />
          <rect x="175" y="42" width="20" height="66" fill="#C86D51" />
          <path d="M 160,78 C 160,70 165,66 172,66 C 174,60 180,56 186,56 C 193,56 198,59 200,64 C 204,64 207,67 207,72 C 207,76 205,79 202,81 L 164,81 C 160,81 160,79 160,78 Z" fill="#FFFFFF" />
          <polygon points="174,81 182,68 190,81" fill="#C86D51" />
          <text x="45" y="86" fill="#FFFFFF" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="28" letterSpacing="0.1em">
            KODIAK
          </text>
          <text x="215" y="86" fill="#FFFFFF" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="28" letterSpacing="0.1em">
            COPPER
          </text>
        </svg>
      );

    case "pan-global":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`pgBronze-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          <circle cx="65" cy="74" r="36" stroke={`url(#pgBronze-${uid})`} strokeWidth="4" fill="none" />
          <ellipse cx="65" cy="74" rx="16" ry="36" stroke={`url(#pgBronze-${uid})`} strokeWidth="3" fill="none" />
          <line x1="29" y1="74" x2="101" y2="74" stroke={`url(#pgBronze-${uid})`} strokeWidth="3" />
          <text x="125" y="74" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="36" letterSpacing="0.08em">
            PAN GLOBAL
          </text>
          <text x="128" y="106" fill="#F59E0B" fontFamily="var(--font-geist-sans), sans-serif" fontWeight="800" fontSize="20" letterSpacing="0.18em">
            RESOURCES INC.
          </text>
        </svg>
      );

    case "he-capital":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <circle cx="65" cy="74" r="32" stroke="#3B82F6" strokeWidth="4" fill="none" />
          <ellipse cx="65" cy="74" rx="42" ry="14" stroke="#6366F1" strokeWidth="3.5" fill="none" transform="rotate(-25 65 74)" />
          <circle cx="95" cy="58" r="6" fill="#3B82F6" />
          <text x="130" y="74" fill={textPri} fontFamily="serif" fontWeight="900" fontSize="36" letterSpacing="0.08em">
            HE CAPITAL
          </text>
          <text x="132" y="106" fill="#60A5FA" fontFamily="var(--font-geist-mono), monospace" fontWeight="800" fontSize="22" letterSpacing="0.22em">
            MARKETS
          </text>
        </svg>
      );

    case "harfang":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <path d="M 15,64 C 32,64 45,78 65,92 C 85,78 98,64 115,64 C 100,84 85,98 65,108 C 45,98 30,84 15,64 Z" fill={darkShape} stroke={theme === "dark" ? "#64748B" : "none"} strokeWidth="1" />
          <path d="M 65,42 L 76,68 L 65,80 L 54,68 Z" fill="#D4AF37" />
          <path d="M 65,48 L 72,68 L 65,76 L 58,68 Z" fill="#FFFFFF" opacity="0.4" />
          <text x="135" y="78" fill={textPri} fontFamily="var(--font-geist-sans), sans-serif" fontWeight="900" fontSize="42" letterSpacing="0.1em">
            HARFANG
          </text>
          <text x="138" y="108" fill={textSec} fontFamily="var(--font-geist-mono), monospace" fontWeight="800" fontSize="18" letterSpacing="0.28em">
            EXPLORATION
          </text>
        </svg>
      );

    case "neocloudz":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`neoGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
          </defs>
          <rect x="25" y="38" width="370" height="74" rx="22" fill={`url(#neoGrad-${uid})`} stroke="#10B981" strokeWidth="3" />
          <path d="M 70,84 C 62,84 56,78 56,70 C 56,63 62,57 69,56 C 72,46 82,38 94,38 C 107,38 118,48 120,60 C 124,58 128,57 132,57 C 141,57 148,64 148,72 C 148,80 141,84 132,84 Z" fill="#34D399" />
          <text x="165" y="86" fill="#FFFFFF" fontFamily="var(--font-geist-mono), monospace" fontWeight="900" fontSize="38" letterSpacing="0.04em">
            Neo<tspan fill="#34D399">Cloudz</tspan>
          </text>
        </svg>
      );

    case "west-red-lake":
      return (
        <svg viewBox="0 0 420 160" className="w-full h-full max-h-20 sm:max-h-22 object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)]" fill="none">
          <defs>
            <linearGradient id={`wrlgCrimson-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id={`wrlgGold-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <rect x="30" y="32" width="76" height="76" rx="18" fill={`url(#wrlgCrimson-${uid})`} stroke="#B8860B" strokeWidth="2.5" />
          <path d="M 40,88 Q 68,64 96,88" stroke="#FFFFFF" strokeWidth="4" fill="none" />
          <path d="M 40,96 Q 68,72 96,96" stroke="#FFFFFF" strokeWidth="4" fill="none" />
          <path d="M 52,54 L 54,48 L 58,52 L 62,44 L 66,52 L 70,48 L 72,54 L 68,58 L 62,64 L 56,58 Z" fill={`url(#wrlgGold-${uid})`} />
          <text x="125" y="70" fill={textPri} fontFamily="serif" fontWeight="900" fontSize="34" letterSpacing="0.04em">
            WEST RED LAKE
          </text>
          <text x="128" y="102" fill="#F59E0B" fontFamily="serif" fontWeight="800" fontSize="22" letterSpacing="0.16em">
            GOLD MINES LTD.
          </text>
        </svg>
      );

    default:
      return null;
  }
}

/*
 * COMPACT 3D LOGO (NO BOXES, BORDERLESS)
 */
function Card3DOnlyLogo({ client }: { client: ClientPortfolioCard }) {
  return (
    <div
      className="group relative w-full h-full flex items-center justify-center p-2 sm:p-3 cursor-pointer transition-transform duration-300 hover:scale-110"
      title={client.name}
    >
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Logo3DFullHD id={client.id} theme="light" />
      </div>
    </div>
  );
}

/*
 * 1 SINGLE ROW OF LOGOS WITH 3D CASCADE FLIP CYCLING (NO BOXES)
 */
function FlippingLogoRow({ clients }: { clients: ClientPortfolioCard[] }) {
  const ROW_SIZE = 6;
  const [flipStep, setFlipStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Advance to next batch every 3.8 seconds
  useEffect(() => {
    if (clients.length <= ROW_SIZE) return;

    const timer = setInterval(() => {
      if (!isPaused) {
        setFlipStep((prev) => prev + 1);
      }
    }, 3800);

    return () => clearInterval(timer);
  }, [clients.length, isPaused]);

  const activeCount = Math.min(ROW_SIZE, clients.length);
  const slots = Array.from({ length: activeCount }, (_, i) => i);

  // On even flip steps (0, 2, 4...): front face is visible (at 0deg, 360deg...)
  // On odd flip steps (1, 3, 5...): back face is visible (at 180deg, 540deg...)
  const isEvenStep = flipStep % 2 === 0;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 items-center justify-items-center py-4"
    >
      {slots.map((idx) => {
        // The visible face always displays the current batch:
        // The hidden face is already prepared with the upcoming next batch!
        const frontClient = isEvenStep
          ? clients[(flipStep * ROW_SIZE + idx) % clients.length]
          : clients[((flipStep + 1) * ROW_SIZE + idx) % clients.length];

        const backClient = isEvenStep
          ? clients[((flipStep + 1) * ROW_SIZE + idx) % clients.length]
          : clients[(flipStep * ROW_SIZE + idx) % clients.length];

        return (
          <div
            key={`flip-slot-${idx}`}
            className="w-full h-20 sm:h-24 md:h-28 [perspective:1000px] flex items-center justify-center"
          >
            <div
              className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700 ease-in-out"
              style={{
                transform: `rotateX(${flipStep * 180}deg)`,
                transitionDelay: `${idx * 80}ms`,
              }}
            >
              {/* FRONT FACE */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center [backface-visibility:hidden]">
                {frontClient && <Card3DOnlyLogo client={frontClient} />}
              </div>

              {/* BACK FACE (Pre-rotated 180 deg so it becomes upright when parent is at 180, 540...) */}
              <div
                className="absolute inset-0 w-full h-full flex items-center justify-center [backface-visibility:hidden]"
                style={{
                  transform: "rotateX(180deg)",
                }}
              >
                {backClient && <Card3DOnlyLogo client={backClient} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/*
 * VIEW 2: DETAILED CARDS WITH 3D LOGOS, DRILL METRICS & ASSETS
 */
function DetailedDossierCard({ client }: { client: ClientPortfolioCard }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const badgeStyle = getCategoryBadgeStyle(client.category);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="client-data-card group relative rounded-2xl border border-[#D5E4F2] bg-white p-6 sm:p-7 shadow-[0_4px_22px_rgba(11,31,58,0.06)] hover:shadow-[0_20px_40px_-10px_rgba(11,31,58,0.15),0_0_24px_rgba(184,134,11,0.16)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      {/* Dynamic champagne gold mouse-tracking glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(360px circle at ${mousePos.x}px ${mousePos.y}px, rgba(184, 134, 11, 0.12), transparent 75%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-0 border-2 border-[#B8860B]/60"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      <div className="relative z-10">
        {/* HEADER: 3D FULL HD LOGO + TICKER & COMMODITY BADGES */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="h-12 max-w-[190px] sm:max-w-[220px] flex items-center justify-start shrink-0">
            <Logo3DFullHD id={client.id} theme="light" />
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border shadow-2xs ${badgeStyle}`}>
              {client.commodity}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-800 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{client.exchange}: {client.ticker}</span>
            </div>
          </div>
        </div>

        {/* ISSUER TITLE & ASSET LOCATION */}
        <div className="mb-3.5">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0B1F3A] tracking-tight leading-snug group-hover:text-[#B8860B] transition-colors duration-200">
            {client.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
            <span className="truncate">{client.jurisdiction}</span>
          </div>
        </div>

        {/* FLAGSHIP ASSET CHIP */}
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E5EFF8] border border-[#CFE0EF] text-xs font-mono text-neutral-800">
          <span className="text-[#B8860B] font-bold">ASSET:</span>
          <span className="font-medium truncate">{client.flagship}</span>
        </div>

        {/* SUMMARY / THESIS */}
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal mb-6 line-clamp-3">
          {client.summary}
        </p>
      </div>

      {/* FOOTER: PERFORMANCE SPARKLINE + BENCHMARK METRIC + CTA */}
      <div className="relative z-10 pt-4 border-t border-[#DCE7F2] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-[#0B1F3A] font-serif font-bold text-base sm:text-lg leading-none">
            <TrendingUp className="w-4 h-4 text-[#B8860B]" />
            <span>{client.metric}</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mt-0.5 truncate max-w-[125px]">
            {client.metricLabel}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ExplorationSparkline seed={client.sparklineSeed} />

          <a
            href="#contact"
            className="w-8 h-8 rounded-full bg-white border border-[#D5E4F2] flex items-center justify-center text-[#0B1F3A] group-hover:bg-[#0B1F3A] group-hover:text-white group-hover:border-[#0B1F3A] shadow-xs transition-all duration-300 shrink-0"
            title="Request Coverage Brief"
          >
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/*
 * Client Collaboration Categories from Corporate Profile
 */
const CLIENT_PILLARS = [
  {
    index: "01",
    tag: "CONFERENCE & POLICY",
    eyebrow: "STRATEGIC ALLIANCE",
    title: "Leading Mining Associations",
    description: "Knowledge sharing, policy alignment, and keynote conference partnerships.",
    image: "/images/engine/conference_auditorium.jpg",
  },
  {
    index: "02",
    tag: "TECH & PLATFORMS",
    eyebrow: "INTEGRATED INFRASTRUCTURE",
    title: "Service & Technology Providers",
    description: "Co-branded digital campaigns, software integration, and investor showcase events.",
    image: "/images/engine/financial_terminal.jpg",
  },
  {
    index: "03",
    tag: "GROWTH & CAPITAL",
    eyebrow: "CORPORATE EXPANSION",
    title: "Corporate Growth Partners",
    description: "Digital transformation in marketing, corporate re-branding, and liquidity acceleration.",
    image: "/images/engine/investor_meeting.jpg",
  },
  {
    index: "04",
    tag: "ESG & GOVERNANCE",
    eyebrow: "MARKET INTEGRITY",
    title: "Regulatory & Transparency Bodies",
    description: "Promoting ESG reporting standards, investor trust, and verified market intelligence.",
    image: "/images/engine/executive_boardroom.jpg",
  },
];

function YellowCircleIcon() {
  return (
    <div className="relative inline-block shrink-0 aspect-square w-[clamp(2rem,9vw,12rem)] h-[clamp(2rem,9vw,12rem)] mx-2 sm:mx-6 md:mx-12 align-middle">
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2 xl:border-[3px] border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.12)] group/icon"
        aria-hidden="true"
      >
        <Image
          src="/services/02-drill.jpg"
          alt="Exploration drilling"
          fill
          sizes="(min-width: 1024px) 192px, 120px"
          className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover/icon:scale-110"
          priority
        />
      </div>
    </div>
  );
}

function OrangeDonutIcon() {
  return (
    <div className="relative inline-block shrink-0 aspect-square w-[clamp(2rem,9vw,12rem)] h-[clamp(2rem,9vw,12rem)] mx-2 sm:mx-6 md:mx-12 align-middle">
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2 xl:border-[3px] border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.12)] group/icon"
        aria-hidden="true"
      >
        <Image
          src="/services/04-pit.jpg"
          alt="Production open pit"
          fill
          sizes="(min-width: 1024px) 192px, 120px"
          className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover/icon:scale-110"
          priority
        />
      </div>
    </div>
  );
}

function PurplePieIcon() {
  return (
    <div className="relative inline-block shrink-0 aspect-square w-[clamp(2rem,9vw,12rem)] h-[clamp(2rem,9vw,12rem)] mx-2 sm:mx-6 md:mx-12 align-middle">
      <div
        className="relative w-full h-full rounded-full overflow-hidden border-2 xl:border-[3px] border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.12)] group/icon"
        aria-hidden="true"
      >
        <Image
          src="/images/engine/investor_meeting.jpg"
          alt="Capital markets"
          fill
          sizes="(min-width: 1024px) 192px, 120px"
          className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover/icon:scale-110"
          priority
        />
      </div>
    </div>
  );
}

const CATEGORIES = [
  "All",
  "Precious Metals",
  "Base & Critical Metals",
  "Energy & Compute",
  "Institutional Capital",
] as const;

export function ClientScrubShowcase() {
  const containerRef = useRef<HTMLElement | null>(null);
  const rowsWrapperRef = useRef<HTMLDivElement | null>(null);
  const row1Ref = useRef<HTMLDivElement | null>(null);
  const row2Ref = useRef<HTMLDivElement | null>(null);
  const row3Ref = useRef<HTMLDivElement | null>(null);

  const discoverySectionRef = useRef<HTMLDivElement | null>(null);
  const discoveryHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const discoveryBgTransitionRef = useRef<HTMLDivElement | null>(null);

  const textARef = useRef<HTMLHeadingElement | null>(null);
  const textBRef = useRef<HTMLHeadingElement | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const r1 = row1Ref.current;
    const r2 = row2Ref.current;
    const r3 = row3Ref.current;

    if (!container || !r1 || !r2 || !r3) return;

    const ctx = gsap.context(() => {
      // 1. THREE WORDS PIC SECTION SCRUB
      const rows = [
        { el: r1, dir: 1 },
        { el: r2, dir: -1 },
        { el: r3, dir: 1 },
      ];

      rows.forEach(({ el, dir }) => {
        gsap.fromTo(
          el,
          { x: () => dir * -window.innerWidth * 0.22 },
          {
            x: () => dir * window.innerWidth * 0.22,
            ease: "none",
            scrollTrigger: {
              trigger: rowsWrapperRef.current || container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      // 2. DISCOVERY ZOOM TO COVER SCREEN BEFORE CLIENT INFORMATION
      if (discoverySectionRef.current && discoveryHeadingRef.current) {
        ScrollTrigger.create({
          trigger: discoverySectionRef.current,
          start: "top top",
          end: "+=160%",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress;

            // Zoom out / scale up massively to cover the whole screen
            const scale = 1 + Math.pow(p * 3.2, 3) * 0.8;
            const textOpacity = p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.25);

            if (discoveryHeadingRef.current) {
              discoveryHeadingRef.current.style.transform = `scale(${scale})`;
              discoveryHeadingRef.current.style.opacity = `${textOpacity}`;
            }

            // Crossfade into light blue #EAF2F9 as it covers the screen
            if (discoveryBgTransitionRef.current) {
              const bgOpacity = p < 0.55 ? 0 : Math.min(1, (p - 0.55) / 0.35);
              discoveryBgTransitionRef.current.style.opacity = `${bgOpacity}`;
            }
          },
        });
      }

      // 3. CLIENT INFORMATION ENTRANCE REVEAL
      if (textARef.current && textBRef.current) {
        gsap.fromTo(
          [textARef.current, textBRef.current],
          { y: 24, opacity: 0.3 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            scrollTrigger: {
              trigger: textARef.current,
              start: "top 90%",
              end: "bottom 55%",
              scrub: 1,
            },
          }
        );
      }

      // 4. CLIENT LOGO CARDS REVEAL
      if (cardsContainerRef.current) {
        gsap.fromTo(
          cardsContainerRef.current.children,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.05,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardsContainerRef.current,
              start: "top 85%",
              end: "bottom 60%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="clients"
      className="relative w-full overflow-hidden bg-[#11110F] select-none pt-8 sm:pt-12 md:pt-16"
      aria-label="Client Ecosystem"
    >
      {/* THREE WORDS PIC SECTION */}
      <div ref={rowsWrapperRef} className="relative z-10 w-full flex flex-col my-4">
        <div className="w-full border-t border-white/[0.09]" />
        <div className="w-full overflow-hidden py-4 sm:py-6 md:py-8 flex items-center justify-center">
          <div ref={row1Ref} className="group flex items-center justify-center whitespace-nowrap will-change-transform cursor-default">
            <YellowCircleIcon />
            <h1 className="font-geist font-bold text-[clamp(2.2rem,11vw,13.5rem)] uppercase text-white tracking-[-0.02em] leading-none select-none">
              EXPLORATION
            </h1>
          </div>
        </div>
        <div className="w-full border-t border-white/[0.09]" />
        <div className="w-full overflow-hidden py-4 sm:py-6 md:py-8 flex items-center justify-center">
          <div ref={row2Ref} className="group flex items-center justify-center whitespace-nowrap will-change-transform cursor-default">
            <h1 className="font-geist font-bold text-[clamp(2.2rem,11vw,13.5rem)] uppercase text-white tracking-[-0.02em] leading-none select-none">
              PRODUCTION
            </h1>
            <OrangeDonutIcon />
          </div>
        </div>
        <div className="w-full border-t border-white/[0.09]" />
        <div className="w-full overflow-hidden py-4 sm:py-6 md:py-8 flex items-center justify-center">
          <div ref={row3Ref} className="group flex items-center justify-center whitespace-nowrap will-change-transform cursor-default">
            <PurplePieIcon />
            <h1 className="font-geist font-bold text-[clamp(2.2rem,11vw,13.5rem)] uppercase text-white tracking-[-0.02em] leading-none select-none">
              CAPITAL
            </h1>
          </div>
        </div>
      </div>


      {/* DISCOVERY ZOOM-OUT HEADING (BEFORE CLIENT INFORMATION) */}
      <div
        ref={discoverySectionRef}
        className="relative w-full h-screen flex flex-col items-center justify-center bg-[#11110F] text-white overflow-hidden select-none z-10"
      >
        {/* Subtle Ambient Radial Glow masked away from top seam */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)",
          }}
        >
          <div className="w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] rounded-full bg-[#B8860B]/10 blur-[140px]" />
        </div>

        {/* Content Container - ONLY DISCOVERY */}
        <div className="relative z-10 w-full h-full flex items-center justify-center px-4 pointer-events-none will-change-transform">
          <h2
            ref={discoveryHeadingRef}
            className="font-geist font-bold text-[clamp(2.75rem,14vw,14rem)] uppercase text-white tracking-[-0.02em] leading-none select-none drop-shadow-[0_4px_40px_rgba(0,0,0,0.9)] text-center"
            style={{
              transformOrigin: "center center",
            }}
          >
            DISCOVERY
          </h2>
        </div>

        {/* Seamless Crossfade Layer to Warm Cream (#F7F4ED) */}
        <div
          ref={discoveryBgTransitionRef}
          className="absolute inset-0 bg-[#F7F4ED] pointer-events-none z-20 opacity-0 will-change-opacity"
          style={{ backgroundColor: "#F7F4ED" }}
        />
      </div>

      {/* CLIENT INFORMATION ON WARM CREAM BACKGROUND (#F7F4ED) */}
      <div
        className="relative z-20 w-full bg-[#F7F4ED] text-neutral-900 pt-20 md:pt-32 pb-32 md:pb-44"
        style={{ backgroundColor: "#F7F4ED" }}
      >
        {/* Kinetic Title Scrub */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 md:mb-20">
          <div className="w-full flex flex-col items-start overflow-hidden">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#B8860B] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B8860B]" />
              Corporate Client Portfolio &amp; Strategic Ecosystem
            </div>
            <h1
              ref={textARef}
              className="font-geist font-bold text-[clamp(2.4rem,9vw,9.5rem)] uppercase text-neutral-950 leading-[0.92] tracking-[-0.02em] select-none"
            >
              CLIENT
            </h1>
            <h1
              ref={textBRef}
              className="font-geist font-bold text-[clamp(2.4rem,9vw,9.5rem)] uppercase text-neutral-900 leading-[0.92] tracking-[-0.02em] select-none mt-2"
            >
              INFORMATION
            </h1>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl font-normal leading-relaxed">
              Empowering premier global mining companies, exploration developers, and institutional capital partners with targeted visibility and measurable industry growth.
            </p>
          </div>
        </div>

        {/* Slide 14 Collaboration Pillars - Styled Exactly Like First Image Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {CLIENT_PILLARS.map((pillar, idx) => {
              return (
                <Link
                  key={`pillar-${idx}`}
                  href="/work"
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#161B26] border border-[#2B3345] hover:border-[#E5A93C]/60 transition-all duration-500 hover:-translate-y-1.5 shadow-[0_10px_32px_rgba(11,31,58,0.14)] hover:shadow-[0_20px_48px_rgba(11,31,58,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
                  aria-label={`View ${pillar.title} portfolio`}
                >
                  {/* Upper Image Section */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1D2332]">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Subtle gradient overlay at top for badge legibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20 pointer-events-none" />

                    {/* Top Badge matching screenshot: 01 — CONFERENCE & POLICY */}
                    <div className="absolute top-3 left-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10141D]/80 backdrop-blur-md border border-white/15">
                      <span className="font-mono text-xs font-bold text-[#E5A93C] tracking-wider">
                        {pillar.index}
                      </span>
                      <span className="text-white/40 text-xs font-mono">—</span>
                      <span className="font-mono text-[9px] tracking-widest uppercase text-white/90 font-medium">
                        {pillar.tag}
                      </span>
                    </div>
                  </div>

                  {/* Lower Section: Softened Lighter Dark Background with Content */}
                  <div className="flex flex-col justify-between flex-1 p-5 sm:p-6 bg-[#161B26]">
                    <div>
                      {/* Eyebrow */}
                      <span className="text-[10px] sm:text-[10.5px] font-mono font-bold tracking-[0.18em] uppercase text-[#E5A93C] mb-2 block">
                        {pillar.eyebrow}
                      </span>

                      {/* Title */}
                      <h4 className="font-serif text-[19px] sm:text-[21px] font-normal text-white leading-tight tracking-tight mb-2.5 group-hover:text-[#F3E5C8] transition-colors duration-300">
                        {pillar.title}
                      </h4>

                      {/* Description */}
                      <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed font-sans font-normal mb-5">
                        {pillar.description}
                      </p>
                    </div>

                    {/* Bottom Action Row with Circular Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.12]">
                      <span className="font-mono text-[10px] sm:text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[#E5A93C] group-hover:text-[#FFC766] transition-colors flex items-center gap-1.5">
                        EXPLORE ALLIANCE
                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </span>

                      {/* Circular Button */}
                      <div className="w-9 h-9 rounded-full border border-[#E5A93C]/50 bg-[#10141D]/70 flex items-center justify-center text-[#E5A93C] group-hover:bg-[#E5A93C] group-hover:text-[#0B0E17] group-hover:border-[#E5A93C] group-hover:scale-105 transition-all duration-300 shadow-md shrink-0">
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            CLIENT SHOWCASE WITH QUICK VIEW SWITCHER
            1. Logo Showcase (Default): Compact 3D Full HD logo cards
            2. Detailed Cards: Deep drill metrics, assets, and technical research briefs
            ========================================================================= */}
        <div className="max-w-7xl mx-auto px-6">


          {/* COMPACT 3D FULL HD LOGO SHOWCASE - ONLY 1 ROW WITH ROTATING FLIP */}
          <div ref={cardsContainerRef}>
            <FlippingLogoRow clients={FEATURED_PORTFOLIO} />
          </div>

          {/* Sub-footer Reassurance */}
          <div className="mt-14 pt-8 border-t border-[#E2E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
              <span>Independent Natural Resource Coverage &amp; Institutional Reach</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-neutral-400">Showing {FEATURED_PORTFOLIO.length} Partners</span>
              <span className="text-[#B8860B] font-bold">100% Verified Mining Issuers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
