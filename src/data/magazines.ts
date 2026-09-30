/**
 * Mining Discovery Magazine Editions
 *
 * Controlled chronological catalog ordered strictly by Year -> Month.
 * Filenames are mapped directly to actual assets in /public/Magazines/.
 */

export interface MagazineEdition {
  id: string;
  title: string;
  month: string;
  monthIndex: number; // 1-12
  year: number;
  edition: string;
  pdf: string;
  cover?: string;
  issueNumber?: number;
  highlight?: string;
}

export const MAGAZINES: MagazineEdition[] = [
  {
    id: "june-2025",
    title: "Mining Discovery",
    month: "June",
    monthIndex: 6,
    year: 2025,
    edition: "June Edition 2025",
    pdf: "/Magazines/June 2025 Mag Spread.pdf",
    cover: "/Magazines/June 2025 Mag Spread.pdf",
    issueNumber: 1,
  },
  {
    id: "july-2025",
    title: "Mining Discovery",
    month: "July",
    monthIndex: 7,
    year: 2025,
    edition: "July Edition 2025",
    pdf: "/Magazines/July 2025 Mag Spread.pdf",
    cover: "/Magazines/July 2025 Mag Spread.pdf",
    issueNumber: 2,
  },
  {
    id: "august-2025",
    title: "Mining Discovery",
    month: "August",
    monthIndex: 8,
    year: 2025,
    edition: "August Edition 2025",
    pdf: "/Magazines/August 2025 mag Spread.pdf",
    cover: "/Magazines/August 2025 mag Spread.pdf",
    issueNumber: 3,
  },
  {
    id: "september-2025",
    title: "Mining Discovery",
    month: "September",
    monthIndex: 9,
    year: 2025,
    edition: "September Edition 2025",
    pdf: "/Magazines/September 2025 mag spread.pdf",
    cover: "/Magazines/September 2025 mag spread.pdf",
    issueNumber: 4,
  },
  {
    id: "october-2025",
    title: "Mining Discovery",
    month: "October",
    monthIndex: 10,
    year: 2025,
    edition: "October Edition 2025",
    pdf: "/Magazines/October 2025 mag spread.pdf",
    cover: "/Magazines/October 2025 mag spread.pdf",
    issueNumber: 5,
  },
  {
    id: "november-2025",
    title: "Mining Discovery",
    month: "November",
    monthIndex: 11,
    year: 2025,
    edition: "November Edition 2025",
    pdf: "/Magazines/November 2025 Mag Spread.pdf",
    cover: "/Magazines/November 2025 Mag Spread.pdf",
    issueNumber: 6,
  },
  {
    id: "december-2025",
    title: "Mining Discovery",
    month: "December",
    monthIndex: 12,
    year: 2025,
    edition: "December Edition 2025",
    pdf: "/Magazines/December 2025 Mag spread.pdf",
    cover: "/Magazines/December 2025 Mag spread.pdf",
    issueNumber: 7,
  },
  {
    id: "january-2026",
    title: "Mining Discovery",
    month: "January",
    monthIndex: 1,
    year: 2026,
    edition: "January Edition 2026",
    pdf: "/Magazines/January 2026 Mag Spread.pdf",
    cover: "/Magazines/January 2026 Mag Spread.pdf",
    issueNumber: 8,
  },
  {
    id: "february-2026",
    title: "Mining Discovery",
    month: "February",
    monthIndex: 2,
    year: 2026,
    edition: "February Edition 2026",
    pdf: "/Magazines/February 2026 Mag spread.pdf",
    cover: "/Magazines/February 2026 Mag spread.pdf",
    issueNumber: 9,
  },
  {
    id: "march-2026",
    title: "Mining Discovery",
    month: "March",
    monthIndex: 3,
    year: 2026,
    edition: "March Edition 2026",
    pdf: "/Magazines/March 2026 mag spread.pdf",
    cover: "/Magazines/March 2026 mag spread.pdf",
    issueNumber: 10,
  },
  {
    id: "april-2026",
    title: "Mining Discovery",
    month: "April",
    monthIndex: 4,
    year: 2026,
    edition: "April Edition 2026",
    pdf: "/Magazines/April 2026 mag spread.pdf",
    cover: "/Magazines/April 2026 mag spread.pdf",
    issueNumber: 11,
  },
  {
    id: "may-2026",
    title: "Mining Discovery",
    month: "May",
    monthIndex: 5,
    year: 2026,
    edition: "May Edition 2026",
    pdf: "/Magazines/May 2026 mag spread.pdf",
    cover: "/Magazines/May 2026 mag spread.pdf",
    issueNumber: 12,
  },
  {
    id: "june-2026",
    title: "Mining Discovery",
    month: "June",
    monthIndex: 6,
    year: 2026,
    edition: "June Edition 2026",
    pdf: "/Magazines/June 2026 Mag spread.pdf",
    cover: "/Magazines/June 2026 Mag spread.pdf",
    issueNumber: 13,
  },
  {
    id: "july-2026",
    title: "Mining Discovery",
    month: "July",
    monthIndex: 7,
    year: 2026,
    edition: "July Edition 2026",
    pdf: "/Magazines/July 2026 Mag Spread.pdf",
    cover: "/Magazines/July 2026 Mag Spread.pdf",
    issueNumber: 14,
  },
];

/**
 * Returns all magazines strictly ordered by Year and Month.
 * @param ascending - If true, oldest to newest; if false, newest to oldest (default).
 */
export function getChronologicalMagazines(ascending = false): MagazineEdition[] {
  return [...MAGAZINES].sort((a, b) => {
    if (a.year !== b.year) {
      return ascending ? a.year - b.year : b.year - a.year;
    }
    return ascending ? a.monthIndex - b.monthIndex : b.monthIndex - a.monthIndex;
  });
}

/**
 * Returns the most recent magazine edition (latest year + month).
 */
export function getLatestMagazine(): MagazineEdition {
  return getChronologicalMagazines(false)[0];
}
