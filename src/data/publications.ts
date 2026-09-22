/**
 * Publications Data (Weekly Newsletters & Articles)
 * Sourced from Mining Discovery Strapi CMS
 */

export interface PublicationItem {
  id: string;
  title: string;
  cover: string;
  pdf: string;
  description?: string;
  date?: string;
}

export function getProxiedPdfUrl(pdfUrl: string): string {
  if (!pdfUrl) return "";
  if (pdfUrl.startsWith("/api/pdf-proxy") || pdfUrl.startsWith("/Magazines/")) {
    return pdfUrl;
  }
  if (pdfUrl.startsWith("http://") || pdfUrl.startsWith("https://")) {
    return `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
  }
  return pdfUrl;
}

export const INITIAL_NEWSLETTERS: PublicationItem[] = [
  {
    "id": "83",
    "title": "17 November 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_17_NOV_converted_25e305b198.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/November_17_2025_370b2590fa.pdf",
    "date": "2026-01-14T11:18:21.007Z"
  },
  {
    "id": "29",
    "title": "August 4, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_sept_3c8fc35596.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_10_9528626c44.pdf",
    "date": "2025-10-27T11:34:54.203Z"
  },
  {
    "id": "30",
    "title": "August 18, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Newsletter_10_pdf_6d6142f2e4.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_12_d34ca67e51.pdf",
    "date": "2025-10-27T11:35:18.325Z"
  },
  {
    "id": "31",
    "title": "August 11, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_sept_3c8fc35596.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_11_377afee21a.pdf",
    "date": "2025-10-27T11:35:52.626Z"
  },
  {
    "id": "33",
    "title": "July 28, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_August_5_2025_df8645527a.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_10_9528626c44.pdf",
    "date": "2025-10-27T11:39:26.624Z"
  },
  {
    "id": "34",
    "title": "July 22, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_August_11_2025_90a5230038.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_11_377afee21a.pdf",
    "date": "2025-10-27T11:39:49.805Z"
  },
  {
    "id": "36",
    "title": "June 9, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_August_22_2025_1b5b818850.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_13_e38d61db5d.pdf",
    "date": "2025-10-27T11:40:48.464Z"
  },
  {
    "id": "53",
    "title": "September 8,2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_September_1_2025_f1d45d20bd.jpg",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/September_8_c3d4969315.pdf",
    "date": "2025-10-27T12:08:53.168Z"
  },
  {
    "id": "54",
    "title": "September 5,2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_September_1_2025_f1d45d20bd.jpg",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/September_5_e62b00054e.pdf",
    "date": "2025-10-27T12:09:15.755Z"
  },
  {
    "id": "41",
    "title": "June 2, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_june_a3d9f8fe6d.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_6_a095031f51.pdf",
    "date": "2025-10-27T11:47:37.172Z"
  },
  {
    "id": "42",
    "title": "August 25, 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_sept_3c8fc35596.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_13_e38d61db5d.pdf",
    "date": "2025-10-27T11:47:44.820Z"
  },
  {
    "id": "46",
    "title": "September 3,2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_September_1_2025_f1d45d20bd.jpg",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/September_3_4_4ceacee273.pdf",
    "date": "2025-10-27T12:06:55.480Z"
  },
  {
    "id": "55",
    "title": "September 4,2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_September_1_2025_f1d45d20bd.jpg",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/September_4_5_037f345a8d.pdf",
    "date": "2025-10-27T12:09:28.191Z"
  },
  {
    "id": "85",
    "title": "24 November 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_24_nov_converted_913510e5e6.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/November_24_2025_1e73f81d78.pdf",
    "date": "2026-01-14T11:19:45.782Z"
  },
  {
    "id": "61",
    "title": "1st September 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_sept1_converted_7bdb19652d.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Sep_1_5_ac8674ce0e.pdf",
    "date": "2026-01-12T06:03:29.516Z"
  },
  {
    "id": "63",
    "title": "29 September 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_29_Sept_converted_fc5d8102d5.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Sep_29_30_78509ed54a.pdf",
    "date": "2026-01-12T06:06:25.225Z"
  },
  {
    "id": "67",
    "title": "16 September 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_16_Sept_converted_d133cc5359.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Sep_16_19_e8a89706a2.pdf",
    "date": "2026-01-12T06:11:49.329Z"
  },
  {
    "id": "69",
    "title": "1st October 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_1_October_converted_fae84667b0.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Oct_1_2_f572ec84d2.pdf",
    "date": "2026-01-12T06:14:22.802Z"
  },
  {
    "id": "71",
    "title": "3 October 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_3_October_converted_989dc6cd08.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Oct_3_9_d52020652a.pdf",
    "date": "2026-01-12T06:16:08.523Z"
  },
  {
    "id": "73",
    "title": "10 October 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_10_oct_converted_c755bc8bd1.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Oct_10_16_7f2c359594.pdf",
    "date": "2026-01-12T06:17:22.870Z"
  },
  {
    "id": "75",
    "title": "17 October 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_17_oct_converted_e02624da94.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Oct_17_23_14e0967a43.pdf",
    "date": "2026-01-12T06:18:32.205Z"
  },
  {
    "id": "79",
    "title": "3 November 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_3_nov_converted_9ea78a3cd3.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/November_3_2025_3bb9f0c39e.pdf",
    "date": "2026-01-14T11:15:50.201Z"
  },
  {
    "id": "81",
    "title": "10 November 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_10_nov_converted_d770795774.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/November_10_2025_724d6da3da.pdf",
    "date": "2026-01-14T11:17:03.684Z"
  },
  {
    "id": "86",
    "title": "24 October 2025",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_24_oct_converted_eb23435494.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Oct_24_30_c4d04126ba.pdf",
    "date": "2026-01-14T11:39:55.719Z"
  },
  {
    "id": "94",
    "title": "December Week 4",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_December_Week_4_converted_fe17e0be75.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Dec_22_28_8722ce52be.pdf",
    "date": "2026-01-22T10:20:47.906Z"
  },
  {
    "id": "95",
    "title": "December Week 1",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_December_Week_1_8b53df0214.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Dec_1_7_5359956c87.pdf",
    "date": "2026-01-22T10:21:18.621Z"
  },
  {
    "id": "96",
    "title": "December Week 2",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_December_Week_2_converted_344152d02d.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Dec_8_14_dc3a594157.pdf",
    "date": "2026-01-22T10:21:39.912Z"
  },
  {
    "id": "97",
    "title": "December Week 3",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_December_Week_3_converted_16407a6d6b.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Dec_15_21_0c6dbabbe4.pdf",
    "date": "2026-01-22T10:22:02.876Z"
  },
  {
    "id": "99",
    "title": "December Week 5",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_December_Week_5_converted_f6db1d2944.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Dec_29_31_25a1794d68.pdf",
    "date": "2026-01-22T10:23:14.606Z"
  },
  {
    "id": "161",
    "title": "May 16-31",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_May_15_31_b1d8b9b1a1.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/May_16_to_31_0157ad2eca.pdf",
    "date": "2026-06-16T06:59:13.677Z"
  },
  {
    "id": "136",
    "title": "March Week 5",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_March_week_5_3ddd49ffc4.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_March_Week_5_4aba707536.pdf",
    "date": "2026-04-27T10:46:17.401Z"
  },
  {
    "id": "137",
    "title": "March Week 4",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_March_week_4_6b2b028122.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_March_Week_4_0ddd0bb231.pdf",
    "date": "2026-04-27T10:46:41.073Z"
  },
  {
    "id": "138",
    "title": "March Week 3",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_March_week_3_2a9b719383.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_March_Week_3_d76e82008d.pdf",
    "date": "2026-04-27T10:47:12.190Z"
  },
  {
    "id": "139",
    "title": "March Week 2",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_March_week_2_eb48d62bce.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_March_Week_2_f81f5f00b0.pdf",
    "date": "2026-04-27T10:47:36.143Z"
  },
  {
    "id": "140",
    "title": "March Week 1",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_March_week_1_780ccff564.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Newsletter_March_Week_1_b8c2c0392f.pdf",
    "date": "2026-04-27T10:47:58.888Z"
  },
  {
    "id": "141",
    "title": "February Week 1",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Feb_week_1_440150d6a7.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Feb_Week_1_69370de6ce.pdf",
    "date": "2026-04-27T11:40:26.067Z"
  },
  {
    "id": "142",
    "title": "February Week 2",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Feb_week_2_9a9497feab.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Feb_Week_2_91ead910c4.pdf",
    "date": "2026-04-27T11:41:28.003Z"
  },
  {
    "id": "143",
    "title": "February Week 3",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Feb_week_3_d1813157e5.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Feb_Week_3_6643d13faa.pdf",
    "date": "2026-04-27T11:42:47.867Z"
  },
  {
    "id": "144",
    "title": "February Week 4",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Feb_week_4_2c60d885c6.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Feb_Week_4_2446b41bfb.pdf",
    "date": "2026-04-27T11:43:34.314Z"
  },
  {
    "id": "145",
    "title": "January Week 1",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Jan_week_1_2ec4ae5629.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Jan_Week_1_a66a82db28.pdf",
    "date": "2026-04-27T12:18:25.968Z"
  },
  {
    "id": "146",
    "title": "January Week 2",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Jan_week_2_12022a9850.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Jan_Week_2_40be454cd0.pdf",
    "date": "2026-04-27T12:19:07.287Z"
  },
  {
    "id": "147",
    "title": "January Week 3",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Jan_week_3_9af03e91f4.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Jan_Week_3_e09710f40f.pdf",
    "date": "2026-04-27T12:20:06.368Z"
  },
  {
    "id": "148",
    "title": "January Week 4",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Jan_week_4_6e189a8caa.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Jan_Week_4_33c7d155cf.pdf",
    "date": "2026-04-27T12:21:05.804Z"
  },
  {
    "id": "149",
    "title": "January Week 5",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Jan_week_5_4543c1d640.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Jan_Week_5_3271192c90.pdf",
    "date": "2026-04-27T12:22:07.503Z"
  },
  {
    "id": "153",
    "title": "April 1-15",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_April_1_15_367fb2e8b6.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/April_1_15_d22f67275a.pdf",
    "date": "2026-05-19T08:06:13.033Z"
  },
  {
    "id": "155",
    "title": "April 16-30",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_April_16_30_5e500d4e1f.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/April_16_30_c9f0885d3b.pdf",
    "date": "2026-05-19T08:07:01.692Z"
  },
  {
    "id": "158",
    "title": "May 1-15 ",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_May_1_15_5a42c57970.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/May_1_to_15_10e9743a6d.pdf",
    "date": "2026-06-16T06:57:16.712Z"
  }
];

export const INITIAL_ARTICLES: PublicationItem[] = [
  {
    "id": "11",
    "title": "Silver wolf",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_43_2ce336b06b.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Silver_Wolf_Exploration_4_cda5afab3e.pdf",
    "description": "",
    "date": "2026-04-30T11:53:07.966Z"
  },
  {
    "id": "12",
    "title": "Silver wolf",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_44_8d4c06a08b.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Silver_Wolf_A_1_3_3c8e3831ae.pdf",
    "description": "",
    "date": "2026-04-30T11:53:44.209Z"
  },
  {
    "id": "14",
    "title": "Pan Global Resources",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Pan_Global_Resources_Inc_1b6b03beef.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Pan_Global_Resources_developing_copper_scale_in_Spain_after_maiden_1_3c491a5783.pdf",
    "description": "",
    "date": "2026-05-04T05:05:30.698Z"
  },
  {
    "id": "17",
    "title": "Pan Global Resources",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Pan_Global_Resources_Inc_1_12227b3edd.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Pan_Global_Resources_6ee7b08638.pdf",
    "description": "",
    "date": "2026-06-22T09:09:35.345Z"
  },
  {
    "id": "19",
    "title": "Auro Metals Inc",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Auro_Metals_Inc_1_converted_d0d6dc9838.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Auro_Metals_PDF_183fecd67f.pdf",
    "description": "",
    "date": "2026-06-26T06:42:39.720Z"
  },
  {
    "id": "21",
    "title": "US Gold Corp",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_U_S_Gold_Corp_converted_2d59b49b01.webp",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/U_S_Gold_f6e29f9ef2.pdf",
    "description": "",
    "date": "2026-06-26T06:43:33.640Z"
  },
  {
    "id": "23",
    "title": "Auro Metals Inc",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Auro_Metals_Inc_1_fbfd559516.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Auro_Metals_PDF_8_c6857a2f87.pdf",
    "description": "",
    "date": "2026-07-13T09:40:31.761Z"
  },
  {
    "id": "24",
    "title": "Harfang Exploration",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Harfang_Exploration_bebcb4e815.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Harfang_Article_e3f275e038.pdf",
    "description": "",
    "date": "2026-08-03T09:52:16.728Z"
  },
  {
    "id": "26",
    "title": "Auro Metals Inc",
    "cover": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/medium_Auro_Metals_PDF_1_316b0e1117.png",
    "pdf": "https://acceptable-desire-0cca5bb827.media.strapiapp.com/Auro_Metals_PDF_14_6607d55c13.pdf",
    "description": "",
    "date": "2026-09-18T10:37:23.544Z"
  }
];
