import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

export async function GET(req: NextRequest) {
  try {
    const backendEndpoint = `${BACKEND_URL.replace(/\/+$/, "")}/api/health`;
    const res = await fetch(backendEndpoint, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(
      {
        frontend: "UP",
        backendStatus: res.status,
        backendData: data,
        backendUrl: BACKEND_URL,
      },
      { status: res.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        frontend: "UP",
        backendStatus: "DOWN",
        error: error instanceof Error ? error.message : "Backend unreachable",
        backendUrl: BACKEND_URL,
      },
      { status: 503 }
    );
  }
}
