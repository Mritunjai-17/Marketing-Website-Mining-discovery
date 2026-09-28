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

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MiningDiscovery/1.0)",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch upstream PDF: ${response.statusText}`, {
        status: response.status,
      });
    }

    const arrayBuffer = await response.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Failed to proxy PDF", { status: 500 });
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
  return new NextResponse(null, { status: 204, headers });
}
