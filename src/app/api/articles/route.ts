import { NextResponse } from "next/server";
import { INITIAL_ARTICLES, type PublicationItem } from "@/data/publications";

export const revalidate = 1800; // Cache for 30 minutes

export async function GET() {
  try {
    const res = await fetch(
      "https://admins.miningdiscovery.com/api/our-artciles?pagination[pageSize]=100&populate=*",
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json({ success: true, data: INITIAL_ARTICLES });
    }

    const json = await res.json();
    const cleanArticles: PublicationItem[] = (json.data || [])
      .filter((a: any) => a.pdf?.url)
      .map((a: any) => ({
        id: String(a.id),
        title: a.Title || "Mining Research Article",
        cover:
          a.coverImage?.formats?.medium?.url ||
          a.coverImage?.formats?.small?.url ||
          a.coverImage?.url ||
          "/cards/bg_card_2.webp",
        pdf: `/api/pdf-proxy?url=${encodeURIComponent(a.pdf.url)}`,
        description: a.Description || "",
        date: a.publishedAt || a.createdAt || "",
      }));

    return NextResponse.json({
      success: true,
      data: cleanArticles.length > 0 ? cleanArticles : INITIAL_ARTICLES,
    });
  } catch (error) {
    return NextResponse.json({ success: true, data: INITIAL_ARTICLES });
  }
}
