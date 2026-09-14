import {
  openai,
  MODEL,
} from "./openai";

import type {
  FetchedSource,
} from "./source-fetcher";

/*
==================================================
EXTRACTED DATA TYPE
==================================================
*/
export type ExtractedData = {
  source: string;
  url: string;
  domain: string;
  title: string;

  sourceType:
    | "official_company"
    | "government"
    | "regulator"
    | "exchange"
    | "news"
    | "financial"
    | "commodity"
    | "mining_publication"
    | "other";

  information: string;

  company?: string;
  ticker?: string;
  marketCap?: number;
  currency?: string;
  rank?: number;
  country?: string;

  year?: number;

  status:
    | "actual"
    | "guidance"
    | "forecast"
    | "estimate"
    | "unknown";

  informationDate: string | null;
  publicationDate: string | null;
  reportingPeriod: string | null;

  confidence:
    | "high"
    | "medium"
    | "low";
};

/*
==================================================
SOURCE TYPE
==================================================
*/

const SOURCE_TYPES = [
  "official_company",
  "government",
  "regulator",
  "exchange",
  "news",
  "financial",
  "commodity",
  "mining_publication",
  "other",
] as const;

/*
==================================================
CONFIDENCE
==================================================
*/

const CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
] as const;

/*
==================================================
EXTRACT DATA FROM SOURCES
==================================================
*/

export async function extractSourceData(
  question: string,
  sources: FetchedSource[]
): Promise<ExtractedData[]> {

  /*
  --------------------------------------------------
  ONLY SUCCESSFUL SOURCES
  --------------------------------------------------
  */

  const usableSources =
    sources.filter(
      (source) =>
        source.status === "success" &&
        source.text.trim().length > 0
    );

  if (
    usableSources.length === 0
  ) {
    console.log(
      "SOURCE EXTRACTION: No usable sources"
    );

    return [];
  }

  /*
  --------------------------------------------------
  LIMIT SOURCE CONTENT
  --------------------------------------------------
  */
const extractionSources = usableSources.slice(0, 4);
const sourceText =
  extractionSources
      .map(
        (source, index) => `
==================================================
SOURCE ${index + 1}
==================================================

SOURCE NAME:
${source.name}

EXACT FETCHED URL:
${source.url}

DOMAIN:
${source.domain}

SOURCE TYPE:
${source.type}

FETCHED AT:
${source.fetchedAt}

SOURCE CONTENT:
${source.text.slice(0, 30000)}
`
      )
      .join("\n");

  /*
  --------------------------------------------------
  SYSTEM INSTRUCTIONS
  --------------------------------------------------
  */

  const instructions = `
You are the source extraction engine for
Mining Discovery AI.

Your job is ONLY to extract factual information
from the supplied source content.

==================================================
ABSOLUTE RULES
==================================================

Use ONLY the supplied source content.

DO NOT browse the web.

DO NOT use external knowledge.

DO NOT use your training knowledge to fill gaps.

DO NOT guess.

DO NOT invent facts.

DO NOT invent dates.

DO NOT invent URLs.

DO NOT invent page titles.

DO NOT combine unrelated sources into one fact.

If a fact is not supported by the supplied source,
DO NOT return it.

==================================================
USER QUESTION
==================================================

${question}

==================================================
SOURCE URL RULE
==================================================

The "url" field MUST correspond to one of the
EXACT FETCHED URL values supplied below.

Never create a URL.

Never modify a URL.

Never replace a specific page URL with a homepage.

For example:

If supplied URL is:

https://example.com/news/botswana-copper-expansion

return:

https://example.com/news/botswana-copper-expansion

NOT:

https://example.com



==================================================
TITLE RULE
==================================================

Return the exact page title if it is explicitly
available in the supplied source.

Do not create a title.

Do not shorten a title.

If the title cannot be determined:

"title": ""

==================================================
RELEVANCE RULE
==================================================

Only return sources that actually contain
information relevant to the user's question.

Do not return unrelated sources.

==================================================
LATEST / CURRENT QUESTIONS
==================================================

If the user asks:

latest
current
today
now
recent
most recent
For latest/current questions:

Extract every relevant dated value supported by the supplied sources.

Do NOT decide freshness solely during extraction.

Preserve:
- informationDate
- publicationDate
- reportingPeriod
- year when explicitly available
- status when explicitly available
- exact value
- exact unit
- exact source

The application validation layer will determine which dataset is the latest valid dataset.

Do not assume that the newest-looking source
is automatically current.

Use the dates present in the source.



==================================================
LATEST GUIDANCE DATE LOGIC
==================================================

For production guidance questions, determine
whether the reporting period has already ended.

If the current date is after the end of the
guidance period, do NOT present that completed
period's guidance as the "latest guidance".

For example:

If the question is asked in August 2026 and
FY2026 ended on June 30, 2026:

FY2026 guidance is historical.

If FY2027 guidance is available in the supplied
sources, use FY2027 guidance instead.

Always prefer the newest FUTURE or CURRENT
guidance period when the user asks for "latest"
guidance.

Do not confuse:

- actual production
- historical guidance
- current guidance
- future guidance

For production guidance, the answer must identify
the financial year or reporting period.

Never return a historical guidance range as the
latest guidance when a newer guidance period is
available.



==================================================
FACTUAL PREMISE VERIFICATION
==================================================

The user's question may contain an assumption that is
true, false, or unsupported.

Do NOT assume that the user's premise is true.

Your job is to extract evidence that allows the final
answer generator to determine whether the premise is
true or false.

If the supplied source explicitly contradicts the
user's premise, extract the contradiction.

Example:

Question:
"Did BHP acquire Rio Tinto?"

If the source says BHP made a takeover offer in 2008
but the offer lapsed and Rio Tinto was not acquired,
extract that fact.

The extracted information should clearly state:

- what was proposed
- which companies were involved
- when it happened
- what the outcome was
- whether the transaction actually completed

Do NOT simply repeat the user's assumption.

Do NOT invent a correction if the supplied sources
do not establish one.

Do NOT use external knowledge.

==================================================
DATES
==================================================

Carefully distinguish:

informationDate

publicationDate

reportingPeriod

Example:

Publication date:
2026-08-13

Reporting period:
Q2 2026

Then:

publicationDate = "2026-08-13"

reportingPeriod = "Q2 2026"

Do NOT set informationDate to the publication
date unless the information itself applies
to that date.

If the exact information date is unavailable:

informationDate = null

If the publication date is unavailable:

publicationDate = null

If there is no reporting period:

reportingPeriod = null

==================================================
MINING NEWS
==================================================

For mining news extract:

- what happened
- company/project involved
- location
- commodity if explicitly stated
- production information if explicitly stated
- investment/capital expenditure if explicitly stated
- announcement date
- relevant reporting period
- exact source URL

Do not add information that is not in the source.

==================================================
WEB SEARCH RESEARCH
==================================================

Some supplied source content may come from the
live web-search research layer.

Treat that research as supplied source material.

Extract facts ONLY when the supplied research
explicitly supports them.

Do not use your own knowledge.

Do not infer missing numbers.

For production guidance questions, preserve:

- exact production figure
- commodity
- unit
- financial year
- reporting period
- publication date
- guidance wording

If the exact production guidance is not explicitly
supported by the supplied material, return no
source rather than guessing.

==================================================
COMPANY QUESTIONS
==================================================

If the question concerns a mining company,
prefer official company information when supplied.

Do not replace one company with another.

Do not combine two companies into one result.

==================================================
CORPORATE ACQUISITION / TAKEOVER QUESTIONS
==================================================

For questions involving:

- acquisition
- acquired
- takeover
- takeover offer
- takeover bid
- merger
- merger agreement
- purchase
- bought
- bid
- offer
- transaction

carefully distinguish between:

1. proposed transaction
2. announced transaction
3. agreed transaction
4. completed transaction
5. failed transaction
6. withdrawn transaction
7. rejected transaction
8. lapsed transaction

NEVER treat a proposed acquisition as a completed
acquisition.

For example:

"BHP made an offer for Rio Tinto"

does NOT mean:

"BHP acquired Rio Tinto."

Extract the exact transaction status supported
by the source.

If the source states that an offer was withdrawn,
rejected, terminated, or lapsed, preserve that
fact.

If the source explicitly states that the acquisition
completed, preserve that fact.

If completion status is not stated, do not assume
completion.

==================================================
PROJECT QUESTIONS
==================================================

Do not substitute another mining project.

For example:

Khoemacau

must not be replaced with:

Motheo

unless the source itself discusses both.
==================================================
COMMODITY QUESTIONS
==================================================

Distinguish carefully between:

- spot price
- official/benchmark price
- futures
- ETF
- company stock
- CFD

==================================================
GOLD
==================================================

When the user asks:

"latest gold price"
"gold price"
"current gold price"
"gold price today"

return the GOLD SPOT PRICE.

Use the supplied Gold Spot source.

Never treat:

GLD

as:

gold spot price.

Never treat a mining company's share price
as:

gold price.

==================================================
COPPER
==================================================

When the user asks:

"latest copper price"
"copper price"
"current copper price"
"copper price today"

return the current COPPER SPOT PRICE if the
supplied source explicitly provides a spot price.

If spot price is not available but the supplied
source provides an explicitly identified official
or benchmark copper price, return that price and
describe it using the exact terminology of the
source.

For copper, prefer the LME Copper Official Price
when it is supplied.

The LME Official Price is the benchmark price
for copper.

Do NOT automatically return:

- copper futures
- copper futures contract
- copper options
- copper ETF
- mining company stock
- copper CFD

Do NOT describe a CFD as a copper spot price.

Do NOT describe futures as a copper spot price.

Do NOT describe an LME 3-month price as spot.

If the source explicitly identifies the price as:

"futures"

describe it as futures.

If the source explicitly identifies the price as:

"CFD"

describe it as CFD.

If the source explicitly identifies the price as:

"benchmark"

describe it as benchmark.

If the source explicitly identifies the price as:

"Official Price"

describe it as the official/benchmark price.

If the source does not clearly identify the type
of copper price, do not guess.

==================================================
SOURCE PRIORITY
==================================================

For commodity prices, prefer the most appropriate
dedicated commodity source supplied to you.

For gold:

Kitco Gold Spot

For copper:

LME Copper Official Price

Do not use another source merely because it is
easier to access if doing so changes the meaning
of the requested price.

==================================================
PRICE ACCURACY
==================================================

Never invent a commodity price.

Never convert a price into another unit unless
the conversion is explicitly requested or can be
performed reliably from supplied data.

Preserve the source's:

- price
- currency
- unit
- price type
- timestamp/date

When the user asks for the "latest" or "current"
price, use the newest relevant price supported by
the supplied source.

Do not combine different commodity sources into
one price.

If the supplied sources disagree, do not average
them or create a new value.

Return the price from the preferred source and
identify the source and timestamp when available.
==================================================
==================================================
MARKET CAPITALIZATION QUESTIONS
==================================================

When the user asks about:

- market capitalization
- market cap
- largest mining companies
- biggest mining companies by market cap
- top mining companies by market cap
- mining company ranking by market cap

and the supplied source is:

companiesmarketcap.com

treat the supplied CompaniesMarketCap source as the
authoritative source for market capitalization.

IMPORTANT:

CompaniesMarketCap may provide a GLOBAL mining ranking.

The source may contain companies from many countries.

If the user specifies a country, such as:

- USA
- United States
- Canada
- Australia
- India
- China
- UK
- Brazil

you MUST filter companies using the COUNTRY shown
in the supplied source.

Do NOT assume a company's country from its name.

Do NOT assume a company's country from its ticker.

Do NOT use the global rank as the country rank.

Example:

If the source contains:

BHP Group — ₹22.444 T — Australia
Southern Copper — ₹15.737 T — USA
Rio Tinto — ₹15.644 T — UK
Newmont — ₹12.618 T — USA

and the question is:

"top mining companies by market capitalization in
the USA"

then:

BHP Group MUST be excluded.
Rio Tinto MUST be excluded.

Southern Copper and Newmont MUST be retained.

The USA ranking must then be calculated only from
companies whose source country is USA.

==================================================
COMPANY-SPECIFIC MARKET CAP DATA
==================================================

For every company found in the supplied source,
extract:

- company name
- ticker
- market capitalization
- currency
- rank if explicitly supplied
- country if explicitly supplied

The "information" field should contain the
company-specific market capitalization.

Example:

"Newmont — ₹11.700 trillion"

Another source item may contain:

"Freeport-McMoRan — ₹9.850 trillion"

Another:

"Barrick Gold — ₹8.420 trillion"

Do NOT copy the market capitalization from one
company to another.

==================================================
MATCHING REQUESTED COMPANIES
==================================================

Match companies based only on the supplied source.

Do not assume that two companies have the same
market capitalization.

Do not copy a value from a neighboring row.

Do not use the first market-cap value found for
every company.

If a requested company is present in the supplied
source, extract its own value.

If a requested company is not present in the
supplied source, do not invent its value.

==================================================
RANKING
==================================================

If the supplied CompaniesMarketCap source contains
multiple mining companies, extract each relevant
company as a separate source item.

For every company, preserve:

- company
- ticker
- marketCap
- currency
- rank
- country

Do NOT calculate a new ranking in the extraction step.

The application layer will perform:

1. country filtering
2. requested-company filtering
3. market-cap sorting
4. requested limit

Do not discard a company merely because it is not
among the first global ranks if the supplied source
contains that company and it is relevant to the
user's requested country.

==================================================
COMPLETE RANKING EXTRACTION
==================================================

When the supplied source is a CompaniesMarketCap
ranking page containing multiple companies:

Extract EVERY visible mining-company row supported
by the supplied source.

Do NOT stop after 9 companies.

Do NOT return only the companies needed to answer
the question.

Do NOT truncate the source ranking.

If the source contains 100 companies, return all
100 relevant companies supported by the source.

The application layer will later determine:

- country filtering
- requested company filtering
- sorting
- Top 5
- Top 10
- Top 20
- or any other requested limit.

Each company must remain a separate source object.

==================================================
COUNTRY-SPECIFIC RANKING
==================================================

If the user asks:

"top mining companies in the USA"

"top mining companies by market cap in USA"

"largest mining companies in the United States"

"top 10 US mining companies by market capitalization"

then:

1. Identify the requested country.
2. Read the country of every company from the supplied
   source.
3. Keep ONLY companies whose source country matches
   the requested country.
4. Sort those companies by market capitalization.
5. Return the requested number of companies.

NEVER:

- take the first 10 global companies
- then call them USA companies
- assume nationality
- infer country from headquarters unless the source
  explicitly provides it
- convert global rank into country rank

GLOBAL RANK != COUNTRY RANK.

For example:

Global:

1 BHP — Australia
2 Southern Copper — USA
3 Rio Tinto — UK
4 China Shenhua — China
5 Zijin Mining — China
6 Newmont — USA

For:

"top mining companies in USA"

the result begins:

1 Southern Copper
2 Newmont

It MUST NOT begin with BHP.


==================================================
MARKET CAP MEANING
==================================================

Market capitalization is NOT:

- share price
- revenue
- production
- enterprise value
- company assets

unless the supplied source explicitly identifies
the value as one of those metrics.

Preserve the market capitalization exactly as
supplied.

Preserve:

- amount
- currency
- unit
- company
- ticker
- source rank

Do not convert INR into USD unless the user
explicitly requests conversion.

==================================================
MISSING COMPANY
==================================================

If the source contains data for:

Newmont
Freeport-McMoRan
Barrick Gold

but does not contain:

Anglo American

return the three supported companies.

Do NOT invent Anglo American's market cap.

The final answer generator must be able to see
which requested companies were actually supported
by the source.

==================================================
NO MARKET CAP DATA
==================================================

If the supplied source does not contain market
capitalization data for any requested company,
return:

{
  "sources": []
}

Do not guess.

==================================================
CRITICAL ANTI-DUPLICATION RULE
==================================================

NEVER assign the same market capitalization to
multiple companies unless the supplied source
explicitly shows that those companies have exactly
the same market capitalization.

For example, if the source says:

Newmont ₹11.700 trillion
Freeport-McMoRan ₹10.200 trillion
Barrick Gold ₹9.800 trillion

DO NOT return:

Newmont ₹11.700 trillion
Freeport-McMoRan ₹11.700 trillion
Barrick Gold ₹11.700 trillion

Each company must use its own source value.

==================================================
==================================================
RANKING QUESTIONS
==================================================

If the question asks for a ranking:

Only use rankings explicitly supported by
the supplied sources.

Do not invent or alter the source's factual ranking data.

The application layer may calculate the requested
ranking from the extracted market-cap values.

Do not convert a global ranking into a
country-specific ranking.

Do not guess company nationality.

Do not substitute:

revenue

for:

market capitalization.

Do not substitute:

production

for:

market capitalization.

==================================================
SOURCE TYPE
==================================================

Use exactly one of:

official_company
government
regulator
exchange
news
financial
commodity
mining_publication
other

==================================================
CONFIDENCE
==================================================

high:

The source directly and clearly supports
the information.

medium:

The source supports the information but
some details are incomplete.

low:

The source is indirect or weak.

==================================================
OUTPUT
==================================================

Return ONLY JSON.

The JSON must have this structure:

{
  "sources": [
    {
      "source": "",
      "url": "",
      "domain": "",
      "title": "",
      "sourceType": "other",
      "information": "",
      "company": "",
      "ticker": "",
      "marketCap": null,
      "currency": "",
      "rank": null,
      "country": "",
      "year": null,
      "status": "unknown",
      "informationDate": null,
      "publicationDate": null,
      "reportingPeriod": null,
      "confidence": "low"
    }
  ]
}

If no supplied source contains useful information:

{
  "sources": []
}
`;

  /*
  --------------------------------------------------
  OPENAI EXTRACTION
  --------------------------------------------------
  */

  try {

    console.log(
      "=========================================="
    );

    console.log(
      "OPENAI SOURCE EXTRACTION"
    );

    console.log(
      "QUESTION:",
      question
    );

    console.log(
      "SOURCES:",
      
extractionSources.length
    );

    const response =
      await openai.responses.create({
        model: MODEL,

        instructions,

        input: `
USER QUESTION:
${question}

==================================================
SUPPLIED SOURCES
==================================================

${sourceText}
`,

        text: {
          format: {
            type: "json_schema",

            name: "mining_source_extraction",

            strict: true,

          schema: {
  type: "object",
  additionalProperties: false,

  properties: {
    sources: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          source: {
            type: "string",
          },

          url: {
            type: "string",
          },

          domain: {
            type: "string",
          },

          title: {
            type: "string",
          },

          sourceType: {
            type: "string",
            enum: [
              "official_company",
              "government",
              "regulator",
              "exchange",
              "news",
              "financial",
              "commodity",
              "mining_publication",
              "other",
            ],
          },

          information: {
            type: "string",
          },

          company: {
            type: "string",
          },

          ticker: {
            type: "string",
          },

          marketCap: {
  type: ["number", "null"],
},

          currency: {
            type: "string",
          },

         rank: {
  type: ["number", "null"],
},

country: {
  type: "string",
},

year: {
  type: ["number", "null"],
},

status: {
  type: "string",
  enum: [
    "actual",
    "guidance",
    "forecast",
    "estimate",
    "unknown",
  ],
},

informationDate: {
  type: ["string", "null"],
},

          publicationDate: {
            type: ["string", "null"],
          },

          reportingPeriod: {
            type: ["string", "null"],
          },

          confidence: {
            type: "string",
            enum: [
              "high",
              "medium",
              "low",
            ],
          },
        },

       required: [
  "source",
  "url",
  "domain",
  "title",
  "sourceType",
  "information",
  "company",
  "ticker",
  "marketCap",
  "currency",
  "rank",
  "country",
  "year",
  "status",
  "informationDate",
  "publicationDate",
  "reportingPeriod",
  "confidence",
],
      },
    },
  },

  required: [
    "sources",
  ],
},
          },
        },
      });

    /*
    --------------------------------------------------
    RAW RESPONSE
    --------------------------------------------------
    */

    const raw =
      response.output_text?.trim() || "";

    if (!raw) {

      console.error(
        "SOURCE EXTRACTION RETURNED EMPTY RESPONSE"
      );

      return [];
    }

    console.log(
      "OPENAI EXTRACTION COMPLETED"
    );

    /*
    --------------------------------------------------
    PARSE JSON
    --------------------------------------------------
    */

    let parsed: unknown;

    try {

      parsed =
        JSON.parse(raw);

    } catch (error) {

      console.error(
        "SOURCE EXTRACTION JSON PARSE ERROR:",
        error
      );

      console.error(
        "RAW RESPONSE:",
        raw
      );

      return [];
    }

    /*
    --------------------------------------------------
    CHECK STRUCTURE
    --------------------------------------------------
    */

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(
        (parsed as {
          sources?: unknown;
        }).sources
      )
    ) {

      console.error(
        "SOURCE EXTRACTION INVALID FORMAT"
      );

      return [];
    }

    const rawSources =
      (
        parsed as {
          sources: unknown[];
        }
      ).sources;

    /*
    --------------------------------------------------
    NORMALIZE
    --------------------------------------------------
    */

    const extracted =
      rawSources
        .filter(
          (
            source
          ): source is Record<
            string,
            unknown
          > =>
            Boolean(source) &&
            typeof source ===
              "object"
        )
        .map(
          (
            source
          ): ExtractedData => {

            return {
              source:
                typeof source.source ===
                  "string"
                  ? source.source
                  : "",

              url:
                typeof source.url ===
                  "string"
                  ? source.url
                  : "",

              domain:
                typeof source.domain ===
                  "string"
                  ? source.domain
                  : "",

              title:
                typeof source.title ===
                  "string"
                  ? source.title
                  : "",

              sourceType:
                isValidSourceType(
                  source.sourceType
                )
                  ? source.sourceType
                  : "other",

              information:
                typeof source.information ===
                  "string"
                  ? source.information
                  : "",

                  company:
  typeof source.company === "string"
    ? source.company
    : "",

ticker:
  typeof source.ticker === "string"
    ? source.ticker
    : "",

marketCap:
  typeof source.marketCap === "number"
    ? source.marketCap
    : undefined,

currency:
  typeof source.currency === "string"
    ? source.currency
    : "",

rank:
  typeof source.rank === "number"
    ? source.rank
    : undefined,

country:
  typeof source.country === "string"
    ? source.country
    : "",

year:
  typeof source.year === "number"
    ? source.year
    : undefined,

status:
  isValidStatus(source.status)
    ? source.status
    : "unknown",

informationDate:
  typeof source.informationDate === "string"
    ? source.informationDate
    : null,

              publicationDate:
                typeof source.publicationDate ===
                  "string"
                  ? source.publicationDate
                  : null,

              reportingPeriod:
                typeof source.reportingPeriod ===
                  "string"
                  ? source.reportingPeriod
                  : null,

              confidence:
                isValidConfidence(
                  source.confidence
                )
                  ? source.confidence
                  : "low",
            };
          }
        );

    /*
    --------------------------------------------------
    PROTECT EXACT SOURCE URL
    --------------------------------------------------
    */

    const normalized =
      extracted
        .map(
          (item) => {

            /*
            ------------------------------------------------
            FIRST: EXACT URL MATCH
            ------------------------------------------------
            */

           let matchingSource = usableSources.find(
  (source) =>
    normalizeUrl(source.url) ===
    normalizeUrl(item.url)
);

            /*
            ------------------------------------------------
            SECOND: DOMAIN MATCH
            ------------------------------------------------
            */

            if (
              !matchingSource &&
              item.domain
            ) {

              matchingSource =
                usableSources.find(
                  (source) =>
                    normalizeDomain(
                      source.domain
                    ) ===
                    normalizeDomain(
                      item.domain
                    )
                );
            }

            /*
            ------------------------------------------------
            THIRD: URL CONTAINS DOMAIN
            ------------------------------------------------
            */

            if (
              !matchingSource &&
              item.url
            ) {

              matchingSource =
                usableSources.find(
                  (source) =>
                    item.url.includes(
                      source.domain
                    )
                );
            }

            /*
            ------------------------------------------------
            RESTORE EXACT FETCHED URL
            ------------------------------------------------
            */

            if (
              matchingSource
            ) {

              /*
              Always use the actual fetched
              URL instead of trusting a URL
              generated by the model.
              */

              item.url =
                matchingSource.url;

              item.domain =
                matchingSource.domain;

              if (
                !item.source
              ) {
                item.source =
                  matchingSource.name;
              }

              if (
                !item.title &&
                "title" in
                  matchingSource
              ) {

                const sourceWithTitle =
                  matchingSource as
                    FetchedSource & {
                      title?: string;
                    };

                item.title =
                  sourceWithTitle.title ||
                  "";
              }
            }

            return item;
          }
        );

    /*
    --------------------------------------------------
    REMOVE EMPTY INFORMATION
    --------------------------------------------------
    */

    const finalResults =
      normalized.filter(
        (item) =>
          item.information
            .trim()
            .length > 0 &&
          item.url
            .trim()
            .length > 0
      );

   console.log(
  "EXTRACTED SOURCES:",
  finalResults.length
);

console.log(
  "EXTRACTED SOURCE DETAILS:"
);

console.log(
  finalResults.map(
    (item) => ({
      source: item.source,
      title: item.title,
      url: item.url,
      information: item.information,
      informationDate: item.informationDate,
      publicationDate: item.publicationDate,
      reportingPeriod: item.reportingPeriod,
      confidence: item.confidence,
    })
  )
);

return finalResults;

  } catch (error) {

    console.error(
      "SOURCE EXTRACTION FAILED:",
      error
    );

    return [];
  }
}

/*
==================================================
VALID SOURCE TYPE
==================================================
*/


function isValidSourceType(
  value: unknown
): value is ExtractedData["sourceType"] {
  return (
    typeof value === "string" &&
    SOURCE_TYPES.includes(
      value as (typeof SOURCE_TYPES)[number]
    )
  );
}

/*
==================================================
VALID CONFIDENCE
==================================================
*/

function isValidConfidence(
  value: unknown
): value is ExtractedData["confidence"] {
  return (
    typeof value === "string" &&
    CONFIDENCE_LEVELS.includes(
      value as (typeof CONFIDENCE_LEVELS)[number]
    )
  );
}

function isValidStatus(
  value: unknown
): value is ExtractedData["status"] {
  return (
    value === "actual" ||
    value === "guidance" ||
    value === "forecast" ||
    value === "estimate" ||
    value === "unknown"
  );
}

/*
==================================================
NORMALIZE URL
==================================================
*/

function normalizeUrl(
  value: string
): string {

  try {

    const url =
      new URL(value);

    return (
      url.origin +
      url.pathname
        .replace(/\/+$/, "") +
      url.search
    ).toLowerCase();

  } catch {

    return value
      .trim()
      .toLowerCase()
      .replace(
        /\/+$/,
        ""
      );
  }
}

/*
==================================================
NORMALIZE DOMAIN
==================================================
*/

function normalizeDomain(
  value: string
): string {

  return value
    .replace(
      /^www\./i,
      ""
    )
    .trim()
    .toLowerCase();
}

/*
==================================================
HOMEPAGE CHECK
==================================================
*/

function isHomepageUrl(
  url: string,
  domain: string
): boolean {

  if (!url) {
    return true;
  }

  try {

    const parsed =
      new URL(url);

    const hostname =
      parsed.hostname
        .replace(
          /^www\./i,
          ""
        )
        .toLowerCase();

    const cleanDomain =
      domain
        .replace(
          /^www\./i,
          ""
        )
        .toLowerCase();

    if (
      hostname !==
      cleanDomain
    ) {
      return false;
    }

    const path =
      parsed.pathname
        .replace(
          /\/+$/,
          ""
        );

    return path === "";

  } catch {

    return false;
  }
}