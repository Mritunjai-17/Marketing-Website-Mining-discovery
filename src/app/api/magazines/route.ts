import { NextResponse } from "next/server";

export const revalidate = 1800; // Cache for 30 minutes

import { MagazineApiItem, INITIAL_MAGAZINES } from "@/data/magazinesApiData";

export async function GET() {
  try {
    const res = await fetch(
      "https://admins.miningdiscovery.com/api/magazines?pagination[pageSize]=100&populate=*",
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch magazines: ${res.status}`);
    }

    const json = await res.json();
    const items = json.data || [];

    const cleanMagazines: MagazineApiItem[] = items
      .filter((m: any) => m.pdf?.url)
      .map((m: any) => {
        const cover =
          m.coverImage?.formats?.medium?.url ||
          m.coverImage?.formats?.small?.url ||
          m.coverImage?.formats?.large?.url ||
          m.coverImage?.url ||
          "";

        const localMatch = INITIAL_MAGAZINES.find(
          (init) =>
            init.month?.toLowerCase() === month.toLowerCase() &&
            Number(init.year) === Number(year)
        );
        const pdfUrl = localMatch?.pdf || `/api/pdf-proxy?url=${encodeURIComponent(m.pdf.url)}`;

        const dateObj = m.publishDate
          ? new Date(m.publishDate)
          : new Date(m.createdAt || Date.now());
        const month = dateObj.toLocaleString("en-US", { month: "long" });
        const year = dateObj.getFullYear();

        return {
          id: String(m.id),
          title: m.Title || `${month} Edition ${year}`,
          edition: m.Title || `${month} Edition ${year}`,
          description: m.Description || "",
          cover,
          pdf: pdfUrl,
          rawPdf: m.pdf.url,
          publishDate: m.publishDate || m.createdAt || "",
          features: m.features || "",
          month,
          year,
          issueNumber: m.id,
        };
      });

    // Sort newest to oldest
    cleanMagazines.sort((a, b) => {
      const dateA = new Date(a.publishDate).getTime();
      const dateB = new Date(b.publishDate).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      data: cleanMagazines.length > 0 ? cleanMagazines : INITIAL_MAGAZINES,
    });
  } catch (error) {
    console.error("Magazines API error:", error);
    return NextResponse.json({ success: true, data: INITIAL_MAGAZINES });
  }
}
