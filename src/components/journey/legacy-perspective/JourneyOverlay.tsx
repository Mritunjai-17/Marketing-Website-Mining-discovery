"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import { smoothstep } from "./journeyPerspective";
import { useJourneyFrame } from "./journeyScroll";
import {
  CHAPTERS,
  CHAPTER_BLEED,
  MASTER_HEADLINE,
  NUMBERED_CHAPTERS,
  chapterAt,
} from "./journeyChapters";
import { METRICS, METRICS_QUALIFIER, OPENING, SERVICE_GROUPS } from "./journeyContent";
import { passProgress } from "./JourneyMarkers";

/**
 * The story, in words.
 *
 * The only part of the scene a screen reader should see, so it is the only
 * part not marked aria-hidden. Everything behind it is decoration.
 *
 * Every chapter is rendered once and kept in the DOM, with only opacity and a
 * small translate changing per frame. Nothing is mounted or unmounted as the
 * story advances — mounting mid-scroll would cost a layout pass at exactly the
 * moment the frame budget is tightest, and React reconciliation is not
 * something to be doing sixty times a second to swap two paragraphs.
 *
 * PROTOTYPE COPY. The text comes from `journeyChapters.ts`, not the CMS, and
 * must not be wired into it.
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

export const JourneyOverlay: React.FC = () => {
  const masterRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLParagraphElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>(CHAPTERS.map(() => null));
  const indicatorRef = useRef<HTMLDivElement>(null);
  const chapterFillRef = useRef<HTMLSpanElement>(null);
  const chapterLabelRef = useRef<HTMLSpanElement>(null);
  const chapterNameRef = useRef<HTMLSpanElement>(null);
  const scrollFillRef = useRef<HTMLSpanElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>(SERVICE_GROUPS.map(() => null));
  const resultRefs = useRef<(HTMLDivElement | null)[]>(METRICS.map(() => null));
  const qualifierRef = useRef<HTMLParagraphElement>(null);

  useJourneyFrame((scene) => {
    const p = scene.progress;

    /*
     * The master headline is the premise, not a caption. It holds the frame
     * alone while the truck sets off, then hands over to the chapter copy —
     * which occupies the same column, so the two cannot both be present.
     */
    if (masterRef.current) {
      /*
       * No entrance ramp: the premise is already on screen when the section
       * pins, because the visitor scrolls *into* a composed frame rather than
       * arriving at an empty one and waiting for it to assemble.
       */
      const leaving = smoothstep(MASTER_HEADLINE.handover.from, MASTER_HEADLINE.handover.to, p);
      masterRef.current.style.opacity = (1 - leaving).toFixed(3);
      masterRef.current.style.transform = `translate3d(0, ${(-leaving * 14).toFixed(1)}px, 0)`;
    }

    /*
     * Chapters overlap rather than cut. Each block starts arriving a little
     * before its range opens and is still leaving a little after it closes, so
     * at every boundary one is fading up while the other fades down — which is
     * what makes the story feel continuous instead of slide-based.
     */
    CHAPTERS.forEach((chapter, index) => {
      const element = chapterRefs.current[index];
      if (!element) return;

      const span = chapter.to - chapter.from;
      // `copyFrom` lets the opening chapter wait for the master headline to
      // clear the column it shares.
      const copyStart = chapter.copyFrom ?? chapter.from - CHAPTER_BLEED;
      const entering = smoothstep(copyStart, copyStart + span * 0.28, p);
      const leaving =
        index === CHAPTERS.length - 1
          ? 0
          : smoothstep(chapter.to - span * 0.14, chapter.to + CHAPTER_BLEED, p);

      element.style.opacity = (entering * (1 - leaving)).toFixed(3);
      // Rises in, rises away: a consistent direction of travel reads as pages
      // turning rather than as elements arriving from nowhere.
      element.style.transform = `translate3d(0, ${(
        (1 - entering) * 22 -
        leaving * 16
      ).toFixed(1)}px, 0)`;
    });

    /*
     * Service beats, each anchored to the moment its marker passes.
     *
     * A beat arrives while its sign is still ahead and holds until the next
     * one's sign is close, so the words are on screen through the encounter
     * rather than flashing as it goes by. The pass point is derived from the
     * marker's world position, so moving a sign moves its copy with it and the
     * two can never drift apart.
     */
    SERVICE_GROUPS.forEach((group, index) => {
      const element = beatRefs.current[index];
      if (!element) return;
      const pass = passProgress(group.worldZ);
      const next = SERVICE_GROUPS[index + 1];
      const until = next ? passProgress(next.worldZ) : pass + 0.06;

      const entering = smoothstep(pass - 0.055, pass - 0.012, p);
      const leaving = smoothstep(until - 0.03, until + 0.012, p);
      element.style.opacity = (entering * (1 - leaving)).toFixed(3);
      element.style.transform = `translate3d(0, ${(
        (1 - entering) * 14 -
        leaving * 10
      ).toFixed(1)}px, 0)`;
    });

    /*
     * Results accumulate rather than replace: each figure arrives as its post
     * passes and then stays, so by the end of the chapter all four are on
     * screen together and read as one set of outcomes instead of four
     * unrelated numbers seen one at a time.
     */
    METRICS.forEach((metric, index) => {
      const element = resultRefs.current[index];
      if (!element) return;
      const pass = passProgress(metric.worldZ);
      const arriving = smoothstep(pass - 0.045, pass - 0.005, p);
      // They leave together, with the chapter.
      const leaving = smoothstep(0.93, 0.97, p);
      element.style.opacity = (arriving * (1 - leaving)).toFixed(3);
      element.style.transform = `translate3d(0, ${((1 - arriving) * 12).toFixed(1)}px, 0)`;
    });
    if (qualifierRef.current) {
      // The qualifier follows the last figure: the numbers mean nothing without it.
      const arriving = smoothstep(passProgress(METRICS[METRICS.length - 1].worldZ), 0.92, p);
      qualifierRef.current.style.opacity = (arriving * (1 - smoothstep(0.93, 0.97, p)) * 0.75).toFixed(3);
    }

    /*
     * The closing restatement. The journey has just demonstrated what the
     * opening claimed, so the phrase returns once, small, as a conclusion.
     */
    if (closingRef.current) {
      const arriving = smoothstep(MASTER_HEADLINE.closingIn.from, MASTER_HEADLINE.closingIn.to, p);
      closingRef.current.style.opacity = (arriving * 0.62).toFixed(3);
      closingRef.current.style.transform = `translate3d(0, ${((1 - arriving) * 12).toFixed(1)}px, 0)`;
    }

    /*
     * The indicator counts the four numbered chapters and stays out of the way
     * during the opening, which is the premise rather than a step. Adapting it
     * this way keeps the four-position design the composition already has.
     */
    const active = chapterAt(p);
    if (indicatorRef.current) {
      indicatorRef.current.style.opacity = smoothstep(
        CHAPTERS[1].from - 0.04,
        CHAPTERS[1].from + 0.03,
        p,
      ).toFixed(3);
    }
    if (chapterFillRef.current) {
      // Scaled, not resized: scaleX costs nothing, animating width forces layout.
      const numbered = Math.max(0, (p - CHAPTERS[1].from) / (1 - CHAPTERS[1].from));
      chapterFillRef.current.style.transform = `scaleX(${numbered.toFixed(4)})`;
    }
    // textContent invalidates layout, so it is written only when it changes.
    if (chapterLabelRef.current && active.index !== null) {
      const label = `0${active.index}`;
      if (chapterLabelRef.current.textContent !== label) {
        chapterLabelRef.current.textContent = label;
      }
    }
    if (chapterNameRef.current && chapterNameRef.current.textContent !== active.label) {
      chapterNameRef.current.textContent = active.label;
    }

    if (scrollFillRef.current) {
      scrollFillRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
    }
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = (1 - smoothstep(0.03, 0.12, p)).toFixed(3);
    }
  });

  return (
    <div className={styles.overlay}>
      {/* One column, with the master headline and every chapter stacked in it. */}
      <div className={styles.copyStack}>
        <div ref={masterRef} className={styles.copy}>
          <p className={styles.eyebrow}>{CHAPTERS[0].eyebrow}</p>
          <h2 className={styles.headline}>
            {MASTER_HEADLINE.lines.map((line, index) => (
              <React.Fragment key={line}>
                {index > 0 && <br />}
                {renderLine(line, MASTER_HEADLINE.emphasis)}
              </React.Fragment>
            ))}
          </h2>
          <div className={styles.rule} />
          <p className={styles.support}>
            {OPENING.supportLines.map((line, index) => (
              <React.Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </p>
          <p className={styles.cue}>{OPENING.cue}</p>
        </div>

        {CHAPTERS.map((chapter, index) => (
          <div
            key={chapter.id}
            ref={(node) => {
              chapterRefs.current[index] = node;
            }}
            className={styles.copy}
            style={{ opacity: 0 }}
          >
            <p className={styles.eyebrow}>{chapter.eyebrow}</p>
            <h2 className={styles.chapterHeadline}>
              {chapter.headlineLines.map((line, lineIndex) => (
                <React.Fragment key={line}>
                  {lineIndex > 0 && <br />}
                  {renderLine(line, chapter.emphasis)}
                </React.Fragment>
              ))}
            </h2>
            {chapter.supportLines.length > 0 && (
              <>
                <div className={styles.rule} />
                <p className={styles.support}>
                  {chapter.supportLines.map((line, lineIndex) => (
                    <React.Fragment key={line}>
                      {lineIndex > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              </>
            )}
            {chapter.id === "opportunity" && (
              <p ref={closingRef} className={styles.closing} style={{ opacity: 0 }}>
                {MASTER_HEADLINE.closing}
              </p>
            )}
          </div>
        ))}
      </div>

      {/*
        * Service and result beats.
        *
        * Each is tied to the moment its roadside marker passes the camera, not
        * to an arbitrary slice of the chapter — so the words land exactly as
        * the thing they describe goes by. That coupling is what stops these
        * reading as a list that happens to be animated.
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
            <p className={styles.beatLine}>{group.line}</p>
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

      <div ref={indicatorRef} className={styles.chapters} style={{ opacity: 0 }} aria-hidden="true">
        <span ref={chapterLabelRef} className={styles.chapterCurrent}>
          01
        </span>
        <span ref={chapterNameRef} className={styles.chapterName}>
          {CHAPTERS[1].label}
        </span>
        <span className={styles.chapterTrack}>
          <span ref={chapterFillRef} className={styles.chapterFill} />
        </span>
        <span>0{NUMBERED_CHAPTERS}</span>
      </div>

      <div ref={scrollHintRef} className={styles.scrollHint} aria-hidden="true">
        <span className={styles.scrollLabel}>Scroll to explore</span>
        <span className={styles.scrollTrack}>
          <span ref={scrollFillRef} className={styles.scrollFill} />
        </span>
      </div>
    </div>
  );
};

export default JourneyOverlay;
