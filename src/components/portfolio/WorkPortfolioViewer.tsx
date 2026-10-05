"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Download, ArrowUp, Maximize2, Minimize2 } from "lucide-react";
import styles from "./WorkPortfolioViewer.module.css";

interface WorkPortfolioViewerProps {
  pdfPath?: string;
  imageCount?: number;
}

export const WorkPortfolioViewer: React.FC<WorkPortfolioViewerProps> = ({
  pdfPath = "/documents/mining-discovery-portfolio.pdf",
  imageCount = 50,
}) => {
  const [activePage, setActivePage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageExtension, setImageExtension] = useState<string>("webp");
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Detect image extension (webp, jpg, png) automatically from public/portfolio/
  useEffect(() => {
    const detectExtension = async () => {
      const extensions = ["webp", "jpg", "jpeg", "png"];
      for (const ext of extensions) {
        try {
          const res = await fetch(`/portfolio/01.${ext}`, { method: "HEAD" });
          if (res.ok) {
            setImageExtension(ext);
            break;
          }
        } catch {
          // continue
        }
      }
    };
    detectExtension();
  }, []);

  // Dynamically generate projects list matching MIDIS_REALTIME pattern
  const projects = Array.from({ length: imageCount }, (_, idx) => {
    const numStr = String(idx + 1).padStart(2, "0");
    return {
      id: idx + 1,
      title: `Project Slide ${numStr}`,
      image: `/portfolio/${numStr}.${imageExtension}`,
      fallbackImage: `/portfolio/${idx + 1}.${imageExtension}`,
    };
  });

  // Track active slide on scroll using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-page-index"));
            if (index && !isNaN(index)) {
              setActivePage(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-35% 0px -35% 0px",
        threshold: 0.1,
      }
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [projects.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => console.error("Fullscreen error:", err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatPageNum = (num: number) => String(num).padStart(2, "0");

  return (
    <main
      ref={containerRef}
      className={`bg-[#D9D6CE] min-h-screen text-[#0F172A] font-sans selection:bg-[#B8860B]/20 selection:text-[#0B1F3A] overflow-x-hidden ${
        isFullscreen ? "p-4 sm:p-6 bg-[#D9D6CE]" : ""
      }`}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 1000px 600px at 50% 25%, rgba(212, 175, 55, 0.14) 0%, rgba(184, 134, 11, 0.05) 45%, rgba(217, 214, 206, 0) 75%)",
        }}
      />

      {/* NEW PREMIUM HERO SECTION matching MIDIS_REALTIME aesthetic */}
      {!isFullscreen && (
        <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center pt-32 pb-16 px-6 overflow-hidden bg-[#D9D6CE] text-[#0F172A]">
          {/* Subtle background overlay */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D9D6CE]/80 via-[#D9D6CE]/30 to-[#D9D6CE]" />
          </div>

          <div className="max-w-[1400px] mx-auto relative z-10 w-full text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className={styles.eyebrowRow}>
                <span className={styles.eyebrowRule} aria-hidden="true" />
                <span className={styles.eyebrowText}>
                  <span className={styles.eyebrowPip}>✦</span> WORK &amp; PORTFOLIO <span className={styles.eyebrowPip}>✦</span>
                </span>
                <span className={styles.eyebrowRuleRight} aria-hidden="true" />
              </div>

              <h1 className={styles.mainTitle}>
                <span className={styles.titleLine}>Showcasing Our Best</span>
                <span className={styles.titleLine}>
                  <em className={styles.shimmerText}>Works &amp; Impact</em>
                </span>
              </h1>

              <p className={styles.subtitle}>
                A visual record of Mining Discovery&apos;s work across mining media,
                branding, investor engagement, digital communication and global industry outreach.
              </p>
            </motion.div>
          </div>
        </section>
      )}



      {/* PROJECTS SECTION — MATCHING MIDIS_REALTIME PROJECTCARD STACK */}
      <section className="px-4 sm:px-6 pb-24 relative z-10">
        {projects.map((project, idx) => (
          <div
            key={project.id}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            data-page-index={project.id}
            className="w-full max-w-[1400px] mx-auto mb-8 sm:mb-12 md:mb-16 group"
          >
            <div className="relative overflow-hidden cursor-pointer bg-[#0F172A] rounded-xl border border-black/10 group-hover:border-[#D4AF37]/60 transition-colors duration-500 shadow-xl group-hover:shadow-2xl">


              {/* Natural image sizing so absolutely nothing is ever cut off */}
              <img
                src={project.image}
                alt={project.title}
                loading={idx < 3 ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => {
                  // Fallback to unpadded 1.jpg if 01.jpg fails
                  const target = e.currentTarget;
                  if (target.src !== project.fallbackImage) {
                    target.src = project.fallbackImage;
                  }
                }}
                className="w-full h-auto block transform transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
              />

              {/* Elegant bottom accent line matching MIDIS_REALTIME */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/10" />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37] transform origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" />
            </div>
          </div>
        ))}
      </section>

      {/* Floating Scroll-to-Top Button */}
      {activePage > 2 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-[#0F172A] border border-[#D4AF37]/40 text-[#D4AF37] shadow-2xl hover:bg-[#D4AF37] hover:text-[#0B0E14] transition-all duration-300"
          title="Scroll to Top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </main>
  );
};

export default WorkPortfolioViewer;
