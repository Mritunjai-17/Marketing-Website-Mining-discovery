import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header, Footer, SmoothScroll } from "@/components/layout";
import MiningAICHatWidget from "@/components/ui/MiningAICHatWidget";
import CustomCursor from "@/components/ui/CustomCursor";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/**
 * Playfair Display, the brand display serif for editorial pull-quotes and headlines.
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#1A1D21] antialiased selection:bg-[#B8860B]/20 selection:text-[#0B1F3A]">
        <SmoothScroll>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
        <MiningAICHatWidget />
        <CustomCursor />
      </body>
    </html>
  );
}
