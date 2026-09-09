"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, Mail, Share2, User } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface CardSpec {
  number: string;
  badgeIcon: React.ElementType;
  value: string;
  title: string;
  subtitle: string;
  bgImage: string;
  link: string;
  // Deep gradient overlay reproducing the exact look from the screenshot
  cardGradient: string;
  borderHover: string;
  extraOverlay?: React.ReactNode;
}

const CARDS: CardSpec[] = [
  {
    number: "01",
    badgeIcon: Users,
    value: "+120%",
    title: "Qualified Leads",
    subtitle: "Generated through a targeted digital campaign.",
    bgImage: "/cards/bg_card_1.jpg",
    link: "/contact",
    cardGradient: "from-black/10 via-[#1A1208]/70 to-[#0A0704]/98",
    borderHover: "group-hover:border-[#D4AF37]",
    extraOverlay: (
      <svg
        className="absolute top-8 right-6 w-36 h-20 pointer-events-none opacity-95"
        viewBox="0 0 140 70"
        fill="none"
      >
        <path
          d="M 5 60 Q 40 45 70 35 T 130 10"
          stroke="rgba(255, 255, 255, 0.95)"
          strokeWidth="1.75"
          strokeDasharray="3 3"
        />
        <circle cx="130" cy="10" r="4.5" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    number: "02",
    badgeIcon: Mail,
    value: "+35%",
    title: "Newsletter Subscriptions",
    subtitle: "Growth in newsletter subscriptions.",
    bgImage: "/cards/bg_card_2.jpg",
    link: "/contact",
    cardGradient: "from-black/15 via-[#0E1620]/70 to-[#06090D]/98",
    borderHover: "group-hover:border-[#7AA9D2]",
  },
  {
    number: "03",
    badgeIcon: Share2,
    value: "+50%",
    title: "Social Media Engagement",
    subtitle: "Increase in social media engagement.",
    bgImage: "/cards/bg_card_3.jpg",
    link: "/contact",
    cardGradient: "from-black/10 via-[#0B1A28]/70 to-[#040A10]/98",
    borderHover: "group-hover:border-[#4B9CD3]",
  },
  {
    number: "04",
    badgeIcon: User,
    value: "12,000+",
    title: "Substack Subscribers",
    subtitle: "Building a global audience of mining professionals.",
    bgImage: "/cards/bg_card_4.jpg",
    link: "/contact",
    cardGradient: "from-black/15 via-[#18130E]/70 to-[#0A0806]/98",
    borderHover: "group-hover:border-[#E5A855]",
    extraOverlay: (
      <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20 flex flex-col gap-1.5 shadow-xl">
        <span className="text-[13px] font-bold text-white leading-none">12,000+</span>
        <span className="text-[9px] text-white/75 tracking-wider">Subscribers</span>
        <div className="flex -space-x-1.5 mt-0.5">
          <div className="w-5 h-5 rounded-full bg-[#E5A855] border border-black/40 flex items-center justify-center text-[8px] font-bold text-black">M</div>
          <div className="w-5 h-5 rounded-full bg-[#3B82F6] border border-black/40 flex items-center justify-center text-[8px] font-bold text-white">D</div>
          <div className="w-5 h-5 rounded-full bg-[#10B981] border border-black/40 flex items-center justify-center text-[8px] font-bold text-white">J</div>
          <div className="w-5 h-5 rounded-full bg-[#8B5CF6] border border-black/40 flex items-center justify-center text-[8px] font-bold text-white">R</div>
        </div>
      </div>
    ),
  },
];

export const ImpactCards: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const orbitStageRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = orbitStageRef.current;
    if (!section || !stage) return;

    const cards = gsap.utils.toArray<HTMLElement>(".orbit-card", stage);
    const numCards = cards.length;

    // Angle configuration for circular orbit:
    // Cards start rotated on a circular ring and scroll from left to right as the user scrolls
    const ctx = gsap.context(() => {
      // Pin the section and drive circular revolution from left to right
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2200",
          pin: true,
          scrub: 1.1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            setScrollProgress(p);

            // Circular orbit projection:
            // Radius of the circle (orbiting around the user's field of view)
            const isDesktop = window.innerWidth >= 1024;
            const isTablet = window.innerWidth >= 640;
            const radiusX = isDesktop ? 620 : isTablet ? 460 : 320;
            const radiusY = isDesktop ? 180 : 120;
            const radiusZ = isDesktop ? 450 : 300;

            // Total revolution angle: moving cards continuously from left to right
            // p = 0 to 1 sweeps through approx 160 degrees
            const baseSweep = (p - 0.5) * 2.6; // from -1.3 rad to +1.3 rad

            cards.forEach((card, i) => {
              // Evenly space cards along circular arc
              const cardOffset = (i - (numCards - 1) / 2) * 0.72;
              const angle = baseSweep + cardOffset;

              // 3D coordinates on the circular cylinder / sphere
              const x = Math.sin(angle) * radiusX;
              const z = Math.cos(angle) * radiusZ - radiusZ;
              // Arc curvature for Y to create an elegant parabolic / circular saucer dip
              const y = (1 - Math.cos(angle)) * radiusY * 0.45;

              // Tangential card rotation (faces toward center of circle)
              const rotY = (angle * 180) / Math.PI * 0.75;
              // Gentle natural banking tilt (-4 to +4 deg)
              const rotZ = Math.sin(angle) * 5;

              // Scale & opacity based on front-to-back position
              const depthFactor = (z + radiusZ) / radiusZ; // ~0 (far back) to ~1 (front)
              const scale = 0.86 + depthFactor * 0.16; // 0.86 to 1.02
              const opacity = 0.55 + depthFactor * 0.45;

              // Z-index reflects depth so closest card is on top
              const zIndex = Math.round(depthFactor * 100);

              gsap.set(card, {
                x,
                y,
                z,
                rotateY: rotY,
                rotateZ: rotZ,
                scale,
                opacity,
                zIndex,
              });
            });
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#FAF7F2] text-[#1A1D21] overflow-hidden border-b border-[#E5E4DE] select-none"
    >
      {/* Warm sunlight vignette overlay matching the exact hero / card background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle 900px at 50% 25%, rgba(255, 245, 225, 0.6) 0%, rgba(250, 247, 242, 1) 75%)",
        }}
      />

      <div className="h-screen w-full flex flex-col justify-between pt-12 pb-8 sm:pt-16 sm:pb-12">
        {/* Top Header Block - Identical to screenshot typography */}
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 flex flex-col sm:flex-row sm:items-end justify-between gap-6 shrink-0 z-20">
          <div className="flex flex-col items-start gap-2.5 max-w-2xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-[2px] bg-[#B8860B]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B8860B]">
                OUR IMPACT
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[48px] font-normal text-[#0B1F3A] leading-[1.08] tracking-[-0.015em]">
              Marketing That Delivers Results
            </h2>

            {/* Subheading */}
            <p className="font-sans text-xs sm:text-sm text-[#57595E] leading-relaxed max-w-xl">
              Through strategic media, creative campaigns and investor engagement, we turn visibility into measurable growth.
            </p>
          </div>

          {/* Real campaigns pill link with arrow */}
          <div className="flex items-center gap-3 self-start sm:self-end">
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717A]">
              REAL CAMPAIGNS. TANGIBLE OUTCOMES.
            </span>
            <Link
              href="/services"
              aria-label="View all campaigns and outcomes"
              className="w-10 h-10 rounded-full border border-[#B8860B]/40 hover:border-[#B8860B] hover:bg-[#B8860B] text-[#B8860B] hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs group"
            >
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* 3D Circular Orbit Carousel Stage */}
        <div
          style={{ perspective: 1600 }}
          className="relative w-full flex-1 flex items-center justify-center overflow-visible my-auto py-2"
        >
          <div
            ref={orbitStageRef}
            style={{ transformStyle: "preserve-3d" }}
            className="relative w-full max-w-[1300px] h-[480px] sm:h-[520px] flex items-center justify-center"
          >
            {CARDS.map((card) => {
              const IconComponent = card.badgeIcon;
              return (
                <div
                  key={card.number}
                  className="orbit-card absolute will-change-transform cursor-pointer transition-shadow duration-300"
                  style={{
                    transformOrigin: "center center",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Clean Rectangular Card Shell with exact rounded-[18px] corners from screenshot */}
                  <div
                    className={`group relative flex flex-col justify-between w-[265px] sm:w-[295px] lg:w-[315px] h-[440px] sm:h-[480px] lg:h-[500px] rounded-[18px] sm:rounded-[20px] overflow-hidden p-6 sm:p-7 text-white border border-white/25 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.28)] hover:shadow-[0_28px_55px_-12px_rgba(0,0,0,0.42)] transition-all duration-500 ${card.borderHover}`}
                  >
                    {/* Background Photographic Image: brightens and illuminates on hover */}
                    <div className="absolute inset-0 -z-20 overflow-hidden">
                      <Image
                        src={card.bgImage}
                        alt={card.title}
                        fill
                        className="object-cover object-center transition-all duration-500 ease-out group-hover:scale-108 group-hover:brightness-[1.25] group-hover:contrast-[1.08]"
                        sizes="(max-width: 640px) 265px, 315px"
                      />
                    </div>

                    {/* Gradient Shading Overlay: relaxes slightly on hover so more light shines through */}
                    <div
                      className={`absolute inset-0 -z-10 bg-gradient-to-b ${card.cardGradient} transition-opacity duration-300 group-hover:opacity-75`}
                    />

                    {/* Luminous light wash on hover */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-400"
                    />

                    {/* Custom SVG line or Substack avatar card overlay */}
                    {card.extraOverlay}

                    {/* Top Row: Index number (e.g. 01, 02) */}
                    <div className="flex items-center justify-between z-10">
                      <span className="font-mono text-xs font-semibold tracking-widest text-white/80">
                        {card.number}
                      </span>
                    </div>

                    {/* Bottom Card Content */}
                    <div className="flex flex-col z-10 mt-auto">
                      {/* Frosted Badge Icon Box (matching screenshot's rounded square) */}
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-5 text-white/95 shadow-sm transition-transform duration-300 group-hover:scale-108">
                        <IconComponent className="w-5 h-5 stroke-[1.75]" />
                      </div>

                      {/* Stat Big Value */}
                      <div className="font-serif text-4xl sm:text-[44px] font-normal text-white leading-none tracking-tight mb-2.5">
                        {card.value}
                      </div>

                      {/* Title */}
                      <h3 className="font-sans text-base sm:text-lg font-semibold text-white leading-snug mb-1.5">
                        {card.title}
                      </h3>

                      {/* Subtitle */}
                      <p className="font-sans text-xs sm:text-[13px] text-white/75 leading-relaxed max-w-[92%] mb-5">
                        {card.subtitle}
                      </p>

                      {/* Circular Arrow Button */}
                      <Link
                        href={card.link}
                        aria-label={`Learn more about ${card.title}`}
                        className="w-10 h-10 rounded-full border border-white/35 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-[#0B1F3A] transition-all duration-300 flex items-center justify-center text-white shadow-xs group/btn"
                      >
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Progress Bar & Scroll Indicator - Identical to screenshot */}
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 flex flex-col items-center justify-center gap-3 shrink-0 z-20">
          {/* Segmented Gold Progress Line */}
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((idx) => {
              const activeIdx = Math.min(3, Math.floor(scrollProgress * 4));
              const isActive = idx === activeIdx;
              return (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isActive ? "w-10 bg-[#B8860B]" : "w-10 bg-[#D4AF37]/25"
                  }`}
                />
              );
            })}
          </div>

          {/* Scroll explore note */}
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A1A1AA] flex items-center gap-1.5">
            SCROLL TO EXPLORE MORE <span className="text-xs">&darr;</span>
          </span>
        </div>
      </div>
    </section>
  );
};

export default ImpactCards;