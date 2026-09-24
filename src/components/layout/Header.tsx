"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Calendar, Menu, X, ArrowRight } from "lucide-react";

/*
 * Primary Navigation Architecture for Mining Discovery
 * Image 2 state: Flush top, transparent background, clean spaced links, golden active dot, circular icon + amber CTA.
 * Image 1 state (scrolled): Floating capsule/pill navbar, centered with max-width, dark emerald background, blur, and drop shadow.
 */
const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Work", href: "/work" },
  { name: "Contact", href: "/contact" },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Scroll detection to morph between Image 2 (top) and Image 1 (floating pill)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = Math.max(0, window.scrollY);
      setIsScrolled(scrollY > 35);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    const lenis = (window as any).lenis;
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close mobile drawer on route change or Escape key
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Determine theme: About hero is warm ivory (#F7F5EF), while Home/Services/Work/Contact are dark
  const isLightHero = pathname?.startsWith("/about") ?? false;
  const isDarkNav = isScrolled || !isLightHero;

  return (
    <>
      {/* Outer fixed positioning wrapper - full length across the screen */}
      <header
        className={`fixed top-0 left-0 right-0 w-full z-[110] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled
            ? "bg-[#06080d]/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_12px_35px_-8px_rgba(0,0,0,0.85)]"
            : isLightHero
            ? "bg-transparent border-b border-[#E5E4DE]/60"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        {/* Full-length container with refined responsive padding */}
        <div
          className={`w-full flex items-center justify-between px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 transition-all duration-500 ${
            isScrolled ? "py-2.5 sm:py-3" : "py-4 sm:py-5"
          }`}
        >
          {/* Left: Brand Logo with increased size */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 sm:gap-3 focus:outline-none shrink-0"
            aria-label="Mining Discovery Home"
          >
            <Image
              src="/logo.webp"
              alt="Mining Discovery"
              width={260}
              height={75}
              priority
              className={`w-auto object-contain transition-all duration-500 ${
                isScrolled ? "h-9 sm:h-11 md:h-12" : "h-10 sm:h-12 md:h-14"
              }`}
            />
          </Link>

          {/* Center: Desktop Navigation Links with Active Golden Dot */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              const linkColorClass = isDarkNav
                ? isActive
                  ? "text-[#FAF8F5]"
                  : "text-[#FAF8F5]/80 group-hover:text-[#E5A93C]"
                : isActive
                ? "text-[#0B1F3A]"
                : "text-[#0B1F3A]/75 group-hover:text-[#B8860B]";

              const dotColorClass = isDarkNav
                ? "bg-[#E5A93C] shadow-[0_0_8px_#E5A93C]"
                : "bg-[#B8860B] shadow-[0_0_8px_#B8860B]";

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative py-1 group flex flex-col items-center"
                >
                  <span
                    className={`text-[11px] xl:text-xs font-semibold tracking-[0.2em] uppercase transition-colors duration-300 ${linkColorClass}`}
                  >
                    {link.name}
                  </span>

                  {/* Golden indicator dot */}
                  <span
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotColorClass} transition-all duration-300 ${
                      isActive
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-50 group-hover:opacity-60 group-hover:scale-75"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right: Circular Icon Button + Golden Amber Pill CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Circular Action Button */}
            <Link
              href="/contact"
              className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border transition-all duration-300 backdrop-blur-sm cursor-pointer group flex items-center justify-center ${
                isDarkNav
                  ? "border-white/20 hover:border-[#E5A93C] text-white/85 hover:text-[#E5A93C] bg-white/5 hover:bg-white/10"
                  : "border-[#0B1F3A]/20 hover:border-[#B8860B] text-[#0B1F3A]/85 hover:text-[#B8860B] bg-[#0B1F3A]/5 hover:bg-[#0B1F3A]/10"
              }`}
              aria-label="Schedule Consultation"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:scale-110" />
            </Link>

            {/* Golden Amber Pill CTA Button */}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#E5A93C] via-[#E8B045] to-[#D49525] text-[#111713] font-sans font-bold text-[10px] sm:text-xs uppercase tracking-[0.16em] hover:brightness-110 hover:shadow-[0_0_24px_rgba(229,169,60,0.5)] transition-all duration-300 hover:scale-[1.02] shrink-0 active:scale-[0.98]"
            >
              <span className="hidden sm:inline">SCHEDULE BRIEFING</span>
              <span className="sm:hidden">BRIEFING</span>
            </Link>

            {/* Mobile Menu Trigger (Hamburger icon) */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-colors focus:outline-none cursor-pointer ${
                isDarkNav
                  ? "border-white/20 text-white/90 hover:text-white hover:border-white/40 bg-white/5"
                  : "border-[#0B1F3A]/20 text-[#0B1F3A] hover:text-[#0B1F3A] hover:border-[#0B1F3A]/40 bg-[#0B1F3A]/5"
              }`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Luxury Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 z-[105] lg:hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop blur overlay */}
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-[#06080d] border-l border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <Image
              src="/logo.webp"
              alt="Mining Discovery"
              width={200}
              height={58}
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="flex flex-col gap-5 py-8">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-lg sm:text-xl font-medium tracking-[0.14em] uppercase text-[#FAF8F5]/90 hover:text-[#E5A93C] transition-colors"
                >
                  <span>{link.name}</span>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#E5A93C] shadow-[0_0_10px_#E5A93C]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 opacity-40" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer CTA */}
          <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#E5A93C] to-[#D49525] text-[#111713] font-bold text-center text-xs uppercase tracking-[0.18em] shadow-[0_4px_20px_rgba(229,169,60,0.35)]"
            >
              SCHEDULE BRIEFING
            </Link>

            <div className="flex items-center justify-center gap-5 pt-2 text-white/60">
              <a
                href="https://www.linkedin.com/company/miningdiscovery/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E5A93C] transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.67 1.67 0 1 0 1.67 1.67 1.67 1.67 0 0 0-1.67-1.67z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/miningdiscovery"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E5A93C] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/share/17woBUaJqG/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#E5A93C] transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
