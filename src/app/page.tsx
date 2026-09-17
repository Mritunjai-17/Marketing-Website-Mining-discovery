"use client";

import { GlobeHero } from "@/components/sections/GlobeHero";
import { CompanyJourney } from "@/components/sections/CompanyJourney/CompanyJourney";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F2F2F0]">
      {/* ROTATING HEMISPHERE HERO & 3D STORYTELLING */}
      <GlobeHero />
      {/* COMPANY EVOLUTION TIMELINE ROAD */}
      <CompanyJourney />
    </div>
  );
}
