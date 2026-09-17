"use client";

import { GlobeHero } from "@/components/sections/GlobeHero";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F2F2F0]">
      {/* ROTATING HEMISPHERE HERO */}
      <GlobeHero />
    </div>
  );
}
