"use client";

// Imported per-module rather than through the sections barrel: the barrel also re-exports
// WorldMapHero, which statically imports the world-atlas TopoJSON and would land in this
// page's bundle even though nothing here renders it.
import { GlobeHero } from "@/components/sections/GlobeHero";
import { CompanyJourney } from "@/components/sections/CompanyJourney/CompanyJourney";
import { ImpactCards } from "@/components/sections/ImpactCards";
import { Stats } from "@/components/sections/Stats";
import { About } from "@/components/sections/About";
import { TrustedBy } from "@/components/sections/TrustedBy";
import { ServicesScrollStory } from "@/components/sections/ServicesScrollStory";

export default function Home() {
  // overflow-x-clip, not -hidden: "hidden" computes overflow-y to "auto", which makes
  // this a scroll container and stops the hero's sticky child from pinning to the
  // viewport. "clip" clips just as well without creating one.
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#F2F2F0]">
      {/* ROTATING HEMISPHERE HERO */}
      <GlobeHero />

      {/* COMPANY JOURNEY - SECTION 02 */}
      <div className="relative z-20">
        <CompanyJourney />
      </div>

      {/* FOUR IMPACT STAT CARDS (EXACT SCREENSHOT DESIGN) */}
      <div className="relative z-20">
        <ImpactCards />
      </div>

      {/* FOLLOWING SECTIONS (STATS, TRUSTED BY, SERVICES) */}
      {/* Layout/stacking only — the surface belongs to Stats' own <section>. */}
      <div className="relative z-20">
        <Stats />
      </div>
      {/*
        Services sits here, directly after Market Influence & Reach, so the page reads
        story → proof → reach → capability → trust → action. It carries its own seams at
        both ends: a ramp down from Stats' near-white ground at the top, and a ramp to
        About's #050C18 at the bottom for About's -mt-16 to land on.
      */}
      <ServicesScrollStory />
      {/* The header and footer both link to #about; this is what they resolve to. */}
      <About />
      <TrustedBy />
    </div>
  );
}
