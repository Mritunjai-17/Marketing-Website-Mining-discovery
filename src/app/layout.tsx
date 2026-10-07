import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Header, Footer, SmoothScroll } from "@/components/layout";
import MiningAICHatWidget from "@/components/ui/MiningAICHatWidget";
import CustomCursor from "@/components/ui/CustomCursor";

/**
 * Primary Font: Space Grotesk
 * Used for: Main headings, Section headings, Navigation, Buttons, Important numbers, Short labels
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/**
 * Secondary Font: Inter
 * Used for: Body text, Descriptions, Supporting copy, Cards, Form fields, Small UI text
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Data Font: IBM Plex Mono
 * Used for: Statistics, Numbers, Mining data, Dates, Technical labels, Small metadata
 */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mining Discovery | Premier Mining Marketing & Media Platform",
  description:
    "Mining Discovery is the leading editorial media, marketing, and market intelligence platform for the global mining & metals industry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#1A1D21] antialiased selection:bg-[#B8860B]/20 selection:text-[#0B1F3A]">
        <SmoothScroll>
          <Header />
          <main className="flex-1 overflow-x-clip">{children}</main>
          <Footer />
        </SmoothScroll>
        <MiningAICHatWidget />
        <CustomCursor />
      </body>
    </html>
  );
}
