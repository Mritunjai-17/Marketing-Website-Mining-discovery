"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

/*
 * Navigation Architecture for Mining Discovery:
 * WORK, SERVICES, STORY, INSIGHTS, NETWORK
 * Right Actions: ASK AI, CONTACT
 */
const navLinks = [
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
];

export const Header: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Dark ground routes that open immediately in dark mode
  const DARK_GROUND_ROUTES = ["/services"];
  const isDarkInitialRoute = DARK_GROUND_ROUTES.includes(pathname);

  // Effective dark ratio: 0 = top Hero light state, 1 = dark charcoal section state
  const darkRatio = isDarkInitialRoute ? 1 : Math.min(1, Math.max(0, scrollProgress));
  const isDarkMode = darkRatio > 0.45;

  const goToContact = () => {
    setMobileMenuOpen(false);
    router.push("/contact");
  };

  const openAskAI = () => {
    setMobileMenuOpen(false);
    const chatBtn = document.querySelector<HTMLButtonElement>(".chat-button-new");
    if (chatBtn) {
      chatBtn.click();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 30);

      // Smooth transition progress over 140px of scrolling away from top of Hero
      const progress = Math.min(1, y / 140);
      setScrollProgress(progress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 z-50 w-full font-sans transition-all duration-300 ease-out"
      style={{
        backgroundColor: isDarkInitialRoute
          ? "rgba(8, 9, 9, 0.72)"
          : `rgba(8, 9, 9, ${(scrollProgress * 0.70).toFixed(2)})`,
        backdropFilter: scrollProgress > 0.1 || isDarkInitialRoute ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrollProgress > 0.1 || isDarkInitialRoute ? "blur(12px)" : "none",
        borderBottom: `1px solid rgba(255, 255, 255, ${(scrollProgress * 0.06).toFixed(2)})`,
        paddingTop: isScrolled ? "10px" : "14px",
        paddingBottom: isScrolled ? "10px" : "14px",
      }}
    >
      {/* Full-width container */}
      <div className="w-full px-4 sm:px-8 lg:px-16 flex items-center justify-between">
        {/* Brand Logo */}
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
            className="h-12 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 font-sans">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="relative py-1 text-xs font-semibold uppercase tracking-[0.09em] transition-colors duration-300"
                style={{
                  color: isDarkMode
                    ? isActive
                      ? "#FAF7F2"
                      : "rgba(250, 247, 242, 0.84)"
                    : isActive
                      ? "#0B1F3A"
                      : "rgba(11, 31, 58, 0.90)",
                }}
              >
                <span className="hover:text-[#B8860B] transition-colors duration-200">
                  {link.name}
                </span>

                {/* Restrained Gold Active Indicator */}
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#B8860B] shadow-[0_0_6px_rgba(184,134,11,0.6)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Header Action CTA: Get Featured */}
        <div className="hidden lg:flex items-center">
          <Button
            variant="gold"
            size="sm"
            onClick={goToContact}
            className="font-sans font-semibold tracking-wider text-xs py-1.5 px-4 text-white bg-[#A87E2C] hover:bg-[#8F6B24] shadow-xs transition-all duration-300"
          >
            Get Featured
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-lg focus:outline-none transition-colors"
          style={{
            color: isDarkMode ? "#FAF7F2" : "#0B1F3A",
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(11,31,58,0.06)",
          }}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#080909] text-[#FAF7F2] shadow-2xl p-6 flex flex-col justify-between transform transition-transform duration-300 ease-out border-l border-white/10 font-sans">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
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

              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-semibold uppercase tracking-wider text-white/90 hover:text-[#D4AF37] py-2 border-b border-white/10 transition-colors flex items-center justify-between"
                  >
                    <span>{link.name}</span>
                    {pathname === link.href && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-white/10">
              <Button
                variant="gold"
                size="md"
                fullWidth
                onClick={goToContact}
                className="font-sans font-semibold tracking-wider text-white bg-[#A87E2C] hover:bg-[#8F6B24] shadow-md"
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
