import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Proxy POST /api/contacts from the frontend to the mining-discovery backend service.
 * Handles contact inquiry submission, forwards client headers for IP/rate limiting,
 * and passes back structured responses.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const clientIp =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    const backendEndpoint = `${BACKEND_URL.replace(/\/+$/, "")}/api/contacts`;

    const backendRes = await fetch(backendEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": clientIp,
        "user-agent": userAgent,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => null);

    if (!backendRes.ok) {
      return NextResponse.json(
        data || {
          success: false,
          message: `Backend submission failed with status ${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("[Frontend API Proxy] Error forwarding to backend:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to connect to the backend server. Please verify the backend service is running or contact info@miningdiscovery.com directly.",
      },
      { status: 503 }
    );
  }
}
