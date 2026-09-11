import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CacheEntry {
  rawLines: string[];
  timestamp: number;
}

// In-memory LRU cache to serve repeated queries instantly
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 60 minutes
const MAX_CACHE_SIZE = 150;

function normalizeQuery(msg: string): string {
  return msg.trim().toLowerCase().replace(/[?!.,]/g, "");
}

interface InstantKnowledge {
  keywords: string[];
  answer: string;
  sources?: Array<{ name: string; url: string }>;
  chart?: any;
}

const INSTANT_KB: InstantKnowledge[] = [
  {
    keywords: ["gold price", "latest gold", "gold spot", "price of gold", "gold market", "cost of gold"],
    answer: "The current spot gold market trades near **$4,320 – $4,330 / oz**, reflecting sustained institutional demand, central bank reserve accumulation, and macroeconomic hedging. Primary drivers include global interest rate expectations, sovereign reserve diversification, and rising production costs across Tier-1 gold jurisdictions.",
    sources: [
      { name: "Kitco Gold Index", url: "https://www.kitco.com" },
      { name: "Mining Discovery Intelligence", url: "https://www.miningdiscovery.com" },
    ],
    chart: {
      type: "line",
      title: "Gold Spot Price Benchmark ($/oz)",
      unit: "USD/oz",
      data: [
        { label: "2022", value: 1825 },
        { label: "2023", value: 2060 },
        { label: "2024", value: 2680 },
        { label: "2025", value: 3450 },
        { label: "2026", value: 4325 },
      ],
    },
  },
  {
    keywords: ["top mining", "top companies", "biggest mining", "largest mining", "major miners", "leading mining"],
    answer: "The world's leading mining companies by market capitalization, production scale, and global assets include:\n\n1. **BHP Group** (Australia/UK) – The world's largest diversified resources company (iron ore, copper, metallurgical coal, potash).\n2. **Rio Tinto** (UK/Australia) – Major producer of iron ore, aluminium, copper, and critical battery minerals.\n3. **Glencore** (Switzerland) – Dominant global producer and marketer of copper, cobalt, zinc, and industrial metals.\n4. **Vale S.A.** (Brazil) – World leader in iron ore pellets and premier nickel producer.\n5. **Freeport-McMoRan** (USA) – Leading global copper producer operating Indonesia's Grasberg district.\n6. **Newmont & Barrick Gold** – Premier global gold producers with operations spanning North America, Africa, and Australia.",
    sources: [
      { name: "Global Mining Majors Registry", url: "https://www.miningdiscovery.com" },
      { name: "Mining Intelligence Benchmark", url: "https://www.mining.com" },
    ],
    chart: {
      type: "bar",
      title: "Global Mining Majors by Operational Scale",
      unit: "Index Score",
      data: [
        { label: "BHP", value: 98 },
        { label: "Rio Tinto", value: 92 },
        { label: "Glencore", value: 87 },
        { label: "Vale", value: 83 },
        { label: "Freeport", value: 76 },
      ],
    },
  },
  {
    keywords: ["latest mining news", "mining news", "industry news", "market news", "recent developments"],
    answer: "Key developments across global mining, commodity, and energy markets:\n\n- **Critical Minerals Acceleration**: Western governments continue expediting permitting and strategic stockpiling for lithium, rare earths, and battery metals.\n- **Structural Copper Deficits**: Escalating clean energy infrastructure demand faces long-term structural supply gaps, driving aggressive M&A and greenfield exploration.\n- **Precious Metals Resilience**: Sustained gold and silver strength continues supporting robust equity financings for exploration developers.\n- **Autonomous Technology**: Tier-1 operators are accelerating haul-fleet electrification and AI sensor-based ore sorting to lower per-tonne emissions.",
    sources: [
      { name: "Mining Discovery Newsdesk", url: "https://www.miningdiscovery.com" },
      { name: "Mining.com Feed", url: "https://www.mining.com" },
    ],
  },
  {
    keywords: ["mining discovery", "who are you", "what is mining discovery", "about us", "about mining discovery", "founders", "gaurav", "sagar"],
    answer: "Mining Discovery is a premier global mining media, investor communications, and strategic marketing platform. Founded in 2022 in Chandigarh by Gaurav Sharma and Sagar Bakshi, the platform bridges natural resource enterprises, exploration developers, and institutional capital across North America, Australia, Europe, and international markets. We turn mining exploration and production stories into measurable investor reach and verified industry growth.",
    sources: [
      { name: "Mining Discovery About", url: "https://www.miningdiscovery.com/about" },
    ],
  },
  {
    keywords: ["services", "what do you offer", "what services", "marketing", "campaigns", "investor reach", "capabilities", "solutions"],
    answer: "Mining Discovery provides full-spectrum digital media, marketing, and investor engagement solutions tailored for the natural resource sector:\n\n1. **Targeted Investor Campaigns**: Reaching qualified high-net-worth investors and institutional resource desks.\n2. **Cinematic Media & Video Production**: High-resolution site footage, technical drill briefs, and executive C-suite interviews.\n3. **Corporate Branding & Market Liquidity**: Presentation design, technical decks, and verified issuer visibility.\n4. **Global Conference & Sector Coverage**: Dedicated media presence across PDAC, Mines and Money, 121 Mining Investment, and global expos.\n\nExplore details on our [Services](/services) page.",
    sources: [
      { name: "Mining Discovery Services", url: "https://www.miningdiscovery.com/services" },
    ],
  },
  {
    keywords: ["get featured", "contact", "reach out", "email", "phone", "hire", "collaborate", "partner"],
    answer: "You can feature your mining project or launch an investor campaign directly through Mining Discovery:\n\n- **Get Featured**: Submit your company dossier via our [Get Featured / Contact](/contact) page.\n- **Direct Inquiries**: Email our strategic partnership desk at **info@miningdiscovery.com**.\n- **Coverage**: Tailored for exploration drillers, expanding developers, and commercial producers seeking measurable global audience reach.",
    sources: [
      { name: "Contact Mining Discovery", url: "https://www.miningdiscovery.com/contact" },
    ],
  },
  {
    keywords: ["lithium", "battery metals", "critical minerals", "critical metals"],
    answer: "Lithium and critical battery minerals are essential for electric mobility and grid-scale energy storage. Production centers around two primary geological settings:\n\n1. **Hard Rock (Spodumene Pegmatites)**: Predominantly mined in Western Australia, Canada, and Brazil, featuring rapid processing ramp-ups.\n2. **Continental Brines**: Extracted across the South American 'Lithium Triangle' (Chile, Argentina, Bolivia), utilizing evaporation ponds and next-generation Direct Lithium Extraction (DLE).\n\nLong-term sector fundamentals remain underpinned by EV adoption targets and energy transition infrastructure.",
    sources: [
      { name: "US Geological Survey", url: "https://www.usgs.gov" },
      { name: "Mining Discovery Research", url: "https://www.miningdiscovery.com" },
    ],
  },
  {
    keywords: ["copper", "red metal", "copper deficit"],
    answer: "Copper is fundamental to power generation, electricity distribution networks, and electric vehicles. Global consumption exceeds 26 million tonnes annually, with primary output led by Chile (Escondida, Collahuasi), Peru, and the DRC. Structural deficits are projected over the coming decade due to declining ore grades, water restrictions, and decade-long lead times for new greenfield mine development.",
    sources: [
      { name: "International Copper Study Group", url: "https://www.icsg.org" },
    ],
  },
  {
    keywords: ["uranium", "nuclear", "yellowcake"],
    answer: "The uranium market is experiencing renewed multi-year momentum driven by global nuclear power build-outs, lifetime reactor extensions, and small modular reactor (SMR) investments. Supply is led by Kazatomprom (Kazakhstan) and Cameco (Canada's Athabasca Basin), while utilities face widening uncontracted fuel deficits through 2030 and beyond.",
    sources: [
      { name: "World Nuclear Association", url: "https://world-nuclear.org" },
    ],
  },
  {
    keywords: ["exploration", "production", "capital", "mining cycle", "stages of mining"],
    answer: "The global mining and energy ecosystem rests upon three core pillars showcased across our platform:\n\n1. **Exploration**: Initial geophysics, geochemical sampling, and diamond drilling to identify economic mineralization.\n2. **Production**: Mine construction, open-pit or underground extraction, and metallurgical processing into commercial concentrates or bullion.\n3. **Capital Markets**: Equity financings, joint ventures, royalty/streaming arrangements, and institutional debt that fund projects from initial discovery to commercial cash flow.",
    sources: [
      { name: "Mining Discovery Framework", url: "https://www.miningdiscovery.com" },
    ],
  },
];

function matchInstantKnowledge(query: string): InstantKnowledge | null {
  const q = query.toLowerCase();
  for (const item of INSTANT_KB) {
    for (const kw of item.keywords) {
      if (q.includes(kw)) {
        return item;
      }
    }
  }
  return null;
}

function streamInstantAnswer(item: InstantKnowledge) {
  const encoder = new TextEncoder();
  const words = item.answer.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      // Fast typewriter effect streaming 2-3 words every 10ms
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
        controller.enqueue(encoder.encode(JSON.stringify({ type: "answer", data: chunk }) + "\n"));
        await new Promise((r) => setTimeout(r, 10));
      }
      if (item.chart) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "chart", data: item.chart }) + "\n"));
      }
      if (item.sources && item.sources.length > 0) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: "sources", data: item.sources }) + "\n"));
      }
      controller.enqueue(encoder.encode(JSON.stringify({ type: "done", data: true }) + "\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  return new Response(JSON.stringify({ status: "ready" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = typeof body?.message === "string" ? body.message : "";
    const key = normalizeQuery(query);

    // 1. INSTANT KNOWLEDGE ENGINE: Matches in 10-15ms
    const instantMatch = matchInstantKnowledge(query);
    if (instantMatch) {
      return streamInstantAnswer(instantMatch);
    }

    // 2. FAST CACHE HIT: If answered recently, stream cached lines immediately
    if (key && cache.has(key)) {
      const entry = cache.get(key)!;
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return new Response(entry.rawLines.join("\n") + "\n", {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      } else {
        cache.delete(key);
      }
    }

    // 3. REMOTE FALLBACK FETCH with keepalive
    const remoteRes = await fetch("https://mining-assistent-eight.vercel.app/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      keepalive: true,
    });

    if (!remoteRes.ok) {
      const errText = await remoteRes.text();
      return NextResponse.json({ error: errText || "Remote AI endpoint error" }, { status: remoteRes.status });
    }

    if (!remoteRes.body) {
      return NextResponse.json({ error: "Empty body from AI endpoint" }, { status: 500 });
    }

    // 4. TEE STREAM: Client receives stream, cache records for instant repeats
    const [clientStream, cacheStream] = remoteRes.body.tee();

    if (key) {
      (async () => {
        try {
          const reader = cacheStream.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          const lines: string[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() || "";
            for (const part of parts) {
              if (part.trim()) lines.push(part.trim());
            }
          }
          if (buffer.trim()) lines.push(buffer.trim());

          if (lines.some((l) => l.includes('"answer"'))) {
            if (cache.size >= MAX_CACHE_SIZE) {
              const firstKey = cache.keys().next().value;
              if (firstKey) cache.delete(firstKey);
            }
            cache.set(key, { rawLines: lines, timestamp: Date.now() });
          }
        } catch { }
      })();
    }

    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Proxy API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reach AI service" }, { status: 500 });
  }
}
