import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionReveal, RevealItem } from "@/components/ui/SectionReveal";

/**
 * Brand glyphs as inline paths rather than an icon package.
 *
 * lucide-react is already a dependency but v1 carries no brand icons at all — it dropped
 * every logo mark for trademark reasons, so there is no Facebook, X, Instagram, LinkedIn
 * or YouTube in it to import. Substituting generic shapes (Share2, Video) for recognised
 * logos reads as a mistake rather than as a style choice, and pulling in react-icons for
 * six paths is a large dependency for a fixed, tiny need. These are 24x24 viewBox glyphs
 * and are filled with currentColor, so a single text colour drives the whole row.
 */
const SOCIALS: Array<{ name: string; href: string; path: string }> = [
  {
    name: "Facebook",
    href: "#",
    path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  },
  {
    name: "X",
    href: "#",
    path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
  {
    name: "Instagram",
    href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    name: "LinkedIn",
    href: "#",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    name: "YouTube",
    href: "#",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    name: "Substack",
    href: "#",
    path: "M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z",
  },
];

/**
 * Link columns. Every href is a placeholder: the site is a single route today, so real
 * paths would 404 and in-page anchors only resolve on the home page. The two that DO
 * have a destination already point at the header's own anchors, so they are correct now
 * and the rest are one edit each when the pages exist.
 */
const COLUMNS: Array<{ heading: string; links: Array<{ name: string; href: string }> }> = [
  {
    heading: "Content",
    links: [
      { name: "Services", href: "/#services" },
      { name: "Submit News", href: "/#submit-news" },
      { name: "Newsletter", href: "#" },
      { name: "Magazine", href: "#" },
      { name: "News", href: "#" },
    ],
  },
  {
    heading: "Profiles",
    links: [
      { name: "CEO Profiles", href: "#" },
      { name: "Company Profiles", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Management", href: "#" },
      { name: "Contact", href: "/#contact" },
    ],
  },
];

export const Footer: React.FC = () => {
  return (
    /*
     * Same #0B1F3A as the header, deliberately: the two dark bands are what close the
     * page top and bottom around the light editorial middle. border-t in navy-dark keeps
     * the seam against Services' own surface.
     */
    <footer className="w-full border-t border-[#061224] bg-[#0B1F3A] font-sans text-white">
      {/*
        The footer closes the page, so it gets the same entrance every section above it
        has: brand, then the link columns left to right, then socials, then the bottom
        bar. Nothing here needs state, so this file stays a server component - the two
        wrappers below are the only client code involved.
      */}
      <SectionReveal className="container-editorial py-8 md:py-10 lg:py-12">
        {/*
          Twelve columns rather than five. The brand block needs roughly a third to keep
          its description from wrapping into a narrow ribbon, and 4 + 2 + 2 + 2 + 2 gives
          it that while leaving the four link columns exactly equal — which is what
          repeat(4, 1fr) would have done had the brand not been in the same row.
        */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <RevealItem className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]"
              aria-label="Mining Discovery Home"
            >
              <Image
                src="/logo.png"
                alt="Mining Discovery Logo"
                width={220}
                height={85}
                className="h-11 w-auto object-contain sm:h-12"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm font-normal leading-relaxed text-[#F0F4F8]/70">
              Mining Discovery is your trusted source for in-depth mining news, executive
              profiles, company insights, and industry analysis — connecting the global
              mining community with the stories that matter.
            </p>
          </RevealItem>

          {/* Link columns */}
          {COLUMNS.map((column) => (
            <RevealItem key={column.heading} className="lg:col-span-2">
              <nav aria-label={column.heading}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#D4AF37]">
                  {column.heading}
                </h2>
                <ul className="mt-5 space-y-4">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm font-normal text-[#F0F4F8]/70 underline-offset-4 transition-colors duration-200 hover:text-[#D4AF37] hover:underline focus:outline-none focus-visible:text-[#D4AF37] focus-visible:underline"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </RevealItem>
          ))}

          {/* Social */}
          <RevealItem className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#D4AF37]">
              Follow Us
            </h2>
            <ul className="mt-5 flex flex-wrap gap-3">
              {SOCIALS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    aria-label={social.name}
                    className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#F0F4F8]/70 transition-colors duration-200 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] focus:outline-none focus-visible:border-[#D4AF37] focus-visible:text-[#D4AF37]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[18px] w-[18px]"
                      fill="currentColor"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d={social.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </RevealItem>
        </div>

        {/* Bottom bar */}
        <RevealItem className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row lg:mt-10">
          <p className="text-xs font-normal text-[#F0F4F8]/65">
            © {new Date().getFullYear()} Mining Discovery. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-xs font-normal text-[#F0F4F8]/65 underline-offset-4 transition-colors duration-200 hover:text-[#D4AF37] hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs font-normal text-[#F0F4F8]/65 underline-offset-4 transition-colors duration-200 hover:text-[#D4AF37] hover:underline"
            >
              Terms of Use
            </Link>
          </div>
        </RevealItem>
      </SectionReveal>
    </footer>
  );
};
