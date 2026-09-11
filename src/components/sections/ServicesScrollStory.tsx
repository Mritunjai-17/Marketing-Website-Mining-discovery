"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ServicesScrollStory.module.css";

/**
 * Our Services — six service categories travelling through one pinned
 * frame.
 *
 * WHAT CHANGED, AND WHY. This section used to cross-fade four full-bleed photographs
 * behind four blocks of type, driven by a rAF loop that derived a category index from the
 * track's rect. A fade tells the reader nothing about where a category went or what is
 * coming; the brief asks for categories that physically travel, and for previous/active/
 * next to be legible at any moment. So the photograph is no longer the section — each
 * category is now one card carrying its own number, descriptor, title, statement,
 * capabilities and photograph, and the cards move through the frame under the scroll.
 *
 * Because every one of those elements lives inside the single transformed card, a
 * category cannot come apart mid-travel: there is no second animation to keep in sync.
 *
 * WHAT DRIVES IT. GSAP ScrollTrigger, scrubbed — the stack this codebase already pins
 * Our Impact with. The previous Framer Motion variants were time-based transitions fired
 * by a state change, which is the fade this brief rules out; a scrub needs the scroll
 * position itself to be the animation's clock. Framer Motion is untouched elsewhere.
 * Nothing here runs on a timer, and there are exactly two ScrollTriggers: the intro
 * reveal and the pin.
 */

interface Feature {
  title: string;
  desc: string;
}

interface Service {
  num: string;
  /** The small line above the title. */
  descriptor: string;
  /** Set as two lines by design, not by where the box happens to wrap. */
  titleLines: [string, string];
  /** Short gold-accented value proposition. */
  valueStatement: string;
  statement: string;
  /** Exactly two features with title + explanation, replacing the plain caps list. */
  features: [Feature, Feature];
  image: string;
  alt: string;
}

/*
 * The six categories, and the photographs behind them.
 *
 * ON THE IMAGERY. The approved library is smaller than its filenames suggest: four of the
 * five /stats images are byte-identical duplicates of the /services ones, and
 * newsletter-briefing.jpg is an open-pit sunset rather than anything to do with a
 * newsletter. That leaves nine distinct frames, exactly one of which has a person in it
 * and none of which show media, conference or branding work.
 *
 * So 04, 05 and 06 get literal matches — a phone, a person, a desk — and 01, 02 and 03
 * get mining operations standing in for capital, industry presence and creative
 * presence, which is what the brief allows for 01 ("investors / mining operations /
 * capital"). They are also sequenced so no two neighbouring categories look alike: aerial,
 * then golden panorama, then green mountains, then device, then interior, then desk.
 *
 * Alt text describes what is actually in each frame, not what the filename claims.
 */
const SERVICES: Service[] = [
  {
    num: "01",
    descriptor: "Capital & Investor Reach",
    titleLines: ["Investor", "Growth"],
    valueStatement: "Turn mining opportunities into investor attention.",
    statement:
      "Connect mining projects with relevant investors, stakeholders and decision-makers through focused investor campaigns and global industry outreach.",
    features: [
      {
        title: "Investor Campaigns",
        desc: "Targeted campaigns designed to communicate the opportunity and story behind mining projects to relevant audiences.",
      },
      {
        title: "Global Outreach",
        desc: "Extend project visibility across international mining audiences and create connections with global stakeholders.",
      },
    ],
    image: "/services/04-pit.jpg",
    alt: "Aerial view of a large open-pit mine in production",
  },
  {
    num: "02",
    descriptor: "Credibility & Industry Presence",
    titleLines: ["Media &", "Authority"],
    valueStatement: "Build authority across the mining media landscape.",
    statement:
      "Strengthen your industry presence through mining-focused news coverage, press communication and conference media.",
    features: [
      {
        title: "News & Syndication",
        desc: "Turn company developments, project stories and important updates into relevant industry visibility.",
      },
      {
        title: "Press & Conference Media",
        desc: "Communicate key announcements and extend the impact of mining events through focused media coverage and storytelling.",
      },
    ],
    image: "/stats/newsletter-briefing.jpg",
    alt: "Open-pit mining operation at sunset",
  },
  {
    num: "03",
    descriptor: "Identity & Creative Presence",
    titleLines: ["Brand &", "Digital"],
    valueStatement: "Build a distinctive digital identity for mining.",
    statement:
      "Create a stronger digital presence through focused branding, multimedia and visual communication built around your company's story.",
    features: [
      {
        title: "Digital Branding",
        desc: "Build a recognizable and consistent visual identity across your company's digital presence.",
      },
      {
        title: "Multimedia",
        desc: "Transform complex mining stories, projects and developments into engaging visual experiences.",
      },
    ],
    image: "/services/02-drill.jpg",
    alt: "Exploration drill rig and crew working in mountain terrain",
  },
  {
    num: "04",
    descriptor: "Reach & Engagement",
    titleLines: ["Audience", "Growth"],
    valueStatement: "Turn content into audience growth.",
    statement:
      "Expand your mining audience by combining targeted campaigns, social growth and paid digital promotion to amplify important stories.",
    features: [
      {
        title: "Social Growth & Ads",
        desc: "Build visibility and engagement across relevant mining audiences through focused social content and promotion.",
      },
      {
        title: "Paid Ad Campaigns",
        desc: "Amplify important stories, announcements and campaigns towards relevant digital audiences.",
      },
    ],
    image: "/cards/bg_card_3.jpg",
    alt: "Smartphone held in front of a mining landscape",
  },
  {
    num: "05",
    descriptor: "Leadership & Voice",
    titleLines: ["Executive", "Visibility"],
    valueStatement: "Put mining leaders at the center of the conversation.",
    statement:
      "Give mining executives and industry leaders a stronger voice through podcasts, interviews, features and editorial storytelling.",
    features: [
      {
        title: "Podcasts & Interviews",
        desc: "Create engaging conversations that give industry leaders a platform to share their experience, perspective and vision.",
      },
      {
        title: "Executive Features",
        desc: "Highlight the people behind mining companies and projects through focused leadership and industry storytelling.",
      },
    ],
    image: "/services/03-assay.jpg",
    alt: "Mining professional logging drill core samples on a core bench",
  },
  {
    num: "06",
    descriptor: "Owned Audience",
    titleLines: ["Direct", "Audience"],
    valueStatement: "Build a direct connection with your audience.",
    statement:
      "Create an ongoing communication channel with your audience through newsletters, email communication and relevant industry updates.",
    features: [
      {
        title: "Newsletter & Emailer",
        desc: "Keep audiences connected through company developments, project updates, industry insights and relevant mining stories.",
      },
      {
        title: "Audience Retention",
        desc: "Turn individual interactions into an ongoing relationship through consistent and relevant communication.",
      },
    ],
    image: "/cards/bg_card_2.jpg",
    alt: "Laptop and printed industry report on a desk at dusk",
  },
];

const LAST = SERVICES.length - 1;

/*
 * The scrub is expressed in "units", one unit being one category travelling onto centre.
 * Scroll progress maps onto that scale as:
 *
 *   raw = progress * UNITS - LEAD
 *   pos = clamp(raw, 0, LAST)
 *
 * LEAD is a short hold at the top of the pin so category 01 is genuinely the active card
 * for a moment before it starts leaving, rather than departing on the first pixel.
 *
 * TAIL is the beat after 04 lands: the card recedes very slightly while the single
 * closing CTA rises in, and the pin releases the instant that finishes. Nothing is
 * static during it, so it costs no dead scroll — and because `pos` is clamped at LAST,
 * no category can re-enter once the sequence is done.
 */
const LEAD = 0.35;
const TAIL = 0.3;
const CARD_UNITS = LEAD + LAST + TAIL;

/*
 * THE OPENING OF THE SAME SCENE.
 *
 * The masthead used to sit in normal flow above the pinned frame, which made Services
 * read as two screens: an intro page, then - after most of a blank viewport while the
 * frame scrolled up under it - a card page. The masthead now lives INSIDE the pinned
 * frame as its opening state, and these two units are the beats that carry it into the
 * cards. They are part of the same scrub as the categories, so there is one timeline and
 * one pin for the whole section.
 *
 * INTRO_HOLD is a short beat where only the masthead is on screen, drifting slightly so
 * the scroll is never frozen. TRANSITION is the handover itself: the masthead rises and
 * recedes while the stage climbs in from below and the index resolves. They overlap on
 * purpose - the first card is already entering well before the masthead has gone.
 */
const INTRO_HOLD = 0.3;
const TRANSITION = 1;
const UNITS = INTRO_HOLD + TRANSITION + CARD_UNITS;

/*
 * The arc the categories travel on.
 *
 * SPREAD is how much of the ellipse one step spans, in radians — the slice of the curve
 * between one category and the next. It is deliberately well under a quarter turn: the
 * brief asks for a large arc, not a carousel going round, so the categories ride the top of
 * a big ellipse rather than orbiting a small one.
 *
 * MIN_SCALE is the size a category has receded to a full step out from the apex, and the
 * arc's depth is measured against it — a smaller card has more room before it clips.
 */
const SPREAD = 0.66;
const MIN_SCALE = 0.86;

/**
 * Must match the `perspective` declared on .svcTrack — the depth maths reads from it.
 * A category's on-screen size is turned into the distance that produces it, rather
 * than being applied as a scale, so the recede is the camera's doing.
 */
const PERSPECTIVE = 1600;

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

/** Smoothstep. Keeps the handover from reading as a linear, mechanical slide. */
const smooth = (v: number) => v * v * (3 - 2 * v);

export const ServicesScrollStory: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const handoffRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeRef = useRef(0);

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const intro = introRef.current;
    const handoff = handoffRef.current;
    const viewport = viewportRef.current;
    const head = headRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    const cta = ctaRef.current;
    if (!section || !intro || !handoff || !viewport || !head || !stage) return;
    if (!track || !cta) return;

    // The two lower lines of the masthead. They clear the frame ahead of the headline -
    // see the ordering in render().
    const lede = intro.querySelector<HTMLElement>(`.${styles.svcLede}`);
    const cue = intro.querySelector<HTMLElement>(`.${styles.svcScrollCue}`);

    const ctx = gsap.context(() => {
      /* ------------------------------------------------------------ intro reveal */

      /*
       * The masthead arrives with the scroll rather than on a timer, so the label and
       * headline surface while the handoff ramp above is still darkening — the section
       * introduces itself instead of cutting in. Scrubbed, so it reverses on the way up.
       */
      gsap.fromTo(
        intro.querySelectorAll(`.${styles.svcIntroItem}`),
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          stagger: 0.12,
          /*
           * Triggered off the handoff ramp, not the masthead itself: the masthead now
           * lives inside the pinned frame, and a trigger on a pinned element is measured
           * against a moving target. The ramp's bottom edge IS the frame's top edge, so
           * this reads the frame rising into the window without ever asking the pin where
           * it is - the lines surface as the dark ground arrives, and the pin then takes
           * over with nothing left to hand off.
           */
          scrollTrigger: {
            trigger: handoff,
            start: "bottom bottom",
            end: "bottom 30%",
            scrub: 0.6,
          },
        }
      );

      /* -------------------------------------------------------------- the categories */

      const cards = gsap.utils.toArray<HTMLElement>(`.${styles.svcCard}`, track);
      // One veil per card, in the same order — see .svcCardVeil in the stylesheet.
      const veils = gsap.utils.toArray<HTMLElement>(`.${styles.svcCardVeil}`, track);
      if (!cards.length) return;

      /*
       * Measured, not hard-coded: travel distance comes from the card's own laid-out
       * size, so the CSS that sizes the card stays the single source of truth at every
       * breakpoint.
       *
       * The axis is what changes with width. Wide viewports move the categories sideways,
       * which is where the depth reads. A phone has no horizontal room to spare, so the
       * stack goes vertical instead — the previous category recedes upward and the next
       * waits below — and the previous/active/next relationship is identical.
       */
      const metrics = {
        /** true when the categories travel sideways, false when they travel vertically. */
        wide: true,
        /** Ellipse radius along the axis the categories travel on. */
        radiusMain: 0,
        /** Ellipse radius across it — the depth of the arc. */
        radiusBow: 0,
        /** How far the apex sits off-centre, so the arc is balanced in the frame. */
        apex: 0,
        /** Hard limits on the across-axis position, so no card is clipped by the stage. */
        bowMin: 0,
        bowMax: 0,
        /** Tangent angle one full step out — the normaliser for rotation. */
        tangentAtStep: 1,
        rot: 4,
        per: 620,
      };

      const measure = () => {
        const w = cards[0].offsetWidth;
        const h = cards[0].offsetHeight;
        const stageW = track.clientWidth;
        const stageH = track.clientHeight;
        const vw = window.innerWidth;

        let main: number;

        if (vw >= 1200) {
          /*
           * Sideways travel, but only as far as the window can actually show. At the
           * crossover the two categories sit half a step either side of centre, so a step
           * wider than (viewport − card) crops both of them at once and the frame has no
           * dominant category at exactly the moment the movement should read clearest.
           * 0.72w is the distance the composition wants; the min is what the window can
           * give; the floor keeps some travel on a window that is wide but not wide
           * enough to have both.
           */
          main = Math.min(w * 0.72, Math.max(w * 0.4, vw - w * 0.9));
          metrics.wide = true;
          metrics.rot = 4;
          metrics.per = 620;
        } else if (vw >= 640) {
          // No window this narrow has room for two cards abreast, so the long axis of
          // the arc turns vertical and it bows sideways instead. Same curve, rotated.
          main = h * 0.3;
          metrics.wide = false;
          metrics.rot = 2.5;
          metrics.per = 520;
        } else {
          main = h * 0.34;
          metrics.wide = false;
          metrics.rot = 1.5;
          metrics.per = 440;
        }

        /*
         * How deep the arc can bow before it starts clipping.
         *
         * Measured rather than picked, because it is bounded by real geometry: the card
         * at the apex must still fit inside the stage, and so must a receded card at the
         * far end of the bow — and a receded card is smaller, so it has more room. The
         * 0.85 keeps a margin off both walls. `bowCard` is the card's size ACROSS the
         * travel axis, which is its height when the categories move sideways.
         */
        const bowSpan = metrics.wide ? stageH : stageW;
        const bowCard = metrics.wide ? h : w;
        const apexRoom = Math.max(0, bowSpan / 2 - bowCard / 2);
        const sideRoom = Math.max(0, bowSpan / 2 - (MIN_SCALE * bowCard) / 2);

        metrics.apex = apexRoom * 0.85;
        // 0.34 of the card was a real curve but a shallow-looking one. 0.46 makes the
        // vertical leg of the arc unmistakable while the measured ceiling below still
        // guarantees neither the apex card nor a flank card can clip the stage.
        const depth = Math.min(bowCard * 0.46, metrics.apex + sideRoom * 0.85);

        metrics.bowMin = -apexRoom;
        metrics.bowMax = sideRoom;

        // Radii that put a category exactly `main` along and `depth` across at |d| = 1.
        metrics.radiusMain = main / Math.sin(SPREAD);
        metrics.radiusBow = depth / (1 - Math.cos(SPREAD));
        metrics.tangentAtStep =
          Math.atan2(
            metrics.radiusBow * Math.sin(SPREAD),
            metrics.radiusMain * Math.cos(SPREAD)
          ) || 1;
      };

      /**
       * One function, one clock. `u` is the position along the whole pin measured in
       * units, and every phase below is a window on it - masthead, handover, categories,
       * closing CTA. Nothing here switches state; each phase is a ramp, so scrolling back
       * up retraces the identical path.
       */
      const render = (u: number) => {
        const introT = clamp(u / INTRO_HOLD, 0, 1);
        // The handover, 0 -> 1.
        const t = clamp((u - INTRO_HOLD) / TRANSITION, 0, 1);
        // What the category arc has always been driven by, offset past the opening.
        const raw = u - INTRO_HOLD - TRANSITION - LEAD;

        const h = viewport.clientHeight || window.innerHeight;

        /* --------------------------------------------------- masthead leaving */

        /*
         * It rises and recedes rather than cutting: a third of the frame's height and
         * four percent of its size, which is enough to read as depth and far short of a
         * zoom.
         *
         * The travel is what keeps the overlap legible rather than muddy. The masthead
         * and the card are on screen together for most of this beat by design, so they
         * have to cross vertically instead of stacking - the headline clears the top of
         * the frame on roughly the same scroll that the card's own title arrives at the
         * middle of it. A shorter rise left the two sets of type sitting on one another
         * at t = 0.5, which read as a collision and not as a handover.
         */
        gsap.set(intro, {
          y: -h * (0.03 * introT + 0.36 * smooth(t)),
          scale: 1 - 0.04 * smooth(t),
          opacity: 1 - smooth(clamp((t - 0.08) / 0.52, 0, 1)),
        });

        /*
         * The masthead empties from the bottom up: cue, then lede, then the headline and
         * label with the layer itself.
         *
         * This is what keeps the overlap clean. The card arrives at the middle of the
         * frame, which is exactly where the lede sits, so a masthead that faded evenly
         * would put a paragraph across the photograph for the whole beat. Emptying it
         * bottom-up clears that band first and leaves the headline - which by then is
         * riding up out of the card's way - as the last thing to go. It also reads as the
         * right order editorially: the cue has done its job the moment the scroll it
         * asked for begins, and the supporting copy follows it out.
         *
         * Only opacity is set on these two. They ride upward on the masthead layer above,
         * and their transforms belong to the reveal tween, which is the one other thing
         * in this component that writes to them.
         */
        if (cue) gsap.set(cue, { opacity: 1 - smooth(clamp(t / 0.3, 0, 1)) });
        if (lede) {
          gsap.set(lede, { opacity: 1 - smooth(clamp((t - 0.02) / 0.44, 0, 1)) });
        }

        /* -------------------------------------------- index and stage arriving */

        // The index resolves once there is something for it to index.
        const indexIn = smooth(clamp((t - 0.3) / 0.5, 0, 1));
        gsap.set(head, { opacity: indexIn, y: (1 - indexIn) * -12 });

        /*
         * The categories arrive as a stage, not as six separate entrances: the frame
         * they travel in climbs from a fifth of a screen below and comes forward from
         * 0.92, and the arc inside it is untouched. The card's own movement - the
         * ellipse, the veils, the banking - therefore starts from exactly the state it
         * always had; this only decides when that frame is standing in front of the
         * reader, and it is already doing so while the masthead is still on screen.
         */
        const enter = smooth(clamp((t - 0.14) / 0.86, 0, 1));
        /*
         * Opacity resolves ahead of the arrival so the card is read while it is still
         * travelling, rather than being found already in place. This is the other half of
         * the overlap: at the midpoint of the beat the card is the brighter of the two
         * and the masthead is the one on its way out.
         */
        const enterFade = smooth(clamp((t - 0.14) / 0.52, 0, 1));
        gsap.set(stage, {
          opacity: enterFade,
          y: (1 - enter) * h * 0.2,
          scale: 0.92 + 0.08 * enter,
        });

        /* -------------------------------------------------------- the categories */

        const pos = clamp(raw, 0, LAST);
        // How far into the closing beat we are, 0 → 1.
        const tail = clamp(raw - LAST, 0, TAIL) / TAIL;

        for (let i = 0; i < cards.length; i++) {
          // Signed distance from centre: negative once a category has been passed.
          const d = i - pos;
          const near = Math.min(Math.abs(d), 1);
          const far = Math.min(Math.abs(d), 2);

          /*
           * The category's place on the ellipse. `angle` is continuous in scroll — there
           * is no previous/active/next switch anywhere in here, only a point on a curve —
           * so every property below is a function of one arc position and reverses along
           * the identical path.
           *
           * `along` sweeps the travel axis, `across` is the bow: zero at the apex and
           * growing either side of it, which is what puts the active category at the top
           * of the arc and its neighbours down and out on both flanks.
           */
          /*
           * Clamped to a quarter turn. Past that the ellipse starts curving back on
           * itself and a far-off card would drift inward again instead of continuing
           * out. Nothing within the visible range (|d| < 1.85) ever reaches the clamp —
           * it only keeps the six-card sequence well-behaved at its far ends.
           */
          const angle = clamp(d * SPREAD, -Math.PI / 2, Math.PI / 2);
          const along = metrics.radiusMain * Math.sin(angle);
          const across = clamp(
            metrics.radiusBow * (1 - Math.cos(angle)) - metrics.apex,
            metrics.bowMin,
            metrics.bowMax
          );

          /*
           * Rotation is the tangent to that ellipse, normalised so a category one step
           * out sits at `rot` degrees. It is flat at the apex because the tangent there
           * IS flat, and it changes sign either side because the curve does — the card
           * banks with the path instead of being tilted at it.
           */
          const tangent = Math.atan2(
            metrics.radiusBow * Math.sin(angle),
            metrics.radiusMain * Math.cos(angle)
          );

          // Depth read off the same arc parameter as the position, so a category grows as
          // it climbs toward the apex and recedes as it falls away — one curve driving
          // travel, size and tilt together rather than three separate ramps.
          const depth = clamp((1 - Math.cos(angle)) / (1 - Math.cos(SPREAD)), 0, 1);

          /*
           * Size is distance, not scale.
           *
           * `apparent` is the on-screen size wanted at this point on the arc — 1 at the
           * apex, 0.86 a step out — and `z` is the depth that produces it under the
           * track's perspective, from apparent = P / (P - z). Same sizes as before, but
           * now the card is genuinely further away: it foreshortens, and because the
           * projection is about the track's centre it also drifts toward the vanishing
           * point as it goes, which a scale can never do.
           */
          const apparent = (1 - depth * 0.14) * (1 - tail * 0.05);
          const z = PERSPECTIVE * (1 - 1 / apparent);

          gsap.set(cards[i], {
            xPercent: -50,
            yPercent: -50,
            z,
            /*
             * Divided by apparent because the perspective divides everything: the
             * projection scales this offset by the same factor it scales the card, so
             * pre-dividing is what keeps the arc walked in screen pixels rather than
             * contracting as the card recedes.
             */
            x: (metrics.wide ? along : across) / apparent,
            y: (metrics.wide ? across : along) / apparent,
            rotation: (tangent / metrics.tangentAtStep) * metrics.rot,
            // Solid until the card is off-frame, then out — receding is the veil's job.
            opacity: clamp((1.85 - far) / 0.7, 0, 1),
            zIndex: Math.round(100 - far * 20),
          });

          const veil = veils[i];
          if (veil) veil.style.opacity = String(near * 0.62 + tail * 0.1);
        }

        for (let i = 0; i < fillRefs.current.length; i++) {
          const fill = fillRefs.current[i];
          if (fill) fill.style.transform = `scaleX(${clamp(pos - i, 0, 1)})`;
        }

        // One closing CTA, not one per category. It starts rising as 04 comes onto centre
        // and completes exactly as the pin releases.
        const reveal = clamp((raw - (LAST - 0.4)) / (0.4 + TAIL), 0, 1);
        cta.style.opacity = String(reveal);
        cta.style.transform = `translate3d(0, ${(1 - reveal) * 18}px, 0)`;
        cta.style.pointerEvents = reveal > 0.9 ? "auto" : "none";

        const next = clamp(Math.round(pos), 0, LAST);
        if (next !== activeRef.current) {
          activeRef.current = next;
          setActive(next);
        }
      };

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
          render(self.progress * UNITS);
        },
        onUpdate: (self) => render(self.progress * UNITS),
      });

      measure();
      render(0);
    }, section);

    return () => ctx.revert();
  }, []);

  /* ------------------------------------------------------------------- service card */

  const cardBody = (service: Service, sizes: string) => (
    <>
      <div className={styles.svcCardMedia}>
        <Image
          src={service.image}
          alt={service.alt}
          fill
          quality={95}
          sizes={sizes}
          className={styles.svcCardImage}
        />
        <div aria-hidden="true" className={styles.svcCardMediaScrim} />

        <div className={styles.svcCardMediaHead}>
          <span className={styles.svcCardNum}>{service.num}</span>
          <span aria-hidden="true" className={styles.svcCardNumRule} />
          <span className={styles.svcCardDescriptor}>{service.descriptor}</span>
        </div>
      </div>

      <div className={styles.svcCardPanel}>
        {/* Top block: title, gold value statement, description */}
        <div className={styles.svcCardPanelTop}>
          {/* aria-label keeps the accessible name a single phrase. */}
          <h3 className={styles.svcCardTitle} aria-label={service.titleLines.join(" ")}>
            {service.titleLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h3>
          <p className={styles.svcCardValueStmt}>{service.valueStatement}</p>
          <p className={styles.svcCardText}>{service.statement}</p>
        </div>

        {/* Feature block: two features separated by hairline dividers */}
        <div className={styles.svcCardFeatures}>
          <span aria-hidden="true" className={styles.svcCardDivider} />
          <div className={styles.svcCardFeature}>
            <span className={styles.svcCardFeatureTitle}>{service.features[0].title}</span>
            <p className={styles.svcCardFeatureDesc}>{service.features[0].desc}</p>
          </div>
          <span aria-hidden="true" className={styles.svcCardDivider} />
          <div className={styles.svcCardFeature}>
            <span className={styles.svcCardFeatureTitle}>{service.features[1].title}</span>
            <p className={styles.svcCardFeatureDesc}>{service.features[1].desc}</p>
          </div>
        </div>
      </div>

      {/* Depth. Inert in the static copy, driven by distance-from-centre in the pin. */}
      <div aria-hidden="true" className={styles.svcCardVeil} />
    </>
  );

  return (
    <section id="services" ref={sectionRef} className={styles.svcSection}>
      {/* Seam down from Market Influence & Reach. Decorative, and entirely inside this
          section, so that one never has to know about it. */}
      <div ref={handoffRef} aria-hidden="true" className={styles.svcHandoff} />

      <div ref={viewportRef} className={styles.svcViewport}>
        <div aria-hidden="true" className={styles.svcGlow} />

        {/* No second section label in here: the masthead is the opening state of this
            same frame and is still on screen as the index resolves, so one would only
            have doubled it. */}
        <div ref={headRef} className={styles.svcHead}>
          {/* A table of contents, not carousel navigation: it says where in the
              journey you are and offers nothing to click. */}
          <div className={styles.svcProgress} aria-hidden="true">
            {SERVICES.map((service, index) => (
              <React.Fragment key={service.num}>
                <span
                  className={`${styles.svcProgressStep} ${
                    index === active ? styles.svcProgressStepActive : ""
                  }`}
                >
                  {service.num}
                </span>
                {index < LAST && (
                  <span className={styles.svcProgressLine}>
                    <span
                      ref={(el) => {
                        fillRefs.current[index] = el;
                      }}
                      className={styles.svcProgressFill}
                    />
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <span className="sr-only">
            Service {active + 1} of {SERVICES.length}
          </span>
        </div>

        <div ref={stageRef} className={styles.svcStage}>
          <div ref={trackRef} className={styles.svcTrack}>
            {SERVICES.map((service, index) => (
              <article
                key={service.num}
                data-index={index}
                className={styles.svcCard}
              >
                {cardBody(
                  service,
                  "(max-width: 639px) 88vw, (max-width: 1199px) 84vw, 68vw"
                )}
              </article>
            ))}
          </div>
        </div>

        <div className={styles.svcFoot}>
          <div ref={ctaRef} style={{ opacity: 0, pointerEvents: "none" }}>
            <Link href="/services" className={styles.svcCta}>
              Explore all services
              <ArrowRight className={styles.svcCtaIcon} />
            </Link>
          </div>
        </div>

        {/*
          The masthead, inside the frame it opens. Last in the markup so it sits over
          the stage while the two overlap, and inert to the pointer throughout so it
          never stands between the reader and the closing link underneath it.
        */}
        <div ref={introRef} className={styles.svcIntro}>
          <div className={styles.svcIntroInner}>
            <span className={`${styles.svcEyebrow} ${styles.svcIntroItem}`}>
              <span aria-hidden="true" className={styles.svcEyebrowRule} />
              Our Services
              <span aria-hidden="true" className={styles.svcEyebrowRule} />
            </span>

            <h2 className={`${styles.svcHeadline} ${styles.svcIntroItem}`}>
              <span>Mining Expertise.</span>
              <span>Digital Influence.</span>
              <span>Investor Reach.</span>
            </h2>

            <p className={`${styles.svcLede} ${styles.svcIntroItem}`}>
              From investor campaigns and industry media to digital branding, audience
              growth and executive visibility, we help mining companies turn their
              stories into market influence.
            </p>

            <span className={`${styles.svcScrollCue} ${styles.svcIntroItem}`}>
              Scroll to explore
              <span aria-hidden="true" className={styles.svcScrollCueRule} />
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- reduced-motion copy */}
      <div className={styles.svcStatic}>
        {SERVICES.map((service) => (
          <article key={service.num} className={styles.svcStaticItem}>
            {cardBody(
                    service, "(max-width: 899px) 92vw, 58vw")}
          </article>
        ))}

        <div className={styles.svcStaticFoot}>
          <Link href="/services" className={styles.svcCta}>
            Explore all services
            <ArrowRight className={styles.svcCtaIcon} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesScrollStory;
