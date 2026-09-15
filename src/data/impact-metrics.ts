/**
 * Approved Mining Discovery Impact Metrics
 *
 * Preserved for future compact supporting impact/proof strip around or underneath the magazine.
 * Values are strictly preserved from the approved project specification.
 */

export interface ImpactMetricItem {
  id: string;
  number: string;
  category: string;
  categoryName: string;
  value: string;
  metricLabel: string;
  description: string;
  contextLabel: string;
  link: string;
}

export const IMPACT_METRICS: ImpactMetricItem[] = [
  {
    id: "leads",
    number: "01",
    category: "01 / REACH",
    categoryName: "REACH",
    value: "+120%",
    metricLabel: "QUALIFIED LEADS",
    description:
      "Targeted digital campaigns helped create stronger connections between mining opportunities and relevant audiences.",
    contextLabel: "SELECTED CAMPAIGN OUTCOME",
    link: "/work",
  },
  {
    id: "retention",
    number: "02",
    category: "02 / RETENTION",
    categoryName: "RETENTION",
    value: "+35%",
    metricLabel: "NEWSLETTER SUBSCRIPTIONS",
    description:
      "Consistent industry communication helped expand the direct audience around mining content.",
    contextLabel: "SELECTED CAMPAIGN OUTCOME",
    link: "/work",
  },
  {
    id: "engagement",
    number: "03",
    category: "03 / ENGAGEMENT",
    categoryName: "ENGAGEMENT",
    value: "+50%",
    metricLabel: "SOCIAL MEDIA ENGAGEMENT",
    description:
      "Strategic content and digital distribution helped increase interaction across relevant audiences.",
    contextLabel: "SELECTED CAMPAIGN OUTCOME",
    link: "/work",
  },
  {
    id: "community",
    number: "04",
    category: "04 / COMMUNITY",
    categoryName: "COMMUNITY",
    value: "12,000+",
    metricLabel: "SUBSTACK SUBSCRIBERS",
    description:
      "A growing direct audience built around mining news, insights and industry stories.",
    contextLabel: "CURRENT AUDIENCE",
    link: "/work",
  },
];
