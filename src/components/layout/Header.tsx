"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

/*
 * Every item here is a real route, so none of them are in-page anchors any more.
 *
 * Pointing SERVICES at /services does not touch the homepage's own services section: it
 * keeps its id and its place, and the footer still links to it. The same holds for the
 * two entries that used to sit between SERVICES and CONTACT — COMPANIES ("/#trusted-by")
 * and SUBMIT NEWS ("/#submit-news") are gone from the nav, but the sections they pointed
 * at are untouched and the footer still links to them.
 */
const navLinks = [
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /*
   * GET FEATURED goes to /contact like the nav's Contact item does. router.push rather
   * than wrapping the Button in a Link: Button renders a real <button>, and an <a> around
   * a <button> is interactive content inside interactive content.
   */
  const router = useRouter();
  const pathname = usePathname();

  /*
   * Whether the header is currently sitting on a light page ground.
   *
   * When not scrolled, the page ground is light across all routes (including the
   * light sky hero on the homepage), so dark navy text reads correctly. Once scrolled,
   * the header paints its own #0B1F3A background behind itself, so white text is used.
   */
  const onLightGround = !isScrolled;

  const goToContact = () => {
    setMobileMenuOpen(false);
    router.push("/contact");
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 font-sans ${isScrolled
          ? "bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 shadow-lg py-2.5"
          : "bg-transparent border-b border-transparent py-3"
        }`}
    >
      {/* Full-width container */}
      <div className="w-full px-4 sm:px-8 lg:px-16 flex items-center justify-between">
        {/* Original Brand Logo Left */}
        <Link
          href="/"
          className="group flex items-center focus:outline-none"
          aria-label="Mining Discovery Home"
        >
          <Image
            src="/logo.png"
            alt="Mining Discovery Logo"
            width={220}
            height={85}
            priority
            /*
             * h-14 with -my-1.5, and the negative margin is the whole trick.
             *
             * This image is the tallest thing in the bar, so it is what sets the row
             * height and therefore the header's: 44px of logo inside py-3 is the 69px
             * header. Taking h-11 to h-14 on its own would have carried the navbar up to
             * 81px with it.
             *
             * Flex sizes a line by its items' MARGIN boxes, so -1.5 (-6px top and bottom)
             * hands back exactly the 12px the extra height took: the image draws at 56px
             * and still occupies 44px of layout. The 6px it spills on each side lands in
             * the header's own padding, and the header is overflow: visible, so nothing
             * clips. 56/44 is +27% - inside the 25-35% asked for - and w-auto keeps the
             * 480x212 aspect, so the width follows from 99.7px to ~126.8px on its own.
             *
             * Reset at sm, where the logo was already at its intended 48px and the bar is
             * not the one under review.
             */
            className="h-14 -my-1.5 sm:h-12 sm:my-0 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
          />
        </Link>

        {/* Desktop Navigation Links (Inter 600) */}
        <nav className="hidden lg:flex items-center gap-8 font-sans">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${onLightGround
                  ? // #B8860B on hover, not #D4AF37: the lighter gold is legible on navy
                    // but washes out against an off-white ground.
                    "text-[#0B1F3A] hover:text-[#B8860B]"
                  : isScrolled
                    ? "text-white/90 hover:text-[#D4AF37]"
                    : "text-white/85 hover:text-[#D4AF37]"
                }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Header Action CTA: Distinct "Get Featured" Partnership CTA */}
        <div className="hidden lg:flex items-center">
          <Button
            variant="gold"
            size="sm"
            onClick={goToContact}
            className="font-sans font-semibold tracking-wide text-[#0B1F3A] bg-[#B8860B] hover:bg-[#D4AF37] shadow-[0_0_20px_rgba(184,134,11,0.35)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-shadow text-xs py-1.5 px-4"
          >
            Get Featured
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`lg:hidden p-1.5 rounded-md focus:outline-none transition-colors ${onLightGround
              ? "text-[#0B1F3A] hover:bg-[#0B1F3A]/10"
              : "text-white hover:bg-white/10"
            }`}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#0B1F3A] text-white shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out border-l border-white/15 font-sans">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  <Image
                    src="/logo.png"
                    alt="Mining Discovery"
                    width={160}
                    height={60}
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold uppercase tracking-wider text-white/90 hover:text-[#D4AF37] py-1 border-b border-white/10 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile CTA */}
            <div className="pt-6 border-t border-white/15">
              <Button
                variant="gold"
                size="md"
                fullWidth
                onClick={goToContact}
                className="font-sans font-semibold tracking-wide text-[#0B1F3A] bg-[#B8860B] hover:bg-[#D4AF37] shadow-md"
              >
                Get Featured
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
