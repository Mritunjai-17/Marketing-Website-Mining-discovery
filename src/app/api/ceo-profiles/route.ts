import { NextResponse } from "next/server";
import { INITIAL_CEO_PROFILES, type CeoProfileItem } from "@/data/publications";

export const revalidate = 1800; // Cache for 30 minutes

export async function GET() {
  try {
    const res = await fetch(
      "https://admins.miningdiscovery.com/api/ceo-profiles?pagination[pageSize]=100&populate=*",
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        data: INITIAL_CEO_PROFILES,
      });
    }

    const json = await res.json();
    const items = json.data || [];

    const cleanProfiles: CeoProfileItem[] = items.map((c: any) => {
      const coverObj = Array.isArray(c.cover_image) ? c.cover_image[0] : c.cover_image;
      const cover =
        coverObj?.formats?.medium?.url ||
        coverObj?.formats?.small?.url ||
        coverObj?.formats?.large?.url ||
        coverObj?.url ||
        c.ceo_image?.formats?.thumbnail?.url ||
        c.ceo_image?.url ||
        "/cards/bg_card_2.webp";

      const ceoImage =
        c.ceo_image?.formats?.thumbnail?.url ||
        c.ceo_image?.url ||
        cover;

      const pdfObj = Array.isArray(c.ceo_pdf) ? c.ceo_pdf[0] : c.ceo_pdf;
      const rawPdf = pdfObj?.url || "";
      const pdf = rawPdf ? `/api/pdf-proxy?url=${encodeURIComponent(rawPdf)}` : "";

      return {
        id: String(c.id),
        name: c.name || "Mining Executive",
        title: c.name && c.designation ? `${c.name} — ${c.designation}` : c.name || "Executive Profile",
        designation: c.designation || "Mining Industry Executive",
        description: c.shortDescription || "",
        cover,
        ceoImage,
        pdf,
        rawPdf,
        date: c.publishedAt || c.createdAt || "",
      };
    });

    return NextResponse.json({
      success: true,
      data: cleanProfiles.length > 0 ? cleanProfiles : INITIAL_CEO_PROFILES,
    });
  } catch (error) {
    console.error("CEO Profiles API error:", error);
    return NextResponse.json({ success: true, data: INITIAL_CEO_PROFILES });
  }
}
