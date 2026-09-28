import { NextResponse } from "next/server";
import { INITIAL_NEWSLETTERS, type PublicationItem } from "@/data/publications";

export const revalidate = 1800; // Cache for 30 minutes

export async function GET() {
  try {
    const res = await fetch(
      "https://admins.miningdiscovery.com/api/post-newsletters?pagination[pageSize]=100&populate=*",
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json({ success: true, data: INITIAL_NEWSLETTERS });
    }

    const json = await res.json();
    const cleanNewsletters: PublicationItem[] = (json.data || [])
      .filter((n: any) => n.pdfFile?.url)
      .map((n: any) => ({
        id: String(n.id),
        title: n.title || "Weekly Newsletter",
        cover:
          n.coverImage?.formats?.medium?.url ||
          n.coverImage?.formats?.small?.url ||
          n.coverImage?.url ||
          "/cards/bg_card_1.webp",
        pdf: `/api/pdf-proxy?url=${encodeURIComponent(n.pdfFile.url)}`,
        date: n.publishedAt || n.createdAt || "",
      }));

    return NextResponse.json({
      success: true,
      data: cleanNewsletters.length > 0 ? cleanNewsletters : INITIAL_NEWSLETTERS,
    });
  } catch (error) {
    return NextResponse.json({ success: true, data: INITIAL_NEWSLETTERS });
  }
}
