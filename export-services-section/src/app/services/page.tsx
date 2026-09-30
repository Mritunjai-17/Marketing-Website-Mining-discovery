import type { Metadata } from "next";
import { ServicesJourney } from "@/components/services";

export const metadata: Metadata = {
  title: "Services | Mining Discovery",
  description:
    "Investor growth, media authority, brand and digital, audience growth, executive visibility and direct audience — six service categories built for the mining industry.",
};

/*
 * The dedicated /services route, reached from the header's SERVICES link and from the
 * homepage's "Explore all services" CTA.
 *
 * WHAT THIS RENDERS NOW. One component: the immersive six-chapter journey. The page used
 * to be six stacked sections on an ivory ground — hero, capabilities, mining story,
 * showcase, trusted brands, closing CTA — which is a different brief from the one this
 * page now answers. It is a single continuous experience rather than a stack of blocks,
 * so composing it from six independent sections would only have put seams back in.
 *
 * THE OLD SECTIONS ARE STILL THERE. ServicesHero, ServicesCapabilities,
 * ServicesMiningStory, ServicesShowcase, ServicesTrustedBrands and ServicesFinalCTA are
 * left in src/components/services/ and still exported, exactly as ServicesEcosystem and
 * ServicesProcess already were — unrendered, not deleted, so bringing any of them back is
 * a one-line change here.
 *
 * Still a server component, like /about: it owns the metadata, and the journey carries its
 * own "use client" boundary because it drives a scrubbed GSAP timeline. Nothing here
 * imports the homepage's ServicesScrollStory, so nothing on this route can change how the
 * homepage behaves.
 */
export default function ServicesPage() {
  return <ServicesJourney />;
}
