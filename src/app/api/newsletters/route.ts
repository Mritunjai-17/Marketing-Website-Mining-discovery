import { NextResponse } from "next/server";
import { INITIAL_NEWSLETTERS, type PublicationItem } from "@/data/publications";

export const revalidate = 60; // Revalidate every minute for timely updates

export async function GET() {
  try {
    // Fetch dynamically from Strapi with descending sort by createdAt
    const res = await fetch(
      "https://admins.miningdiscovery.com/api/post-newsletters?pagination[pageSize]=200&sort[0]=createdAt:desc&sort[1]=id:desc&populate=*",
      { next: { revalidate: 60 } }
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
        date: n.createdAt || n.publishedAt || "",
      }))
      .sort((a: PublicationItem, b: PublicationItem) => {
        const timeA = new Date(a.date || 0).getTime();
        const timeB = new Date(b.date || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.id) - Number(a.id);
      });

    return NextResponse.json({
      success: true,
      data: cleanNewsletters.length > 0 ? cleanNewsletters : INITIAL_NEWSLETTERS,
    });
  } catch (error) {
    return NextResponse.json({ success: true, data: INITIAL_NEWSLETTERS });
  }
}

