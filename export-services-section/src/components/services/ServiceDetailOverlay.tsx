"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import gsap from "gsap";
import styles from "./ServiceDetailOverlay.module.css";
import {
  SERVICE_CHAPTERS,
  SERVICE_DETAILS,
  type ServiceChapter,
  type ServiceDetail,
} from "./servicesData";

/**
 * The full-viewport detail chapter for one service category.
 *
 * WHAT IT IS HANDED. A category number and nothing else. Both halves of that category —
 * the scene-level record the journey renders, and the long-form record behind it — are
 * looked up from servicesData, so the overlay can never show a mix of two categories and
 * there is no second copy of the data to keep in step.
 *
 * WHAT IT DOES TO THE PAGE UNDERNEATH. Nothing. The journey stays mounted and its
 * ScrollTrigger is left alone, so closing returns the reader to the same scroll offset
 * with the same category active — there is no animation to restart because none was
 * stopped. Only the scroll itself is held: Lenis is asked to stop where it exists, and
 * the document is pinned directly where it does not (reduced motion skips Lenis entirely).
 *
 * Sections whose portfolio content is missing are omitted rather than rendered empty.
 */

interface ServiceDetailOverlayProps {
  /** The category to show, e.g. "01". Null closes the overlay. */
  serviceNum: string | null;
  onClose: () => void;
}

/** Anything a keyboard can land on, for the focus trap. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const ServiceDetailOverlay: React.FC<ServiceDetailOverlayProps> = ({
  serviceNum,
  onClose,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** What had focus before we opened, so it can be handed back on close. */
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = serviceNum !== null;

  const chapter: ServiceChapter | undefined = SERVICE_CHAPTERS.find(
    (c) => c.num === serviceNum
  );
  const detail: ServiceDetail | undefined = serviceNum
    ? SERVICE_DETAILS[serviceNum]
    : undefined;

  /* --------------------------------------------------------------- scroll lock */

  useEffect(() => {
    if (!open) return;

    const lenis = (
      window as unknown as { lenis?: { stop: () => void; start: () => void } }
    ).lenis;

    // Where the reader was, so the exact position can be restored on close.
    const y = window.scrollY;

    if (lenis) {
      // Lenis owns the scroll here, and globals.css already hides overflow while it is
      // stopped — nothing else is needed and the offset is held for us.
      lenis.stop();
    } else {
      // No Lenis (reduced motion): hold the document at its current offset instead of
      // letting `overflow: hidden` reset it.
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      if (lenis) lenis.start();
      else document.documentElement.style.overflow = "";
      window.scrollTo(0, y);
    };
  }, [open]);

  /* ------------------------------------------------------- open animation + focus */

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    // Always start a fresh chapter from the top.
    root.scrollTop = 0;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = gsap.utils.toArray<HTMLElement>(`.${styles.sdReveal}`, panel);

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(panel, { opacity: 1, y: 0 });
        gsap.set(reveals, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        panel,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      // Everything below the fold waits for the observer; the first screen comes in with
      // the panel so the overlay is never briefly blank.
      gsap.set(reveals, { opacity: 0, y: 26 });
    }, panel);

    // Focus the close control, so Escape and Tab both have somewhere to start.
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);

    let observer: IntersectionObserver | null = null;
    if (!reduced) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
            });
            observer?.unobserve(entry.target);
          }
        },
        { root, rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
      );
      reveals.forEach((el) => observer?.observe(el));
    }

    return () => {
      window.clearTimeout(focusTimer);
      observer?.disconnect();
      ctx.revert();
      returnFocusRef.current?.focus?.();
    };
  }, [open, serviceNum]);

  /* ------------------------------------------------------ escape + focus trap */

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const root = rootRef.current;
      if (!root) return;

      const items = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === closeRef.current);
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;

      // Wrap at both ends so focus can never leave the overlay.
      if (event.shiftKey && (activeEl === first || !root.contains(activeEl))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!open || !chapter || !detail) return null;

  const title = chapter.titleLines.join(" ");

  const section = (label: string, body: React.ReactNode) => (
    <section className={`${styles.sdSection} ${styles.sdReveal}`}>
      <span className={styles.sdSectionLabel}>{label}</span>
      {body}
    </section>
  );

  const list = (items: string[]) => (
    <ul className={styles.sdList}>
      {items.map((item) => (
        <li key={item} className={styles.sdListItem}>
          <span aria-hidden="true" className={styles.sdListRule} />
          {item}
        </li>
      ))}
    </ul>
  );

  /*
   * data-lenis-prevent below is load-bearing.
   *
   * Lenis listens for wheel on the window with a non-passive handler and calls
   * preventDefault on it. lenis.stop() suppresses Lenis's own scrolling but not that
   * preventDefault, so without this attribute a wheel gesture over the overlay is
   * swallowed before the overlay ever sees it — the panel has thousands of pixels of
   * content and will not move a single one of them. Lenis skips any event whose target
   * sits inside a [data-lenis-prevent] subtree, which hands the wheel back.
   */
  return (
    <div
      ref={rootRef}
      className={styles.sdRoot}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={`${chapter.num} — ${title} service details`}
      onKeyDown={onKeyDown}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className={styles.sdClose}
      >
        Close
        <X aria-hidden="true" className={styles.sdCloseIcon} />
      </button>

      <div ref={panelRef} className={styles.sdPanel}>
        <div className={styles.sdInner}>
          <div className={styles.sdGrid}>
            {/* ------------------------------------------------ identity */}
            <div className={styles.sdIdentity}>
              <span className={styles.sdNum}>{chapter.num}</span>

              <span className={styles.sdCategory}>
                <span aria-hidden="true" className={styles.sdCategoryRule} />
                {title}
              </span>

              <h2 className={styles.sdHeadline}>{detail.headline}</h2>

              <p className={styles.sdIntro}>{detail.intro}</p>

              <div className={styles.sdMedia}>
                <Image
                  src={chapter.image}
                  alt={chapter.alt}
                  fill
                  quality={90}
                  sizes="(max-width: 1023px) 92vw, 36vw"
                  className={styles.sdMediaImg}
                />
              </div>
            </div>

            {/* -------------------------------------------------- detail */}
            <div>
              {detail.whatWeDo.length > 0 &&
                section(
                  "What we do",
                  <>
                    {detail.whatWeDo.map((work) => (
                      <article key={work.title} className={styles.sdWork}>
                        <h3 className={styles.sdWorkTitle}>{work.title}</h3>
                        <p className={styles.sdWorkBody}>{work.body}</p>
                      </article>
                    ))}
                  </>
                )}

              {detail.capabilities.length > 0 &&
                section("Capabilities", list(detail.capabilities))}

              {detail.whyItMatters.length > 0 &&
                section("Why it matters", list(detail.whyItMatters))}

              {detail.proof.length > 0 &&
                section(
                  "Proof",
                  <>
                    <div className={styles.sdFigures}>
                      {detail.proof.map((figure) => (
                        <div key={figure.label}>
                          <span className={styles.sdFigureValue}>{figure.value}</span>
                          <span className={styles.sdFigureLabel}>{figure.label}</span>
                        </div>
                      ))}
                    </div>
                    {detail.proofNote && (
                      <p className={styles.sdNote}>{detail.proofNote}</p>
                    )}
                  </>
                )}

              {detail.platform &&
                section(
                  "The platform",
                  <>
                    <p className={styles.sdPlatformTitle}>{detail.platform.title}</p>
                    {list(detail.platform.points)}
                    <p className={styles.sdNote}>{detail.platform.note}</p>
                  </>
                )}

              <div className={styles.sdReveal}>
                <Link href="/contact" className={styles.sdCta}>
                  Start a campaign
                  <ArrowRight aria-hidden="true" className={styles.sdCtaIcon} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailOverlay;
