import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Security check: Only proxy PDFs from known strapi media domains or HTTPS
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("https") && !parsed.protocol.startsWith("http")) {
      return new NextResponse("Invalid URL scheme", { status: 400 });
    }

    const range = req.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (compatible; MiningDiscovery/1.0)",
    };
    if (range) {
      fetchHeaders["Range"] = range;
    }

    const upstreamRes = await fetch(url, {
      headers: fetchHeaders,
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Failed to fetch upstream PDF: ${upstreamRes.statusText}`, {
        status: upstreamRes.status,
      });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstreamRes.headers.get("content-type") || "application/pdf");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
    headers.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      headers.set("Content-Range", contentRange);
    }
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Failed to proxy PDF", { status: 500 });
  }
}

export async function HEAD(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url parameter", { status: 400 });

  try {
    const upstreamRes = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MiningDiscovery/1.0)" },
    });
    const headers = new Headers();
    headers.set("Content-Type", upstreamRes.headers.get("content-type") || "application/pdf");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
    headers.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(null, {
      status: upstreamRes.status,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Failed to HEAD PDF", { status: 500 });
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
  headers.set("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
  return new NextResponse(null, { status: 204, headers });
}
