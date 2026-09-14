export const dynamic = "force-dynamic";
export const maxDuration = 60;

import {
  openai,
  MODEL,
} from "@/lib/openai";

import companyKnowledge from "@/lib/company-knowledge";


import {
  buildChartForAnswer,
} from "@/lib/chart-builder";

import {
  miningAgentKnowledge,
} from "@/lib/knowledge";

import {
  connectMongoDB,
} from "@/lib/db/client";

import {
  needsCurrentData,
  detectTopic,
  detectCommodity,
  detectCompany,
  detectCompanies,
  detectCountry,
} from "@/lib/topic-detector";

import {
  fetchSourcesForQuestion,
  searchWeb,
} from "@/lib/source-fetcher";

import {
  extractSourceData,
} from "@/lib/source-parser";

import {
  createMiningAnswerStream,
} from "@/lib/mining-answer";


/*
==================================================
FRONTEND
==================================================
*/


const FRONTEND_URL =
  process.env.FRONTEND_URL || "*";


/*
==================================================
COMPANY CONTEXT
==================================================
*/

const companyContext = `
==================================================
MINING DISCOVERY COMPANY KNOWLEDGE
==================================================

${JSON.stringify(
  companyKnowledge,
  null,
  2
)}

==================================================
IMPORTANT COMPANY RULES
==================================================

Use this knowledge when answering questions
specifically about Mining Discovery.

Do not invent company information.

Do not invent employees or executives.

Do not invent services.

Do not invent prices.

Do not invent phone numbers.

Do not invent addresses.

Do not invent partnerships.

If the requested company information is not
available in this knowledge, clearly say that
the information is not available and direct
the visitor to contact Mining Discovery.

Identify yourself as an AI assistant.

Never pretend to be a Mining Discovery employee.

For investment questions, provide general
educational information only.

Do not guarantee financial returns.

Answer politely, professionally and concisely.
`;




/*
==================================================
SAVE CONVERSATION MESSAGE
==================================================
*/

async function saveConversationMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {

  try {

    const db =
      await connectMongoDB();

    if (!db) {
      return;
    }

    const collection =
      db.collection(
        "conversations"
      );

    const now =
      new Date().toISOString();

    await collection.updateOne(

      {
        id: conversationId,
      },

      {
        $set: {
          updatedAt: now,
        },

        $setOnInsert: {
          id: conversationId,
          createdAt: now,
        },

        $push: {
          messages: {
            role,
            content,
            timestamp: now,
          },
        },
      } as any,

      {
        upsert: true,
      }
    );

    console.log(
      "CONVERSATION SAVED:",
      conversationId,
      role
    );

  } catch (error) {

    console.error(
      "FAILED TO SAVE CONVERSATION:",
      error
    );
  }
}

async function getConversationHistory(
  conversationId: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  try {
    const db = await connectMongoDB();
    if (!db) return [];

    const doc = await db.collection("conversations").findOne({ id: conversationId });
    if (doc && Array.isArray(doc.messages)) {
      return doc.messages
        .filter((m: any) => m && m.content)
        .map((m: any) => ({
          role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: String(m.content),
        }));
    }
  } catch (error) {
    console.error("FAILED TO GET CONVERSATION HISTORY:", error);
  }
  return [];
}


/*
==================================================
SLEEP
==================================================
*/

function sleep(
  ms: number
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}





/*
==================================================
FAST COMMODITY PRICE DETECTION
==================================================
*/

function isCommodityPriceQuestion(
  message: string
): boolean {

  const q =
    message
      .toLowerCase()
      .trim();

  const priceWords = [
    "price",
    "spot price",
    "current price",
    "latest price",
    "today's price",
    "today price",
    "market price",
    "trading price",
    "value",
    "quote",
  ];

  const hasPriceWord =
    priceWords.some(
      word =>
        q.includes(word)
    );

  if (!hasPriceWord) {
    return false;
  }

  const commodity =
    detectCommodity(
      message
    );

  return Boolean(
    commodity
  );
}


/*
==================================================
FAST COMMODITY PRICE ANSWER
==================================================
*/

function buildCommodityPriceAnswer(
  message: string,
  extractedData: any[]
): string {

  const commodity =
    detectCommodity(
      message
    );

  if (
    !commodity ||
    extractedData.length === 0
  ) {

    return "";
  }


  /*
  --------------------------------------------------
  FIND SOURCES THAT ACTUALLY CONTAIN PRICE DATA
  --------------------------------------------------
  */

  const priceSources =
    extractedData.filter(
      source => {

        const information =
          String(
            source.information || ""
          );

        return (
          /\$?\s?\d[\d,]*(?:\.\d+)?/.test(
            information
          )
        );
      }
    );


  if (
    priceSources.length === 0
  ) {

    return "";
  }


  /*
  --------------------------------------------------
  PRIMARY SOURCE
  --------------------------------------------------
  */

  const primary =
    priceSources.find(
      source =>
        source.source
          ?.toLowerCase()
          .includes("kitco")
    ) ||
    priceSources[0];


  const secondary =
    priceSources.find(
      source =>
        source !== primary &&
        source.source
          ?.toLowerCase()
          .includes(
            "trading economics"
          )
    );


  /*
  --------------------------------------------------
  RETURN VERIFIED SOURCE DATA
  --------------------------------------------------
  */

  let answer =
    primary.information
      ?.trim() || "";


  if (
    secondary &&
    secondary.information &&
    secondary.information !==
      primary.information
  ) {

    answer +=
      `\n\n${secondary.information.trim()}`;
  }


  return answer;
}


/*
==================================================
MINING WEB DATA DECISION
==================================================

This is important.

The bot should search globally for:

- current information
- companies
- CEOs
- executives
- countries
- mining projects
- mines
- governments
- regulations
- exploration
- production
- financial information
- rankings
- mining news

But it should NOT perform web searches for every
basic educational question.

Examples that can use knowledge:

"What is open pit mining?"

"What is copper?"

"How does flotation work?"

Examples that should use global sources:

"Who is the CEO of BHP?"

"What mining companies operate in Mongolia?"

"Gold production in Ghana"

"Mining regulations in Peru"

"Current copper price"

"Major lithium projects in Argentina"
==================================================
*/

function shouldUseGlobalMiningSearch(
  message: string
): boolean {

  const q =
    message
      .toLowerCase()
      .trim();

  /*
  --------------------------------------------------
  CURRENT DATA
  --------------------------------------------------
  */

  if (
    needsCurrentData(
      message
    )
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  DETECT ENTITIES
  --------------------------------------------------
  */

  const company =
    detectCompany(
      message
    );

  const country =
    detectCountry(
      message
    );

  const topic =
    detectTopic(
      message
    );


  /*
  --------------------------------------------------
  COMPANY QUESTIONS
  --------------------------------------------------
  */

  const companyWords = [
    "ceo",
    "chief executive",
    "executive",
    "executives",
    "leadership",
    "management",
    "president",
    "chairman",
    "chairperson",
    "director",
    "directors",
    "founder",
    "founders",
    "headquarters",
    "head office",
    "owned by",
    "owner",
    "ownership",
    "shareholder",
    "shareholders",
    "subsidiary",
    "subsidiaries",
    "company profile",
    "company information",
    "company history",
    "who owns",
    "who runs",
    "what does the company do",
  ];

  if (
    company ||
    companyWords.some(
      word =>
        q.includes(word)
    )
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  COUNTRY QUESTIONS
  --------------------------------------------------
  */

  const countryWords = [
    "mining in",
    "mines in",
    "mine in",
    "mining companies in",
    "mining company in",
    "mining industry in",
    "mining sector in",
    "mining projects in",
    "mineral resources in",
    "mineral reserves in",
    "mineral production in",
    "mineral exports from",
    "mineral imports into",
    "gold mining in",
    "copper mining in",
    "lithium mining in",
    "iron ore mining in",
    "coal mining in",
    "diamond mining in",
    "uranium mining in",
    "mining laws in",
    "mining regulations in",
    "mining policy in",
  ];

  if (
    country &&
    countryWords.some(
      word =>
        q.includes(word)
    )
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  PROJECT QUESTIONS
  --------------------------------------------------
  */

  const projectWords = [
    "project",
    "mine",
    "mine development",
    "mine status",
    "project status",
    "project update",
    "project progress",
    "construction",
    "commissioning",
    "expansion",
    "development",
    "operations",
    "operational",
  ];

  if (
    projectWords.some(
      word =>
        q.includes(word)
    )
  ) {

    /*
    Only use global search when the question
    appears to be asking about a real-world
    mining project/mine rather than explaining
    the concept of a project.
    */

    const realWorldIndicators = [
      "status",
      "update",
      "current",
      "latest",
      "company",
      "located",
      "location",
      "country",
      "owner",
      "owns",
      "production",
      "construction",
      "development",
      "operation",
      "operating",
      "announced",
      "when will",
      "where is",
      "who owns",
    ];

    if (
      realWorldIndicators.some(
        word =>
          q.includes(word)
      )
    ) {
      return true;
    }
  }


  /*
  --------------------------------------------------
  GOVERNMENT / REGULATION
  --------------------------------------------------
  */

  if (
    topic === "government" ||
    topic === "regulation"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  EXPLORATION
  --------------------------------------------------
  */

  if (
    topic === "exploration"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  FINANCIAL
  --------------------------------------------------
  */

  if (
    topic === "financial"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  RANKINGS
  --------------------------------------------------
  */

  if (
    topic === "companyRanking"
  ) {
    return true;
  }


  /*
  --------------------------------------------------
  DEFAULT
  --------------------------------------------------
  */

  return false;
}


/*
==================================================
LATEST COMPANY DATA QUESTION
==================================================
*/

function isLatestCompanyQuestion(
  message: string
): boolean {

  const q =
    message
      .toLowerCase()
      .trim();


  const latestWords = [
    "latest",
    "current",
    "today",
    "recent",
    "most recent",
    "newest",
    "updated",
    "update",
  ];


  const hasLatestWord =
    latestWords.some(
      word =>
        q.includes(word)
    );


  /*
  "guidance" alone does NOT mean latest.
  */

  if (
    !hasLatestWord
  ) {
    return false;
  }


  const company =
    detectCompany(
      message
    );


  return Boolean(
    company
  );
}

function isExecutiveOrEventsQuestion(
  message: string
): boolean {
  const q = message.toLowerCase();
  return (
    /\b(ceo|ceos|chief executive|director|directors|head|heads|who runs|who leads|leadership|management|board|chair|chairs|chairman|chairwoman|chairperson|c-suite|cfo|coo|president|presidents|governance)\b/i.test(q) ||
    /\b(recent event|recent events|latest events|industry events|events in the mining|mega[- ]?deal|mega[- ]?deals|deal|deals|m&a|merger|mergers|acquisition|acquisitions|takeover|takeovers|future impact|what(?:['’]?s| is| its| it's)? (?:gonna|going to) happen|what will happen|what happens next|next catalyst|upcoming catalyst|catalysts|restructuring|demerger|arcadium|anglo teck|vicuna|vicuña|cobre panama|simandou)\b/i.test(q)
  );
}

/*
==================================================
LATEST OFFICIAL COMPANY SOURCE
==================================================
*/

/* 
==================================================
LATEST OFFICIAL COMPANY SOURCE
==================================================
*/

async function findOfficialCompanySource(
  message: string,
  company: string
): Promise<{
  title: string;
  url: string;
  domain: string;
} | null> {

  try {

    /*
    ------------------------------------------------
    FIRST: FETCH REGISTERED SOURCES
    ------------------------------------------------
    */

    const registeredSources =
      await fetchSourcesForQuestion(
        message
      );

    console.log(
      "[LATEST COMPANY PATH] Registered sources:",
      registeredSources.map(
        source => ({
          name: source.name,
          domain: source.domain,
          url: source.url,
        })
      )
    );


    /*
    ------------------------------------------------
    OFFICIAL COMPANY SOURCES
    ------------------------------------------------
    */

   const normalizedCompany =
  company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const officialSources =
  registeredSources.filter(
    source => {

      const domain =
        String(
          source.domain || ""
        )
        .toLowerCase()
        .replace(/^www\./, "")
        .replace(/[^a-z0-9]/g, "");

      return (
        domain.includes(
          normalizedCompany
        ) ||
        normalizedCompany.includes(
          domain.split(".")[0]
        )
      );

    }
  );

    /*
    ------------------------------------------------
    IMPORTANT:
    REMOVE OLD SOURCES FOR "LATEST" QUESTIONS
    ------------------------------------------------

    We don't want an old 2025 BHP report when
    the question asks for the latest information.
    */

    const currentYear =
      new Date().getFullYear();

    const recentSources =
      officialSources.filter(
        source => {

          const text =
            `${source.name || ""} ${source.url || ""}`;

          /*
          Accept current year and previous year.
          This prevents very old reports from winning.
          */

          return (
            text.includes(
              String(currentYear)
            ) ||
            text.includes(
              String(currentYear - 1)
            )
          );

        }
      );


    console.log(
      "[LATEST COMPANY PATH] Recent official sources:",
      recentSources.map(
        source => ({
          name: source.name,
          url: source.url,
          domain: source.domain,
        })
      )
    );


    /*
    ------------------------------------------------
    PREFER THE FY2026 BHP OPERATIONAL REVIEW
    ------------------------------------------------

    For BHP specifically, the latest annual
    operational review is the strongest source
    for production guidance.
    */

    if (
      company.toLowerCase() === "bhp"
    ) {

      const bhpOperationalReview =
        recentSources.find(
          source => {

            const text =
              `${source.name || ""} ${source.url || ""}`
                .toLowerCase();

            return (
              text.includes(
                "operational review"
              ) &&
              (
                text.includes(
                  "2026"
                ) ||
                text.includes(
                  "30-june-2026"
                ) ||
                text.includes(
                  "30june2026"
                )
              )
            );

          }
        );

      if (
        bhpOperationalReview
      ) {

        console.log(
          "[LATEST COMPANY PATH] Selected latest BHP operational review:",
          {
            name:
              bhpOperationalReview.name,

            url:
              bhpOperationalReview.url,

            domain:
              bhpOperationalReview.domain,
          }
        );

        return {
          title:
            bhpOperationalReview.name,

          url:
            bhpOperationalReview.url,

          domain:
            bhpOperationalReview.domain,
        };
      }
    }


    /*
    ------------------------------------------------
    GENERIC FALLBACK
    ------------------------------------------------
    */

    const sourcesToUse =
      recentSources.length > 0
        ? recentSources
        : officialSources;


    if (
      sourcesToUse.length === 0
    ) {

      console.log(
        "[LATEST COMPANY PATH] No official company source found."
      );

      return null;
    }


    /*
    ------------------------------------------------
    FIND NEWEST DATE
    ------------------------------------------------
    */

    const datedSources =
      sourcesToUse.map(
        source => {

          const text =
            `${source.name || ""} ${source.url || ""}`;

          const dateMatches = [

            ...(text.match(
              /\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/g
            ) || []),

            ...(text.match(
              /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}\b/gi
            ) || []),

            ...(text.match(
              /\b(20\d{2})\b/g
            ) || []),

          ];


          let timestamp =
            0;


          for (
            const dateText
            of dateMatches
          ) {

            const parsed =
              Date.parse(
                dateText.replace(
                  /\//g,
                  "-"
                )
              );


            if (
              !Number.isNaN(parsed) &&
              parsed > timestamp
            ) {

              timestamp =
                parsed;

            }

          }


          return {
            source,
            timestamp,
          };

        }
      );


    datedSources.sort(
      (
        a,
        b
      ) =>
        b.timestamp -
        a.timestamp
    );


    const selected =
      datedSources[0]?.source ||
      sourcesToUse[0];


    console.log(
      "[LATEST COMPANY PATH] Selected official source:",
      {
        name:
          selected.name,

        url:
          selected.url,

        domain:
          selected.domain,
      }
    );


    return {

      title:
        selected.name,

      url:
        selected.url,

      domain:
        selected.domain,

    };

  } catch (
    error
  ) {

    console.error(
      "OFFICIAL COMPANY SOURCE ERROR:",
      error
    );

    return null;

  }

}


/*
==================================================
LATEST COMPANY LINK ANSWER
==================================================
*/
function buildLatestCompanyAnswer(
  company: string,
  source: {
    title: string;
    url: string;
    domain: string;
  }
): string {

  return (
    `For the latest ${company.toUpperCase()} information, ` +
    `including production guidance, operational results ` +
    `and company announcements, please refer to the ` +
    `official company source below.`
  );
}
/*
==================================================
MARKET CAP QUESTION DETECTION
==================================================
*/

/*
==================================================
MARKET CAP QUESTION DETECTION
==================================================
*/

function isMarketCapQuestion(message: string): boolean {
  const q = message.toLowerCase();

  const marketCapWords = [
    "market capitalization",
    "market cap",
    "market value",
    "company value",
    "valuation",
  ];

  return marketCapWords.some(word =>
    q.includes(word)
  );
}


function isMarketCapRankingQuestion(
  message: string
): boolean {

  const q =
    message
      .toLowerCase()
      .trim();

  const rankingWords = [
    "top",
    "largest",
    "biggest",
    "ranking",
    "ranked",
    "highest",
    "leading",
  ];

  const hasRankingWord =
    rankingWords.some(
      word =>
        q.includes(word)
    );

  const hasMarketCap =
    q.includes("market capitalization") ||
    q.includes("market cap") ||
    q.includes("market value");

  return (
    hasRankingWord &&
    hasMarketCap
  );
}

/*
==================================================
EXTRACT REQUESTED COMPANIES FROM QUESTION
==================================================

No company names are hard-coded.

Example:

"What is the current market capitalization of
Rio Tinto, BHP, Vale, and Glencore?"

returns:

["Rio Tinto", "BHP", "Vale", "Glencore"]
==================================================
*/

function extractRequestedCompanies(
  message: string
): string[] {

  const q = message.trim();

  /*
  Find the part after "of" and before
  words such as "rank", "compare", etc.
  */

  const match = q.match(
    /\b(?:of|for)\s+(.+?)(?:\s+(?:and\s+)?rank\b|\s+from\s+highest\b|\s+in\s+descending\b|[?.!]?$)/i
  );

  if (!match) {
    return [];
  }

  let companyText =
    match[1]
      .replace(/\?$/, "")
      .trim();

  /*
  Remove common wording that is not a company.
  */

  companyText =
    companyText
      .replace(
        /^(?:the\s+)?(?:current\s+)?market\s+capitali[sz]ation\s+of\s+/i,
        ""
      )
      .trim();

  /*
  Split:

  A, B, C and D

  into:

  A
  B
  C
  D
  */

  const companies =
    companyText
      .split(/\s*,\s*|\s+and\s+/i)
      .map(company =>
        company
          .replace(/^(?:the|a)\s+/i, "")
          .trim()
      )
      .filter(Boolean);

  return [
    ...new Set(companies),
  ];
}


/*
==================================================
NORMALIZE COMPANY NAME
==================================================
*/

function normalizeCompanyName(
  name: string
): string {

  return name
    .toLowerCase()
    .replace(
      /\b(group|limited|ltd|plc|inc|corp|corporation|company|sa|ag)\b/g,
      ""
    )
    .replace(/[^a-z0-9]/g, "");
}


/*
==================================================
EXTRACT MARKET CAP VALUE
==================================================

Handles values such as:

₹21.665 trillion
₹15.060 trillion
$245.4 billion
245.4 billion
21.665 T
15.060 trillion
==================================================
*/

function extractMarketCapValue(
  text: string
): string | null {

  const match =
    text.match(
      /(?:₹|\$|€|£)?\s?\d+(?:,\d{3})*(?:\.\d+)?\s*(?:trillion|billion|million|T|B|M)\b/i
    );

  return match
    ? match[0].trim()
    : null;
}


/*
==================================================
EXTRACT MARKET CAP NUMBER
==================================================

Used only for ranking.

Examples:

21.665 trillion -> 21665000000000
15.060 trillion -> 15060000000000
8.393 billion   -> 8393000000
==================================================
*/

function marketCapToNumber(
  value: string
): number {

  const cleaned =
    value
      .replace(/,/g, "")
      .replace(/[₹$€£]/g, "")
      .trim();

  const match =
    cleaned.match(
      /([\d.]+)\s*(trillion|billion|million|t|b|m)/i
    );

  if (!match) {
    return 0;
  }

  const number =
    Number(match[1]);

  const unit =
    match[2].toLowerCase();

  if (unit === "trillion" || unit === "t") {
    return number * 1_000_000_000_000;
  }

  if (unit === "billion" || unit === "b") {
    return number * 1_000_000_000;
  }

  if (unit === "million" || unit === "m") {
    return number * 1_000_000;
  }

  return number;
}


function extractCompanyMarketCapPairs(
  sourceTexts: string[]
): {
  company: string;
  marketCap: string;
  numericValue: number;
}[] {

  const results: {
    company: string;
    marketCap: string;
    numericValue: number;
  }[] = [];

  const companyValueRegex =
    /(?:^|\n|\r|\d+\.\s*)([A-Z][A-Za-z0-9&.'()\- ]{1,100}?)\s*(?:—|-|:|\|)\s*(?:₹|\$|€|£|¥)?\s*([\d,.]+)\s*(trillion|tn|T|billion|bn|B|million|mn|M)\b/gi;

  const valueCompanyRegex =
    /(?:₹|\$|€|£|¥)?\s*([\d,.]+)\s*(trillion|tn|T|billion|bn|B|million|mn|M)\b\s*(?:—|-|:|\|)\s*([A-Z][A-Za-z0-9&.'()\- ]{1,100})/gi;

  for (const text of sourceTexts) {

    let match;

    while (
      (match = companyValueRegex.exec(text)) !== null
    ) {

      const company =
        match[1].trim();

      const marketCap =
        `${match[2]} ${match[3]}`;

      const numericValue =
        marketCapToNumber(marketCap);

      if (
        company &&
        numericValue > 0
      ) {

        results.push({
          company,
          marketCap,
          numericValue,
        });
      }
    }

    while (
      (match = valueCompanyRegex.exec(text)) !== null
    ) {

      const marketCap =
        `${match[1]} ${match[2]}`;

      const company =
        match[3].trim();

      const numericValue =
        marketCapToNumber(marketCap);

      if (
        company &&
        numericValue > 0
      ) {

        results.push({
          company,
          marketCap,
          numericValue,
        });
      }
    }
  }

  const unique =
    new Map<
      string,
      {
        company: string;
        marketCap: string;
        numericValue: number;
      }
    >();

  for (const item of results) {

    const key =
      normalizeCompanyName(item.company);

    if (
      !unique.has(key) ||
      item.numericValue >
        unique.get(key)!.numericValue
    ) {

      unique.set(key, item);
    }
  }

  return Array.from(unique.values());
}

/*
==================================================
BUILD MARKET CAP ANSWER
==================================================

IMPORTANT:

NO COMPANY NAMES ARE HARDCODED.

The companies come from the user's question.

The market-cap values come from extracted source data.

The ranking is calculated dynamically.
==================================================
*/

/*
==================================================
BUILD MARKET CAP ANSWER
==================================================

IMPORTANT:

- NO hard-coded company names
- Companies are extracted from the user's question
- Market-cap values come only from extractedData
- Each company gets its own value
- Ranking is calculated numerically
- Works with any number of companies
==================================================
*/


function extractRankingLimit(message: string): number {
  const match = message.match(
    /\btop\s+(\d+)\b/i
  );

  if (!match) {
    return 10;
  }

  const limit = Number(match[1]);

  if (!Number.isFinite(limit) || limit <= 0) {
    return 10;
  }

  return Math.min(limit, 100);
}



function buildMarketCapAnswer(
  message: string,
  extractedData: any[]
): string {

  /*
  --------------------------------------------------
  1. EXTRACT COMPANY NAMES FROM USER QUESTION
  --------------------------------------------------

  Examples:

  "What is the market cap of BHP, Rio Tinto and Vale?"

  -> BHP
  -> Rio Tinto
  -> Vale

  "What is the current market capitalization of
   Newmont, Freeport-McMoRan, Barrick Gold,
   and Anglo American?"

  -> Newmont
  -> Freeport-McMoRan
  -> Barrick Gold
  -> Anglo American
  --------------------------------------------------
  */

  function extractRequestedCompanies(
    question: string
  ): string[] {

    const q =
      question
        .replace(/\?/g, "")
        .trim();

    /*
    Find the section after:

    "of"
    "for"
    "between"
    */

    const match =
      q.match(
        /\b(?:of|for|between)\b(.+)$/i
      );

    if (!match) {
      return [];
    }

    let companyPart =
      match[1];

    /*
    Remove ranking/instruction text after
    the company list.
    */

    companyPart =
      companyPart
        .replace(
          /\b(?:rank|ranking|highest|lowest|descending|ascending)\b.*$/i,
          ""
        )
        .trim();

    /*
    Remove common question wording.
    */

    companyPart =
      companyPart
        .replace(
          /\b(?:companies|company|stocks|stock|shares)\b/gi,
          ""
        )
        .trim();

    /*
    Split:

    A, B, C and D

    A, B, C, and D
    */

    const parts =
      companyPart
        .split(
          /\s*,\s*|\s+\band\b\s+|\s+\bor\b\s+/i
        )
        .map(
          item =>
            item
              .trim()
              .replace(
                /^(?:the)\s+/i,
                ""
              )
              .replace(
                /^(?:and|or)\s+/i,
                ""
              )
              .trim()
        )
        .filter(
          item =>
            item.length > 0
        );

    return [
      ...new Set(parts),
    ];
  }


  /*
  --------------------------------------------------
  2. EXTRACT REQUESTED COMPANIES
  --------------------------------------------------
  */

 const rankingQuestion =
  isMarketCapRankingQuestion(message);

const requestedCompanies =
  rankingQuestion
    ? []
    : extractRequestedCompanies(message);

console.log(
  "[MARKET CAP] Ranking question:",
  rankingQuestion
);

console.log(
  "[MARKET CAP] Requested companies:",
  requestedCompanies
);


  /*
  --------------------------------------------------
  3. COLLECT ALL SOURCE INFORMATION
  --------------------------------------------------
  */

  const sourceTexts =
    extractedData
      .map(
        source =>
          String(
            source.information || ""
          ).trim()
      )
      .filter(
        text =>
          text.length > 0
      );


  if (
    sourceTexts.length === 0
  ) {

    return "";
  }



  /*
--------------------------------------------------
RANKING QUESTION
--------------------------------------------------

For ranking questions we DO NOT extract company
names from the user question.

The companies must come from the source data.
--------------------------------------------------
*/

if (rankingQuestion) {

  const limit =
    extractRankingLimit(
      message
    );

  console.log(
    "[MARKET CAP] Dynamic ranking limit:",
    limit
  );

  const dynamicResults =
    extractCompanyMarketCapPairs(
      sourceTexts
    );

  console.log(
    "[MARKET CAP] Dynamically extracted companies:",
    dynamicResults
  );

  if (
    dynamicResults.length === 0
  ) {

    console.log(
      "[MARKET CAP] No company/market-cap pairs found."
    );

    return "";
  }


  

  /*
  ------------------------------------------------
  SORT HIGHEST -> LOWEST
  ------------------------------------------------
  */

  dynamicResults.sort(
    (a, b) =>
      b.numericValue -
      a.numericValue
  );

  /*
  ------------------------------------------------
  TAKE REQUESTED TOP N
  ------------------------------------------------
  */

  const topResults =
    dynamicResults.slice(
      0,
      limit
    );

  /*
  ------------------------------------------------
  BUILD ANSWER
  ------------------------------------------------
  */

  const answerLines =
    topResults.map(
      (item, index) =>
        `${index + 1}. ${item.company} — ${item.marketCap}`
    );

  return [
    `Top ${topResults.length} mining companies by market capitalization:`,
    "",
    ...answerLines,
  ].join("\n");
}

  /*
  --------------------------------------------------
  4. MARKET CAP VALUE PARSER
  --------------------------------------------------

  Supports examples such as:

  ₹21.665 trillion
  ₹15.060 trillion
  $226.29 B
  $157.30 B
  €195.20 B
  21.665 trillion
  87.67 B
  5.573 T
  --------------------------------------------------
  */

  function parseMarketCapValue(
    valueText: string
  ): number | null {

    const cleaned =
      valueText
        .replace(
          /,/g,
          ""
        )
        .trim();


    const match =
      cleaned.match(
        /([\d]+(?:\.\d+)?)\s*(trillion|tn|t|billion|bn|b|million|mn|m)?/i
      );


    if (!match) {
      return null;
    }


    const number =
      Number(
        match[1]
      );


    if (
      !Number.isFinite(number)
    ) {
      return null;
    }


    const unit =
      String(
        match[2] || ""
      ).toLowerCase();


    if (
      unit === "trillion" ||
      unit === "tn" ||
      unit === "t"
    ) {

      return number * 1_000_000_000_000;
    }


    if (
      unit === "billion" ||
      unit === "bn" ||
      unit === "b"
    ) {

      return number * 1_000_000_000;
    }


    if (
      unit === "million" ||
      unit === "mn" ||
      unit === "m"
    ) {

      return number * 1_000_000;
    }


    return number;
  }


  /*
  --------------------------------------------------
  5. FIND MARKET CAP NEAR COMPANY NAME
  --------------------------------------------------

  We do NOT use a company list.

  We use the company name extracted from
  the user's question.
  --------------------------------------------------
  */

  function findCompanyMarketCap(
    company: string,
    text: string
  ): {
    displayValue: string;
    numericValue: number;
  } | null {


    /*
    Escape company name so characters such as
    "-" and "(" do not break the regex.
    */

    const escapedCompany =
      company.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );


    /*
    Market-cap value pattern.

    Examples:

    ₹21.665 trillion
    $226.31 B
    €195.20 B
    21.665 trillion
    87.67 B
    */

    const valuePattern =
      /(?:₹|\$|€|£|¥)?\s*\d[\d,]*(?:\.\d+)?\s*(?:trillion|tn|T|billion|bn|B|million|mn|M|T)?/i;


    /*
    ------------------------------------------------
    A. COMPANY -> VALUE
    ------------------------------------------------

    Example:

    BHP Group — ₹21.665 trillion

    Rio Tinto ₹15.060 trillion
    */

    const afterCompany =
      new RegExp(
        escapedCompany +
          "[^\\n]{0,250}?" +
          "(" +
          valuePattern.source +
          ")",
        "i"
      );


    const afterMatch =
      text.match(
        afterCompany
      );


    if (
      afterMatch &&
      afterMatch[1]
    ) {

      const numericValue =
        parseMarketCapValue(
          afterMatch[1]
        );


      if (
        numericValue !== null
      ) {

        return {
          displayValue:
            afterMatch[1].trim(),

          numericValue,
        };
      }
    }


    /*
    ------------------------------------------------
    B. VALUE -> COMPANY
    ------------------------------------------------

    Handles:

    ₹21.665 trillion — BHP Group
    ₹21.665 trillion BHP Group
    */

    const beforeCompany =
      new RegExp(
        "(" +
          valuePattern.source +
          ")" +
          "[^\\n]{0,250}?" +
          escapedCompany,
        "i"
      );


    const beforeMatch =
      text.match(
        beforeCompany
      );


    if (
      beforeMatch &&
      beforeMatch[1]
    ) {

      const numericValue =
        parseMarketCapValue(
          beforeMatch[1]
        );


      if (
        numericValue !== null
      ) {

        return {
          displayValue:
            beforeMatch[1].trim(),

          numericValue,
        };
      }
    }


    return null;
  }


  /*
  --------------------------------------------------
  6. FIND EACH REQUESTED COMPANY
  --------------------------------------------------
  */

  const results: {
    company: string;
    marketCap: string;
    numericValue: number;
  }[] = [];


  for (
    const requestedCompany
    of requestedCompanies
  ) {

    let found:
      {
        displayValue: string;
        numericValue: number;
      } | null =
      null;


    /*
    Search every extracted source.

    Do NOT stop after finding the first source
    if it does not contain a valid value.
    */

    for (
      const sourceText
      of sourceTexts
    ) {

      found =
        findCompanyMarketCap(
          requestedCompany,
          sourceText
        );


      if (
        found
      ) {
        break;
      }
    }


    /*
    ------------------------------------------------
    If exact company name is not found, try a
    normalized comparison against text.
    ------------------------------------------------
    */

    if (
      !found
    ) {

      const normalizedRequested =
        requestedCompany
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );


      for (
        const sourceText
        of sourceTexts
      ) {

        const words =
          sourceText
            .split(
              /\s+/
            );


        /*
        Build small windows from source text
        and compare normalized text.

        This helps with:

        Freeport-McMoRan
        Freeport McMoRan
        Anglo American plc
        BHP Group
        Rio Tinto plc
        */

        for (
          let i = 0;
          i < words.length;
          i++
        ) {

          for (
            let size = 1;
            size <= 5;
            size++
          ) {

            const candidate =
              words
                .slice(
                  i,
                  i + size
                )
                .join(" ");


            const normalizedCandidate =
              candidate
                .toLowerCase()
                .replace(
                  /[^a-z0-9]/g,
                  ""
                );


            if (
              normalizedCandidate !==
              normalizedRequested
            ) {
              continue;
            }


            found =
              findCompanyMarketCap(
                candidate,
                sourceText
              );


            if (
              found
            ) {
              break;
            }
          }


          if (
            found
          ) {
            break;
          }
        }


        if (
          found
        ) {
          break;
        }
      }
    }


    /*
    ------------------------------------------------
    ADD ONLY IF A REAL VALUE WAS FOUND
    ------------------------------------------------
    */

    if (
      found
    ) {

      results.push({
        company:
          requestedCompany,

        marketCap:
          found.displayValue,

        numericValue:
          found.numericValue,
      });

    } else {

      console.log(
        `[MARKET CAP] No value found for ${requestedCompany}`
      );

    }
  }


  /*
  --------------------------------------------------
  7. REQUIRE AT LEAST ONE RESULT
  --------------------------------------------------
  */

  if (
    results.length === 0
  ) {

    return "";
  }


  /*
  --------------------------------------------------
  8. SORT HIGHEST -> LOWEST
  --------------------------------------------------
  */

  results.sort(
    (
      a,
      b
    ) =>
      b.numericValue -
      a.numericValue
  );


  /*
  --------------------------------------------------
  9. BUILD FINAL ANSWER
  --------------------------------------------------
  */

  const answerLines =
    results.map(
      (
        item,
        index
      ) =>
        `${index + 1}. ${item.company} — ${item.marketCap}`
    );


  return [
    "Current market capitalization ranking:",
    "",
    ...answerLines,
  ].join("\n");
}


/*
==================================================
RELATED SOURCE
==================================================
Only return ONE relevant source.
Remove duplicate URLs.
==================================================
*/

function getRelatedSource(
  extractedData: any[],
  message: string
) {

  if (
    !extractedData ||
    extractedData.length === 0
  ) {
    return null;
  }

  const q =
    message.toLowerCase();

  /*
  ==================================================
  SOURCE TYPE KEYWORDS
  ==================================================
  */

  const productionQuestion =
    q.includes("production") ||
    q.includes("produced") ||
    q.includes("output") ||
    q.includes("tonnes") ||
    q.includes("tons");

  const copperQuestion =
    q.includes("copper");

  /*
  ==================================================
  REMOVE OBVIOUSLY UNRELATED SOURCES
  ==================================================
  */

  const relevantSources =
    extractedData.filter(source => {

      const text =
        `${source.source || ""} ${source.information || ""} ${source.title || ""} ${source.url || ""}`
          .toLowerCase();

      /*
      Never use market-cap sources for production
      questions.
      */

      if (
        productionQuestion &&
        (
          text.includes("companiesmarketcap") ||
          text.includes("market cap") ||
          text.includes("market capitalization")
        )
      ) {
        return false;
      }

      /*
      Copper production question:
      source should contain copper/production
      related information.
      */

      if (
        productionQuestion &&
        copperQuestion
      ) {

        return (
          text.includes("copper") &&
          (
            text.includes("production") ||
            text.includes("produced") ||
            text.includes("output") ||
            text.includes("tonnes") ||
            text.includes("tons")
          )
        );
      }

      return true;
    });

  /*
  ==================================================
  NO RELEVANT SOURCE
  ==================================================
  */

  if (
    relevantSources.length === 0
  ) {
    return null;
  }

  /*
  ==================================================
  PICK BEST SOURCE
  ==================================================
  */

  const source =
    relevantSources[0];

  return {
    name:
      source.source,

    url:
      source.url,

    date:
      source.informationDate,

    publicationDate:
      source.publicationDate,
  };
}


/*
==================================================
POST
==================================================
*/

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();


    const message =
      String(
        body.message || ""
      ).trim();


    const conversationId =
      String(
        body.conversationId || ""
      ).trim();

    const clientHistory: Array<{ role: "user" | "assistant"; content: string }> =
      Array.isArray(body.history)
        ? body.history
            .filter((m: any) => m && typeof m.content === "string")
            .map((m: any) => ({
              role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
              content: String(m.content),
            }))
        : [];


    /*
    ==================================================
    VALIDATION
    ==================================================
    */

    if (
      !conversationId
    ) {

      return Response.json(
        {
          error:
            "Conversation ID is required",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !message
    ) {

      return Response.json(
        {
          error:
            "Message is required",
        },
        {
          status: 400,
        }
      );
    }

    

    /*
    ==================================================
    LOAD PRIOR CONVERSATION HISTORY & CONTEXT
    ==================================================
    */
    const priorHistory =
      clientHistory.length > 0
        ? clientHistory
        : await getConversationHistory(conversationId);

    const isVerificationOrFollowUp =
      priorHistory.length > 0 &&
      (/\b(verify|verification|audit|fact[- ]?check|previous answer|earlier answer|prior answer|what you said|above answer|correct(?:ed|ion)?|outdated|unsupported)\b/i.test(
        message
      ) ||
        (/\b(why|how come|clarify|elaborate|what about|sources|proof|evidence|are you sure)\b/i.test(
          message
        ) &&
          message.split(/\s+/).length <= 15));

    const lastUserTurn = [...priorHistory].reverse().find((m) => m.role === "user");

    /*
    ==================================================
    SAVE USER MESSAGE
    ==================================================
    */

    void saveConversationMessage(
      conversationId,
      "user",
      message
    );


    /*
    ==================================================
    STREAM CONTROLLER
    ==================================================
    */

    const encoder =
      new TextEncoder();


    let controllerRef:
      ReadableStreamDefaultController<Uint8Array> |
      null =
      null;


    const stream =
      new ReadableStream<Uint8Array>({

        start(
          controller
        ) {

          controllerRef =
            controller;
        },

        cancel() {

          controllerRef =
            null;
        },

      });


    /*
    ==================================================
    SEND
    ==================================================
    */

    function send(
      type: string,
      data: unknown
    ) {

      if (
        !controllerRef
      ) {
        return;
      }

      try {

        controllerRef.enqueue(

          encoder.encode(

            JSON.stringify({
              type,
              data,
            }) + "\n"

          )

        );

      } catch (
        error
      ) {

        console.error(
          "STREAM SEND ERROR:",
          error
        );
      }
    }
function sendRelatedSource(
  extractedData: any[],
  message: string
) {

  const source =
    getRelatedSource(
      extractedData,
      message
    );

  if (!source) {
    return;
  }

  send(
    "sources",
    [source]
  );
}

    /*
    ==================================================
    CLOSE
    ==================================================
    */

    function close() {

      if (
        controllerRef
      ) {

        try {

          controllerRef.close();

        } catch {
          // Stream already closed
        }

        controllerRef =
          null;
      }
    }


    

    /*
    ==================================================
    BACKGROUND PROCESS
    ==================================================
    */

    (async () => {

      try {

        console.log(
          "=========================================="
        );

        console.log(
          "MINING DISCOVERY AI"
        );

        console.log(
          "USER QUESTION:",
          message
        );

        console.log(
          "CONVERSATION ID:",
          conversationId
        );

        console.log(
          "=========================================="
        );


        /* ==================================================
   HARD-CODED GREETING REPLY
   ================================================== */

const normalizedMessage = message
  .toLowerCase()
  .trim()
  .replace(/[!?.,]+$/g, "");

const greetings = [
  "hi",
  "hello",
  "hlo",
  "hey",
  "hi there",
  "hello there",
  "hey there",
];

if (greetings.includes(normalizedMessage)) {

  const greetingReply =
    "Hello! I am Mining Discovery AI Assistant. How can I assist you with mining or minerals today?";

  void saveConversationMessage(
    conversationId,
    "assistant",
    greetingReply
  );

  send(
    "answer",
    greetingReply
  );

  send(
    "done",
    true
  );

  close();

  return;
}



        /*
        ==================================================
        DETECT
        ==================================================
        */

        const current =
          needsCurrentData(
            message
          );

        const topic =
          detectTopic(
            message
          );

        const commodity =
          detectCommodity(
            message
          );

        const company =
          detectCompany(
            message
          );

        const country =
          detectCountry(
            message
          );

        const useGlobalSearch =
          shouldUseGlobalMiningSearch(
            message
          );

        /*
        ==================================================
        EXECUTIVE LEADERSHIP & RECENT EVENTS FAST-TRACK
        ==================================================
        For queries about:
        - CEOs, Directors, and C-Suite Leadership
        - Recent industry events, mega-M&A, restructuring
        - Future impact and upcoming catalysts
        ==================================================
        */
        if (isExecutiveOrEventsQuestion(message)) {
          console.log(
            "[EXECUTIVE & EVENTS PATH] Leadership / future impact detected."
          );

          const allDetected = detectCompanies(message);
          const entityLabel = allDetected.length > 0
            ? allDetected.join(", ").toUpperCase()
            : (company ? company.toUpperCase() : "GLOBAL MINING");

          send(
            "status",
            `Accessing leadership dossier & intelligence for ${entityLabel}...`
          );

          const majorKeywords = [
            "bhp", "rio tinto", "vale", "freeport", "fcx", "anglo", "glencore",
            "teck", "barrick", "newmont", "fortescue", "lundin", "ivanhoe", "zijin",
            "agnico", "southern copper", "scco", "first quantum", "antofagasta"
          ];
          const hasKnownMajor = majorKeywords.some(k => message.toLowerCase().includes(k));
          const hasGeneralDeals =
            /\b(director|directors|head|heads|ceo|ceos|leadership|executive|executives|board|governance|mega[- ]?deal|deal|deals|recent event|recent events|latest events|events in the mining|what(?:['’]?s| is| its| it's)? (?:gonna|going to) happen|future impact|what will happen|what happens next|copper supply|ai datacenter|gold price|central bank|arcadium|vicuna|vicuña|cobre panama|simandou)\b/i.test(message);

          let execSources: any[] = [];
          if (hasKnownMajor || hasGeneralDeals) {
            // Speed optimization: Race against a 1200ms timeout so tokens begin streaming almost instantly
            try {
              execSources = await Promise.race([
                fetchSourcesForQuestion(message),
                new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1200)),
              ]);
            } catch {
              execSources = [];
            }
          } else {
            execSources = await fetchSourcesForQuestion(message);
          }

          send(
            "status",
            "Synthesizing executive briefing & future impact..."
          );

          let execAnswer = "";
          try {
            execAnswer = await createMiningAnswerStream(
              message,
              execSources,
              (chunk) => {
                send("answer", chunk);
              },
              priorHistory
            );
          } catch (err) {
            console.error("[EXECUTIVE PATH] Error:", err);
            execAnswer = "Unable to complete executive briefing at this moment. Please try again.";
            send("answer", execAnswer);
          }

          if (execAnswer.trim()) {
            void saveConversationMessage(
              conversationId,
              "assistant",
              execAnswer.trim()
            );
          }

          const execChart = buildChartForAnswer(message, execAnswer);
          if (execChart) {
            send("chart", execChart);
          }

          if (execSources.length > 0) {
            send(
              "sources",
              execSources.map((source) => ({
                name: source.title || source.name,
                url: source.url,
                domain: source.domain,
              }))
            );
          }

          send("done", true);
          close();
          return;
        }

          /*
==================================================
MARKET CAP PATH
==================================================

Market capitalization questions must retrieve
current market-cap information from the registered
market-cap source.

Example:

"What is the current market capitalization of
Rio Tinto, BHP, Vale, and Glencore?"

Do not let this fall into the normal AI answer path.
==================================================
*/

if (
  isMarketCapQuestion(message)
) {

  console.log(
    "[MARKET CAP PATH] Market capitalization question detected."
  );

  send(
    "status",
    "Fetching current market capitalization data..."
  );

  /*
  --------------------------------------------------
  FETCH REGISTERED MARKET CAP SOURCES
  --------------------------------------------------
  */

  const fetchedMarketCapSources =
    await fetchSourcesForQuestion(
      message
    );

  console.log(
    "[MARKET CAP PATH] Sources:",
    fetchedMarketCapSources.map(
      source => ({
        name: source.name,
        domain: source.domain,
        url: source.url,
        status: source.status,
      })
    )
  );

  let marketCapAnswer = "";
  let extractedMarketCapData: any[] = [];

  if (fetchedMarketCapSources.length > 0) {
    send(
      "status",
      "Verifying market capitalization data..."
    );

    extractedMarketCapData =
      await extractSourceData(
        message,
        fetchedMarketCapSources
      );

    marketCapAnswer =
      buildMarketCapAnswer(
        message,
        extractedMarketCapData
      );
  }

  /*
  --------------------------------------------------
  IF REGEX EXTRACTION DID NOT SUCCEED, FALL BACK TO AI
  --------------------------------------------------
  */
  if (!marketCapAnswer.trim()) {
    console.log(
      "[MARKET CAP PATH] Falling back to AI mining intelligence stream..."
    );

    send(
      "status",
      "Analyzing market capitalization and company intelligence..."
    );

    let aiFallbackAnswer = "";

    try {
      aiFallbackAnswer =
        await createMiningAnswerStream(
          message,
          fetchedMarketCapSources,
          (chunk) => {
            send("answer", chunk);
          },
          priorHistory
        );
    } catch (err) {
      console.error(
        "[MARKET CAP PATH] AI fallback stream failed:",
        err
      );
      aiFallbackAnswer =
        "I couldn't verify current market capitalization data for the requested companies from the available sources.";
      send("answer", aiFallbackAnswer);
    }

    if (aiFallbackAnswer.trim()) {
      void saveConversationMessage(
        conversationId,
        "assistant",
        aiFallbackAnswer.trim()
      );
    }

    const fallbackChart =
      buildChartForAnswer(
        message,
        aiFallbackAnswer
      );

    if (fallbackChart) {
      send("chart", fallbackChart);
    }

    if (fetchedMarketCapSources.length > 0) {
      send(
        "sources",
        fetchedMarketCapSources.map(source => ({
          name: source.title || source.name,
          url: source.url,
          domain: source.domain,
        }))
      );
    }

    send("done", true);
    close();
    return;
  }

    const chart =
  buildChartForAnswer(
    message,
    marketCapAnswer
  );
  /*
  --------------------------------------------------
  SEND ANSWER
  --------------------------------------------------
  */

  void saveConversationMessage(
    conversationId,
    "assistant",
    marketCapAnswer
  );

  const chunkSize = 60;

  for (
    let i = 0;
    i < marketCapAnswer.length;
    i += chunkSize
  ) {

    const chunk =
      marketCapAnswer.slice(
        i,
        i + chunkSize
      );

    send(
      "answer",
      chunk
    );

    await sleep(5);
  }

  
/*
--------------------------------------------------
SEND CHART
--------------------------------------------------
*/

if (chart) {

  console.log(
    "[CHART] Sending chart:",
    JSON.stringify(chart, null, 2)
  );

  send(
    "chart",
    chart
  );
}

  /*
  --------------------------------------------------
  SEND SOURCES
  --------------------------------------------------
  */

  send(
    "sources",
    extractedMarketCapData.map(
      source => ({
        name:
          source.source,

        url:
          source.url,

        date:
          source.informationDate,

        publicationDate:
          source.publicationDate,
      })
    )
  );

  send(
    "done",
    true
  );

  close();

  return;
}

          /*
==================================================
LATEST COMPANY PATH
==================================================

For questions such as:

"What is BHP's latest copper production?"

Fetch official sources and stream a real answer.
*/

if (
  isLatestCompanyQuestion(message) &&
  company
) {

  console.log(
    "[LATEST COMPANY PATH] Fetching live data for company question."
  );

  const allDetected = detectCompanies(message);
  const companyLabel = allDetected.length > 1
    ? allDetected.join(", ").toUpperCase()
    : company.toUpperCase();

  send(
    "status",
    `Searching the latest ${companyLabel} information...`
  );

  const companyFetched =
    await fetchSourcesForQuestion(
      message
    );

  send(
    "status",
    "Preparing answer..."
  );

  let companyAnswer = "";

  companyAnswer =
    await createMiningAnswerStream(
      message,
      companyFetched,
      (chunk) => {
        send(
          "answer",
          chunk
        );
      },
      priorHistory
    );

  if (
    companyAnswer.trim()
  ) {
    void saveConversationMessage(
      conversationId,
      "assistant",
      companyAnswer.trim()
    );
  }

  const companyChart =
    buildChartForAnswer(
      message,
      companyAnswer
    );

  if (companyChart) {
    send(
      "chart",
      companyChart
    );
  }

  send(
    "sources",
    companyFetched.map(source => ({
      name: source.title || source.name,
      url: source.url,
      domain: source.domain,
    }))
  );

  send(
    "done",
    true
  );

  close();

  return;
}


          /*
==================================================
DIRECT COMMODITY PRICE PATH
==================================================

Commodity price questions must use only
trusted live commodity sources.

Do NOT run global web discovery.
*/

if (
  isCommodityPriceQuestion(message)
) {

  console.log(
    "[DIRECT PRICE PATH] Commodity price detected."
  );

  send(
    "status",
    "Checking live commodity price..."
  );

  const fetchedPriceSources =
    await fetchSourcesForQuestion(
      message
    );

  console.log(
    "[DIRECT PRICE PATH] Sources:",
    fetchedPriceSources.map(
      source => source.name
    )
  );

  if (
    fetchedPriceSources.length === 0
  ) {

    const answer =
      "I couldn't retrieve a reliable live price for that commodity right now.";

    void saveConversationMessage(
      conversationId,
      "assistant",
      answer
    );

    send(
      "answer",
      answer
    );

    send(
      "done",
      true
    );

    close();

    return;
  }

  send(
    "status",
    "Streaming live commodity price..."
  );

  let priceAnswer = "";

  priceAnswer =
    await createMiningAnswerStream(
      message,
      fetchedPriceSources,
      (chunk) => {
        send(
          "answer",
          chunk
        );
      },
      priorHistory
    );

  if (
    priceAnswer.trim()
  ) {
    void saveConversationMessage(
      conversationId,
      "assistant",
      priceAnswer.trim()
    );
  }

  // Charts disabled for commodity prices to prevent parsing unstructured prose

  send(
    "sources",
    fetchedPriceSources.map(
      source => ({
        name:
          source.title ||
          source.name,

        url:
          source.url,

        domain:
          source.domain,
      })
    )
  );

  send(
    "done",
    true
  );

  close();

  return;
}


/*
==================================================
LATEST COMPANY DATA
==================================================

For latest company information:

DO NOT generate a potentially stale number.

Instead:
- identify the company
- find its registered official source
- give the user the official company link
==================================================
*/



        console.log(
          "CURRENT DATA:",
          current
        );

        console.log(
          "TOPIC:",
          topic
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
          "COUNTRY:",
          country
        );

        console.log(
          "USE GLOBAL SEARCH:",
          useGlobalSearch
        );


        /*
        ==================================================
        BASIC KNOWLEDGE BRANCH
        ==================================================

        Used for educational questions.

        Example:

        What is open pit mining?

        What is flotation?

        What is a mineral resource?
        ==================================================
        */

        if (
          !useGlobalSearch
        ) {

          const knowledgeText =
            typeof miningAgentKnowledge ===
              "string"

              ? miningAgentKnowledge

              : JSON.stringify(
                  miningAgentKnowledge,
                  null,
                  2
                );


          const systemPrompt = `
You are the Mining Discovery AI Assistant.

==================================================
MINING DISCOVERY KNOWLEDGE BASE
==================================================

${knowledgeText}

==================================================
COMPANY KNOWLEDGE
==================================================

${companyContext}

==================================================
ROLE
==================================================

You are a global mining-focused AI assistant.

You can answer questions about:

- mining
- minerals
- mines
- geology
- mineral processing
- exploration
- mining equipment
- mine safety
- mining economics
- mining engineering
- commodities
- mining operations
- mining terminology
- mining technology

==================================================
RULES
==================================================

Use the knowledge base when appropriate.

Do not invent Mining Discovery information.

Do not invent employees.

Do not invent executives.

Do not invent services.

Do not invent prices.

Do not invent addresses.

Do not invent phone numbers.

Do not invent partnerships.

If a question specifically asks about Mining
Discovery and the information is unavailable,
clearly say that it is unavailable.

Do not pretend to be a Mining Discovery employee.

Identify yourself as an AI assistant.

For investment questions, provide general
educational information only.

Do not guarantee financial returns.

Do not include source names or URLs for this
basic educational response.

Answer clearly and professionally.

If the question is completely unrelated to
mining, respond exactly:

I'm a mining-focused AI assistant. I can only answer questions related to mining, minerals, mines, mining companies, mining projects, commodities, exploration, geology, processing, equipment, safety, regulations, and the global mining industry.
`;


          let answer =
            "";


          const responseStream =
            await openai.responses.create({

              model:
                MODEL,

              instructions:
                systemPrompt,

              input:
                message,

              stream:
                true,

            });


          for await (
            const event of
              responseStream
          ) {

            if (
              event.type ===
              "response.output_text.delta"
            ) {

              const chunk =
                event.delta;

              answer +=
                chunk;

              send(
                "answer",
                chunk
              );
            }
          }


         if (answer.trim()) {
  void saveConversationMessage(
    conversationId,
    "assistant",
    answer.trim()
  );
}

/* SEND CHART IF ANSWER NEEDS ONE */
const chart = buildChartForAnswer(
  message,
  answer
);

if (chart) {
  console.log(
    "[CHART] Sending chart:",
    JSON.stringify(chart, null, 2)
  );

  send(
    "chart",
    chart
  );
}

send(
  "done",
  true
);

          close();

          return;
        }


        /*
        ==================================================
        GLOBAL MINING DATA BRANCH
        ==================================================

        IMPORTANT:

        We no longer call:

        getSourcesForQuestion()
        fetchSources()

        Instead:

        fetchSourcesForQuestion()

        performs:

        trusted sources
              +
        global web discovery
              +
        source fetching
        ==================================================
        */

        send(
          "status",
          "Searching trusted mining sources..."
        );

        const queryForSources =
          isVerificationOrFollowUp &&
          lastUserTurn &&
          !detectCommodity(message) &&
          !detectCompany(message)
            ? `${lastUserTurn.content} ${message}`
            : message;

        const fetchedSources =
          await fetchSourcesForQuestion(
            queryForSources
          );


        console.log(
          "=========================================="
        );

        console.log(
          "FETCHED GLOBAL SOURCES"
        );

        console.log(
          fetchedSources.map(
            source => ({

              name:
                source.name,

              domain:
                source.domain,

              status:
                source.status,

              length:
                source.text.length,

              priority:
                source.priority,

              url:
                source.url,

            })
          )
        );

        console.log(
          "=========================================="
        );


        /*
        ==================================================
        NO SOURCES
        ==================================================
        */

        if (
          fetchedSources.length ===
          0
        ) {

          const answer =
            "I couldn't retrieve reliable information for that mining question right now. Please try again.";

          void saveConversationMessage(
            conversationId,
            "assistant",
            answer
          );

          send(
            "answer",
            answer
          );

          send(
            "done",
            true
          );

          close();

          return;
        }


        /*
        ==================================================
        FINAL ANSWER STREAM
        ==================================================
        */

        send(
          "status",
          "Preparing answer..."
        );

        let finalAnswer = "";

        finalAnswer =
          await createMiningAnswerStream(
            message,
            fetchedSources,
            (chunk) => {
              send(
                "answer",
                chunk
              );
            },
            priorHistory
          );

        console.log(
          "[FINAL ANSWER]:",
          finalAnswer
        );

        if (
          finalAnswer.trim()
        ) {
          void saveConversationMessage(
            conversationId,
            "assistant",
            finalAnswer.trim()
          );
        }

        const chart =
          buildChartForAnswer(
            message,
            finalAnswer
          );

        if (chart) {
          console.log(
            "[CHART] Sending chart:",
            JSON.stringify(
              chart,
              null,
              2
            )
          );

          send(
            "chart",
            chart
          );
        }

        send(
          "sources",
          fetchedSources.map(source => ({
            name: source.title || source.name,
            url: source.url,
            domain: source.domain,
          }))
        );

        send(
          "done",
          true
        );

        close();

      } catch (
        error
      ) {

        console.error(
          "STREAM ERROR:",
          error
        );


        const errorMessage =
          "AI response failed. Please try again.";


        void saveConversationMessage(
          conversationId,
          "assistant",
          errorMessage
        );


        send(
          "answer",
          errorMessage
        );


        send(
          "done",
          true
        );


        close();
      }

    })();


    /*
    ==================================================
    RETURN STREAM
    ==================================================
    */

    return new Response(
      stream,
      {
        headers: {

          "Content-Type":
            "application/x-ndjson; charset=utf-8",

          "Cache-Control":
            "no-cache, no-transform",

          "Connection":
            "keep-alive",

          "Access-Control-Allow-Origin":
            FRONTEND_URL,

          "Access-Control-Allow-Methods":
            "POST, OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type",
        },
      }
    );

  } catch (
    error
  ) {

    console.error(
      "CHAT API ERROR:",
      error
    );


    return Response.json(

      {
        error:
          "AI response failed",
      },

      {
        status: 500,
      }
    );
  }
}


/*
==================================================
OPTIONS
==================================================
*/

export async function GET() {
  return Response.json(
    {
      status: "ok",
      name: "Mining AI Chatbot API",
      message: "Chat service is active and operational. Submit messages via POST /api/chat.",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": FRONTEND_URL,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function OPTIONS() {

  return new Response(
    null,
    {
      status: 204,

      headers: {

        "Access-Control-Allow-Origin":
          FRONTEND_URL,

        "Access-Control-Allow-Methods":
          "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type",
      },
    }
  );
}

// Trigger recompile
