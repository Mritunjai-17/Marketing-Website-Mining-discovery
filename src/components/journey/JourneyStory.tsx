"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import {
  CHAPTERS,
  CHAPTER_COUNT,
  PAGES,
  PAGE_BLEED,
  chapterAt,
} from "./journeyChapters";
import { METRICS, METRICS_QUALIFIER, SERVICE_GROUPS } from "./journeyContent";
import { passProgress } from "./JourneyMarkers";
import { smoothstep } from "./journeySideView";
import { useJourneyFrame } from "./journeyScroll";

/**
 * The story, in words.
 *
 * The only part of the scene a screen reader should see, so it is the only
 * part not marked aria-hidden. Everything behind it is decoration.
 *
 * Every page is rendered once and kept in the DOM, with only opacity and a
 * small translate changing per frame. Nothing mounts or unmounts as the story
 * advances — mounting mid-scroll costs a layout pass at exactly the moment the
 * frame budget is tightest, and React reconciliation is not something to be
 * doing sixty times a second to swap two paragraphs.
 *
 * PROTOTYPE COPY. The text comes from `journeyChapters.ts` and
 * `journeyContent.ts`, not the CMS, and must not be wired into it.
 */

/** Splits a line so one word can carry the accent style. */
function renderLine(line: string, emphasis: string | null): React.ReactNode {
  if (!emphasis || !line.includes(emphasis)) return line;
  const at = line.indexOf(emphasis);
  return (
    <>
      {line.slice(0, at)}
      <em>{emphasis}</em>
      {line.slice(at + emphasis.length)}
    </>
  );
}

export const JourneyStory: React.FC = () => {
  const pageRefs = useRef<(HTMLDivElement | null)[]>(PAGES.map(() => null));
  const beatRefs = useRef<(HTMLDivElement | null)[]>(SERVICE_GROUPS.map(() => null));
  const resultRefs = useRef<(HTMLDivElement | null)[]>(METRICS.map(() => null));
  const qualifierRef = useRef<HTMLParagraphElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useJourneyFrame((scene) => {
    const p = scene.progress;

    /*
     * Pages overlap rather than cut. Each starts arriving a little before its
     * range opens and is still leaving a little after it closes, so at every
     * boundary one fades up while the other fades down — which is what makes
     * the story feel continuous instead of slide-based.
     */
    PAGES.forEach((page, index) => {
      const element = pageRefs.current[index];
      if (!element) return;
      const span = page.to - page.from;
      // Story copy only becomes active once the side view is locked and journey advances
      const entering = smoothstep(page.from, page.from + span * 0.16, p);
      const leaving =
        index === PAGES.length - 1
          ? 0
          : smoothstep(page.to - span * 0.1, page.to + PAGE_BLEED, p);

      element.style.opacity = (entering * (1 - leaving)).toFixed(3);
      // Rises in, rises away: a consistent direction reads as pages turning.
      element.style.transform = `translate3d(0, ${(
        (1 - entering) * 20 -
        leaving * 14
      ).toFixed(1)}px, 0)`;
    });

    /*
     * Service beats, anchored to the moment the truck draws level with each
     * marker. Derived from the marker's world position, so moving a sign moves
     * its copy with it and the two can never drift apart.
     */
    SERVICE_GROUPS.forEach((group, index) => {
      const element = beatRefs.current[index];
      if (!element) return;
      const pass = passProgress(group.worldX);
      const next = SERVICE_GROUPS[index + 1];
      const until = next ? passProgress(next.worldX) : pass + 0.05;

      const entering = smoothstep(pass - 0.05, pass - 0.012, p);
      const leaving = smoothstep(until - 0.028, until + 0.01, p);
      element.style.opacity = (entering * (1 - leaving)).toFixed(3);
      element.style.transform = `translate3d(0, ${(
        (1 - entering) * 12 -
        leaving * 9
      ).toFixed(1)}px, 0)`;
    });

    /*
     * Results accumulate rather than replace: each figure arrives as its post
     * passes and then stays, so by the end of the chapter all four read as one
     * set of outcomes instead of four numbers seen one at a time.
     */
    METRICS.forEach((metric, index) => {
      const element = resultRefs.current[index];
      if (!element) return;
      const arriving = smoothstep(passProgress(metric.worldX) - 0.035, passProgress(metric.worldX) - 0.004, p);
      const leaving = smoothstep(0.965, 0.995, p);
      element.style.opacity = (arriving * (1 - leaving)).toFixed(3);
      element.style.transform = `translate3d(0, ${((1 - arriving) * 10).toFixed(1)}px, 0)`;
    });
    if (qualifierRef.current) {
      // The qualifier follows the last figure: the numbers mean nothing alone.
      const arriving = smoothstep(passProgress(METRICS[METRICS.length - 1].worldX), 0.955, p);
      qualifierRef.current.style.opacity = (arriving * (1 - smoothstep(0.965, 0.995, p)) * 0.75).toFixed(3);
    }

    /* ----------------------------------------------------------- chrome */

    const active = chapterAt(p);
    if (indicatorRef.current) {
      const indOp = smoothstep(0.01, 0.06, p);
      indicatorRef.current.style.opacity = indOp.toFixed(3);
    }
    if (fillRef.current) {
      fillRef.current.style.transform = `scaleX(${Math.max(0.18, p).toFixed(4)})`;
    }
    // textContent invalidates layout, so it is written only when it changes.
    const label = `0${active.index}`;
    if (indexRef.current && indexRef.current.textContent !== label) {
      indexRef.current.textContent = label;
    }
    if (nameRef.current && nameRef.current.textContent !== active.label) {
      nameRef.current.textContent = active.label;
    }
    if (hintRef.current) {
      // Prominent only during the opening, then down to a trace.
      const hintEnter = smoothstep(0.01, 0.04, p);
      const hintFade = 1 - smoothstep(0.06, 0.14, p) * 0.88;
      hintRef.current.style.opacity = (hintEnter * hintFade).toFixed(3);
    }
  });

  return (
    <div className={styles.overlay}>
      {/* One column on the left; every page stacked in it. */}
      <div className={styles.copyStack}>
        {PAGES.map((page, index) => (
          <div
            key={`${page.eyebrow}-${index}`}
            ref={(node) => {
              pageRefs.current[index] = node;
            }}
            className={styles.copy}
            style={{ opacity: 0 }}
          >
            <p className={styles.eyebrow}>{page.eyebrow}</p>
            <h2 className={index === 0 ? styles.headline : styles.chapterHeadline}>
              {page.headlineLines.map((line, lineIndex) => (
                <React.Fragment key={line}>
                  {lineIndex > 0 && <br />}
                  {renderLine(line, page.emphasis)}
                </React.Fragment>
              ))}
            </h2>
            {page.supportLines.length > 0 && (
              <>
                <div className={styles.rule} />
                <p className={styles.support}>
                  {page.supportLines.map((line, lineIndex) => (
                    <React.Fragment key={line}>
                      {lineIndex > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/*
       * Service and result beats sit low-left, beneath the chapter column.
       * The right of the frame belongs to the truck and the network, and this
       * composition exists precisely so words and vehicle never compete.
       */}
      <div className={styles.beats}>
        {SERVICE_GROUPS.map((group, index) => (
          <div
            key={group.num}
            ref={(node) => {
              beatRefs.current[index] = node;
            }}
            className={styles.beat}
            style={{ opacity: 0 }}
          >
            <p className={styles.beatLead}>{group.num}</p>
            <p className={styles.beatTitle}>{group.title}</p>
            <p className={styles.beatServices}>{group.services.join(" · ")}</p>
          </div>
        ))}
      </div>

      <div className={styles.results}>
        {METRICS.map((metric, index) => (
          <div
            key={metric.id}
            ref={(node) => {
              resultRefs.current[index] = node;
            }}
            className={styles.result}
            style={{ opacity: 0 }}
          >
            <p className={styles.resultValue}>{metric.value}</p>
            <p className={styles.resultLabel}>{metric.label}</p>
          </div>
        ))}
        <p ref={qualifierRef} className={styles.qualifier} style={{ opacity: 0 }}>
          {METRICS_QUALIFIER.map((line, index) => (
            <React.Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </p>
      </div>

      <div ref={indicatorRef} className={styles.chapters} style={{ opacity: 1 }} aria-hidden="true">
        <span ref={indexRef} className={styles.chapterCurrent}>
          01
        </span>
        <span ref={nameRef} className={styles.chapterName}>
          THE JOURNEY
        </span>
        <span className={styles.chapterTrack}>
          <span ref={fillRef} className={styles.chapterFill} style={{ transform: "scaleX(0.18)" }} />
        </span>
        <span>0{CHAPTER_COUNT}</span>
      </div>

      <div ref={hintRef} className={styles.scrollHint} aria-hidden="true">
        <span className={styles.scrollLabel}>SCROLL TO EXPLORE</span>
        <span className={styles.scrollTrack}>
          <span className={styles.scrollFill} style={{ transform: "scaleY(0.4)" }} />
        </span>
      </div>
    </div>
  );
};

export default JourneyStory;
