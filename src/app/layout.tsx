import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header, Footer, SmoothScroll } from "@/components/layout";

/**
 * Playfair Display, the brand display serif.
 *
 * No `weight` key on purpose: Playfair Display ships as a variable font whose wght
 * axis runs 400-900, so omitting it loads that one variable file and every weight in
 * the range is available - 400 regular, 500/600 medium, 700 bold, 800/900 for the
 * large headlines. Listing static cuts instead would download five files to cover the
 * same range.
 */
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display-custom",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-custom",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono-custom",
  weight: ["400", "500", "600"],
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
      className={`${playfairDisplay.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#1A1D21] antialiased selection:bg-[#B8860B]/20 selection:text-[#0B1F3A]">
        <SmoothScroll>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
