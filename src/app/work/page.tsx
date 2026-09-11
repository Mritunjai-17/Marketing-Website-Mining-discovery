import { Metadata } from "next";
import WorkPortfolioViewer from "@/components/portfolio/WorkPortfolioViewer";

export const metadata: Metadata = {
  title: "Work & Portfolio | Mining Discovery",
  description:
    "Explore Mining Discovery's visual portfolio showcasing natural resource marketing, media, branding, and investor engagement.",
};

export default function WorkPage() {
  return <WorkPortfolioViewer pdfPath="/documents/mining-discovery-portfolio.pdf" />;
}
