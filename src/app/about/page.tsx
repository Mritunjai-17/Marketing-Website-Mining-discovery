import type { Metadata } from "next";
import {
  AboutAdvisor,
  AboutClosing,
  AboutHero,
  AboutLookingAhead,
  AboutManagement,
  AboutOrigin,
  AboutPrinciples,
  AboutPurpose,
  AboutTrustedBrands,
  AboutUnique,
} from "@/components/about";

export const metadata: Metadata = {
  title: "About Us | Mining Discovery",
  description:
    "Mining Discovery was founded in 2022 by Gaurav Sharma and Sagar Bakshi to bring clarity and depth to a mining sector often clouded by noise — covering exploration, production, regulation, investment, and ESG across global mining markets.",
};

/*
 * The standalone About page, reached from the header's ABOUT link and the homepage CTA.
 *
 * EVERY FACT ON THIS PAGE COMES FROM miningdiscovery.com/about-us. The founding year, both
 * founders, the advisor and her fifty-plus years, the four purposes, the five principles,
 * the five differentiators, the three expansion regions, and the trusted brands roster are
 * all the source's. Nothing here should be edited into a claim the source does not make —
 * no client counts, no revenue, no office locations, no dates between 2022 and now.
 *
 * A server component. It owns the metadata and the section order and nothing else; each
 * section carries its own "use client" boundary because each drives its own GSAP timeline.
 * No <Header /> or <Footer />: the root layout (src/app/layout.tsx) already wraps every
 * page in both. The hero's pt-32 is the offset for that layout's fixed header, which
 * overlays the page rather than sitting in the flow.
 *
 * Vertical scroll throughout, on purpose. The homepage's About section is a four-panel
 * horizontal pin; repeating that mechanic here would make the two read as the same
 * component twice rather than as a summary and its full account. Shared vocabulary instead
 * of shared motion — gold hairline, eyebrow, serif headline, masked word reveal.
 */
/*
 * THE PAGE GROUND: #F7F5EF, warm ivory, declared on the wrapper below and nowhere else —
 * no global CSS, no body/html/:root, nothing any other route can reach.
 *
 * For it to be visible at all, the sections that used to paint #FBFBFA over it had to stop
 * painting. That near-white was never an intentional contrast; it was simply this page's
 * alternate tint, and the wrapper now holds that role. Sections that declare a colour of
 * their own keep it — white on Origin, Advisor, Principles and Trusted Brands, navy on
 * Looking Ahead — so the page still alternates ground to ground rather than flattening into
 * one ivory field.
 */
export default function AboutPage() {
  return (
    <div className="w-full overflow-x-clip bg-[#F7F5EF] font-sans text-[#1A1D21]">
      {/*
        Every section on this page hides its content in CSS before revealing it, so that the
        server-rendered HTML never flashes the finished layout before hydration. With no JS
        there is no reveal — so the hidden state must not be what a reader is left looking
        at. Declared once here rather than in ten components, and inert for everyone else:
        a <noscript> block's contents are never parsed as markup when scripting is enabled.
      */}
      <noscript>
        <style>{`[data-about-reveal],[data-about-rule-x],[data-about-rule-y],.about-mask__word{transform:none!important;opacity:1!important}`}</style>
      </noscript>

      {/* 01 — Hero */}
      <AboutHero />
      {/* 02 — Our Origin */}
      <AboutOrigin />
      {/* 03 — Management */}
      <AboutManagement />
      {/* 04 — Advisor */}
      <AboutAdvisor />
      {/* 05 — Our Purpose */}
      <AboutPurpose />
      {/* 06 — Our Principles */}
      <AboutPrinciples />
      {/* 07 — What Makes Us Unique */}
      <AboutUnique />
      {/* 08 — Looking Ahead */}
      <AboutLookingAhead />
      {/* 09 — Trusted Brands */}
      <AboutTrustedBrands />
      {/* Closer — positioning statement and the page's one CTA */}
      <AboutClosing />
    </div>
  );
}