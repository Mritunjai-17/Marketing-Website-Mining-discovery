import {
  COMMODITIES,
  COMPANY_DOMAINS,
  SOURCE_REGISTRY,
  SourceDefinition,
} from "./source-registry";


import {
  validateDataset,
  validateFreshness,
  type CanonicalDataset,
} from "./current-data-type";
/*
==================================================
GLOBAL MINING TOPIC DETECTOR
==================================================

IMPORTANT:

This detector is NOT a database of the mining world.

Known:
- countries
- companies
- commodities
- projects
- mines

are only helpers.

UNKNOWN entities MUST NOT block the pipeline.

Examples that must work:

"What is the latest mining news in Botswana?"

"What is the current status of the X mining project?"

"Who is the CEO of ABC Mining?"

"What is the lithium price?"

"What are the copper mines in an unknown country?"

"Tell me about XYZ mine."

The source registry is a PREFERRED SOURCE system.

It is NOT a limitation on global mining questions.
==================================================
*/

export type Topic =
  | "commodity"
  | "company"
  | "companyRanking"
  | "financial"
  | "exploration"
  | "regulation"
  | "resources"
  | "government"
  | "miningNews"
  | "project"
  | "person"
  | "mine"
  | "country"
  | "commodityProduction"
  | "reserves"
  | "ownership"
  | "generalMining";

export type MiningIntent =
  | "overview"
  | "market_cap"
  | "ceo"
  | "executive"
  | "company_info"
  | "mine_info"
  | "project_info"
  | "ownership"
  | "production"
  | "reserves"
  | "resources"
  | "price"
  | "financial"
  | "exploration"
  | "regulation"
  | "government"
  | "ranking"
  | "news"
  | "location"
  | "history"
  | "comparison"
  | "other";

/*
==================================================
PRICE TYPE
==================================================
*/

export type PriceType =
  | "spot"
  | "futures"
  | "benchmark"
  | "market"
  | "unknown";

export type MiningAnalysis = {
  isMining: boolean;

  topic: Topic;

  intent: MiningIntent;

  country: string | null;

  company: string | null;

  person: string | null;

  commodity: string | null;

  mine: string | null;

  project: string | null;

  priceType: PriceType | null;

  requiresCurrentData: boolean;
};

/*
==================================================
HELPERS
==================================================
*/

function normalizeText(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.$%/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholeWord(
  text: string,
  value: string
): boolean {
  const cleanValue = normalizeText(value);

  if (!cleanValue) {
    return false;
  }

  const escaped = escapeRegex(cleanValue);

  return new RegExp(
    `(?:^|\\s)${escaped}(?=\\s|$)`,
    "i"
  ).test(text);
}

function containsAny(
  text: string,
  words: string[]
): boolean {
  return words.some((word) => {
    const clean = normalizeText(word);

    if (!clean) {
      return false;
    }

    if (clean.includes(" ")) {
      return text.includes(clean);
    }

    return containsWholeWord(text, clean);
  });
}

function matchesAnyRegex(
  text: string,
  patterns: RegExp[]
): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/*
==================================================
SAFE SOURCE REGISTRY ACCESS
==================================================

This prevents TypeScript errors when SOURCE_REGISTRY
does not explicitly expose every optional property.

The registry remains the preferred-source database.

Unknown questions are still allowed.
==================================================
*/

const registry =
  SOURCE_REGISTRY as Record<
    string,
    SourceDefinition[] | undefined
  >;

/*
==================================================
MINING RELEVANCE
==================================================
*/

const MINING_TERMS = [
  "mining",
  "mine",
  "mines",
  "miner",
  "miners",
  "mineral",
  "minerals",
  "ore",
  "ores",
  "deposit",
  "deposits",
  "orebody",
  "ore body",
  "metallurgy",
  "metallurgical",
  "smelter",
  "smelting",
  "refinery",
  "refining",
  "tailings",
  "concentrate",
  "concentrates",
  "exploration",
  "drilling",
  "drill",
  "assay",
  "geology",
  "geological",
  "geologist",
  "resource",
  "resources",
  "reserve",
  "reserves",
  "mineralization",
  "mineralisation",
  "open pit",
  "open-pit",
  "underground mining",
  "strip mining",
  "coal mining",
  "gold mining",
  "copper mining",
  "iron ore",
  "lithium mining",
  "nickel mining",
  "cobalt mining",
  "uranium mining",
  "rare earth",
  "rare earths",
  "critical minerals",
  "critical mineral",
  "mineral production",
  "mine production",
  "mining production",
  "mine development",
  "mining project",
  "mining projects",
  "mining company",
  "mining companies",
  "mining industry",
  "mining sector",
  "mining operation",
  "mining operations",
  "mining license",
  "mining licence",
  "mining permit",
  "mining permits",
  "mining regulation",
  "mining regulations",
  "mining law",
  "mining laws",
  "mining policy",
  "mineral rights",
  "royalty",
  "royalties",
  "mining royalty",
  "mine ownership",
  "mine operator",
  "mine owner",
  "mining investment",
  "mining merger",
  "mining acquisition",
  "mining stock",
  "mining stocks",
  "mining shares",
  "mining ceo",
  "mining chairman",
  "mining executive",
  "mining news",
  "mining announcement",
  "mining announcements",
  "mining press release",
  "mining feasibility",
  "feasibility study",
  "pre feasibility",
  "pre-feasibility",
  "scoping study",
  "mineral estimate",
  "resource estimate",
  "reserve estimate",
  "mine life",
  "mine closure",
  "mine expansion",
  "mine construction",
  "mine commissioning",
  "mine operations",
  "production rate",
  "production volume",
];

/*
==================================================
NON-MINING TERMS
==================================================
*/

const NON_MINING_TERMS = [
  "football",
  "soccer",
  "cricket",
  "movie",
  "movies",
  "music",
  "recipe",
  "restaurant",
  "fashion",
  "weather",
  "politics",
  "political party",
  "celebrity gossip",
  "gaming",
  "video game",
  "programming",
  "javascript",
  "typescript",
  "python programming",
];

/*
==================================================
CURRENT DATA DETECTION
==================================================
*/

export function needsCurrentData(
  message: string
): boolean {
  const q = normalizeText(message);

  const currentWords = [
    "latest",
    "current",
    "today",
    "now",
    "currently",
    "live",
    "recent",
    "recently",
    "newest",
    "updated",
    "update",
    "this week",
    "this month",
    "this year",
    "this quarter",
    "this financial year",
    "as of",
    "up to date",
    "up-to-date",
    "latest available",
    "most recent",
    "just announced",
    "announced today",
    "recent announcement",
    "recent news",
    "latest news",
    "latest announcement",
  ];

  if (containsAny(q, currentWords)) {
    return true;
  }

  const priceWords = [
    "price",
    "spot price",
    "market price",
    "commodity price",
    "futures",
    "futures price",
    "benchmark price",
    "market value",
    "market cap",
    "market capitalization",
    "share price",
    "stock price",
    "stock market",
    "valuation",
    "exchange rate",
  ];

  if (containsAny(q, priceWords)) {
    return true;
  }

  const statusWords = [
    "project status",
    "mine status",
    "project update",
    "project progress",
    "construction status",
    "development status",
    "production",
    "production rate",
    "production volume",
    "output",
    "revenue",
    "profit",
    "earnings",
    "valuation",
    "ownership",
    "shareholding",
    "acquisition",
    "acquired",
    "merger",
    "investment",
    "funding",
    "financing",
    "expansion",
    "commissioning",
    "construction",
    "operations",
    "operational status",
    "operating",
    "production guidance",
    "guidance",
    "mine life",
  ];

  if (containsAny(q, statusWords)) {
    return true;
  }

  const executivePatterns = [
    /\bwho\s+is\s+the\s+(current\s+)?ceo\b/i,
    /\bwho\s+is\s+the\s+(current\s+)?chief\s+executive\b/i,
    /\bwho\s+is\s+the\s+(current\s+)?chairman\b/i,
    /\bwho\s+is\s+the\s+(current\s+)?chairwoman\b/i,
    /\bwho\s+is\s+the\s+(current\s+)?president\b/i,
    /\bwho\s+is\s+the\s+(current\s+)?director\b/i,
    /\bcurrent\s+ceo\b/i,
    /\bcurrent\s+chief\s+executive\b/i,
    /\bcurrent\s+chairman\b/i,
    /\bcurrent\s+president\b/i,
    /\bcurrent\s+director\b/i,
    /\bceo\s+of\b/i,
    /\bchief\s+executive\s+of\b/i,
    /\bchairman\s+of\b/i,
  ];

  if (matchesAnyRegex(q, executivePatterns)) {
    return true;
  }

  const rankingPatterns = [
    /\btop\s+\d+/i,
    /\btop\s+ten\b/i,
    /\blargest\b/i,
    /\bbiggest\b/i,
    /\bleading\b/i,
    /\bmajor\b/i,
    /\bhighest\b/i,
    /\branked\b/i,
    /\branking\b/i,
    /\bmost valuable\b/i,
    /\bnumber one\b/i,
    /\bworlds largest\b/i,
    /\bworld's largest\b/i,
  ];

  if (matchesAnyRegex(q, rankingPatterns)) {
    return true;
  }

  const countryMiningPatterns = [
    /\bmining companies in\b/i,
    /\bmines in\b/i,
    /\bmineral production in\b/i,
    /\bmineral resources in\b/i,
    /\bmineral reserves in\b/i,
    /\bmining industry in\b/i,
    /\bmining sector in\b/i,
    /\bmining projects in\b/i,
    /\bmining laws in\b/i,
    /\bmining regulations in\b/i,
    /\bmining policy in\b/i,
    /\bmining exports from\b/i,
    /\bmineral exports from\b/i,
    /\bmineral imports into\b/i,
    /\bmining investment in\b/i,
    /\bmining investment into\b/i,
  ];

  if (matchesAnyRegex(q, countryMiningPatterns)) {
    return true;
  }

  const newsWords = [
    "announcement",
    "announcements",
    "news",
    "news update",
    "press release",
    "breaking",
    "reported",
    "reports",
    "announcement today",
    "company announcement",
  ];

  if (containsAny(q, newsWords)) {
    return true;
  }

  const regulatoryWords = [
    "new law",
    "new regulation",
    "new policy",
    "permit requirements",
    "licensing requirements",
    "regulatory changes",
    "regulatory update",
    "new permit",
    "new licence",
    "new license",
    "government approval",
    "regulatory approval",
  ];

  if (containsAny(q, regulatoryWords)) {
    return true;
  }

  

  const ownershipPatterns = [
    /\bwho\s+owns\b/i,
    /\bwho\s+operates\b/i,
    /\bowned\s+by\b/i,
    /\boperated\s+by\b/i,
    /\bownership\s+of\b/i,
  ];

  if (matchesAnyRegex(q, ownershipPatterns)) {
    return true;
  }

  return false;
}

/*
==================================================
COUNTRY DETECTION
==================================================
*/

const KNOWN_COUNTRIES: Record<string, string> = {
  "united states": "United States",
  "united states of america": "United States",
  usa: "United States",
  "u.s.a": "United States",
  "u.s.": "United States",
  america: "United States",

  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  britain: "United Kingdom",
  british: "United Kingdom",

  "south africa": "South Africa",

  canada: "Canada",
  canadian: "Canada",

  australia: "Australia",
  australian: "Australia",

  india: "India",
  indian: "India",

  china: "China",
  chinese: "China",

  brazil: "Brazil",
  brazilian: "Brazil",

  russia: "Russia",
  russian: "Russia",

  chile: "Chile",
  chilean: "Chile",

  peru: "Peru",
  peruvian: "Peru",

  mexico: "Mexico",
  mexican: "Mexico",

  indonesia: "Indonesia",
  indonesian: "Indonesia",

  ghana: "Ghana",
  zambia: "Zambia",
  zimbabwe: "Zimbabwe",
  botswana: "Botswana",
  namibia: "Namibia",
  tanzania: "Tanzania",
  uganda: "Uganda",
  kenya: "Kenya",
  nigeria: "Nigeria",
  niger: "Niger",
  mali: "Mali",
  guinea: "Guinea",
  "sierra leone": "Sierra Leone",
  liberia: "Liberia",

  "democratic republic of the congo":
    "Democratic Republic of the Congo",

  drc: "Democratic Republic of the Congo",

  congo: "Republic of the Congo",

  mongolia: "Mongolia",
  kazakhstan: "Kazakhstan",
  uzbekistan: "Uzbekistan",
  kyrgyzstan: "Kyrgyzstan",
  tajikistan: "Tajikistan",
  turkmenistan: "Turkmenistan",

  argentina: "Argentina",
  bolivia: "Bolivia",
  colombia: "Colombia",
  ecuador: "Ecuador",
  guyana: "Guyana",
  suriname: "Suriname",

  "papua new guinea": "Papua New Guinea",
  philippines: "Philippines",
  vietnam: "Vietnam",
  malaysia: "Malaysia",
  thailand: "Thailand",
  laos: "Laos",
  myanmar: "Myanmar",

  "saudi arabia": "Saudi Arabia",
  oman: "Oman",
  iran: "Iran",
  turkey: "Turkey",

  "united arab emirates":
    "United Arab Emirates",

  uae: "United Arab Emirates",

  sweden: "Sweden",
  norway: "Norway",
  finland: "Finland",
  germany: "Germany",
  france: "France",
  spain: "Spain",
  portugal: "Portugal",
  serbia: "Serbia",
  greece: "Greece",
  poland: "Poland",
  ukraine: "Ukraine",
  romania: "Romania",

  "new zealand": "New Zealand",
};

export function detectCountry(
  message: string
): string | null {
  const q = normalizeText(message);

  const countries = Object.keys(
    KNOWN_COUNTRIES
  ).sort(
    (a, b) => b.length - a.length
  );

  for (const country of countries) {
    if (containsWholeWord(q, country)) {
      return KNOWN_COUNTRIES[country];
    }
  }

  return null;
}

/*
==================================================
COMMODITY DETECTION
==================================================
*/

export function detectCommodity(
  message: string
): string | null {
  const q = normalizeText(message);

  if (
    containsWholeWord(q, "aluminum") ||
    containsWholeWord(q, "aluminium")
  ) {
    return "aluminium";
  }

  const sorted = [...COMMODITIES].sort(
    (a, b) => b.length - a.length
  );

  for (const commodity of sorted) {
    if (
      containsWholeWord(
        q,
        commodity
      )
    ) {
      return commodity;
    }
  }

  const additionalCommodities = [
    "gold",
    "silver",
    "copper",
    "iron ore",
    "coal",
    "lithium",
    "nickel",
    "cobalt",
    "zinc",
    "lead",
    "tin",
    "uranium",
    "platinum",
    "palladium",
    "chromium",
    "manganese",
    "graphite",
    "potash",
    "phosphate",
    "bauxite",
    "rare earth",
    "rare earths",
    "vanadium",
    "tungsten",
    "molybdenum",
    "antimony",
    "niobium",
    "tantalum",
    "titanium",
    "rutile",
    "ilmenite",
    "zircon",
    "diamond",
    "diamonds",
    "silica",
    "quartz",
    "gypsum",
    "salt",
    "coking coal",
    "thermal coal",
  ];

  for (
    const commodity of additionalCommodities.sort(
      (a, b) => b.length - a.length
    )
  ) {
    if (
      containsWholeWord(
        q,
        commodity
      )
    ) {
      return commodity;
    }
  }

  return null;
}

/*
==================================================
COMPANY DETECTION
==================================================
*/

export function detectCompany(
  message: string
): string | null {
  const q = normalizeText(message);

  const companies = Object.keys(
    COMPANY_DOMAINS
  ).sort(
    (a, b) => b.length - a.length
  );

  for (const company of companies) {
    if (
      containsWholeWord(
        q,
        company
      )
    ) {
      return company;
    }
  }

  

  const commonCompanies = [
    "BHP",
    "Rio Tinto",
    "Vale",
    "Glencore",
    "Anglo American",
    "Barrick Gold",
    "Barrick",
    "Newmont",
    "Freeport-McMoRan",
    "Freeport McMoRan",
    "Fortescue",
    "FMG",
    "Teck",
    "Southern Copper",
    "Antofagasta",
    "First Quantum",
    "Ivanhoe Mines",
    "Eramet",
    "Alcoa",
    "Nucor",
    "ArcelorMittal",
    "Nornickel",
    "Zijin Mining",
    "CMOC",
    "China Molybdenum",
    "KGHM",
    "Boliden",
    "Kinross",
    "Agnico Eagle",
    "Wheaton Precious Metals",
    "Harmony Gold",
    "Gold Fields",
    "Sibanye Stillwater",
    "Impala Platinum",
    "African Rainbow Minerals",
    "Vedanta",
    "Hindustan Zinc",
    "Coal India",
    "NMDC",
    "Hindalco",
    "Adani Enterprises",
    "Adani",
    "Lithium Americas",
    "Albemarle",
    "SQM",
    "Pilbara Minerals",
    "Mineral Resources",
    "IGO",
    "OceanaGold",
    "South32",
  ];

  for (
    const company of commonCompanies.sort(
      (a, b) => b.length - a.length
    )
  ) {
    if (
  containsWholeWord(
    q,
    company
  )
) {
  return company;
}
  }

  /*
  IMPORTANT:

  Returning null here does NOT mean that the company
  is unsupported.

  It only means it is not in our local detector.

  The global search layer must still process it.
  */

  return null;
}

/*
==================================================
MULTI-COMPANY DETECTION
==================================================
*/

export function detectCompanies(
  message: string
): string[] {
  const q = normalizeText(message);

  const companies = [
    ...Object.keys(COMPANY_DOMAINS),
    "BHP",
    "Rio Tinto",
    "Vale",
    "Glencore",
    "Anglo American",
    "Barrick Gold",
    "Barrick",
    "Newmont",
    "Freeport-McMoRan",
    "Freeport McMoRan",
    "Fortescue",
    "FMG",
    "Teck",
    "Southern Copper",
    "Antofagasta",
    "First Quantum",
    "Ivanhoe Mines",
    "Eramet",
    "Alcoa",
    "Nucor",
    "ArcelorMittal",
    "Nornickel",
    "Zijin Mining",
    "CMOC",
    "China Molybdenum",
    "KGHM",
    "Boliden",
    "Kinross",
    "Agnico Eagle",
    "Wheaton Precious Metals",
    "Harmony Gold",
    "Gold Fields",
    "Sibanye Stillwater",
    "Impala Platinum",
    "African Rainbow Minerals",
    "Vedanta",
    "Hindustan Zinc",
    "Coal India",
    "NMDC",
    "Hindalco",
    "Adani Enterprises",
    "Adani",
    "Lithium Americas",
    "Albemarle",
    "SQM",
    "Pilbara Minerals",
    "Mineral Resources",
    "IGO",
    "OceanaGold",
    "South32",
  ];

const uniqueCompanies = [
  ...new Set(companies),
].sort((a, b) => b.length - a.length);

const detected: string[] = [];

for (const company of uniqueCompanies) {
  if (containsWholeWord(q, company)) {
    detected.push(company);
  }
}

return [...new Set(detected)];

  
}

/*
==================================================
PERSON DETECTION
==================================================
*/

function isPersonQuestion(
  message: string
): boolean {
  const q = normalizeText(message);

  return matchesAnyRegex(q, [
    /\bwho\s+is\b/i,
    /\bwho\s+was\b/i,
    /\bceo\b/i,
    /\bchief executive\b/i,
    /\bchairman\b/i,
    /\bchairwoman\b/i,
    /\bpresident\b/i,
    /\bmanaging director\b/i,
    /\bexecutive director\b/i,
    /\bdirector\b/i,
    /\bchief financial officer\b/i,
    /\bcfo\b/i,
    /\bchief operating officer\b/i,
    /\bcoo\b/i,
    /\bexecutive\b/i,
  ]);
}

/*
==================================================
PROJECT DETECTION
==================================================
*/

function isProjectQuestion(
  message: string
): boolean {
  const q = normalizeText(message);

  return containsAny(q, [
    "project",
    "mining project",
    "mine development",
    "mine status",
    "project status",
    "project update",
    "project progress",
    "project development",
    "project construction",
    "project expansion",
    "project commissioning",
    "project feasibility",
    "feasibility study",
    "pre feasibility",
    "pre-feasibility",
    "scoping study",
    "development project",
    "development",
    "construction",
    "commissioning",
    "expansion",
  ]);
}

/*
==================================================
MINE DETECTION
==================================================
*/

function isMineQuestion(
  message: string
): boolean {
  const q = normalizeText(message);

  return containsAny(q, [
    "mine",
    "mines",
    "mining operation",
    "mining operations",
    "orebody",
    "ore body",
    "open pit",
    "open-pit",
    "underground mine",
    "underground mining",
    "mine owner",
    "mine operator",
    "mine production",
    "mine life",
    "mine closure",
  ]);
}


function isCommodityProductionRankingQuestion(
  message: string
): boolean {
  const q = normalizeText(message);
  const commodity = detectCommodity(message);

  if (!commodity) {
    return false;
  }

  const productionTerms = [
    "production",
    "produces",
    "produced",
    "production volume",
    "production output",
    "output",
    "producing countries",
    "producing country",
    "production by country",
    "production by companies",
    "production by company",
  ];

  const comparisonTerms = [
    "compare",
    "comparison",
    "major",
    "top",
    "largest",
    "leading",
    "highest",
    "lowest",
    "ranking",
    "ranked",
    "by country",
    "by countries",
    "by company",
    "by companies",
  ];

  return (
    containsAny(q, productionTerms) &&
    containsAny(q, comparisonTerms)
  );
}

function hasRankingDimension(message: string): boolean {
  const q = normalizeText(message);

  return containsAny(q, [
    "revenue",
    "revenues",
    "ebitda",
    "net profit",
    "net income",
    "profit",
    "profits",
    "earnings",
    "market cap",
    "market capitalization",
    "market capitalisation",
    "market value",
    "valuation",
    "share price",
    "stock price",
    "production",
    "production volume",
    "production output",
    "output",
    "reserves",
    "resources",
    "growth",
"production",
"production volume",
"production output",
"output",
  ]);
}

/*
==================================================
RANKING DETECTION
==================================================
*/
function isRankingQuestion(message: string): boolean {
  const q = normalizeText(message);

  const explicitRanking = containsAny(q, [
    "top",
    "ranking",
    "rankings",
    "ranked",
    "number one",
    "no 1",
    "number 1",
    "most valuable",
    "largest",
    "biggest",
    "highest",
    "lowest",
  ]);

  const rankingDimension = containsAny(q, [
    "revenue",
    "ebitda",
    "profit",
    "net profit",
    "net income",
    "earnings",
    "market cap",
    "market capitalization",
    "market value",
    "valuation",
    "production",
    "production volume",
    "production output",
    "output",
    "reserves",
    "resources",
    "growth",
    "share price",
    "stock price",
  ]);

  const rankingEntity = containsAny(q, [
    "companies",
    "company",
    "miners",
    "producers",
    "countries",
    "country",
    "mines",
    "mine",
    "projects",
    "project",
  ]);

  // Explicit ranking question
  if (explicitRanking && rankingEntity) {
    return true;
  }

  // Example: "companies by revenue"
  if (rankingEntity && rankingDimension && q.includes(" by ")) {
    return true;
  }

  // Example: "highest gold production by country"
  if (rankingDimension && rankingEntity && (
    q.includes("highest") ||
    q.includes("largest") ||
    q.includes("top")
  )) {
    return true;
  }

  return false;
}
/*
==================================================
PRICE TYPE DETECTION
==================================================
*/

export function detectPriceType(
  message: string
): PriceType | null {
  const q = normalizeText(message);

  if (
    !containsAny(q, [
      "price",
      "spot price",
      "market price",
      "commodity price",
      "futures",
      "futures price",
      "benchmark price",
    ])
  ) {
    return null;
  }

  if (
    containsAny(q, [
      "futures",
      "futures price",
      "futures contract",
      "futures contracts",
      "forward price",
      "forward contract",
    ])
  ) {
    return "futures";
  }

  if (
    containsAny(q, [
      "benchmark",
      "benchmark price",
      "benchmark rate",
    ])
  ) {
    return "benchmark";
  }

  if (
    containsAny(q, [
      "spot",
      "spot price",
      "spot rate",
      "cash price",
    ])
  ) {
    return "spot";
  }

  if (
    containsAny(q, [
      "market price",
      "market rate",
      "current market price",
    ])
  ) {
    return "market";
  }

  return "unknown";
}

/*
==================================================
INTENT DETECTION
==================================================
*/

export function detectIntent(
  message: string
): MiningIntent {
  const q = normalizeText(message);



  /*
==================================================
MARKET CAPITALIZATION
==================================================
*/

if (
  containsAny(q, [
    "market cap",
    "market capitalization",
    "market capitalisation",
    "company market cap",
    "company market capitalization",
    "market value of the company",
    "current market cap",
    "current market capitalization",
  ])
) {
  return "market_cap";
}


  /*
==================================================
FINANCIAL QUESTIONS MUST COME BEFORE RANKING
==================================================

Examples:
- revenue of BHP, Rio Tinto and Vale
- EBITDA comparison
- net profit comparison
- highest revenue growth
- financial results ranking
*/

if (
  containsAny(q, [
    "revenue",
    "revenues",
    "ebitda",
    "net profit",
    "net income",
    "profit",
    "profits",
    "earnings",
    "financial results",
    "financial performance",
    "annual revenue",
    "annual profit",
    "annual ebitda",
    "revenue growth",
    "profit growth",
    "earnings growth",
    "growth compared with",
    "growth compared to",
    "previous fiscal year",
    "previous financial year",
    "fiscal year",
    "financial year",
  ])
) {

  // Ranking questions using financial metrics
  // must remain rankings.
  if (isRankingQuestion(message)) {
    return "ranking";
  }

  return "financial";
}

/*
==================================================
GENERIC RANKING
==================================================
*/

if (isCommodityProductionRankingQuestion(message)) {
  return "production";
}

if (isRankingQuestion(message)) {
  return "ranking";
}

  if (
    /\bwho\s+is\s+the\s+(current\s+)?ceo\b/i.test(q) ||
    /\bceo\s+of\b/i.test(q) ||
    /\bchief executive of\b/i.test(q)
  ) {
    return "ceo";
  }

  if (
    /\bchairman\b/i.test(q) ||
    /\bchairwoman\b/i.test(q) ||
    /\bpresident\b/i.test(q) ||
    /\bmanaging director\b/i.test(q) ||
    /\bexecutive director\b/i.test(q) ||
    /\bchief financial officer\b/i.test(q) ||
    /\bcfo\b/i.test(q) ||
    /\bchief operating officer\b/i.test(q) ||
    /\bcoo\b/i.test(q)
  ) {
    return "executive";
  }

  if (
    /\bwho\s+owns\b/i.test(q) ||
    /\bowned by\b/i.test(q) ||
    /\bownership\b/i.test(q) ||
    /\bwho operates\b/i.test(q) ||
    /\boperated by\b/i.test(q)
  ) {
    return "ownership";
  }

  if (
  (
    detectCommodity(message) !== null &&
    containsAny(q, [
      "price",
      "spot price",
      "commodity price",
      "market price",
      "price of",
      "price for",
      "futures price",
      "benchmark price",
      "share price",
      "stock price",
    ])
  )
) {
  return "price";
}

  if (
    containsAny(q, [
      "production",
      "produces",
      "produced",
      "production volume",
      "production rate",
      "output",
      "tonnes produced",
      "tons produced",
    ])
  ) {
    return "production";
  }

  if (
    containsAny(q, [
      "reserve",
      "reserves",
      "ore reserves",
      "mineral reserves",
    ])
  ) {
    return "reserves";
  }

  if (
    containsAny(q, [
      "resource",
      "resources",
      "mineral resource",
      "mineral resources",
      "ore resources",
    ])
  ) {
    return "resources";
  }

  if (
  containsAny(q, [
    "market cap",
    "market capitalization",
    "market capitalisation",
    "market value of the company",
    "current market cap",
    "current market capitalization",
  ])
) {
  return "market_cap";
}

  if (
    containsAny(q, [
      "revenue",
      "profit",
      "earnings",
      "ebitda",
      "cash flow",
      "net income",
      "annual report",
      "quarterly results",
      "financial results",
      "financial performance",
      "market cap",
      "market capitalization",
      "valuation",
    ])
  ) {
    return "financial";
  }

  if (
    containsAny(q, [
      "exploration",
      "exploration results",
      "drilling",
      "drill results",
      "assay",
      "discovery",
      "mineralization",
      "mineralisation",
      "resource estimate",
    ])
  ) {
    return "exploration";
  }

  if (
    containsAny(q, [
      "regulation",
      "regulations",
      "law",
      "laws",
      "legislation",
      "permit",
      "permits",
      "licence",
      "license",
      "licensing",
      "policy",
      "policies",
      "royalty",
      "royalties",
    ])
  ) {
    return "regulation";
  }

  if (
    containsAny(q, [
      "government",
      "ministry",
      "minister",
      "mining ministry",
      "geological survey",
      "government agency",
      "regulator",
      "regulatory authority",
    ])
  ) {
    return "government";
  }

  if (
    containsAny(q, [
      "news",
      "announcement",
      "announcements",
      "press release",
      "breaking",
      "latest update",
      "recent update",
    ])
  ) {
    return "news";
  }

  if (
    containsAny(q, [
      "where is",
      "located",
      "location",
      "country is",
    ])
  ) {
    return "location";
  }

  if (
    containsAny(q, [
      "history",
      "historical",
      "founded",
      "established",
    ])
  ) {
    return "history";
  }

  if (
    containsAny(q, [
      "compare",
      "comparison",
      "versus",
      "vs",
      "difference between",
    ])
  ) {
    return "comparison";
  }

  if (isProjectQuestion(message)) {
    return "project_info";
  }

  if (isMineQuestion(message)) {
    return "mine_info";
  }

  if (detectCompany(message)) {
    return "company_info";
  }

  if (detectCountry(message)) {
    return "overview";
  }

  return "other";
}

/*
==================================================
TOPIC DETECTION
==================================================
*/

export function detectTopic(
  message: string
): Topic {
  const commodity = detectCommodity(message);
  const company = detectCompany(message);
  const companies = detectCompanies(message);
  const country = detectCountry(message);
  const intent = detectIntent(message);

if (intent === "ranking") {
  const q = normalizeText(message);

  // 1. Country ranking
  if (
    containsAny(q, [
      "countries",
      "country",
      "by country",
      "by countries",
    ])
  ) {
    return "commodityProduction";
  }

  // 2. Mine ranking
  if (
    containsAny(q, [
      "mines",
      "mine",
    ])
  ) {
    return "mine";
  }

  // 3. Project ranking
  if (
    containsAny(q, [
      "projects",
      "project",
    ])
  ) {
    return "project";
  }

  // 4. Company ranking
  if (
    containsAny(q, [
      "companies",
      "company",
      "miners",
      "producers",
    ])
  ) {
    return "companyRanking";
  }

  // 5. Commodity ranking
  if (
    commodity &&
    containsAny(q, [
      "production",
      "producing",
      "reserves",
      "resources",
    ])
  ) {
    return "commodityProduction";
  }

  // Do NOT assume company ranking by default.
  return "generalMining";
}


if (intent === "market_cap") {
  return "financial";
}


  if (
    commodity &&
    intent === "price"
  ) {
    return "commodity";
  }

  if (
    commodity &&
    intent === "production"
  ) {
    return "commodityProduction";
  }

  if (intent === "reserves") {
    return "reserves";
  }

  if (intent === "resources") {
    return "resources";
  }

  if (intent === "regulation") {
    return "regulation";
  }

  if (intent === "government") {
    return "government";
  }

  if (intent === "exploration") {
    return "exploration";
  }

  if (intent === "financial") {
    return "financial";
  }

  if (
    intent === "ceo" ||
    intent === "executive" ||
    isPersonQuestion(message)
  ) {
    return "person";
  }

  if (intent === "project_info") {
    return "project";
  }

  if (intent === "mine_info") {
    return "mine";
  }

  if (intent === "ownership") {
    return "ownership";
  }

  if (
    company ||
    intent === "company_info"
  ) {
    return "company";
  }

  if (intent === "news") {
    return "miningNews";
  }

  if (country) {
    return "country";
  }

  return "generalMining";
}

/*
==================================================
MINING RELEVANCE
==================================================
*/

export function isMiningQuestion(
  message: string
): boolean {
  const q = normalizeText(message);

  if (
    MINING_TERMS.some((term) => {
      if (term.includes(" ")) {
        return q.includes(term);
      }

      return containsWholeWord(
        q,
        term
      );
    })
  ) {
    return true;
  }

  /*
  Known company.
  */

  if (detectCompany(message)) {
    return true;
  }

  /*
Known commodity.

Commodity questions are mining-related even when
the word "mining" is not explicitly present.

Examples:
- What is the gold price?
- What is the copper price?
- What is the lithium price?
- What are current nickel prices?
*/

  if (detectCommodity(message)) {
    return true;
  }

  /*
  Mining person questions.
  */

  if (
    isPersonQuestion(message) &&
    (
      q.includes("company") ||
      q.includes("mining") ||
      q.includes("mine") ||
      q.includes("minerals") ||
      q.includes("mineral")
    )
  ) {
    return true;
  }

  /*
  Mining + unknown country/entity.

  We deliberately do NOT require the country
  to exist in KNOWN_COUNTRIES.
  */

  if (
    /\b(mining|mineral|minerals|mine|ore)\b/i.test(q) &&
    /\bin\b|\bof\b|\bfrom\b/i.test(q)
  ) {
    return true;
  }

  const hasNonMining =
    NON_MINING_TERMS.some((term) =>
      q.includes(term)
    );

  if (
    hasNonMining &&
    !MINING_TERMS.some((term) =>
      q.includes(term)
    )
  ) {
    return false;
  }

  return false;
}

/*
==================================================
FULL ANALYSIS
==================================================
*/

export function analyzeMiningQuestion(
  message: string
): MiningAnalysis {
  const topic = detectTopic(message);
  const intent = detectIntent(message);

  return {
    isMining: isMiningQuestion(message),

    topic,

    intent,

    country: detectCountry(message),

    company: detectCompany(message),

    person: null,

    commodity: detectCommodity(message),

    mine: null,

    project: null,

    priceType:
      intent === "price"
        ? detectPriceType(message)
        : null,

    requiresCurrentData:
      needsCurrentData(message),
  };
}

/*
==================================================
SOURCE HELPER
==================================================
*/

function addSources(
  target: SourceDefinition[],
  sources:
    | readonly SourceDefinition[]
    | undefined
) {
  if (!sources?.length) {
    return;
  }

  target.push(...sources);
}

/*
==================================================
PRICE SEARCH QUERY BUILDER
==================================================
*/

function buildPriceSearchQuery(
  commodity: string,
  priceType: PriceType | null
): string {
  if (priceType === "futures") {
    return `${commodity} futures price today`;
  }

  if (priceType === "benchmark") {
    return `${commodity} benchmark price today`;
  }

  if (priceType === "spot") {
    return `${commodity} spot price today`;
  }

  if (priceType === "market") {
    return `${commodity} market price today`;
  }

  return `${commodity} price today`;
}

/*
==================================================
GLOBAL MINING SEARCH QUERY BUILDER
==================================================

IMPORTANT:

There is ONLY ONE definition of this function.

Unknown entities are still included in the original
question and are not rejected.
==================================================
*/

export function buildMiningSearchQueries(
  message: string
): string[] {
  const q = message.trim();

  if (!q) {
    return [];
  }

  const analysis =
    analyzeMiningQuestion(message);

  const queries: string[] = [];

  /*
  Original question FIRST.

  This is extremely important for unknown:
  - companies
  - mines
  - projects
  - countries
  - people
  - commodities
  */

  queries.push(q);

  /*
==================================================
MARKET CAPITALIZATION
==================================================

Market-cap questions get dedicated queries.

Do NOT send them through:
- generic financial results
- latest company
- mining news
*/

if (analysis.intent === "market_cap") {
  const companies = detectCompanies(message);

  if (companies.length > 0) {
    for (const company of companies) {
      queries.push(
        `"${company}" market cap CompaniesMarketCap USD`
      );

      queries.push(
        `"${company}" market capitalization CompaniesMarketCap USD`
      );
    }
  } else {
    queries.push(
      `${q} market cap CompaniesMarketCap USD`
    );
  }

  return [
    ...new Set(
      queries
        .map((query) =>
          query.replace(/\s+/g, " ").trim()
        )
        .filter(Boolean)
    ),
  ];
}

  /*
  Always create a mining-context query.
  */

  if (
    !/\bmining\b|\bmine\b|\bmineral\b|\bminerals\b/i.test(q)
  ) {
    queries.push(`${q} mining`);
  }

  /*
  Company.
  */

  if (analysis.company) {
    queries.push(
      `"${analysis.company}" official company`
    );

    queries.push(
      `"${analysis.company}" mining latest`
    );

    queries.push(
      `"${analysis.company}" CEO executive leadership`
    );
  }

  /*
  UNKNOWN COMPANY:

  We cannot detect its name from the registry,
  but the ORIGINAL QUESTION remains intact.

  Example:
  "Who is the CEO of XYZ Mining?"

  Query remains:
  "Who is the CEO of XYZ Mining?"

  Therefore XYZ Mining is NOT blocked.
  */

  if (
    analysis.intent === "ceo" ||
    analysis.intent === "executive"
  ) {
    queries.push(
      `${q} current CEO official`
    );

    queries.push(
      `${q} chief executive official`
    );
  }

  /*
  Country.
  */

  if (analysis.country) {
    queries.push(
      `${q} mining ${analysis.country}`
    );

    queries.push(
      `mining companies mines projects ${analysis.country}`
    );

    queries.push(
      `mineral resources production ${analysis.country}`
    );
  }

  /*
  Unknown country is NOT blocked.

  The original query is still searched.
  */

  /*
  Commodity.
  */

  if (analysis.commodity) {
    if (analysis.intent === "price") {
      queries.push(
        buildPriceSearchQuery(
          analysis.commodity,
          analysis.priceType
        )
      );
    } else {
      queries.push(
        `${analysis.commodity} mining latest`
      );

      queries.push(
        `${analysis.commodity} production mining`
      );
    }
  }

  /*
  Ranking.
  */

 if (analysis.topic === "companyRanking") {
  queries.push(`${q} ranking`);
}

  /*
  Government.
  */

  if (
    analysis.topic === "government"
  ) {
    queries.push(
      `${q} government mining`
    );
  }

  /*
  Regulation.
  */

  if (
    analysis.topic === "regulation"
  ) {
    queries.push(
      `${q} mining regulation law policy`
    );
  }

  /*
  Exploration.
  */

  if (
    analysis.topic === "exploration"
  ) {
    queries.push(
      `${q} mining exploration drilling`
    );
  }

  /*
  Financial.
  */

  if (
    analysis.topic === "financial"
  ) {
    queries.push(
      `${q} mining company financial results`
    );
  }

  /*
  Mine.
  */

  if (
    analysis.topic === "mine"
  ) {
    queries.push(
      `${q} mine official`
    );

    queries.push(
      `${q} mining company`
    );
  }

  /*
  Project.
  */

  if (
    analysis.topic === "project"
  ) {
    queries.push(
      `${q} mining project`
    );

    queries.push(
      `${q} project official`
    );

    if (q.toLowerCase().includes("simandou")) {
      const currentYear = new Date().getFullYear();
      queries.unshift(`Rio Tinto Simandou project status ${currentYear} production sales guidance official`);
    }

    if (q.toLowerCase().includes("jansen")) {
      const currentYear = new Date().getFullYear();
      queries.unshift(`BHP Jansen project status ${currentYear} production capacity stage 1 stage 2 official`);
    }
  }

  /*
  Current information.
  */

 if (analysis.requiresCurrentData) {
  queries.push(`${q} latest`);
  queries.push(`${q} current official`);
}

  return [
    ...new Set(
      queries
        .map((query) =>
          query
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean)
    ),
  ];
}

/*
==================================================
GET SOURCES FOR QUESTION
==================================================

KNOWN SOURCES:
    preferred

UNKNOWN:
    NOT BLOCKED

GLOBAL FALLBACK:
    generic trusted mining sources

This means getSourcesForQuestion() should not return
an empty array merely because a company/country/
commodity is unknown.
==================================================
*/

function classifySource(source: SourceDefinition): 
  | "official"
  | "government"
  | "exchange"
  | "trusted"
  | "other" {

  const text = `${source.name} ${source.url}`.toLowerCase();

  if (
    text.includes("government") ||
    text.includes(".gov") ||
    text.includes("ministry") ||
    text.includes("regulator") ||
    text.includes("geological survey")
  ) {
    return "government";
  }

  if (
    text.includes("exchange") ||
    text.includes("cmegroup") ||
    text.includes("lme.com") ||
    text.includes("lbma")
  ) {
    return "exchange";
  }

  if (
    text.includes("official") ||
    text.includes("company")
  ) {
    return "official";
  }

  if (
    text.includes("reuters") ||
    text.includes("mining.com") ||
    text.includes("miningweekly")
  ) {
    return "trusted";
  }

  return "other";
}

export function getSourcesForQuestion(
  message: string
): SourceDefinition[] {
  const topic = detectTopic(message);

  const commodity = detectCommodity(message);

  const company = detectCompany(message);
 

  const country = detectCountry(message);

  const intent = detectIntent(message);

  const sources: SourceDefinition[] = [];

  /*
  --------------------------------------------------
  COMPANY OFFICIAL SOURCES
  --------------------------------------------------
  */

/*
--------------------------------------------------
COMPANY OFFICIAL SOURCES
--------------------------------------------------
*/

const companies = detectCompanies(message);

for (const detectedCompany of companies) {
  const companyKey = Object.keys(COMPANY_DOMAINS).find(
    (key) =>
      normalizeText(key) === normalizeText(detectedCompany)
  );

  const companySources = companyKey
    ? COMPANY_DOMAINS[companyKey]
    : undefined;

  if (!companySources) {
    continue;
  }
  /*
  Financial questions require official
  annual reports / financial results.
  */

  if (topic === "financial") {
    const financialSources =
      companySources.filter((source) => {
        const text = `${source.name} ${source.url}`
          .toLowerCase();

        return (
          text.includes("annual") ||
          text.includes("financial") ||
          text.includes("result") ||
          text.includes("report") ||
          text.includes("investor")
        );
      });

    addSources(
      sources,
      financialSources.length > 0
        ? financialSources
        : companySources
    );
  } else {
    addSources(
      sources,
      companySources
    );
  }
}

  /*
  --------------------------------------------------
  COMMODITY SOURCES
  --------------------------------------------------
  */

  if (
    commodity &&
    topic === "commodity"
  ) {
    const commoditySources =
      registry[commodity];

    addSources(
      sources,
      commoditySources
    );
  }

  /*
  --------------------------------------------------
  KNOWN PROJECT SOURCES
  --------------------------------------------------
  */

  const normalized =
    normalizeText(message);

  if (
    normalized.includes("simandou")
  ) {
    addSources(
      sources,
      registry["simandou"]
    );
  }

/*
--------------------------------------------------
MARKET CAPITALIZATION
--------------------------------------------------

Market-cap questions use the registered
market-data source.

Do NOT send them through the generic
latest-company/news source path.
--------------------------------------------------
*/

if (intent === "market_cap") {
  const marketCapSources =
    registry["companyRanking"]?.filter(
      (source) =>
        source.domain === "companiesmarketcap.com"
    ) ?? [];

  if (marketCapSources.length > 0) {
    return marketCapSources;
  }

  return [];
}

 /* 
--------------------------------------------------
COMPANY RANKING
--------------------------------------------------

Ranking sources are selected dynamically.

There is NO country-specific hardcoding here.

Examples:
- Canada
- USA
- Australia
- Botswana
- Chile
- any unknown country

The country is simply part of the search question.
--------------------------------------------------
*/

if (topic === "commodityProduction") {
  if (commodity) {
    addSources(
      sources,
      registry[commodity]
    );
  }

  addSources(
    sources,
    registry["government"]
  );

  addSources(
    sources,
    registry["miningNews"]
  );
}



if (topic === "companyRanking") {
  addSources(
    sources,
    registry["companyRanking"]
  );
}

  /*
  --------------------------------------------------
  NEWS
  --------------------------------------------------
  */

if (
  topic === "miningNews" ||
  topic === "generalMining" ||
  topic === "company" ||
  (
    topic === "financial" &&
    detectIntent(message) !== "market_cap"
  ) ||
  topic === "person" ||
  topic === "mine" ||
  topic === "project"
) {
  addSources(
    sources,
    registry["miningNews"]
  );
}

  /*
  --------------------------------------------------
  GOVERNMENT
  --------------------------------------------------
  */

  if (
    topic === "government" ||
    topic === "country"
  ) {
    addSources(
      sources,
      registry["government"]
    );
  }

  /*
  --------------------------------------------------
  REGULATION
  --------------------------------------------------
  */

  if (
    topic === "regulation"
  ) {
    addSources(
      sources,
      registry["regulation"]
    );
  }

  /*
  --------------------------------------------------
  EXPLORATION
  --------------------------------------------------
  */

  if (
    topic === "exploration"
  ) {
    addSources(
      sources,
      registry["government"]
    );

    addSources(
      sources,
      registry["miningNews"]
    );
  }

  /*
  --------------------------------------------------
  GLOBAL FALLBACK
  --------------------------------------------------

  THIS IS THE IMPORTANT CHANGE.

  Even if the detector knows nothing about:

  - country
  - company
  - commodity
  - mine
  - project
  - person

  we still provide trusted global mining sources.

  The question itself is never discarded.
  --------------------------------------------------
  */

  if (sources.length === 0) {
    addSources(
      sources,
      registry["miningNews"]
    );

    addSources(
      sources,
      registry["government"]
    );
  }

  /*
  --------------------------------------------------
  REMOVE DUPLICATE URLS
  --------------------------------------------------
  */

  const unique =
    new Map<
      string,
      SourceDefinition
    >();

  for (
    const source of sources
  ) {
    if (
      source &&
      source.url &&
      !unique.has(source.url)
    ) {
      unique.set(
        source.url,
        source
      );
    }
  }

  const result =
    [...unique.values()].sort(
      (a, b) =>
        a.priority - b.priority
    );

  /*
  --------------------------------------------------
  DEBUG
  --------------------------------------------------
  */

  console.log(
    "=========================================="
  );

  console.log(
    "GLOBAL MINING SOURCE ANALYSIS"
  );

  console.log(
    "QUESTION:",
    message
  );

  console.log(
    "TOPIC:",
    topic
  );

  console.log(
    "INTENT:",
    detectIntent(message)
  );

  console.log(
    "MINING:",
    isMiningQuestion(message)
  );

  console.log(
    "COUNTRY:",
    country
  );

  console.log(
    "COMMODITY:",
    commodity
  );

  console.log(
    "COMPANY:",
    company
  );

  console.log(
    "CURRENT:",
    needsCurrentData(message)
  );

  console.log(
    "SEARCH QUERIES:",
    buildMiningSearchQueries(message)
  );

  console.log(
    "REGISTERED SOURCES:",
    result.map(
      (source) => source.url
    )
  );

  console.log(
    "=========================================="
  );

  return result;
}