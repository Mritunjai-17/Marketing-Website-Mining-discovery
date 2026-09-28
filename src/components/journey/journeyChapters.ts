/**
 * The journey's narrative spine.
 *
 * Every scroll range the story depends on lives here, in one table, rather
 * than scattered as magic numbers through the layers that use them. Chapters,
 * billboard creatives, route timings and network stages are declared together
 * because they have to stay in step: a chapter whose words arrive before its
 * visual event, or after it, reads as captioning rather than storytelling.
 *
 * The rule the table enforces is that **every chapter owns a visual event**.
 */

export interface ChapterPage {
  eyebrow: string;
  headlineLines: string[];
  emphasis: string | null;
  supportLines: string[];
  /** Where this page holds. */
  from: number;
  to: number;
}

export interface JourneyChapter {
  id: string;
  /** Position in the indicator, 1-based. */
  index: number;
  label: string;
  from: number;
  to: number;
  /**
   * One or two pages of copy.
   *
   * VISIBILITY carries two: the brief gives it a second statement ("From story
   * to signal") that continues the same beat while the billboard's light runs
   * down the road. Splitting that into its own chapter would have made eight
   * against an indicator the brief specifies as seven.
   */
  pages: ChapterPage[];
  /** The visual event this chapter owns. Documented, and asserted in tests. */
  event: string;
}

export const CHAPTER_COUNT = 7;

/**
 * The opening statement, before the numbered story begins.
 *
 * Holds the frame alone while the truck sets off, then hands over. It shares
 * the text column with the chapters, so the two are never present together.
 */
export const OPENING_PAGE: ChapterPage = {
  eyebrow: "A Global Journey",
  headlineLines: ["Turning Possibility", "Into Opportunity"],
  emphasis: "Opportunity",
  supportLines: [
    "Mining has no shortage of stories.",
    "We help those stories reach the people, markets",
    "and opportunities that move mining forward.",
  ],
  from: 0,
  to: 0.1,
};

export const CHAPTERS: JourneyChapter[] = [
  {
    id: "story",
    index: 1,
    label: "The Story",
    from: 0.1,
    to: 0.22,
    event: "the truck sets off; the 2022 marker passes",
    pages: [
      {
        eyebrow: "The Story",
        headlineLines: ["Every mine has", "a story."],
        emphasis: "story",
        supportLines: [
          "From discoveries and people to technology,",
          "investment and impact.",
          "But a great story only matters when it",
          "reaches beyond the site.",
        ],
        from: 0.1,
        to: 0.22,
      },
    ],
  },
  {
    id: "visibility",
    index: 2,
    label: "Visibility",
    from: 0.22,
    to: 0.44,
    event: "the billboard illuminates and cycles, then its light runs down the road",
    pages: [
      {
        eyebrow: "01 / Visibility",
        headlineLines: ["Being seen is", "the first step."],
        emphasis: "seen",
        supportLines: [
          "We turn mining stories into media that",
          "captures attention across the industry.",
        ],
        from: 0.22,
        to: 0.34,
      },
      {
        eyebrow: "From Story to Signal",
        headlineLines: ["One story can start", "a conversation."],
        emphasis: "conversation",
        supportLines: [
          "We shape the message, build the visibility",
          "and put it where the industry is looking.",
        ],
        from: 0.34,
        to: 0.44,
      },
    ],
  },
  {
    id: "reach",
    index: 3,
    label: "Reach",
    from: 0.44,
    to: 0.58,
    event: "the gold route splits into separate routes",
    pages: [
      {
        eyebrow: "02 / Reach",
        headlineLines: ["Your audience isn't", "in one place."],
        emphasis: "audience",
        supportLines: [
          "Industry leaders. Companies.",
          "Decision-makers. Investors.",
          "Global mining communities.",
        ],
        from: 0.44,
        to: 0.58,
      },
    ],
  },
  {
    id: "connection",
    index: 4,
    label: "Connection",
    from: 0.58,
    to: 0.71,
    event: "the separate routes link into a network",
    pages: [
      {
        eyebrow: "03 / Connection",
        headlineLines: ["Attention is only", "the beginning."],
        emphasis: "beginning",
        supportLines: [
          "The real value comes when the right people",
          "connect with the right opportunity.",
        ],
        from: 0.58,
        to: 0.71,
      },
    ],
  },
  {
    id: "opportunity",
    index: 5,
    label: "Opportunity",
    from: 0.71,
    to: 0.81,
    event: "the network converges on one gold point",
    pages: [
      {
        eyebrow: "04 / Opportunity",
        headlineLines: ["Visibility creates possibility.", "Connection creates opportunity."],
        emphasis: "opportunity",
        supportLines: [
          "We help mining companies move from",
          "being discovered to being remembered.",
        ],
        from: 0.71,
        to: 0.81,
      },
    ],
  },
  {
    id: "impact",
    index: 6,
    label: "Impact",
    from: 0.81,
    to: 0.91,
    event: "four result markers pass, one figure each",
    pages: [
      {
        eyebrow: "05 / Impact",
        headlineLines: ["Visibility that can", "be measured."],
        emphasis: "measured",
        supportLines: [],
        from: 0.81,
        to: 0.91,
      },
    ],
  },
  {
    id: "global",
    index: 7,
    label: "Global Network",
    from: 0.91,
    to: 1,
    event: "the network expands outward",
    pages: [
      {
        eyebrow: "The Global Network",
        headlineLines: ["From visibility", "to opportunity."],
        emphasis: "opportunity",
        supportLines: [
          "Mining Discovery has evolved from a mining",
          "news platform into a full-service digital media",
          "and investor-engagement agency.",
        ],
        from: 0.91,
        to: 1,
      },
    ],
  },
];

/** Every page in the journey, opening first, in scroll order. */
export const PAGES: ChapterPage[] = [OPENING_PAGE, ...CHAPTERS.flatMap((c) => c.pages)];

/** The chapter that owns a given progress value. */
export function chapterAt(progress: number): JourneyChapter {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (progress >= CHAPTERS[i].from) return CHAPTERS[i];
  }
  return CHAPTERS[0];
}

/**
 * How far a page's copy bleeds past its own range.
 *
 * Pages must overlap — a hard cut between two headlines reads as a slideshow —
 * so each starts arriving before its range opens and is still leaving after it
 * closes. Small, because two full headlines at once is a collision, not a
 * crossfade.
 */
export const PAGE_BLEED = 0.012;

/* -------------------------------------------------------------- billboard */

export interface BillboardMessage {
  id: string;
  lines: string[];
  /** Fraction of the panel width each line is forced to occupy, via textLength. */
  lineWidths: number[];
  caption: string | null;
  hold: { from: number; to: number };
}

/**
 * Three creatives, cycling as the truck closes on the sign.
 *
 * The publisher, the story, the audience — resolving on THE INDUSTRY as the
 * truck draws level with the panel.
 *
 * `lineWidths` is a correctness guard, not styling: SVG text neither wraps nor
 * shrinks, and the display serif may not have loaded when the panel first
 * paints, so each line is pinned to a fraction of the panel and the fit stops
 * depending on which font resolves.
 */
export const BILLBOARD_MESSAGES: BillboardMessage[] = [
  {
    id: "brand",
    lines: ["MINING", "DISCOVERY"],
    lineWidths: [0.5, 0.76],
    caption: "GLOBAL MINING MEDIA",
    hold: { from: 0, to: 0.3 },
  },
  {
    id: "your-story",
    lines: ["YOUR", "STORY"],
    lineWidths: [0.42, 0.5],
    caption: null,
    hold: { from: 0.3, to: 0.35 },
  },
  {
    id: "the-industry",
    lines: ["THE", "INDUSTRY"],
    lineWidths: [0.32, 0.72],
    caption: null,
    hold: { from: 0.35, to: 1 },
  },
];

export const BILLBOARD_CROSSFADE = 0.035;

/** The panel comes up from its resting glow as its chapter opens. */
export const BILLBOARD_ACTIVATION = { from: 0.22, to: 0.3 };

/**
 * The signal that runs down the road after the billboard.
 *
 * Chapter 02's second page: the sign's light leaves it and travels right along
 * the carriageway as a thin gold line. This is the moment the physical journey
 * starts becoming a digital one, so it is the seed the routes grow from rather
 * than a separate effect.
 */
export const SIGNAL_RUN = { from: 0.42, to: 0.56 };

/* ----------------------------------------------------------------- reach */

export interface JourneyRoute {
  id: string;
  /** What this route reaches. Rendered as a small label at its node. */
  audience: string;
  /** Where it leaves the road, in world units. */
  originX: number;
  /** Horizontal reach beyond its origin, in world units. */
  runX: number;
  /** Vertical rise, as a fraction of stage height above the road. */
  riseY: number;
  reveal: { from: number; to: number };
  /** Where its node settles once the network becomes a diagram. */
  anchor: { x: number; y: number };
}

/**
 * Five routes, leaving the road and rising into the upper right.
 *
 * They rise rather than fan symmetrically because of where the quiet space is:
 * the text column owns the left third and the truck runs low across the
 * middle, so above and right of the road is the only region a network can
 * occupy without covering either. The composition dictates the geometry.
 */
export const ROUTES: JourneyRoute[] = [
  { id: "leaders", audience: "Industry Leaders", originX: 1240, runX: 150, riseY: 0.3, reveal: { from: 0.44, to: 0.49 }, anchor: { x: 0.5, y: 0.2 } },
  { id: "companies", audience: "Companies", originX: 1290, runX: 200, riseY: 0.2, reveal: { from: 0.46, to: 0.51 }, anchor: { x: 0.67, y: 0.31 } },
  { id: "deciders", audience: "Decision-makers", originX: 1340, runX: 180, riseY: 0.41, reveal: { from: 0.48, to: 0.53 }, anchor: { x: 0.58, y: 0.1 } },
  { id: "investors", audience: "Investors", originX: 1390, runX: 240, riseY: 0.26, reveal: { from: 0.5, to: 0.55 }, anchor: { x: 0.84, y: 0.25 } },
  { id: "global", audience: "Global Mining", originX: 1440, runX: 260, riseY: 0.37, reveal: { from: 0.52, to: 0.57 }, anchor: { x: 0.77, y: 0.12 } },
];

/** The physical surface gives way to a gold line along each route. */
export const DIGITISATION = { from: 0.48, to: 0.62 };
export const CROSSOVER = { physical: 0.7, digital: 0.16 };

/* ------------------------------------------------------------ connection */

/**
 * The network settling out of the landscape.
 *
 * This is what lets the story continue after the junctions have slid off the
 * left of the frame. Each node's position blends from where it physically sits
 * to a composed position in the frame: landscape early, diagram late, one
 * continuous blend with no cut between them.
 */
export const NETWORK_SETTLE = { from: 0.56, to: 0.7 };
export const NETWORK_CONNECT = { from: 0.6, to: 0.76 };
export const NETWORK_CONVERGE = { from: 0.72, to: 0.82 };
export const NETWORK_EXPAND = { from: 0.92, to: 1 };

/** How far the outer nodes travel toward the centre. Not all the way. */
export const CONVERGE_PULL = 0.38;

/** Where the opportunity point sits, as a fraction of the stage. */
export const OPPORTUNITY_ANCHOR = { x: 0.66, y: 0.2 };
