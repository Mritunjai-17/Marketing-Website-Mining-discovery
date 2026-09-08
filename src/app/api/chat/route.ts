import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const remoteRes = await fetch("https://mining-assistent-eight.vercel.app/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!remoteRes.ok) {
      const errText = await remoteRes.text();
      return NextResponse.json({ error: errText || "Remote AI endpoint error" }, { status: remoteRes.status });
    }

    if (!remoteRes.body) {
      return NextResponse.json({ error: "Empty body from AI endpoint" }, { status: 500 });
    }

    return new Response(remoteRes.body, {
      headers: {
        "Content-Type": remoteRes.headers.get("Content-Type") || "text/plain",
      },
    });
  } catch (error: any) {
    console.error("Proxy API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reach AI service" }, { status: 500 });
  }
}
