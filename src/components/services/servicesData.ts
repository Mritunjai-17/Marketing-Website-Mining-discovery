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
  /** A short, bold value proposition — one line, 6–10 words. */
  valueStatement: string;
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
    valueStatement: "Capital connections, built for mining.",
    concept: "Turn mining opportunities into investor attention through targeted outreach and global stakeholder connections.",
    services: ["Investor Campaigns", "Global Outreach"],
    image: "/services/04-pit.jpg",
    alt: "Aerial view of a large open-pit mine in production",
  },
  {
    num: "02",
    short: "Media",
    titleLines: ["Media &", "Authority"],
    valueStatement: "Your story placed in the right rooms.",
    concept: "Build authority across the mining media landscape through industry coverage, press communication and conference visibility.",
    services: ["News & Syndication", "Press Office", "Conference Media"],
    image: "/stats/newsletter-briefing.jpg",
    alt: "Open-pit mining operation at sunset",
  },
  {
    num: "03",
    short: "Brand",
    titleLines: ["Brand &", "Digital"],
    valueStatement: "Identity that makes you recognisable and remembered.",
    concept: "Build a distinctive visual and digital identity that makes mining companies easier to recognise, understand and remember.",
    services: ["Digital Branding", "Multimedia"],
    image: "/services/02-drill.jpg",
    alt: "Exploration drill rig and crew working in mountain terrain",
  },
  {
    num: "04",
    short: "Audience",
    titleLines: ["Audience", "Growth"],
    valueStatement: "Expand your reach. Own your audience.",
    concept: "Grow your mining audience through targeted campaigns, social growth and paid digital promotion.",
    services: ["Social Growth & Ads", "Paid Ad Campaigns"],
    image: "/cards/bg_card_3.jpg",
    alt: "Smartphone held in front of a mining landscape",
  },
  {
    num: "05",
    short: "Executive",
    titleLines: ["Executive", "Visibility"],
    valueStatement: "Leadership voices that build industry credibility.",
    concept: "Put mining leadership at the centre of the story through executive conversations, interviews and industry insights.",
    services: ["Podcasts & Interviews", "Thought Leadership", "Executive Profiling"],
    image: "/services/03-assay.jpg",
    alt: "Mining professional logging drill core samples on a core bench",
  },
  {
    num: "06",
    short: "Direct",
    titleLines: ["Direct", "Audience"],
    valueStatement: "Stay connected through direct, consistent communication.",
    concept: "Keep your audience engaged through direct and regular communication that extends beyond the campaign.",
    services: ["Newsletter & Emailer", "Subscriber Campaigns"],
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
      "Mining companies operate in a highly technical industry, but strong digital communication starts with making that complexity understandable, recognizable and visually compelling.",
    whatWeDo: [
      {
        title: "Digital Branding",
        body: "A strong digital presence begins with a clear identity. We help mining companies communicate who they are through focused digital branding that brings consistency to their visual language, communication and online presence.",
      },
      {
        title: "Multimedia",
        body: "Mining stories are often complex. Multimedia gives companies a more engaging way to communicate projects, people and developments through visual storytelling designed for today's digital audience.",
      },
      {
        title: "Visual Communication",
        body: "From project stories to company communication, we help transform technical information into clear and compelling digital content that can connect with industry audiences more effectively.",
      },
      {
        title: "Digital Presence",
        body: "Your digital presence is often the first point of contact with investors, partners and industry stakeholders. We help create a more consistent and professional presence across the digital touchpoints where your audience discovers and engages with your company.",
      },
    ],
    capabilities: [
      "Digital Branding",
      "Multimedia",
      "Visual Communication",
      "Digital Presence",
    ],
    whyItMatters: [
      "Consistent visual identity",
      "Mining-focused storytelling",
      "Stronger digital presence",
      "Brand recognition",
    ],
    proof: [],
    proofNote: "",
    platform: null,
  },

  "04": {
    headline: "Reach & Amplification",
    intro:
      "Great mining stories only create impact when they reach the right audience.\n\nMining Discovery combines social growth and paid digital campaigns to amplify mining-focused content, expand reach and create stronger connections with the audiences that matter to companies, projects and industry leaders.",
    whatWeDo: [
      {
        title: "Social Growth",
        body: "Social platforms provide an opportunity to keep your company, projects and people part of the industry conversation. We help develop and amplify mining-focused content designed to build visibility and encourage continued audience engagement.",
      },
      {
        title: "Paid Ad Campaigns",
        body: "Paid campaigns can extend the reach of content beyond organic discovery. We use targeted digital advertising to help mining companies amplify selected campaigns, announcements and stories toward relevant audiences.",
      },
      {
        title: "Audience Amplification",
        body: "From project developments to company announcements and industry insights, we help turn individual pieces of content into opportunities for wider digital visibility across relevant channels.",
      },
      {
        title: "Digital Campaigns",
        body: "Effective audience growth requires more than posting consistently. We bring content, digital distribution and campaign activity together to create a more focused approach to reaching and engaging mining audiences.",
      },
    ],
    capabilities: [
      "Social Growth & Ads",
      "Paid Ad Campaigns",
      "Audience Amplification",
      "Digital Campaigns",
    ],
    whyItMatters: [
      "Build visibility & audience engagement",
      "Targeted digital advertising",
      "Wider digital visibility across channels",
      "Focused approach to reaching mining audiences",
    ],
    proof: [],
    proofNote: "",
    platform: null,
  },

  "05": {
    headline: "Leadership & Industry Voice",
    intro:
      "Mining is driven by projects, technology and capital — but it is also driven by the people leading the industry.\n\nMining Discovery creates opportunities for executives and industry leaders to share their perspectives through podcasts, interviews, features and editorial storytelling designed to connect leadership voices with the wider mining community.",
    whatWeDo: [
      {
        title: "Podcasts & Interviews",
        body: "Podcasts and interviews create a direct way for mining executives to share their experience, perspectives and vision. We help turn conversations with industry leaders into engaging content that can connect with a relevant mining audience.",
      },
      {
        title: "Executive Spotlights",
        body: "Mining companies are built by people. Executive-focused storytelling gives audiences an opportunity to understand the leadership, expertise and thinking behind the companies and projects shaping the industry.",
      },
      {
        title: "Leadership Insights",
        body: "Industry leaders have perspectives that can add context to complex mining developments. We help communicate those insights through focused editorial and multimedia content that contributes to meaningful industry conversations.",
      },
      {
        title: "CEO Features",
        body: "Executive features can strengthen the human side of a mining company's story. By highlighting leadership perspectives, achievements and industry experience, companies can create a more complete and recognizable presence across their digital and media channels.",
      },
    ],
    capabilities: [
      "Podcasts & Interviews",
      "Executive Spotlights",
      "Leadership Insights",
      "CEO Features",
    ],
    whyItMatters: [
      "Direct platform for leadership voices",
      "Humanize company & project milestones",
      "Executive-focused editorial & multimedia",
      "Strengthen digital presence with CEO features",
    ],
    proof: [],
    proofNote: "",
    platform: null,
  },

  "06": {
    headline: "Owned Communication",
    intro:
      "Digital visibility can bring an audience to your story, but lasting engagement comes from creating a direct connection.\n\nMining Discovery helps mining companies communicate consistently with their audience through newsletters and email campaigns designed to keep important stories, company updates and industry insights within reach.",
    whatWeDo: [
      {
        title: "Newsletters",
        body: "Newsletters provide a direct channel for sharing company developments, industry insights, project updates and relevant mining stories. We help structure and communicate content so your audience has a reason to stay connected.",
      },
      {
        title: "Email Communication",
        body: "Email allows important information to reach an audience without depending entirely on social or external platforms. We help companies use focused email communication to distribute relevant updates and maintain consistent contact with their audience.",
      },
      {
        title: "Regular Updates",
        body: "A strong communication strategy continues beyond individual announcements. Regular updates create opportunities to keep audiences informed about company developments, projects, insights and industry activity over time.",
      },
      {
        title: "Audience Retention",
        body: "Growing an audience is only valuable when people have a reason to remain connected. Consistent and relevant communication helps companies maintain relationships with the people who choose to follow their story.",
      },
    ],
    capabilities: [
      "Newsletter & Emailer",
      "Email Communication",
      "Regular Updates",
      "Audience Retention",
    ],
    whyItMatters: [
      "Direct owned communication channel",
      "Consistent audience engagement over time",
      "Independent from social media algorithms",
      "Long-term audience relationship building",
    ],
    proof: [
      { value: "12,000+", label: "Substack subscribers across Mining Discovery network" },
    ],
    proofNote: "",
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
  | "figures"
  /** The last state: one statement, centred, carrying the way back out. */
  | "closing";

export interface ServiceState {
  id: string;
  /** Supporting heading. Deliberately not hero-sized — the service name is the hero. */
  label: string;
  /**
   * The statement under the heading: what this chapter does for the reader, in one line.
   * Set above the body and below the heading, so a state reads heading → claim → detail
   * rather than heading → paragraph. Optional, because not every state has one.
   */
  lead?: string;
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
  /**
   * The same crop for windows under 1024px, where one is needed.
   *
   * A crop that leaves a column of clear stage beside it is a wide-screen idea: on a
   * phone there is no width to split, so the type runs the full measure and a side plate
   * ends up underneath it. A state that reads as picture-beside-type on a laptop becomes
   * picture-above-type here, and this is where it says so. Optional — most crops are
   * fractions of the stage and need no second version.
   */
  frameNarrow?: [number, number, number, number];
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
    /** One entry per paragraph. The opening is two, and they are two ideas. */
    body: string[];
    image: string;
    alt: string;
  };
  states: ServiceState[];
}

/*
 * 01 and 02 exist so far. A category without an entry here falls through to
 * ServiceDetailOverlay, which is why adding one is a data change and not a code change.
 *
 * WHAT IS DELIBERATELY NOT HERE. No figures, in either story. Earlier
 * versions of this story carried both: four campaign percentages and a Substack count,
 * plus an "Investor Platform" state. Those numbers are real, but they belong to the
 * company — they are published on the homepage's Our Impact and on Market Influence &
 * Reach as the outcome of one targeted digital campaign and as platform-wide reach.
 * Restating them inside Investor Growth turns general company results into results for
 * that one service, which is a claim the portfolio does not make. The approved copy for
 * both of these services has no statistics, so neither story has any.
 *
 * The same applies to 02 and the reach figures on Market Influence & Reach — the monthly
 * audience, the companies featured, the years of coverage. Those describe the Mining
 * Discovery platform, not what a client's own media presence will do, and this story does
 * not repeat them. It also names no publications, no conferences, no partnerships and no
 * coverage volumes: the portfolio supplies News & Syndication, Press Office and
 * Conference Media as service concepts, and that is the whole of what is claimed here.
 *
 * Everything below is the approved copy for each service, verbatim.
 */
export const SERVICE_STORIES: Record<string, ServiceStory> = {
  "01": {
    num: "01",
    label: "Investor Growth",
    intro: {
      eyebrow: "Capital & Investor Reach",
      titleLines: ["Investor", "Growth"],
      statement: "Turn mining opportunities into investor attention.",
      body: [
        "Mining projects need more than visibility — they need to reach the right investors, stakeholders and decision-makers.",
        "Mining Discovery combines investor-focused campaigns, mining media and global outreach to help companies communicate their opportunities to a relevant industry audience and build meaningful connections around their projects.",
      ],
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
      /*
       * The four services, then the close. Each one gets its own crop of the same
       * photograph and its own composition, so the reader moves through a changing
       * environment rather than a stack of identically-set paragraphs: a wide plate with
       * the type on its floor, then full bleed with the connection motif over it, then
       * full bleed with the type held left, then a tall plate on the right, then the
       * environment closing in around one statement.
       */
      {
        id: "campaigns",
        label: "Investor Campaigns",
        lead: "Put your mining project in front of the right audience.",
        body: "We develop targeted investor campaigns designed to communicate the value, opportunity and story behind mining projects. By combining industry-focused content, digital distribution and strategic outreach, campaigns are built to attract attention from relevant investors and stakeholders.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        // 0.62, not the 0.5 this state used to carry: its body is now a paragraph rather
        // than a single line, so it reaches down into the brightest, busiest part of the
        // pit instead of clearing it.
        dim: 0.62,
      },
      {
        id: "outreach",
        label: "Global Outreach",
        lead: "Take your project beyond its immediate market.",
        body: "Mining is a global industry. Our global outreach approach connects mining companies with audiences across markets, helping projects gain visibility among international stakeholders, investors and industry participants.",
        layout: "centre",
        frame: [0, 0, 1, 1],
        dim: 0.72,
        network: 1,
      },
      {
        id: "engagement",
        label: "Targeted Investor Engagement",
        lead: "Reach the people who matter to your growth.",
        body: "Rather than relying on broad exposure, we focus on reaching niche mining audiences through tailored campaigns and industry-specific communication. The goal is to create relevant attention around your project and open the door to meaningful investor conversations.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.8,
        network: 0.25,
      },
      {
        id: "storytelling",
        label: "Project Storytelling",
        lead: "Make the opportunity easier to understand.",
        body: "A strong mining opportunity needs a clear story. We translate project information into focused digital communication that can be distributed across media, campaigns and investor-facing channels.",
        layout: "panel",
        frame: [0.53, 0.13, 0.43, 0.74],
        frameNarrow: [0.06, 0.04, 0.88, 0.44],
        dim: 0.34,
      },
      {
        id: "close",
        label: "From project visibility to investor connection.",
        body: "We help mining companies turn their opportunities into stories that reach the right audience, across the right channels, at the right time.",
        layout: "closing",
        frame: [0, 0, 1, 1],
        dim: 0.82,
      },
    ],
  },

  "02": {
    num: "02",
    label: "Media & Authority",
    intro: {
      eyebrow: "Credibility & Industry Presence",
      titleLines: ["Media &", "Authority"],
      statement: "Build authority across the mining media landscape.",
      body: [
        "In mining, credibility is built through consistent presence, relevant communication and being visible where the industry is paying attention.",
        "Mining Discovery helps companies strengthen their industry presence through mining-focused news coverage, press communication and conference media — creating opportunities to put projects, companies and leadership in front of a relevant global audience.",
      ],
      /*
       * NOT the card's own photograph, which is the one place this story departs from
       * how 01 was built. Worth explaining, because it looks like an inconsistency.
       *
       * 02's card carries /stats/newsletter-briefing.jpg. Despite the filename, and
       * despite the alt text on the card calling it an open-pit mine at sunset, that file
       * is a photograph of an open magazine: a masthead reading GLOBAL VENTURE, a feature
       * headline, and a line chart captioned "Clean Energy Returns (2018-2023)". None of
       * it is real. As a small plate on a card it passes as texture, but this story would
       * blow it up to fill the frame for the whole read — an invented publication and an
       * invented chart standing as the entire visual argument for a service whose whole
       * subject is media credibility. That is the one image in the library that must not
       * be used here.
       *
       * So the environment is a survey rig instead: an actual mining scene, no logos, no
       * embedded text, no charts, and the only frame in the approved library not already
       * spoken for by another category. The cost is that the opening morph crosses from
       * the card's plate into a different picture rather than the same one. That is a
       * moment; the alternative is a fabricated masthead for the length of the story.
       *
       * The card itself is untouched — its image, its alt text and its place in the
       * journey are exactly as they were.
       */
      image: "/services/01-survey.jpg",
      alt: "Drill rig and operator at work on an exploration site in open terrain",
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
      /*
       * News, then press, then conference, then the three of them compounding into a
       * presence — the argument the brief asks the visuals to carry.
       *
       * The compositions run in a different order from 01's on purpose. Both stories use
       * the same five-state system, and if they also moved through it in the same
       * sequence the second detail would read as the first one with the words swapped.
       * So 02 goes plate-floor, side-plate, full-bleed-left, tight-inset, close, where 01
       * goes plate-floor, full-bleed-centre, full-bleed-left, side-plate, close.
       */
      {
        // The dims across this story run higher than 01's. Its photograph is a bright
        // one — pale ground, open sky — where 01's pit is dark, so the same veil leaves
        // body copy washed out rather than seated.
        id: "news",
        label: "News & Syndication",
        lead: "Turn industry stories into industry visibility.",
        body: "We help mining companies communicate important developments through focused news and industry coverage. From company updates to project developments, relevant stories can be positioned for visibility across the mining media ecosystem.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        dim: 0.7,
      },
      {
        id: "press",
        label: "Press Office",
        lead: "Keep your company part of the conversation.",
        body: "Effective communication does not stop at publishing a story. Our press-focused approach helps mining companies communicate announcements, developments and company milestones with greater consistency and clarity across relevant media channels.",
        layout: "panel",
        frame: [0.53, 0.13, 0.43, 0.74],
        frameNarrow: [0.06, 0.04, 0.88, 0.44],
        dim: 0.34,
      },
      {
        id: "conference",
        label: "Conference Media",
        lead: "Bring your company into the industry spotlight.",
        body: "Mining conferences bring together companies, investors, executives and industry stakeholders. Conference media creates opportunities to capture that environment through interviews, coverage and digital storytelling — extending the value of industry events beyond the venue.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.82,
      },
      {
        /*
         * The connection motif belongs here and nowhere else in this story: this is the
         * state about the three services compounding across an ecosystem, which is the
         * one thing on the page a web of nodes actually describes.
         */
        id: "presence",
        label: "Industry Presence",
        lead: "Be present where the mining industry is paying attention.",
        body: "A strong media presence compounds over time. By combining news, press communication and conference visibility, Mining Discovery helps companies create a more consistent presence across the mining ecosystem.",
        layout: "centre",
        frame: [0.11, 0.11, 0.78, 0.78],
        dim: 0.8,
        network: 0.85,
      },
      {
        id: "close",
        label: "Be present where the industry is paying attention.",
        body: "Build credibility. Strengthen visibility. Keep your company part of the global mining conversation.",
        layout: "closing",
        frame: [0, 0, 1, 1],
        dim: 0.86,
      },
    ],
  },

  "03": {
    num: "03",
    label: "Brand & Digital",
    intro: {
      eyebrow: "IDENTITY & CREATIVE PRESENCE",
      titleLines: ["Brand &", "Digital"],
      statement: "BUILD A DISTINCTIVE DIGITAL IDENTITY FOR MINING.",
      body: [
        "Mining companies operate in a highly technical industry, but strong digital communication starts with making that complexity understandable, recognizable and visually compelling.",
        "Mining Discovery combines digital branding and multimedia to help mining companies build a stronger visual presence and communicate their projects, expertise and story across digital channels.",
      ],
      image: "/services/02-drill.jpg",
      alt: "Exploration drill rig and crew working in mountain terrain",
    },
    states: [
      {
        id: "intro",
        label: "",
        layout: "intro",
        frame: [0.52, 0.26, 0.43, 0.51],
        dim: 0,
      },
      {
        id: "branding",
        label: "DIGITAL BRANDING",
        lead: "CREATE AN IDENTITY PEOPLE CAN RECOGNIZE.",
        body: "A strong digital presence begins with a clear identity. We help mining companies communicate who they are through focused digital branding that brings consistency to their visual language, communication and online presence.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        dim: 0.65,
      },
      {
        id: "multimedia",
        label: "MULTIMEDIA",
        lead: "TURN MINING STORIES INTO VISUAL EXPERIENCES.",
        body: "Mining stories are often complex. Multimedia gives companies a more engaging way to communicate projects, people and developments through visual storytelling designed for today's digital audience.",
        layout: "panel",
        frame: [0.53, 0.13, 0.43, 0.74],
        frameNarrow: [0.06, 0.04, 0.88, 0.44],
        dim: 0.38,
      },
      {
        id: "visual-communication",
        label: "VISUAL COMMUNICATION",
        lead: "MAKE COMPLEX INFORMATION EASIER TO UNDERSTAND.",
        body: "From project stories to company communication, we help transform technical information into clear and compelling digital content that can connect with industry audiences more effectively.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.78,
      },
      {
        id: "digital-presence",
        label: "DIGITAL PRESENCE",
        lead: "MAKE YOUR COMPANY LOOK AS STRONG ONLINE AS IT IS IN THE INDUSTRY.",
        body: "Your digital presence is often the first point of contact with investors, partners and industry stakeholders. We help create a more consistent and professional presence across the digital touchpoints where your audience discovers and engages with your company.",
        layout: "centre",
        frame: [0.11, 0.11, 0.78, 0.78],
        dim: 0.75,
        network: 0.7,
      },
      {
        id: "close",
        label: "FROM TECHNICAL STORY TO RECOGNIZABLE BRAND.",
        body: "Build a digital identity that communicates your expertise, strengthens your presence and gives your mining story a distinctive place in the market.",
        layout: "closing",
        frame: [0, 0, 1, 1],
        dim: 0.84,
      },
    ],
  },

  "04": {
    num: "04",
    label: "Audience Growth",
    intro: {
      eyebrow: "REACH & AMPLIFICATION",
      titleLines: ["Audience", "Growth"],
      statement: "TURN CONTENT INTO AUDIENCE GROWTH.",
      body: [
        "Great mining stories only create impact when they reach the right audience.",
        "Mining Discovery combines social growth and paid digital campaigns to amplify mining-focused content, expand reach and create stronger connections with the audiences that matter to companies, projects and industry leaders.",
      ],
      image: "/cards/bg_card_3.jpg",
      alt: "Smartphone held in front of a mining landscape",
    },
    states: [
      {
        id: "intro",
        label: "",
        layout: "intro",
        frame: [0.52, 0.26, 0.43, 0.51],
        dim: 0,
      },
      {
        id: "social-growth",
        label: "SOCIAL GROWTH",
        lead: "BUILD AN AUDIENCE AROUND YOUR MINING STORY.",
        body: "Social platforms provide an opportunity to keep your company, projects and people part of the industry conversation. We help develop and amplify mining-focused content designed to build visibility and encourage continued audience engagement.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        dim: 0.65,
      },
      {
        id: "paid-campaigns",
        label: "PAID AD CAMPAIGNS",
        lead: "PUT IMPORTANT STORIES IN FRONT OF THE RIGHT AUDIENCE.",
        body: "Paid campaigns can extend the reach of content beyond organic discovery. We use targeted digital advertising to help mining companies amplify selected campaigns, announcements and stories toward relevant audiences.",
        layout: "panel",
        frame: [0.53, 0.13, 0.43, 0.74],
        frameNarrow: [0.06, 0.04, 0.88, 0.44],
        dim: 0.38,
      },
      {
        id: "amplification",
        label: "AUDIENCE AMPLIFICATION",
        lead: "EXTEND THE REACH OF EVERY IMPORTANT STORY.",
        body: "From project developments to company announcements and industry insights, we help turn individual pieces of content into opportunities for wider digital visibility across relevant channels.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.78,
      },
      {
        id: "digital-campaigns",
        label: "DIGITAL CAMPAIGNS",
        lead: "CONNECT CONTENT, CHANNELS AND AUDIENCE.",
        body: "Effective audience growth requires more than posting consistently. We bring content, digital distribution and campaign activity together to create a more focused approach to reaching and engaging mining audiences.",
        layout: "centre",
        frame: [0.11, 0.11, 0.78, 0.78],
        dim: 0.75,
        network: 0.75,
      },
      {
        id: "close",
        label: "CREATE THE STORY. AMPLIFY THE REACH. GROW THE AUDIENCE.",
        body: "We help mining companies move beyond simply publishing content — building digital visibility around the stories, projects and people they want the industry to notice.",
        layout: "closing",
        frame: [0, 0, 1, 1],
        dim: 0.85,
      },
    ],
  },

  "05": {
    num: "05",
    label: "Executive Visibility",
    intro: {
      eyebrow: "LEADERSHIP & INDUSTRY VOICE",
      titleLines: ["Executive", "Visibility"],
      statement: "PUT MINING LEADERS AT THE CENTER OF THE CONVERSATION.",
      body: [
        "Mining is driven by projects, technology and capital — but it is also driven by the people leading the industry.",
        "Mining Discovery creates opportunities for executives and industry leaders to share their perspectives through podcasts, interviews, features and editorial storytelling designed to connect leadership voices with the wider mining community.",
      ],
      image: "/services/03-assay.jpg",
      alt: "Mining professional logging drill core samples on a core bench",
    },
    states: [
      {
        id: "intro",
        label: "",
        layout: "intro",
        frame: [0.52, 0.26, 0.43, 0.51],
        dim: 0,
      },
      {
        id: "podcasts-interviews",
        label: "PODCASTS & INTERVIEWS",
        lead: "GIVE INDUSTRY LEADERS A PLATFORM TO BE HEARD.",
        body: "Podcasts and interviews create a direct way for mining executives to share their experience, perspectives and vision. We help turn conversations with industry leaders into engaging content that can connect with a relevant mining audience.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        dim: 0.65,
      },
      {
        id: "executive-spotlights",
        label: "EXECUTIVE SPOTLIGHTS",
        lead: "PUT THE PEOPLE BEHIND THE PROJECT IN FOCUS.",
        body: "Mining companies are built by people. Executive-focused storytelling gives audiences an opportunity to understand the leadership, expertise and thinking behind the companies and projects shaping the industry.",
        layout: "panel",
        frame: [0.53, 0.13, 0.43, 0.74],
        frameNarrow: [0.06, 0.04, 0.88, 0.44],
        dim: 0.38,
      },
      {
        id: "leadership-insights",
        label: "LEADERSHIP INSIGHTS",
        lead: "TURN EXPERIENCE INTO INDUSTRY CONVERSATION.",
        body: "Industry leaders have perspectives that can add context to complex mining developments. We help communicate those insights through focused editorial and multimedia content that contributes to meaningful industry conversations.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.78,
      },
      {
        id: "ceo-features",
        label: "CEO FEATURES",
        lead: "MAKE LEADERSHIP PART OF YOUR COMPANY'S DIGITAL PRESENCE.",
        body: "Executive features can strengthen the human side of a mining company's story. By highlighting leadership perspectives, achievements and industry experience, companies can create a more complete and recognizable presence across their digital and media channels.",
        layout: "centre",
        frame: [0.11, 0.11, 0.78, 0.78],
        dim: 0.75,
        network: 0.7,
      },
      {
        id: "close",
        label: "MAKE THE PEOPLE BEHIND THE PROJECT PART OF THE STORY.",
        body: "Projects create opportunities. Leaders give them direction. We help bring those voices into the global mining conversation.",
        layout: "closing",
        frame: [0, 0, 1, 1],
        dim: 0.84,
      },
    ],
  },

  "06": {
    num: "06",
    label: "Direct Audience",
    intro: {
      eyebrow: "OWNED COMMUNICATION",
      titleLines: ["Direct", "Audience"],
      statement: "BUILD A DIRECT CONNECTION WITH YOUR AUDIENCE.",
      body: [
        "Digital visibility can bring an audience to your story, but lasting engagement comes from creating a direct connection.",
        "Mining Discovery helps mining companies communicate consistently with their audience through newsletters and email campaigns designed to keep important stories, company updates and industry insights within reach.",
      ],
      image: "/cards/bg_card_2.jpg",
      alt: "Laptop and printed industry report on a desk at dusk",
    },
    states: [
      {
        id: "intro",
        label: "",
        layout: "intro",
        frame: [0.52, 0.26, 0.43, 0.51],
        dim: 0,
      },
      {
        id: "newsletters",
        label: "NEWSLETTERS",
        lead: "KEEP YOUR AUDIENCE CONNECTED TO YOUR STORY.",
        body: "Newsletters provide a direct channel for sharing company developments, industry insights, project updates and relevant mining stories. We help structure and communicate content so your audience has a reason to stay connected.",
        layout: "lower",
        frame: [0.06, 0.1, 0.88, 0.8],
        dim: 0.65,
      },
      {
        id: "email-communication",
        label: "EMAIL COMMUNICATION",
        lead: "DELIVER THE RIGHT MESSAGE DIRECTLY.",
        body: "Email allows important information to reach an audience without depending entirely on social or external platforms. We help companies use focused email communication to distribute relevant updates and maintain consistent contact with their audience.",
        layout: "panel",
        frame: [0.53, 0.13, 0.43, 0.74],
        frameNarrow: [0.06, 0.04, 0.88, 0.44],
        dim: 0.38,
      },
      {
        id: "regular-updates",
        label: "REGULAR UPDATES",
        lead: "TURN INDIVIDUAL STORIES INTO AN ONGOING CONVERSATION.",
        body: "A strong communication strategy continues beyond individual announcements. Regular updates create opportunities to keep audiences informed about company developments, projects, insights and industry activity over time.",
        layout: "left",
        frame: [0, 0, 1, 1],
        dim: 0.78,
      },
      {
        id: "audience-retention",
        label: "AUDIENCE RETENTION",
        lead: "BUILD A RELATIONSHIP THAT CONTINUES BEYOND THE FIRST CLICK.",
        body: "Growing an audience is only valuable when people have a reason to remain connected. Consistent and relevant communication helps companies maintain relationships with the people who choose to follow their story.",
        layout: "centre",
        frame: [0.11, 0.11, 0.78, 0.78],
        dim: 0.75,
        network: 0.75,
      },
      {
        id: "close",
        label: "DON’T JUST REACH YOUR AUDIENCE. BUILD A DIRECT RELATIONSHIP WITH IT.",
        body: "Create a communication channel that keeps your company, projects and stories connected to the audience you have worked to reach.",
        layout: "closing",
        frame: [0, 0, 1, 1],
        dim: 0.85,
      },
    ],
  },
};
