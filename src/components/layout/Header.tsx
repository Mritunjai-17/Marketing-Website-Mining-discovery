"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";

/*
 * Primary Navigation Architecture for Mining Discovery
 */
const navLinks = [
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Work", href: "/work" },
  { name: "Contact", href: "/contact" },
];

export const Header: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);

  const pathname = usePathname();

  // Dark ground routes that open immediately in dark mode
  const DARK_GROUND_ROUTES = ["/services", "/work", "/contact"];
  const isDarkInitialRoute = DARK_GROUND_ROUTES.includes(pathname);

  // Lock body scroll when overlay menu is open
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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scroll monitoring
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY);
      setIsScrolled(currentScrollY > 30);

      const progress = Math.min(1, currentScrollY / 140);
      setScrollProgress(progress);

      const prevScrollY = lastScrollYRef.current;
      const diff = currentScrollY - prevScrollY;

      if (currentScrollY <= 40) {
        setIsVisible(true);
      } else if (Math.abs(diff) > 3) {
        if (diff > 0) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
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

  const shouldShow = isVisible || menuOpen;

  return (
    <>
      {/* Fixed Navigation Bar */}
      <header
        className="fixed top-0 left-0 z-[110] w-full font-sans transition-all duration-400 ease-out"
        style={{
          transform: shouldShow ? "translateY(0)" : "translateY(-100%)",
          opacity: shouldShow ? 1 : 0,
          pointerEvents: shouldShow ? "auto" : "none",
          backgroundColor: menuOpen
            ? "transparent"
            : isDarkInitialRoute
            ? "rgba(8, 9, 9, 0.75)"
            : scrollProgress > 0.1
            ? `rgba(10, 11, 14, ${(0.82 + scrollProgress * 0.12).toFixed(2)})`
            : "transparent",
          backdropFilter:
            !menuOpen && (scrollProgress > 0.05 || isDarkInitialRoute)
              ? "blur(14px)"
              : "none",
          WebkitBackdropFilter:
            !menuOpen && (scrollProgress > 0.05 || isDarkInitialRoute)
              ? "blur(14px)"
              : "none",
          borderBottom: menuOpen
            ? "none"
            : `1px solid rgba(255, 255, 255, ${(scrollProgress * 0.07).toFixed(2)})`,
          paddingTop: isScrolled
            ? "max(12px, env(safe-area-inset-top, 12px))"
            : "max(18px, env(safe-area-inset-top, 18px))",
          paddingBottom: isScrolled ? "12px" : "18px",
        }}
      >
        {/* 3-Column Luxury Forge Header Layout */}
        <div className="w-full px-5 sm:px-10 lg:px-16 flex items-center justify-between">
          {/* Left Column: Social Icons (LinkedIn, Instagram, Facebook matching recording) */}
          <div className="w-1/3 flex items-center justify-start gap-2.5 sm:gap-4.5">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/miningdiscovery/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110 flex items-center justify-center"
              aria-label="LinkedIn"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.67 1.67 0 1 0 1.67 1.67 1.67 1.67 0 0 0-1.67-1.67z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/miningdiscovery"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110 flex items-center justify-center"
              aria-label="Instagram"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/17woBUaJqG/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110 flex items-center justify-center"
              aria-label="Facebook"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>

          {/* Center Column: Symmetrical Brand Logo */}
          <div className="w-1/3 flex items-center justify-center">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="group flex flex-col items-center justify-center focus:outline-none"
              aria-label="Mining Discovery Home"
            >
              <Image
                src="/logo.webp"
                alt="Mining Discovery Logo"
                width={190}
                height={60}
                priority
                className="h-7 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Right Column: NAVIGATE / CLOSE Trigger Button */}
          <div className="w-1/3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-white/90 hover:text-white transition-all duration-300 focus:outline-none select-none cursor-pointer"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
            >
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] sm:tracking-[0.22em] transition-colors duration-200 group-hover:text-amber-300/90">
                {menuOpen ? "CLOSE" : "NAVIGATE"}
              </span>

              {/* Icon: Two horizontal bars for NAVIGATE, Cross for CLOSE */}
              <div className="relative w-4 h-4 flex items-center justify-center">
                {menuOpen ? (
                  <X className="w-4 h-4 text-white transition-transform duration-300 rotate-0 group-hover:rotate-90" />
                ) : (
                  <div className="flex flex-col justify-center items-end gap-1 w-3.5">
                    <span className="w-3.5 h-[1.5px] bg-white transition-all duration-300 group-hover:w-4" />
                    <span className="w-2.5 h-[1.5px] bg-white transition-all duration-300 group-hover:w-4" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Luxury Editorial Overlay Menu (Forge Style) */}
      <div
        className="fixed inset-0 z-[105] flex flex-col justify-between overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          opacity: menuOpen ? 1 : 0,
          visibility: menuOpen ? "visible" : "hidden",
          pointerEvents: menuOpen ? "auto" : "none",
          background:
            "radial-gradient(ellipse at 50% 45%, #240b0f 0%, #150608 50%, #070304 95%)",
        }}
        aria-hidden={!menuOpen}
      >
        {/* Subtle Ambient Radial Vignette Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 65%)",
          }}
        />

        {/* Top Spacer to account for pinned header */}
        <div className="h-24 sm:h-28 w-full shrink-0" />

        {/* Center: Massive Editorial Serif Navigation Links */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
          <nav className="flex flex-col items-center justify-center gap-3 sm:gap-6 md:gap-8 text-center">
            {navLinks.map((link) => {
              const isHovered = hoveredLink === link.name;
              const hasHover = hoveredLink !== null;
              const isOtherHovered = hasHover && !isHovered;

              return (
                <div
                  key={link.name}
                  className="relative flex flex-col items-center group"
                  onMouseEnter={() => setHoveredLink(link.name)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {/* Fluid Sine Wave Ornament Above Text on Hover (Reference Recording Detail) */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{
                      height: isHovered ? "18px" : "0px",
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? "translateY(0)" : "translateY(6px)",
                    }}
                    aria-hidden="true"
                  >
                    <svg
                      width="60"
                      height="12"
                      viewBox="0 0 60 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-[#FAF7F2]/80"
                    >
                      <path
                        d="M2 6C6 2 10 2 14 6C18 10 22 10 26 6C30 2 34 2 38 6C42 10 46 10 50 6C54 2 58 2 62 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* Editorial Serif Link Text */}
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="relative block font-[family-name:var(--font-editorial-serif)] uppercase tracking-[0.06em] text-3xl sm:text-5xl md:text-7xl lg:text-8xl transition-all duration-400 ease-out select-none"
                    style={{
                      color: isHovered
                        ? "#FFFFFF"
                        : isOtherHovered
                        ? "rgba(250, 247, 242, 0.28)"
                        : "rgba(250, 247, 242, 0.92)",
                      fontStyle: isHovered ? "italic" : "normal",
                      transform: isHovered ? "scale(1.03)" : "scale(1)",
                      textShadow: isHovered
                        ? "0 0 35px rgba(255, 255, 255, 0.25)"
                        : "none",
                    }}
                  >
                    {link.name}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Bar: Copyright, Legal Links, Attribution (Matches Recording 00:09-00:12) */}
        <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 text-white/50 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-sans">
          {/* Bottom Left */}
          <div className="order-3 sm:order-1 text-center sm:text-left">
            <span>COPYRIGHT © {new Date().getFullYear()}</span>
          </div>

          {/* Bottom Center: Legal & Powered By */}
          <div className="order-1 sm:order-2 flex flex-col items-center gap-1.5 text-center">
            <div className="flex items-center gap-5 text-white/70">
              <Link
                href="/privacy"
                onClick={() => setMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                COOKIES
              </Link>
              <span className="text-white/20">•</span>
              <Link
                href="/privacy"
                onClick={() => setMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                PRIVACY
              </Link>
              <span className="text-white/20">•</span>
              <Link
                href="/terms"
                onClick={() => setMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                TERMS
              </Link>
            </div>
            <span className="text-[9px] text-white/40 tracking-[0.26em]">
              POWERED BY MINING DISCOVERY
            </span>
          </div>

          {/* Bottom Right */}
          <div className="order-2 sm:order-3 text-center sm:text-right">
            <span>MADE BY 101 STUDIO</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
