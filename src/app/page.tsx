"use client";

import { GlobeHero } from "@/components/sections/GlobeHero";
import MiningDiscoveryShowcase from "@/components/MiningDiscoveryShowcase";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF7F2]">
      {/* SCROLL-DRIVEN 3D GLOBE HERO, TRUCK & OUR SERVICES (ALL 8 CARDS) */}
      <GlobeHero />

      {/* MINING DISCOVERY INTERACTIVE SHOWCASE (QUOTE -> ZOOM -> HORIZONTAL CARDS) */}
      <MiningDiscoveryShowcase />
    </div>
  );
}
