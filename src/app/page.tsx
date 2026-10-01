"use client";

import { GlobeHero, MiningDiscoveryShowcase, FaqSection } from "@/components/sections";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF7F2]">
      {/* SCROLL-DRIVEN 3D GLOBE HERO, TRUCK & OUR SERVICES (ALL 8 CARDS) */}
      <GlobeHero />

      {/* MINING DISCOVERY INTERACTIVE SHOWCASE (QUOTE -> ZOOM -> HORIZONTAL CARDS) */}
      <MiningDiscoveryShowcase />

      {/* FAQ SECTION — pre-footer trust builder */}
      <FaqSection />
    </div>
  );
}
