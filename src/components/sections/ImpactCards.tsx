"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, Mail, Share2, User } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ImpactCards.module.css";

interface ImpactResult {
  number: string;
  icon: React.ElementType;
  /** The exact string that must be on screen once the count-up settles. */
  value: string;
  /** What the count-up runs to; `format` turns it back into `value` at the end. */
  countTo: number;
  prefix: string;
  suffix: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

const RESULTS: ImpactResult[] = [
  {
    number: "01",
    icon: Users,
    value: "+120%",
    countTo: 120,
    prefix: "+",
    suffix: "%",
    title: "Qualified Leads",
    subtitle: "Generated through a targeted digital campaign.",
    image: "/cards/bg_card_1.jpg",
    link: "/contact",
  },
  {
    number: "02",
    icon: Mail,
    value: "+35%",
    countTo: 35,
    prefix: "+",
    suffix: "%",
    title: "Newsletter Subscriptions",
    subtitle: "Growth in newsletter subscriptions.",
    image: "/cards/bg_card_2.jpg",
    link: "/contact",
  },
  {
    number: "03",
    icon: Share2,
    value: "+50%",
    countTo: 50,
    prefix: "+",
    suffix: "%",
    title: "Social Media Engagement",
    subtitle: "Increase in social media engagement.",
    image: "/cards/bg_card_3.jpg",
    link: "/contact",
  },
  {
    number: "04",
    icon: User,
    value: "12,000+",
    countTo: 12000,
    prefix: "",
    suffix: "+",
    title: "Substack Subscribers",
    subtitle: "Building a global audience of mining professionals.",
    image: "/cards/bg_card_4.jpg",
    link: "/contact",
  },
];

const LAST = RESULTS.length - 1;

/*
 * The scrub is expressed in "units", where one unit is one result travelling into the
 * centre. UNITS is what maps scroll progress onto that scale:
 *
 *   pos = clamp(progress * UNITS - LEAD, 0, LAST)
 *
 * LEAD is a short hold at the top of the pin so 01 is genuinely *the active card* for a
 * moment before it starts moving away, rather than beginning to leave on the first pixel
 * of scroll. Everything after it is one unit per transition, which puts pos exactly at
 * LAST when progress hits 1 — the final card lands on centre at the same instant the pin
 * releases, so there is no dead scroll and no drift after 04 has arrived.
 */
const LEAD = 0.35;
const UNITS = LEAD + LAST;

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

const format = (result: ImpactResult, n: number) =>
  `${result.prefix}${Math.round(n).toLocaleString("en-US")}${result.suffix}`;

export const ImpactCards: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  // Gates the count-up so the numbers animate when the section is reached rather than
  // silently finishing while it is still far below the fold.
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.impactCard}`, track);
      if (!cards.length) return;

      /*
       * Measured, not hard-coded: `step` is how far a card travels per transition and it
       * is derived from the card's own laid-out width, so the CSS clamp that sizes the
       * card is the single source of truth at every breakpoint. `per` is how much scroll
       * one transition costs; `drop` gives the off-centre cards a small vertical settle
       * on narrow screens, where the horizontal room to read depth is thin.
       */
      const metrics = { step: 0, drop: 0, per: 560 };

      const measure = () => {
        const w = cards[0].offsetWidth;
        const vw = window.innerWidth;
        if (vw >= 1024) {
          metrics.step = w * 1.04;
          metrics.drop = 0;
          metrics.per = 560;
        } else if (vw >= 640) {
          metrics.step = w * 0.94;
          metrics.drop = 12;
          metrics.per = 480;
        } else {
          metrics.step = w * 0.8;
          metrics.drop = 20;
          metrics.per = 400;
        }
      };

      const render = (pos: number) => {
        for (let i = 0; i < cards.length; i++) {
          // Signed distance from the centre: negative once a card has been passed.
          const d = i - pos;
          const near = Math.min(Math.abs(d), 1);
          const far = Math.min(Math.abs(d), 2);

          gsap.set(cards[i], {
            // The card is anchored at the stage's centre point; these two carry the
            // centring that the stylesheet's own transform does before GSAP takes over.
            xPercent: -50,
            yPercent: -50,
            x: d * metrics.step,
            y: Math.abs(d) * metrics.drop,
            // 1 -> 0.82 over the first unit of travel, then held: the card recedes
            // rather than shrinking away to nothing.
            scale: 1 - near * 0.18,
            // A previous card carries a slightly negative tilt, the next one a positive
            // one, so the pair reads as travelling through the frame, not sliding on rails.
            rotation: clamp(d, -1, 1) * 3,
            // 1 -> 0.35 across the first unit, then out to 0 across the second, which is
            // what stops a third card from muddying the frame behind the neighbours.
            opacity: far <= 1 ? 1 - near * 0.65 : 0.35 * (2 - far),
            zIndex: Math.round(100 - far * 20),
            // Only the card on centre is interactive; the receded ones must not swallow
            // a click meant for the active one.
            pointerEvents: near < 0.5 ? "auto" : "none",
          });
        }

        for (let i = 0; i < fillRefs.current.length; i++) {
          const fill = fillRefs.current[i];
          if (fill) fill.style.transform = `scaleX(${clamp(pos - i, 0, 1)})`;
        }

        const active = clamp(Math.round(pos), 0, LAST);
        if (active !== activeRef.current) {
          activeRef.current = active;
          setActiveIndex(active);
        }
      };

      const posFor = (progress: number) => clamp(progress * UNITS - LEAD, 0, LAST);

      ScrollTrigger.create({
        trigger: viewport,
        start: "top top",
        end: () => `+=${Math.round(UNITS * metrics.per)}`,
        pin: viewport,
        pinSpacing: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onRefreshInit: measure,
        onRefresh: (self) => {
          measure();
          render(posFor(self.progress));
        },
        onUpdate: (self) => render(posFor(self.progress)),
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => setInView(true),
      });

      measure();
      render(0);
    }, section);

    return () => ctx.revert();
  }, []);

  // Count-up on the card that has just arrived. Deliberately short and eased out: a
  // quick settle, not a dashboard ticker. The final write is the literal string.
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = valueRefs.current[activeIndex];
    const result = RESULTS[activeIndex];
    if (!el || !result) return;

    const counter = { v: 0 };
    const tween = gsap.to(counter, {
      v: result.countTo,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = format(result, counter.v);
      },
      onComplete: () => {
        el.textContent = result.value;
      },
    });

    return () => {
      tween.kill();
      el.textContent = result.value;
    };
  }, [activeIndex, inView]);

  return (
    <section ref={sectionRef} className={styles.impactSection}>
      <div className={styles.impactScrollArea}>
        <div ref={viewportRef} className={styles.impactViewport}>
          <div aria-hidden="true" className={styles.impactGlow} />

          {/* ---------------------------------------------------------- intro */}
          <div className={styles.impactIntro}>
            <div className={styles.impactIntroCopy}>
              <span className={styles.impactEyebrow}>
                <span aria-hidden="true" className={styles.impactEyebrowRule} />
                Our Impact
              </span>

              <h2 className={styles.impactHeadline}>Marketing That Delivers Results</h2>

              <p className={styles.impactLede}>
                Through strategic media, creative campaigns and investor engagement, we turn
                visibility into measurable growth.
              </p>
            </div>

            <div className={styles.impactIntroAside}>
              <span className={styles.impactKicker}>Real campaigns. Tangible outcomes.</span>
              <Link
                href="/services"
                aria-label="View all campaigns and outcomes"
                className={styles.impactArrow}
              >
                <ArrowRight className={styles.impactArrowIcon} />
              </Link>
            </div>
          </div>

          {/* ---------------------------------------------------------- showcase */}
          <div className={styles.impactStage}>
            <div ref={trackRef} className={styles.impactTrack}>
              {RESULTS.map((result, index) => {
                const Icon = result.icon;
                const isActive = index === activeIndex;
                return (
                  <article
                    key={result.number}
                    data-index={index}
                    className={styles.impactCard}
                  >
                    <div className={styles.impactCardMedia}>
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        // No preload: the section sits far below the fold, and all four
                        // images enter the viewport together when the pin begins, so the
                        // default lazy loading already has them ready in time.
                        // (`priority` is deprecated as of Next 16 in any case.)
                        sizes="(max-width: 639px) 78vw, (max-width: 1023px) 40vw, 400px"
                        className={styles.impactCardImage}
                      />
                    </div>
                    <div aria-hidden="true" className={styles.impactCardScrim} />

                    <div className={styles.impactCardBody}>
                      <span className={styles.impactCardIndex}>{result.number}</span>

                      <div className={styles.impactCardFoot}>
                        <span aria-hidden="true" className={styles.impactCardBadge}>
                          <Icon strokeWidth={1.75} />
                        </span>

                        <span
                          ref={(el) => {
                            valueRefs.current[index] = el;
                          }}
                          className={styles.impactValue}
                        >
                          {result.value}
                        </span>

                        <h3 className={styles.impactCardTitle}>{result.title}</h3>
                        <p className={styles.impactCardText}>{result.subtitle}</p>

                        <Link
                          href={result.link}
                          aria-label={`Learn more about ${result.title}`}
                          // Receded cards are visually gone; leaving their links in the
                          // tab order would send focus to something nobody can see.
                          tabIndex={isActive ? undefined : -1}
                          className={styles.impactCardArrow}
                        >
                          <ArrowRight className={styles.impactArrowIcon} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------------- progress */}
          <div className={styles.impactProgress} aria-hidden="true">
            {RESULTS.map((result, index) => (
              <React.Fragment key={result.number}>
                <span
                  className={`${styles.impactProgressStep} ${
                    index === activeIndex ? styles.impactProgressStepActive : ""
                  }`}
                >
                  {result.number}
                </span>
                {index < LAST && (
                  <span className={styles.impactProgressLine}>
                    <span
                      ref={(el) => {
                        fillRefs.current[index] = el;
                      }}
                      className={styles.impactProgressFill}
                    />
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ reduced-motion copy */}
      <div className={styles.impactStatic}>
        <div aria-hidden="true" className={styles.impactGlow} />

        <div className={styles.impactIntroCopy}>
          <span className={styles.impactEyebrow}>
            <span aria-hidden="true" className={styles.impactEyebrowRule} />
            Our Impact
          </span>
          <h2 className={styles.impactHeadline}>Marketing That Delivers Results</h2>
          <p className={styles.impactLede}>
            Through strategic media, creative campaigns and investor engagement, we turn
            visibility into measurable growth.
          </p>
          <p className={styles.impactKicker}>Real campaigns. Tangible outcomes.</p>
        </div>

        <div className={styles.impactStaticGrid}>
          {RESULTS.map((result) => {
            const Icon = result.icon;
            return (
              <article key={result.number} className={styles.impactStaticItem}>
                <div className={styles.impactCardMedia}>
                  <Image
                    src={result.image}
                    alt={result.title}
                    fill
                    sizes="(max-width: 639px) 90vw, 300px"
                    className={styles.impactCardImage}
                  />
                </div>
                <div aria-hidden="true" className={styles.impactCardScrim} />

                <div className={styles.impactCardBody}>
                  <span className={styles.impactCardIndex}>{result.number}</span>
                  <div className={styles.impactCardFoot}>
                    <span aria-hidden="true" className={styles.impactCardBadge}>
                      <Icon strokeWidth={1.75} />
                    </span>
                    <span className={styles.impactValue}>{result.value}</span>
                    <h3 className={styles.impactCardTitle}>{result.title}</h3>
                    <p className={styles.impactCardText}>{result.subtitle}</p>
                    <Link
                      href={result.link}
                      aria-label={`Learn more about ${result.title}`}
                      className={styles.impactCardArrow}
                    >
                      <ArrowRight className={styles.impactArrowIcon} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImpactCards;
