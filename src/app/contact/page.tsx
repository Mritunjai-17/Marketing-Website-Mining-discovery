import type { Metadata } from "next";
import { ContactPanel } from "@/components/contact";

export const metadata: Metadata = {
  title: "Contact | Mining Discovery",
  description:
    "Start a conversation with Mining Discovery — questions, projects and opportunities across the global mining industry.",
};

/*
 * The dedicated /contact route.
 *
 * Built section by section. The hero and the contact details are in; the form replaces the
 * placeholder in ServicesInformation's right-hand column in step 2, and Trusted Brands
 * follows after that.
 *
 * A server component, like /about and /services: it owns the metadata and the section order,
 * and each section carries its own "use client" boundary because each drives a GSAP timeline.
 * No <Header /> or <Footer /> — the root layout already wraps every route in both.
 *
 * NOTE: the header, the footer and the Services CTA all still link "Contact" to "/#contact",
 * an anchor that exists on no page. This route is the real destination, but repointing those
 * links means editing shared components, which this task placed out of bounds.
 */
export default function ContactPage() {
  return (
    /*
      The page is now a light ground carrying one card, rather than a full-bleed editorial
      spread. #F7F5EF is the surface this route already used, kept so the page reads as the
      same one it was.
    */
    <div className="w-full bg-[#F7F5EF] font-sans text-[#1A1D21]">
      <ContactPanel />
    </div>
  );
}
