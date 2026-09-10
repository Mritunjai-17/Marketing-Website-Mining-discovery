"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ServicesJourney.module.css";
import { ServiceDetailOverlay } from "./ServiceDetailOverlay";
import { ServiceStoryOverlay } from "./ServiceStoryOverlay";
import { SERVICE_CHAPTERS, SERVICE_STORIES } from "./servicesData";

/**
 * /services — the six service categories presented as one scroll-driven journey.
 *
 * HOW THIS DIFFERS FROM THE HOMEPAGE. The homepage's ServicesScrollStory is the preview:
 * six cards orbiting an ellipse, seen from outside. This is the full experience, so it
 * puts the reader inside one chapter at a time — a single large plate at the centre of
 * the frame, type set across it at display size, and one chapter replacing another by
 * physically opening over it. Neither file imports the other; they share only the six
 * categories' names, so a change to one cannot alter the other.
 *
 * HOW A CHAPTER ARRIVES. Its plate is wiped open from the bottom edge (a clip, not a
 * fade) while the photograph inside drifts up behind the opening edge, and its type rises
 * out of masks in a short stagger — number, then title, then concept, then the service
 * list. Because a fully open plate is opaque and sits later in the DOM, it covers the
 * chapter before it without anything having to fade out, and scrolling back simply closes
 * the same clip. There is never a frame with two chapters half-present.
 *
 * WHAT DRIVES IT. One scrubbed GSAP ScrollTrigger, the stack the rest of the site pins
 * with. Every value below is a pure function of scroll position, so stopping stops the
 * motion and reversing retraces it exactly. Nothing runs on a timer.
 */

const LAST = SERVICE_CHAPTERS.length - 1;

/*
 * Scroll maps onto the journey in "units", one unit being one chapter replacing another:
 *
 *   raw = progress * UNITS - LEAD
 *   pos = clamp(raw, 0, LAST)
 *
 * LEAD holds chapter 01 open for a moment before it starts giving way; TAIL is the beat
 * after 06 has fully arrived, so the last chapter is readable before the pin releases.
 * Because `pos` is clamped at LAST, no chapter can re-enter once the journey is done.
 */
const LEAD = 0.3;
const TAIL = 0.25;
const UNITS = LEAD + LAST + TAIL;

/** Must match the perspective declared on .sjFrame — the depth maths reads from it. */
const PERSPECTIVE = 1500;

/*
 * The two halves of a handover are deliberately not mirror images.
 *
 * Given the same curve, the outgoing and incoming plates pass through the same size at
 * the same instant in the same place — two photographs at half opacity on top of each
 * other, which is exactly the cross-dissolve this is meant to avoid. Letting the
 * departing chapter fall away faster than the arriving one comes forward means that at
 * every moment of the handover one plate is clearly nearer and brighter than the other,
 * and the eye always knows which chapter it is looking at.
 */
const AWAY_SPAN_OUT = 0.85;
const AWAY_SPAN_IN = 1.15;
const FADE_POW_OUT = 0.95;
const FADE_POW_IN = 1.5;

/*
 * Narrow screens lean harder on the same idea. There is no room to move two plates apart
 * in a 390px frame, so separation has to come from size alone: the departing chapter is
 * pulled away sooner and the arriving one held back longer, which keeps a clear size gap
 * between them at the moment they would otherwise be identical.
 */
const AWAY_SPAN_OUT_NARROW = 0.72;
const AWAY_SPAN_IN_NARROW = 1.28;

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

/** Long ease in and out, so a wipe accelerates and settles rather than running linearly. */
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;


/*
 * The ground the hero stands on: survey contours, two section lines and their marked
 * stations. Drawn rather than photographed so it can sit at an opacity a photograph
 * could not — it is meant to be found on the second look, not seen on the first.
 * Inert decoration, so it is hidden from assistive technology.
 */
const HeroTerrain: React.FC = () => (
  <svg
    className={styles.sjTerrain}
    viewBox="0 0 1600 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable={false}
  >
    <g className={styles.sjContours}>
      {[0, 46, 92, 140, 192, 248, 310, 380].map((r) => (
        <ellipse
          key={r}
          cx="1108"
          cy="446"
          rx={132 + r * 1.32}
          ry={94 + r}
          transform="rotate(-13 1108 446)"
        />
      ))}
    </g>

    <g className={styles.sjSurvey}>
      <path d="M120 742 L1462 236" />
      <path d="M186 168 L1338 796" />
    </g>

    <g className={styles.sjStations}>
      {[
        [120, 742],
        [612, 556],
        [1108, 368],
        [1462, 236],
        [186, 168],
        [744, 520],
        [1338, 796],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />
      ))}
    </g>
  </svg>
);

/*
 * Where each category sits in the hero, as a percentage of the opening. A staggered
 * column down the right balances the type block on the left without any of them
 * landing on it, and gives the scroll handover somewhere to travel FROM.
 */
/*
 * Where each category sits in the hero, as a percentage of the opening.
 *
 * `from` matters: a marker is a number, a rule and a name on one line, so a left-
 * anchored one near the right edge runs its own label off the frame. The right-hand
 * ones are anchored from the right instead, and grow inward.
 */
const CONSTELLATION: { x: number; y: number; from: "left" | "right" }[] = [
  { x: 66, y: 14, from: "left" },
  { x: 4, y: 28, from: "right" },
  { x: 68, y: 42, from: "left" },
  { x: 2, y: 56, from: "right" },
  { x: 66, y: 70, from: "left" },
  { x: 8, y: 84, from: "right" },
];

export const ServicesJourney: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const openingRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  /** The hero scroll cue, whose rule extends as the reader starts moving. */
  const cueRef = useRef<HTMLSpanElement>(null);
  /** Set once the pin exists, so the index rail can scroll to a chapter. */
  const seekRef = useRef<((index: number) => void) | null>(null);

  const [active, setActive] = useState(0);
  /*
   * Which category's detail chapter is open, by number. Holding the number rather than
   * the record keeps one source of truth: the overlay looks both halves of the category
   * up from servicesData, so the two can never drift apart.
   */
  const [detailNum, setDetailNum] = useState<string | null>(null);
  /*
   * Where the clicked category's plate was standing, so the story can grow out of the
   * visual the reader actually pressed rather than cutting to a new screen.
   */
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const openDetail = (num: string, index: number) => {
    const plate = frameRef.current?.querySelector<HTMLElement>(
      `[data-plate="${index}"]`
    );
    setOriginRect(plate ? plate.getBoundingClientRect() : null);
    setDetailNum(num);
  };

  const closeDetail = () => {
    setDetailNum(null);
    setOriginRect(null);
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const root = rootRef.current;
    const opening = openingRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!root || !opening || !stage || !frame) return;

    const ctx = gsap.context(() => {
      /* ---------------------------------------------------------- opening reveal */

      /*
       * The masthead is the first thing on the route, so its reveal is an entrance rather
       * than a scrub. A scrub cannot work here: both ends of the trigger resolve to
       * negative scroll offsets for an element already at the top of the document, which
       * collapses the trigger to zero length and leaves the lines parked below their
       * masks — the masthead never appears at all.
       *
       * This is the page's only tween that is not a function of scroll position. It runs
       * once, on arrival, and nothing downstream depends on it; the six chapters below are
       * scrubbed exactly as the brief requires. The from-state lives here rather than in
       * the stylesheet, so with no JavaScript the words are simply visible.
       */
      gsap.fromTo(
        opening.querySelectorAll(`.${styles.sjMaskInner}`),
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.12,
        }
      );

      const nodes = gsap.utils.toArray<HTMLElement>(`.${styles.sjNode}`, opening);

      // The constellation settles in behind the masthead rather than alongside it.
      gsap.fromTo(
        nodes,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.07,
          delay: 0.45,
        }
      );

      /*
       * The hero handing over to the card stage.
       *
       * Scrubbed across the opening's own scroll range, which — unlike the entrance
       * above — is a positive range, because the opening has a full viewport of height
       * to travel through before the pin begins. As the reader moves, each marker
       * converges toward the centre and drops toward the stage about to take over, and
       * is gone before the first card arrives: the six are named here, then carried
       * down, and never shown twice.
       */
      ScrollTrigger.create({
        trigger: opening,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          const w = opening.clientWidth;
          const h = opening.clientHeight;

          for (let i = 0; i < nodes.length; i++) {
            /*
             * Measured, not read off the percentage above: half the markers are
             * anchored from the right, so their percentage is not their position.
             * offsetLeft is a layout metric and is unaffected by the transform this
             * very line is writing, so it can be read on every frame without the
             * value feeding back into itself.
             */
            const home = nodes[i].offsetLeft + nodes[i].offsetWidth / 2;
            gsap.set(nodes[i], {
              x: (w / 2 - home) * p * 0.7,
              y: h * 0.26 * p,
              scale: 1 - p * 0.2,
              opacity: clamp(1 - p * 1.35, 0, 1),
            });
          }

          if (cueRef.current) {
            cueRef.current.style.transform = `scaleY(${1 + p * 1.4})`;
          }
        },
      });

      /* ------------------------------------------------------------- the chapters */

      const plates = gsap.utils.toArray<HTMLElement>(`.${styles.sjPlate}`, frame);
      const inners = gsap.utils.toArray<HTMLElement>(`.${styles.sjPlateInner}`, frame);
      const texts = gsap.utils.toArray<HTMLElement>(`.${styles.sjChapterText}`, frame);
      if (!plates.length) return;

      const details = gsap.utils.toArray<HTMLElement>(`.${styles.sjDetails}`, frame);

      /*
       * How far a neighbouring chapter's type sits off the stage. Measured from the frame
       * rather than fixed, so the arrangement holds its proportions on any viewport
       * instead of flying apart on a wide one and colliding on a narrow one.
       */
      const metrics = {
        per: 700,
        textX: 0,
        textY: 0,
        plateX: 0,
        plateY: 0,
        /* Wide layouts centre the type on the frame; the stacked one hangs it off the
           bottom edge, and forcing a -50% on that would lift it onto the plate. */
        centredText: true,
        spanOut: AWAY_SPAN_OUT,
        spanIn: AWAY_SPAN_IN,
      };

      const measure = () => {
        const vw = window.innerWidth;
        metrics.per = vw >= 1024 ? 700 : vw >= 640 ? 620 : 540;

        const w = frame.clientWidth;
        const h = frame.clientHeight;
        if (vw >= 1024) {
          metrics.textX = w * 0.1;
          metrics.textY = h * 0.34;
          // Far enough off-axis that the two plates in a handover are not stacked on one
          // another at the moment they are closest in size.
          metrics.plateX = w * 0.2;
          metrics.plateY = h * 0.24;
          metrics.centredText = true;
          metrics.spanOut = AWAY_SPAN_OUT;
          metrics.spanIn = AWAY_SPAN_IN;
        } else {
          // Stacked layout: the type block already owns the lower half, so a neighbour
          // steps mostly downward and barely sideways.
          metrics.textX = w * 0.04;
          metrics.textY = h * 0.2;
          // Less room to move here, and the plate has type directly beneath it.
          metrics.plateX = w * 0.06;
          metrics.plateY = h * 0.1;
          metrics.centredText = false;
          metrics.spanOut = AWAY_SPAN_OUT_NARROW;
          metrics.spanIn = AWAY_SPAN_IN_NARROW;
        }
      };

      const render = (raw: number) => {
        const pos = clamp(raw, 0, LAST);

        for (let i = 0; i < plates.length; i++) {
          const d = i - pos;
          // Distance from the stage, 0 at centre and 1 a full chapter away, eased so a
          // chapter holds its ground for a moment and then falls away quickly.
          const t = clamp(Math.abs(d), 0, 1);
          // Which side of the stage: behind us, or still to come.
          const dir = d < 0 ? -1 : 1;
          // The departing chapter runs this curve faster than the arriving one — see
          // AWAY_SPAN_OUT / AWAY_SPAN_IN.
          const k = ease(
            clamp(t / (dir < 0 ? metrics.spanOut : metrics.spanIn), 0, 1)
          );
          // The type keeps a symmetric curve, so the three visible titles stay evenly
          // spaced while the plates trade places.
          const kText = ease(t);

          /*
           * The plate's size is not a scale — it is how far away it is.
           *
           * apparent is the on-screen size we want at this distance (1 at the centre,
           * 0.28 a chapter away); z is the depth that produces it under the frame's
           * perspective, from apparent = P / (P - z). Letting the camera do the work is
           * what makes a chapter recede INTO the composition rather than just get
           * smaller in place: at depth it also drifts toward the vanishing point.
           */
          const apparent = 1 - k * 0.72;
          const z = PERSPECTIVE * (1 - 1 / apparent);

          gsap.set(plates[i], {
            z,
            /*
             * Divided by apparent so the drift is a constant number of screen pixels
             * rather than shrinking away with the plate. The departing chapter clears the
             * stage up and to the left, the arriving one comes up from below right —
             * the same diagonal the titles travel on, so plate and type read as one move.
             */
            x: (dir * k * metrics.plateX) / apparent,
            y: (dir * k * metrics.plateY) / apparent,
            rotation: dir * k * 3.5,
            // Distance has already taken most of the plate away by the time this bites;
            // it finishes the departure rather than being the departure.
            opacity: clamp(
              1 - Math.pow(t, dir < 0 ? FADE_POW_OUT : FADE_POW_IN),
              0,
              1
            ),
            zIndex: Math.round(100 - k * 60) + (d > 0 ? 1 : 0),
          });

          // A little internal life so the photograph is not a flat card being moved.
          gsap.set(inners[i], { yPercent: -kText * 5 });

          /*
           * The whole composition travels with its plate: number, title, concept and
           * service list are one object. The chapter just left goes up and back, the one
           * arriving comes from below and forward, and both stay legible at the edges of
           * the stage — which is what makes the six read as one sequence.
           */
          gsap.set(texts[i], {
            yPercent: metrics.centredText ? -50 : 0,
            x: dir * kText * metrics.textX,
            y: dir * kText * metrics.textY,
            scale: 1 - kText * 0.38,
            /*
             * Previous, active, next — and nothing else. Past one chapter's distance the
             * title is gone within a third of a step, because a fourth name on stage
             * stops reading as a sequence and starts reading as clutter.
             */
            opacity:
              t < 1
                ? 1 - kText * 0.86
                : clamp(0.14 * ((1.3 - Math.abs(d)) / 0.3), 0, 0.14),
            zIndex: Math.round(20 - kText * 10),
          });

          // Detail belongs to the current chapter alone — a neighbour shows its name.
          details[i].style.opacity = String(clamp(1 - t / 0.45, 0, 1));

          texts[i].style.pointerEvents = Math.abs(d) < 0.5 ? "auto" : "none";
        }

        const next = clamp(Math.round(pos), 0, LAST);
        if (next !== activeRef.current) {
          activeRef.current = next;
          setActive(next);
        }
      };

      const trigger = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${Math.round(UNITS * metrics.per)}`,
        pin: stage,
        pinSpacing: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onRefreshInit: measure,
        onRefresh: (self) => {
          measure();
          render(self.progress * UNITS - LEAD);
        },
        onUpdate: (self) => render(self.progress * UNITS - LEAD),
      });

      // The index rail's target for a chapter: the scroll offset at which `pos` is that
      // chapter's index, derived from the live trigger rather than assumed.
      seekRef.current = (index: number) => {
        const y = trigger.start + (LEAD + index) * metrics.per;
        const lenis = (window as unknown as { lenis?: { scrollTo: (t: number, o?: object) => void } })
          .lenis;
        if (lenis) lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: "smooth" });
      };

      measure();
      render(-LEAD);
    }, root);

    return () => {
      seekRef.current = null;
      ctx.revert();
    };
  }, []);

  /* --------------------------------------------------------------- masked line helper */

  const maskedLine = (content: React.ReactNode, key?: React.Key) => (
    <span key={key} className={styles.sjMask}>
      <span className={styles.sjMaskInner}>{content}</span>
    </span>
  );

  return (
    <div ref={rootRef} className={styles.sjRoot}>
      {/* ------------------------------------------------------------- opening */}
      <section ref={openingRef} className={styles.sjOpening} aria-labelledby="services-heading">
        <HeroTerrain />

        {/*
          The six categories, introduced. Editorial markers rather than a second card
          section — they are named here and then carried down into the real one by the
          scroll handover below, so the two never appear at once.
        */}
        <div className={styles.sjConstellation} aria-hidden="true">
          {SERVICE_CHAPTERS.map((chapter, index) => (
            <span
              key={chapter.num}
              className={styles.sjNode}
              style={{
                [CONSTELLATION[index].from]: `${CONSTELLATION[index].x}%`,
                top: `${CONSTELLATION[index].y}%`,
              }}
            >
              <span className={styles.sjNodeNum}>{chapter.num}</span>
              <span className={styles.sjNodeRule} />
              <span className={styles.sjNodeName}>
                {chapter.titleLines.join(" ")}
              </span>
            </span>
          ))}
        </div>

        <div className={styles.sjOpeningCopy}>
          <span className={styles.sjEyebrow}>
            <span aria-hidden="true" className={styles.sjEyebrowRule} />
            Our Services
          </span>

          <h1 id="services-heading" className={styles.sjOpeningTitle}>
            {maskedLine("From mining stories", "a")}
            {maskedLine("to market influence.", "b")}
          </h1>

          <p className={styles.sjOpeningLede}>
            We combine mining expertise, media influence, digital strategy and investor
            communication to help companies build visibility, credibility and growth.
          </p>

          <span className={styles.sjScrollCue}>
            Scroll to explore
            <span aria-hidden="true" className={styles.sjScrollCueRule}>
              <span ref={cueRef} className={styles.sjScrollCueFill} />
            </span>
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------- the six chapters */}
      <div className={styles.sjScrollArea}>
        <div ref={stageRef} className={styles.sjStage}>
          <div ref={frameRef} className={styles.sjFrame}>
            {/* One slot holds all six plates in the same place, in one 3D space. */}
            <div className={styles.sjPlateSlot}>
              {SERVICE_CHAPTERS.map((chapter, index) => (
                <div key={chapter.num} data-plate={index} className={styles.sjPlate}>
                  <div className={styles.sjPlateInner}>
                    <Image
                      src={chapter.image}
                      alt={chapter.alt}
                      fill
                      quality={95}
                      sizes="(max-width: 1023px) 100vw, 54vw"
                      className={styles.sjPlateImg}
                      priority={index === 0}
                    />
                  </div>
                  <div aria-hidden="true" className={styles.sjPlateScrim} />
                </div>
              ))}
            </div>

            {/*
              No per-line masks here any more. Masks hide a chapter completely, and a
              neighbouring chapter has to stay partly on stage for the six to read as one
              sequence — so the block is positioned and scaled as a whole instead.
            */}
            {SERVICE_CHAPTERS.map((chapter, index) => (
              <div key={chapter.num} className={styles.sjChapterText}>
                <span className={styles.sjNum}>{chapter.num}</span>

                <h2 className={styles.sjTitle} aria-label={chapter.titleLines.join(" ")}>
                  {chapter.titleLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>

                <div className={styles.sjDetails}>
                  <p className={styles.sjConcept}>{chapter.concept}</p>

                  <ul className={styles.sjList}>
                    {chapter.services.map((service) => (
                      <li key={service} className={styles.sjListItem}>
                        <span className={styles.sjListLine}>
                          <span aria-hidden="true" className={styles.sjListRule} />
                          {service}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/*
                    Inside the detail block, so it inherits that block's opacity and only
                    the category actually on stage shows one. tabIndex follows the same
                    rule, so a keyboard never lands on a button it cannot see.
                  */}
                  <button
                    type="button"
                    onClick={() => openDetail(chapter.num, index)}
                    tabIndex={index === active ? 0 : -1}
                    aria-label={`View details for ${chapter.titleLines.join(" ")}`}
                    className={styles.sjViewDetails}
                  >
                    View details
                    <ArrowRight aria-hidden="true" className={styles.sjViewDetailsIcon} />
                  </button>
                </div>
              </div>
            ))}

            {/* --------------------------------------------------- service index */}
            <nav className={styles.sjIndex} aria-label="Service categories">
              {SERVICE_CHAPTERS.map((chapter, index) => (
                <button
                  key={chapter.num}
                  type="button"
                  onClick={() => seekRef.current?.(index)}
                  aria-current={index === active ? "true" : undefined}
                  className={`${styles.sjIndexItem} ${
                    index === active ? styles.sjIndexItemActive : ""
                  }`}
                >
                  <span className={styles.sjIndexLabel}>{chapter.short}</span>
                  <span aria-hidden="true" className={styles.sjIndexRule} />
                  {chapter.num}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------- reduced-motion chapter list */}
      <div className={styles.sjStatic}>
        {SERVICE_CHAPTERS.map((chapter) => (
          <article key={chapter.num} className={styles.sjStaticItem}>
            <div className={styles.sjStaticMedia}>
              <Image
                src={chapter.image}
                alt={chapter.alt}
                fill
                sizes="(max-width: 899px) 92vw, 46vw"
                className={styles.sjPlateImg}
              />
            </div>

            <div>
              <span className={styles.sjNum}>{chapter.num}</span>
              <h2 className={styles.sjTitle} aria-label={chapter.titleLines.join(" ")}>
                {chapter.titleLines.map((line) => (
                  <span key={line} style={{ display: "block" }}>
                    {line}
                  </span>
                ))}
              </h2>
              <p className={styles.sjConcept}>{chapter.concept}</p>
              <ul className={styles.sjList}>
                {chapter.services.map((service) => (
                  <li key={service} className={styles.sjListItem}>
                    <span className={styles.sjListLine}>
                      <span aria-hidden="true" className={styles.sjListRule} />
                      {service}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* ------------------------------------------------------------- closing */}
      <section className={styles.sjClosing}>
        <span className={styles.sjEyebrow}>
          <span aria-hidden="true" className={styles.sjEyebrowRule} />
          Start Here
        </span>

        <h2 className={styles.sjClosingTitle}>
          <span>Your next mining story</span>
          <span>should not go unnoticed.</span>
        </h2>

        <Link href="/contact" className={styles.sjCta}>
          Start a campaign
          <ArrowRight className={styles.sjCtaIcon} />
        </Link>
      </section>

      {/* The seam into the site footer, which opens on #0B1F3A. */}
      <div aria-hidden="true" className={styles.sjFooterRamp} />

      {/*
        Rendered here rather than inside the pinned stage: the stage is transformed while
        pinned, and a transformed ancestor would make the overlay's position:fixed resolve
        against it instead of the viewport.
      */}
      {detailNum && SERVICE_STORIES[detailNum] ? (
        <ServiceStoryOverlay
          serviceNum={detailNum}
          originRect={originRect}
          onClose={closeDetail}
        />
      ) : (
        <ServiceDetailOverlay serviceNum={detailNum} onClose={closeDetail} />
      )}
    </div>
  );
};

export default ServicesJourney;
