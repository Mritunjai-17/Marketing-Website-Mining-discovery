import { NextResponse } from "next/server";

export const revalidate = 1800; // Cache for 30 minutes

export interface MagazineApiItem {
  id: string;
  title: string;
  edition: string;
  description: string;
  cover: string;
  pdf: string;
  rawPdf?: string;
  publishDate: string;
  features?: string;
  month?: string;
  year?: number;
  issueNumber?: number;
}

export const INITIAL_MAGAZINES: MagazineApiItem[] = [
  {
    id: "98",
    title: "July Edition 2026",
    edition: "July Edition 2026",
    description:
      "The July 2026 edition of Mining Discovery examines the forces transforming the mining sector, including exploration expansion, strategic capital, AI-driven innovation, and rising critical mineral demand.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Whats_App_Image_2026_08_20_at_9_52_36_AM_ed1af21524.jpeg",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/July_Mag_2_497d8f5b78.pdf",
    publishDate: "2026-07-20",
    month: "July",
    year: 2026,
    issueNumber: 98,
  },
  {
    id: "95",
    title: "June Edition 2026",
    edition: "June Edition 2026",
    description:
      "The June edition of Mining Discovery explores the forces shaping the future of global mining, highlighting exploration growth, critical minerals demand, technological innovation, and strategic capital.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_June_2026_0da229ec3e.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/June_Mag_9b539858ec.pdf",
    publishDate: "2026-06-07",
    month: "June",
    year: 2026,
    issueNumber: 95,
  },
  {
    id: "92",
    title: "May Edition 2026",
    edition: "May Edition 2026",
    description:
      "The May 2026 edition of Mining Discovery highlights the shift toward infrastructure-backed growth, district-scale exploration, and disciplined capital deployment.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_May_2026_9d6672dd02.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/May_mag_7995c2676d.pdf",
    publishDate: "2026-05-31",
    month: "May",
    year: 2026,
    issueNumber: 92,
  },
  {
    id: "89",
    title: "April Edition 2026",
    edition: "April Edition 2026",
    description:
      "The April edition of Mining Discovery highlights a shift from rapid exploration to disciplined, data-driven execution. Projects are advancing from discovery to scalable system definition.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_April_2026_0a6ddcf70d.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/April_mag_fcc1c39133.pdf",
    publishDate: "2026-04-07",
    month: "April",
    year: 2026,
    issueNumber: 89,
  },
  {
    id: "69",
    title: "March Edition 2026",
    edition: "March Edition 2026",
    description:
      "Mining Discovery’s March 2026 edition highlights a shift toward disciplined, system-driven exploration, where geological clarity, execution quality, and capital alignment define progress.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Mag_Cover_3_3b6eb42a9d.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/March_mag_b36389fd86.pdf",
    publishDate: "2026-03-19",
    month: "March",
    year: 2026,
    issueNumber: 69,
  },
  {
    id: "72",
    title: "February Edition 2026",
    edition: "February Edition 2026",
    description:
      "The February 2026 Mining Discovery edition highlights a sector focused on discipline, alignment, and preparation rather than rapid expansion.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Feburary_Month_1843071b83.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/February_Mag_ec921edaa3.pdf",
    publishDate: "2026-02-17",
    month: "February",
    year: 2026,
    issueNumber: 72,
  },
  {
    id: "73",
    title: "January Edition 2026",
    edition: "January Edition 2026",
    description:
      "Mining Discovery's January 2026 edition highlights key resource expansion programs, critical minerals supply chains, and executive updates shaping the exploration year.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_january_Month_164a402a2f.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/January_Mag_d98479d260.pdf",
    publishDate: "2026-01-06",
    month: "January",
    year: 2026,
    issueNumber: 73,
  },
  {
    id: "80",
    title: "December Edition 2025",
    edition: "December Edition 2025",
    description:
      "The December 2025 edition of Mining Discovery showcases a sector-wide shift from speculation to execution, highlighting confirmed mineral resources and district-scale discoveries.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_December_2025_682b6d159b.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/December_Mag_9ca99a6b14.pdf",
    publishDate: "2025-12-01",
    month: "December",
    year: 2025,
    issueNumber: 80,
  },
  {
    id: "79",
    title: "November Edition 2025",
    edition: "November Edition 2025",
    description:
      "The November Edition delivers trusted, data-driven insights across gold, copper, uranium, and the fast-emerging AI-compute sector.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_November_2025_eff30f5f75.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/November_Mag_80f0d739fc.pdf",
    publishDate: "2025-11-26",
    month: "November",
    year: 2025,
    issueNumber: 79,
  },
  {
    id: "78",
    title: "October Edition 2025",
    edition: "October Edition 2025",
    description:
      "The October 2025 issue covers major exploration discoveries in gold and copper along with key resource financing initiatives.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_October_2025_883ef40eb5.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/October_mag_59609a00f4.pdf",
    publishDate: "2025-10-15",
    month: "October",
    year: 2025,
    issueNumber: 78,
  },
  {
    id: "77",
    title: "September Edition 2025",
    edition: "September Edition 2025",
    description:
      "Mining Discovery’s September 2025 edition is a snapshot of global mining and resource innovation across premier discovery corridors.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_September_2025_30452e37da.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/September_mag_f3a01ae4fa.pdf",
    publishDate: "2025-09-03",
    month: "September",
    year: 2025,
    issueNumber: 77,
  },
  {
    id: "76",
    title: "August Edition 2025",
    edition: "August Edition 2025",
    description:
      "The August Edition of Mining Discovery Magazine highlights global mining, energy, and technology trends reshaping modern mineral extraction.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_August_2025_81a609211c.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/August_mag_7d303c052c.pdf",
    publishDate: "2025-08-03",
    month: "August",
    year: 2025,
    issueNumber: 76,
  },
  {
    id: "75",
    title: "July Edition 2025",
    edition: "July Edition 2025",
    description:
      "Mining Discovery Magazine July 2025 Edition highlights exploration breakthroughs across gold, copper, and battery metals.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_July_2025_8053cf32a9.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/July_Mag_75c485a706.pdf",
    publishDate: "2025-07-03",
    month: "July",
    year: 2025,
    issueNumber: 75,
  },
  {
    id: "74",
    title: "June Edition 2025",
    edition: "June Edition 2025",
    description:
      "The June 2025 edition delivers trusted global mining insights, industry innovation, and corporate discovery growth stories.",
    cover:
      "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_June_2025_e32da945b3.png",
    pdf: "https://acceptable-desire-0cca5bb827.media.strapiapp.com/June_mag_365d331e91.pdf",
    publishDate: "2025-06-03",
    month: "June",
    year: 2025,
    issueNumber: 74,
  },
];

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

        const pdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(m.pdf.url)}`;

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
