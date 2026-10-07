import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendOrigin(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5000";

  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return parsed.origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

export async function GET(req: NextRequest) {
  const backendOrigin = getBackendOrigin();
  try {
    const backendEndpoint = `${backendOrigin}/api/health`;
    const res = await fetch(backendEndpoint, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(
      {
        frontend: "UP",
        backendStatus: res.status,
        backendData: data,
        backendUrl: backendOrigin,
      },
      { status: res.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        frontend: "UP",
        backendStatus: "DOWN",
        error: error instanceof Error ? error.message : "Backend unreachable",
        backendUrl: backendOrigin,
      },
      { status: 503 }
    );
  }
}
