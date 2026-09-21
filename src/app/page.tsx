"use client";

import { GlobeHero } from "@/components/sections/GlobeHero";
import { CompanyJourney } from "@/components/sections/CompanyJourney/CompanyJourney";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#FAF7F2]">
      {/* SCROLL-DRIVEN 3D GLOBE HERO & STORYTELLING */}
      <GlobeHero />
      {/* COMPANY EVOLUTION TIMELINE ROAD */}
      <CompanyJourney />
    </div>
  );
}
