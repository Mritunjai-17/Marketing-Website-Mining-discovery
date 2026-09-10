/**
 * The six service categories, and the detail behind each one.
 *
 * One source of truth for both /services experiences on this route: the pinned journey
 * reads the scene-level fields, and the detail overlay reads the same records plus the
 * long-form fields below. Nothing is duplicated between them — the overlay is handed a
 * category's number and looks both halves up from here.
 *
 * CONTENT RULE. Everything in this file has to be traceable to the Mining Discovery
 * portfolio or to copy already approved elsewhere on this site. Where the portfolio has
 * no text for a field, the field is left empty and the overlay omits that section rather
 * than filling it with something plausible. `whatWeDo` is empty for categories 02–06 for
 * exactly that reason — see the note above SERVICE_DETAILS.
 */

export interface ServiceChapter {
  num: string;
  /** The word the index rail shows for this category. */
  short: string;
  /** Two authored lines — the break is a decision, not a wrap. */
  titleLines: [string, string];
  concept: string;
  /** Named exactly as the portfolio names them. */
  services: string[];
  image: string;
  alt: string;
}

/*
 * On the imagery: the approved library holds nine distinct frames — four of the five
 * /stats files are byte-identical duplicates of the /services ones — exactly one of which
 * has a person in it, and none of which show media, conference or branding work. So 04,
 * 05 and 06 have literal matches and 01, 02 and 03 use mining operations standing in for
 * capital, industry presence and creative presence. Alt text describes what is actually in
 * each frame rather than what its filename claims.
 */
export const SERVICE_CHAPTERS: ServiceChapter[] = [
  {
    num: "01",
    short: "Investor",
    titleLines: ["Investor", "Growth"],
    concept: "Turn mining opportunities into investor attention.",
    services: ["Investor Campaigns", "Global Outreach"],
    image: "/services/04-pit.jpg",
    alt: "Aerial view of a large open-pit mine in production",
  },
  {
    num: "02",
    short: "Media",
    titleLines: ["Media &", "Authority"],
    concept: "Build authority across the mining media landscape.",
    services: ["News & Syndication", "Press Office", "Conference Media"],
    image: "/stats/newsletter-briefing.jpg",
    alt: "Open-pit mining operation at sunset",
  },
  {
    num: "03",
    short: "Brand",
    titleLines: ["Brand &", "Digital"],
    concept: "Build a distinctive digital identity for mining companies.",
    services: ["Digital Branding", "Multimedia"],
    image: "/services/02-drill.jpg",
    alt: "Exploration drill rig and crew working in mountain terrain",
  },
  {
    num: "04",
    short: "Audience",
    titleLines: ["Audience", "Growth"],
    concept: "Turn visibility into a growing mining audience.",
    services: ["Social Growth & Ads", "Paid Ad Campaigns"],
    image: "/cards/bg_card_3.jpg",
    alt: "Smartphone held in front of a mining landscape",
  },
  {
    num: "05",
    short: "Executive",
    titleLines: ["Executive", "Visibility"],
    concept: "Put mining leadership at the center of the story.",
    services: ["Podcasts & Interviews"],
    image: "/services/03-assay.jpg",
    alt: "Mining professional logging drill core samples on a core bench",
  },
  {
    num: "06",
    short: "Direct",
    titleLines: ["Direct", "Audience"],
    concept: "Keep audiences connected beyond the campaign.",
    services: ["Newsletter & Emailer"],
    image: "/cards/bg_card_2.jpg",
    alt: "Laptop and printed industry report on a desk at dusk",
  },
];

/** One long-form entry in the overlay's "What we do" list. */
export interface ServiceWork {
  title: string;
  body: string;
}

/** A single figure in a proof block. */
export interface ServiceFigure {
  value: string;
  label: string;
}

export interface ServiceDetail {
  /** The overlay's large heading — the category's descriptor. */
  headline: string;
  /** One short paragraph under the heading. */
  intro: string;
  /** Portfolio copy for the individual services. Empty where the portfolio has none. */
  whatWeDo: ServiceWork[];
  /** Capability names, exactly as the portfolio names them. */
  capabilities: string[];
  /** Benefits the portfolio states for this category. */
  whyItMatters: string[];
  /** Figures, only where the portfolio ties them to this category. */
  proof: ServiceFigure[];
  /** The framing a proof block must carry so it is not read as a guarantee. */
  proofNote: string;
  /** Supporting platform context, where the portfolio supplies it. */
  platform: { title: string; points: string[]; note: string } | null;
}

/*
 * WHAT IS STILL MISSING, and why it is blank rather than written.
 *
 * `whatWeDo` carries the portfolio's own description of each individual service. That
 * copy exists for Investor Campaigns and Global Outreach, so 01 is complete. For 02–06
 * the portfolio has given capability NAMES but no descriptions, so those arrays are empty
 * and the overlay drops the "What we do" section for those categories. Filling them in is
 * a matter of pasting the portfolio's text into these arrays — no code change needed.
 *
 * Every figure below already appears on this site: the four campaign results come from
 * the homepage's Our Impact section and are framed there as the outcome of one targeted
 * digital campaign; the reach figures come from Market Influence & Reach.
 */

const CAMPAIGN_NOTE =
  "Example outcome from a recent targeted digital campaign. Results vary by campaign and are not a guarantee of future performance.";

export const SERVICE_DETAILS: Record<string, ServiceDetail> = {
  "01": {
    headline: "Capital & Investor Reach",
    intro:
      "Mining Discovery provides targeted outreach to capital markets and investors while connecting mining companies with relevant stakeholders globally.",
    whatWeDo: [
      {
        title: "Investor Campaigns",
        body: "Targeted outreach to capital markets and investors. Tailored campaign activity is built to give a mining company visibility among the investor audiences relevant to it, providing access to niche mining investors rather than a general audience.",
      },
      {
        title: "Global Outreach",
        body: "Connecting globally with key stakeholders. Mining companies are connected with the stakeholders that matter to them worldwide.",
      },
    ],
    capabilities: ["Investor Campaigns", "Global Outreach"],
    whyItMatters: [
      "Targeted investor engagement",
      "Global reach",
      "Increased investor leads",
      "Increased engagement",
      "Stronger industry credibility",
    ],
    proof: [
      { value: "+120%", label: "Qualified leads" },
      { value: "+35%", label: "Newsletter subscriptions" },
      { value: "+50%", label: "Social media engagement" },
      { value: "12,000+", label: "Substack subscribers" },
    ],
    proofNote: CAMPAIGN_NOTE,
    platform: {
      title: "For investors, the platform provides",
      points: ["Verified mining updates", "Media insights", "AI-driven analytics"],
      note: "The platform is intended to provide real-time updates, project visibility and investor engagement.",
    },
  },

  "02": {
    headline: "Credibility & Industry Presence",
    intro:
      "Build authority across the mining media landscape through industry coverage, press communication and conference visibility.",
    whatWeDo: [],
    capabilities: [
      "News & Syndication",
      "Press Office",
      "Conference Media",
      "Media Partnership",
      "Magazines",
      "Newsletters",
      "Evening Chatter",
    ],
    whyItMatters: ["Stronger industry credibility"],
    proof: [
      { value: "150,000+", label: "Active monthly audience" },
      { value: "450+", label: "Mining companies featured" },
      { value: "8+", label: "Years industry coverage" },
    ],
    proofNote:
      "Platform reach across Mining Discovery's editorial channels, as published on Market Influence & Reach.",
    platform: null,
  },

  "03": {
    headline: "Identity & Creative Presence",
    intro:
      "Build a distinctive visual and digital identity that makes mining companies easier to recognize, understand and remember.",
    whatWeDo: [],
    capabilities: [
      "Digital Branding",
      "Multimedia",
      "Desktop Platform",
      "Mobile Web",
      "Website Portfolio",
    ],
    whyItMatters: [],
    proof: [],
    proofNote: "",
    platform: null,
  },

  "04": {
    headline: "Reach & Engagement",
    intro:
      "Expand your mining audience through targeted campaigns, social growth and paid digital promotion.",
    whatWeDo: [],
    capabilities: [
      "Social Growth & Ads",
      "Paid Ad Campaigns",
      "Google Ads",
      "YouTube Management",
      "Social Media",
      "Marketing Record",
    ],
    whyItMatters: ["Increased engagement"],
    proof: [
      { value: "+50%", label: "Social media engagement" },
      { value: "+120%", label: "Qualified leads" },
    ],
    proofNote: CAMPAIGN_NOTE,
    platform: null,
  },

  "05": {
    headline: "Leadership & Voice",
    intro:
      "Put leadership at the center of the story through executive conversations, interviews and industry insights.",
    whatWeDo: [],
    capabilities: [
      "Podcasts & Interviews",
      "Executive Spotlights",
      "Leadership Insights",
      "CEO Features",
      "Case Studies",
    ],
    whyItMatters: [],
    proof: [],
    proofNote: "",
    platform: null,
  },

  "06": {
    headline: "Owned Audience",
    intro:
      "Keep your audience connected through direct, consistent and engaging communication.",
    whatWeDo: [],
    capabilities: [
      "Newsletter & Emailer",
      "Newsletters",
      "Evening Chatter",
      "Magazines",
    ],
    whyItMatters: [],
    proof: [
      { value: "12,000+", label: "Substack subscribers" },
      { value: "+35%", label: "Newsletter subscriptions" },
    ],
    proofNote: CAMPAIGN_NOTE,
    platform: null,
  },
};

/* ------------------------------------------------------------------ immersive story */

/**
 * A service's detail is ONE stage with one scroll timeline, not a run of full-screen
 * scenes. A single mining frame persists the whole way through and is re-cropped from
 * state to state; the identity stays on screen; only the supporting information changes
 * inside it. That is why there is no per-state image here and no closing state that
 * re-shows the service name — a second hero at the end reads as the story restarting.
 */
export type StateLayout =
  | "intro"
  | "lower"
  | "centre"
  | "left"
  | "panel"
  | "figures";

export interface ServiceState {
  id: string;
  /** Supporting heading. Deliberately not hero-sized — the service name is the hero. */
  label: string;
  body?: string;
  items?: string[];
  subLabel?: string;
  subItems?: string[];
  figures?: ServiceFigure[];
  note?: string;
  layout: StateLayout;
  /**
   * Where the persistent frame is cropped to, as [x, y, w, h] fractions of the stage.
   * The intro's is measured from the live layout instead, so that first screen stays
   * pixel-identical to the approved one.
   */
  frame: [number, number, number, number];
  /** How far the frame is dimmed behind the type, 0–1. */
  dim: number;
  /** Opacity of the connection motif drawn over the frame, 0–1. */
  network?: number;
}

export interface ServiceStory {
  num: string;
  label: string;
  /** The intro's own copy — rendered exactly as the approved first screen. */
  intro: {
    eyebrow: string;
    titleLines: [string, string];
    statement: string;
    body: string;
    image: string;
    alt: string;
  };
  states: ServiceState[];
}

/*
 * Only 01 exists so far. Every fact is the portfolio's: no investor counts, no
 * geographies, no conversion rates, no platform features beyond the ones it names.
 */
export const SERVICE_STORIES: Record<string, ServiceStory> = {
  "01": {
    num: "01",
    label: "Investor Growth",
    intro: {
      eyebrow: "Capital & Investor Reach",
      titleLines: ["Investor", "Growth"],
      statement: "Turn mining opportunities into investor attention.",
      body: "Mining Discovery provides targeted outreach to capital markets and investors while connecting mining companies with relevant stakeholders globally.",
      image: "/services/04-pit.jpg",
      alt: "Aerial view of a large open-pit mine in production",
    },
    states: [
      {
        id: "intro",
        label: "",
        layout: "intro",
        // Replaced at runtime by the measured intro rect.
        frame: [0.52, 0.26, 0.43, 0.51],
        dim: 0,
      },
      {
        id: "campaigns",
        label: "Investor Campaigns",
        body: "Targeted outreach to capital markets and investors.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        dim: 0.5,
      },
      {
        id: "outreach",
        label: "Global Outreach",
        body: "Connecting globally with key stakeholders.",
        layout: "centre",
        frame: [0, 0, 1, 1],
        dim: 0.72,
        network: 1,
      },
      {
        id: "engagement",
        label: "Targeted Investor Engagement",
        body: "Access to niche mining investors through tailored campaigns.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.8,
        network: 0.25,
      },
      {
        id: "reach",
        label: "Global Reach",
        body: "Connecting mining companies with stakeholders worldwide.",
        layout: "centre",
        frame: [0.05, 0.07, 0.9, 0.86],
        dim: 0.66,
      },
      {
        id: "platform",
        label: "Investor Platform",
        items: ["Real-time updates", "Project visibility", "Investor engagement"],
        subLabel: "For investors",
        subItems: ["Verified mining updates", "Media insights", "AI-driven analytics"],
        layout: "panel",
        frame: [0.55, 0.16, 0.41, 0.68],
        dim: 0.35,
      },
      {
        id: "results",
        label: "Selected Campaign Results",
        figures: [
          { value: "+120%", label: "Qualified leads" },
          { value: "+35%", label: "Newsletter subscriptions" },
          { value: "+50%", label: "Social media engagement" },
          { value: "12,000+", label: "Substack subscribers" },
        ],
        note: "Results from a recent Mining Discovery digital campaign. They describe that campaign, not a guarantee of future performance.",
        layout: "figures",
        frame: [0.04, 0.62, 0.92, 0.34],
        dim: 0.55,
      },
    ],
  },
};
