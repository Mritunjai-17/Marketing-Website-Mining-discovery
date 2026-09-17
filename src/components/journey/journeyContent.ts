/**
 * The Mining Discovery story, as content.
 *
 * SOURCING. Everything here is either supplied directly in the brief for this
 * section or traceable to content already approved elsewhere in this
 * repository. Nothing is invented, no metric is rounded up, and no capability
 * is claimed that the portfolio does not.
 *
 * Two deliberate alignments with existing site content:
 *
 *   - The eleven services are grouped using the six categories already defined
 *     in `src/components/services/servicesData.ts`. Every one of the eleven
 *     maps onto exactly one approved category, so the journey and the services
 *     page describe the same company in the same terms rather than two
 *     different taxonomies invented a page apart.
 *
 *   - `AboutOrigin.tsx` notes that its source "names none" of the milestones
 *     between 2022 and now, which is why the About page claims no dated
 *     progression. The 2023 and 2024 milestones below come from the brief for
 *     this section, which supplies them explicitly. If the About page should
 *     carry them too, that is a content decision for its own source, not
 *     something to infer from here.
 */

/* --------------------------------------------------------------- opening */

export const OPENING = {
  eyebrow: "A Global Journey",
  headlineLines: ["Turning", "Possibility", "Into Opportunity"],
  emphasis: "Opportunity",
  supportLines: [
    "Mining has no shortage of stories.",
    "We help those stories reach the people, markets",
    "and opportunities that move mining forward.",
  ],
  cue: "Scroll to begin",
};

/* ------------------------------------------------------------ milestones */

export interface Milestone {
  id: string;
  year: string;
  lines: string[];
  /** Position along the route, in world units. The truck draws level at x / WORLD_LENGTH. */
  worldX: number;
}

/**
 * The roadside year signs.
 *
 * Physical objects beside the carriageway, not captions: each stands at a real
 * distance, is projected like everything else, and lights as the truck closes
 * on it. The road is the company's timeline, so the milestones have to be
 * things you drive past.
 */
export const MILESTONES: Milestone[] = [
  { id: '2022', year: '2022', lines: ['MINING DISCOVERY', 'DIGITAL MINING NEWS'], worldX: 300 },
  { id: '2023', year: '2023', lines: ['NEWSLETTERS · MAGAZINES', 'INTERACTIVE PLATFORMS'], worldX: 620 },
  { id: '2024', year: '2024', lines: ['INVESTOR CAMPAIGNS · BRANDING', 'CONFERENCE MEDIA'], worldX: 1180 },
  { id: '2025', year: '2025', lines: ['FULL-SERVICE DIGITAL MEDIA', 'INVESTOR ENGAGEMENT'], worldX: 1460 },
];

/* -------------------------------------------------------------- services */

export interface ServiceGroup {
  /** Category number, matching servicesData.ts. */
  num: string;
  title: string;
  /** The services in this category, named exactly as the brief names them. */
  services: string[];
  line: string;
  /** Position of the roadside marker that reveals this group, in world units. */
  worldX: number;
}

/**
 * The eleven services, in the six approved categories.
 *
 * Grouped rather than listed because eleven separate reveals inside one
 * chapter gives each about half a screen of scroll — too fast to read, and the
 * brief is explicit that this must not become eleven cards. Six moments, each
 * tied to a marker the truck passes, is a pace a reader can actually follow.
 */
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    num: "01",
    title: "Investor Growth",
    services: ["Investor Campaigns", "Global Outreach"],
    line: "Targeted outreach to capital markets and investors.",
    worldX: 760,
  },
  {
    num: "02",
    title: "Media & Authority",
    services: ["News & Syndication", "Press Office", "Conference Media"],
    line: "Industry-wide coverage across digital and print.",
    worldX: 880,
  },
  {
    num: "03",
    title: "Brand & Digital",
    services: ["Digital Branding", "Multimedia"],
    line: "SEO, PPC, social media and video campaigns.",
    worldX: 1320,
  },
  {
    num: "04",
    title: "Audience Growth",
    services: ["Social Growth & Ads", "Paid Ad Campaigns"],
    line: "Paid campaigns and organic audience growth.",
    worldX: 1600,
  },
  {
    num: "05",
    title: "Executive Visibility",
    services: ["Podcasts & Interviews"],
    line: "Executive spotlights and leadership insights.",
    worldX: 1760,
  },
  {
    num: "06",
    title: "Direct Audience",
    services: ["Newsletter & Emailer"],
    line: "Regular updates for engaged audiences.",
    worldX: 1900,
  },
];

/* --------------------------------------------------------------- results */

export interface Metric {
  id: string;
  value: string;
  label: string;
  worldX: number;
}

/**
 * The campaign results, exactly as the portfolio states them.
 *
 * Four figures, no others, none rounded. The supporting line below is the
 * qualifier the portfolio attaches to them, and it travels with the numbers
 * rather than being dropped — a growth figure without its context is a claim,
 * not a result.
 */
export const METRICS: Metric[] = [
  { id: "leads", value: "120%", label: "Increase in qualified leads", worldX: 1950 },
  { id: "subs", value: "35%", label: "Increase in newsletter subscriptions", worldX: 2010 },
  { id: "social", value: "50%", label: "Increase in social media engagement", worldX: 2070 },
  { id: "substack", value: "12,000+", label: "Substack subscribers", worldX: 2130 },
];

export const METRICS_QUALIFIER = [
  "A recent digital campaign with a mid-sized mining client",
  "delivered measurable growth across leads,",
  "subscriptions and engagement.",
];

/* ------------------------------------------------------------ ecosystem */

/** The four ways the platform connects — chapter 03's destinations. */
export const ECOSYSTEM = ["Media", "Branding", "Investors", "Global Reach"];

/** The five audiences the network reaches — chapter 05. */
export const AUDIENCES = [
  "Mining Companies",
  "Investors",
  "Industry Leaders",
  "Partners",
  "Stakeholders",
];

/* ----------------------------------------------------------------- close */

export const CLOSING = {
  lines: ["Enhance visibility", "Attract capital", "Build stakeholder trust"],
  scale: ["Local", "Regional", "Global"],
};
