"use client";

import { GlobeHero } from "@/components/sections/GlobeHero";
import MiningDiscoveryShowcase from "@/components/MiningDiscoveryShowcase";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF7F2]">
      {/* SCROLL-DRIVEN 3D GLOBE HERO & STORYTELLING */}
      <GlobeHero />
      {/* MINING DISCOVERY INTERACTIVE SHOWCASE */}
      <MiningDiscoveryShowcase />
    </div>
  );
}
