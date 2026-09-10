"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";
import gsap from "gsap";
import styles from "./ServiceStoryOverlay.module.css";
import { SERVICE_STORIES, type ServiceState, type ServiceStory } from "./servicesData";

/**
 * One service's detail, as a single continuous environment.
 *
 * WHAT THIS IS NOT ANY MORE. It used to be a run of full-screen chapters, each with its
 * own photograph and its own hero-sized title, and it read as a slideshow — worst of all
 * it ended on a second "Investor Growth" hero, which looks exactly like the story
 * starting over.
 *
 * WHAT IT IS NOW. One stage, one scroll timeline, seven information states. A single
 * mining frame persists the whole way through and is RE-CROPPED between states — right
 * column, then dominant, then full bleed, then a side panel, then a strip beneath the
 * numbers. It is the same photograph throughout, so the environment never breaks. The
 * service's identity stays on screen the whole time, and the supporting states are set at
 * supporting size, because Investor Growth is the hero and these are its chapters.
 *
 * THE FIRST SCREEN IS UNTOUCHED. Its rect is measured off the live layout rather than
 * written down, so the frame lands exactly where the approved intro image sits at every
 * viewport. Every other state is expressed as fractions of the stage.
 *
 * Every value below is a pure function of scroll position, so stopping stops it and
 * scrolling back retraces the identical path. Nothing here runs on a timer.
 */

interface ServiceStoryOverlayProps {
  serviceNum: string | null;
  originRect: DOMRect | null;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Rect = [number, number, number, number];

/** The connection motif, drawn over the frame in the states that call for it. */
const NetworkArt: React.FC = () => (
  <svg
    viewBox="0 0 420 300"
    preserveAspectRatio="xMidYMid meet"
    className={styles.igNetArt}
    aria-hidden="true"
  >
    <circle cx="210" cy="150" r="118" className={styles.stNetRing} />
    <circle cx="210" cy="150" r="74" className={styles.stNetRing} />
    {[
      [62, 92],
      [118, 42],
      [318, 66],
      [372, 138],
      [330, 236],
      [206, 274],
      [84, 232],
      [46, 168],
    ].map(([x, y]) => (
      <g key={`${x}-${y}`}>
        <path d={`M210 150 L${x} ${y}`} className={styles.stNetLine} />
        <circle cx={x} cy={y} r="4" className={styles.stNetNode} />
      </g>
    ))}
    <circle cx="210" cy="150" r="13" className={styles.stNetCore} />
    <circle cx="210" cy="150" r="4.5" className={styles.stNetNode} />
  </svg>
);

export const ServiceStoryOverlay: React.FC<ServiceStoryOverlayProps> = ({
  serviceNum,
  originRect,
  onClose,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const frameImgRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const netRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const story: ServiceStory | undefined = serviceNum
    ? SERVICE_STORIES[serviceNum]
    : undefined;
  const open = Boolean(story);

  /* ---------------------------------------------------------------- scroll lock */

  useEffect(() => {
    if (!open) return;

    const lenis = (
      window as unknown as { lenis?: { stop: () => void; start: () => void } }
    ).lenis;
    const y = window.scrollY;

    if (lenis) lenis.stop();
    else document.documentElement.style.overflow = "hidden";

    return () => {
      if (lenis) lenis.start();
      else document.documentElement.style.overflow = "";
      window.scrollTo(0, y);
    };
  }, [open]);

  /* --------------------------------------------------------- the single timeline */

  useEffect(() => {
    if (!open || !story) return;

    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    const hero = heroRef.current;
    const anchor = anchorRef.current;
    if (!root || !track || !stage || !frame || !hero || !anchor) return;

    root.scrollTop = 0;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // The stylesheet lays the same states out as a document.

    const panels = gsap.utils.toArray<HTMLElement>(`.${styles.igState}`, stage);
    const states = story.states;
    const last = states.length - 1;

    let per = 620;
    /** State 0's frame, measured rather than written down. */
    let introRect: Rect = states[0].frame;
    /*
     * The picture is a square element large enough to cover any crop, and it is moved and
     * scaled to cover the current rect rather than being a full-stage image that the clip
     * cuts into. Those are not the same thing: clipping a stage-sized image shows a crop
     * of whatever happens to be under the hole, which changed what the approved intro
     * frame contained. Because the source is square, covering any rect is a UNIFORM scale
     * — max(w, h) / side — so this stays a transform and the picture never distorts.
     */
    let side = 1200;
    let stageW = 1;
    let stageH = 1;

    const measure = () => {
      const vw = window.innerWidth;
      per = vw >= 1024 ? 620 : vw >= 640 ? 560 : 500;

      /*
       * The intro rect has to be read with the hero at rest, or a resize part-way
       * through the story would measure whatever transform the hero is carrying.
       */
      gsap.set(hero, { clearProps: "transform,opacity" });
      const s = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      stageW = s.width;
      stageH = s.height;
      side = Math.max(stageW, stageH) * 1.02;
      if (frameImgRef.current) {
        frameImgRef.current.style.width = `${side}px`;
        frameImgRef.current.style.height = `${side}px`;
        frameImgRef.current.style.marginLeft = `${-side / 2}px`;
        frameImgRef.current.style.marginTop = `${-side / 2}px`;
      }
      if (s.width > 0 && s.height > 0 && a.width > 0) {
        introRect = [
          (a.left - s.left) / s.width,
          (a.top - s.top) / s.height,
          a.width / s.width,
          a.height / s.height,
        ];
      }

      /*
       * The track is the timeline plus exactly one stage. Max scroll therefore lands on
       * the last state with the stage still stuck to the top: the pin releases the moment
       * the story ends, and there is no empty scroll after it.
       */
      track.style.height = `${Math.round(last * per + stage.offsetHeight)}px`;
    };

    const rectOf = (index: number): Rect =>
      index === 0 ? introRect : states[index].frame;

    const render = () => {
      const max = root.scrollHeight - root.clientHeight;
      const progress = max > 0 ? clamp(root.scrollTop / max, 0, 1) : 0;

      // One position on one timeline. Everything below is read off it.
      const s = progress * last;
      const i = Math.min(Math.floor(s), last - 1);
      const t = ease(clamp(s - i, 0, 1));

      /* ---- the frame: one photograph, re-cropped from state to state ---- */
      const a = rectOf(i);
      const b = rectOf(i + 1);
      const x = lerp(a[0], b[0], t);
      const y = lerp(a[1], b[1], t);
      const w = lerp(a[2], b[2], t);
      const h = lerp(a[3], b[3], t);

      frame.style.clipPath = `inset(${(y * 100).toFixed(3)}% ${(
        (1 - x - w) * 100
      ).toFixed(3)}% ${((1 - y - h) * 100).toFixed(3)}% ${(x * 100).toFixed(3)}%)`;

      /*
       * Cover the current rect: centre the square on the rect's centre and scale it to
       * the rect's longer side. A slow extra drift keeps the picture alive; because the
       * scale is uniform, nothing is ever stretched by the reshaping around it.
       */
      const cx = (x + w / 2) * stageW;
      const cy = (y + h / 2) * stageH;
      // The drift starts at zero, not at 3%: at progress 0 this is an exact cover fit, which
      // is what makes the first screen identical to the approved one rather than 3% tighter.
      const cover = (Math.max(w * stageW, h * stageH) / side) * (1 + progress * 0.03);
      gsap.set(frameImgRef.current, {
        x: cx - stageW / 2,
        y: cy - stageH / 2,
        scale: cover,
      });

      const net = lerp(states[i].network ?? 0, states[i + 1].network ?? 0, t);
      gsap.set(dimRef.current, {
        opacity: lerp(states[i].dim, states[i + 1].dim, t),
      });
      gsap.set(netRef.current, { opacity: net, scale: 0.94 + 0.06 * net });

      /* ---- the hero hands over to the persistent marker, and never returns ---- */
      const heroOut = ease(clamp(s, 0, 1));
      gsap.set(hero, {
        y: -heroOut * 60,
        scale: 1 - heroOut * 0.08,
        opacity: 1 - heroOut,
        pointerEvents: heroOut > 0.5 ? "none" : "auto",
      });

      /* ---- the supporting states ---- */
      for (let k = 1; k <= last; k++) {
        const near = clamp(1 - Math.abs(s - k), 0, 1);
        const shown = ease(near);
        const ahead = s < k;
        gsap.set(panels[k - 1], {
          // A wipe, not a fade: revealed from the edge it arrives from.
          clipPath: `inset(${ahead ? (1 - shown) * 100 : 0}% 0% ${
            ahead ? 0 : (1 - shown) * 100
          }% 0%)`,
          y: (1 - shown) * (ahead ? 44 : -44),
          opacity: shown,
          pointerEvents: shown > 0.6 ? "auto" : "none",
          zIndex: Math.round(10 + shown * 10),
        });
      }

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const ctx = gsap.context(() => {
      measure();
      render();
    }, stage);

    let frameId = 0;
    const onScroll = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        render();
      });
    };
    const onResize = () => {
      measure();
      render();
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [open, story]);

  /* -------------------------------------------- the card growing into the stage */

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const root = rootRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!root || !stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);
    if (reduced) return () => window.clearTimeout(focusTimer);

    const ctx = gsap.context(() => {
      gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" });

      // The visual the reader pressed grows into the frame the story opens on.
      if (originRect && frame) {
        const to = frame.getBoundingClientRect();
        if (to.width > 0 && to.height > 0) {
          gsap.from(frame, {
            x: originRect.left + originRect.width / 2 - (to.left + to.width / 2),
            y: originRect.top + originRect.height / 2 - (to.top + to.height / 2),
            scale: Math.max(0.2, originRect.width / to.width),
            duration: 0.7,
            ease: "power3.inOut",
          });
        }
      }

      gsap.from(stage.querySelectorAll(`.${styles.igHeroItem}`), {
        y: 34,
        opacity: 0,
        duration: 0.6,
        stagger: 0.07,
        delay: 0.16,
        ease: "power3.out",
      });
    }, root);

    return () => {
      window.clearTimeout(focusTimer);
      ctx.revert();
      returnFocusRef.current?.focus?.();
    };
  }, [open, serviceNum, originRect]);

  /* --------------------------------------------------- escape + focus trap */

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
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === closeRef.current
      );
      if (!items.length) return;

      const first = items[0];
      const lastItem = items[items.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && (activeEl === first || !root.contains(activeEl))) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && activeEl === lastItem) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!open || !story) return null;

  const layoutClass: Record<string, string> = {
    lower: styles.igLower,
    centre: styles.igCentre,
    left: styles.igLeft,
    panel: styles.igPanel,
    figures: styles.igFigures,
  };

  const statePanel = (state: ServiceState) => (
    <div
      key={state.id}
      className={`${styles.igState} ${layoutClass[state.layout] ?? ""}`}
    >
      <div className={styles.igStateInner}>
        <span className={styles.stEyebrow}>
          <span aria-hidden="true" className={styles.stEyebrowRule} />
          {story.label}
        </span>

        {/* Supporting scale on purpose — the service name is the hero, not this. */}
        <h3 className={styles.igHeading}>{state.label}</h3>

        {state.body && <p className={styles.stBody}>{state.body}</p>}

        {state.items && (
          <ul className={styles.stPillarList}>
            {state.items.map((item, index) => (
              <li key={item} className={styles.stPillar}>
                <span className={styles.stPillarIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.stPillarName}>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {state.subItems && (
          <>
            <span className={styles.stSubLabel}>{state.subLabel}</span>
            <ul className={styles.stSubList}>
              {state.subItems.map((item) => (
                <li key={item} className={styles.stSubItem}>
                  <span aria-hidden="true" className={styles.stSubRule} />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        {state.figures && (
          <div className={styles.stFigures}>
            {state.figures.map((figure) => (
              <div key={figure.label} className={styles.stFigure}>
                <span className={styles.stFigureValue}>{figure.value}</span>
                <span className={styles.stFigureLabel}>{figure.label}</span>
              </div>
            ))}
          </div>
        )}

        {state.note && <p className={styles.stNote}>{state.note}</p>}

        {/* The last state carries the way out; there is no closing hero. */}
        {state.layout === "figures" && (
          <button type="button" onClick={onClose} className={styles.igBack}>
            <ArrowLeft aria-hidden="true" className={styles.stActionIcon} />
            Back to services
          </button>
        )}
      </div>
    </div>
  );

  /*
   * data-lenis-prevent below is load-bearing.
   *
   * Lenis listens for wheel on the window with a non-passive handler and calls
   * preventDefault on it. lenis.stop() suppresses Lenis's own scrolling but not that
   * preventDefault, so without this attribute a wheel gesture over the overlay is
   * swallowed before the overlay ever sees it — the story has thousands of pixels of
   * timeline and will not move a single one of them, which reads as an experience that
   * stops at its first screen.
   */
  return (
    <div
      ref={rootRef}
      className={styles.stRoot}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={`${story.num} ${story.label} — detailed service story`}
      onKeyDown={onKeyDown}
    >
      <span className={styles.stLabel}>
        <span className={styles.stLabelNum}>{story.num}</span>
        {story.label}
      </span>

      <button ref={closeRef} type="button" onClick={onClose} className={styles.stClose}>
        Close
        <X aria-hidden="true" className={styles.stCloseIcon} />
      </button>

      <div ref={trackRef} className={styles.stTrack}>
        <div ref={stageRef} className={styles.stStage}>
          {/* The one frame, present from the first screen to the last. */}
          <div ref={frameRef} className={styles.igFrame}>
            <div ref={frameImgRef} className={styles.igFrameImg}>
              <Image
                src={story.intro.image}
                alt={story.intro.alt}
                fill
                quality={92}
                sizes="100vw"
                className={styles.stMediaImg}
                priority
              />
            </div>
            <div ref={dimRef} aria-hidden="true" className={styles.igDim} />
            <div ref={netRef} aria-hidden="true" className={styles.igNet}>
              <NetworkArt />
            </div>
          </div>

          {/* The approved first screen. Its media column is an empty anchor: the frame
              above is cropped to exactly this box, so the opening is unchanged. */}
          <div ref={heroRef} className={styles.stChapter}>
            <div className={styles.stInner}>
              <div className={styles.stIntro}>
                <div className={styles.stMediaCol}>
                  <div ref={anchorRef} className={styles.igAnchor} aria-hidden="true" />
                </div>
                <div className={styles.stTypeCol}>
                  <span className={`${styles.stNum} ${styles.igHeroItem}`}>
                    {story.num}
                  </span>
                  <span className={`${styles.stEyebrow} ${styles.igHeroItem}`}>
                    <span aria-hidden="true" className={styles.stEyebrowRule} />
                    {story.intro.eyebrow}
                  </span>
                  <h2
                    className={`${styles.stTitle} ${styles.igHeroItem}`}
                    aria-label={story.intro.titleLines.join(" ")}
                  >
                    {story.intro.titleLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </h2>
                  <p className={`${styles.stStatement} ${styles.igHeroItem}`}>
                    {story.intro.statement}
                  </p>
                  <p className={`${styles.stBody} ${styles.igHeroItem}`}>
                    {story.intro.body}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* The six supporting states, all inside the same stage. */}
          {story.states.slice(1).map(statePanel)}
        </div>
      </div>

      <div aria-hidden="true" className={styles.stProgress}>
        <span ref={fillRef} className={styles.stProgressFill} />
      </div>
    </div>
  );
};

export default ServiceStoryOverlay;
