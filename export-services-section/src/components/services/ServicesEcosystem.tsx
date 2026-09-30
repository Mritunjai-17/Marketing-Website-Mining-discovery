"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { ChevronDown } from "lucide-react";
import {
  ABOUT_EASE,
  HIDDEN_RISE,
  HIDDEN_RULE_X,
  MaskedWords,
  revealBlocks,
  useAboutMotion,
} from "@/components/about/reveal";

/*
 * Step 3 — THE MINING MARKETING ECOSYSTEM.
 *
 * The argument the section has to make is that these services are one system rather than a
 * menu, so it is drawn as a hub with a downstream chain: brand, content, media and digital
 * surround the company, and the chain below carries the result out to audience, investors
 * and growth.
 *
 * HOW IT IS BUILT, and why not SVG. The brief suggests stroke-dasharray path drawing; this
 * uses scaled 1px elements instead, which is the "equivalent technique" it also allows. The
 * reason is coordinates: an SVG diagram needs its path endpoints to agree with wherever CSS
 * happened to put the nodes, at every breakpoint, which is exactly how these diagrams end up
 * with lines that miss their boxes on a screen size nobody tested. Here every connector is a
 * grid cell BETWEEN two node cells, so it is attached to them by layout and cannot drift. A
 * line scaling from 0 to 1 along its own axis is the same "being drawn" motion a dashoffset
 * gives, with none of the geometry to keep in sync.
 *
 * ONE SET OF NODES, TWO LAYOUTS. The nodes are declared once, in the logical reading order
 * the mobile flow wants, and CSS Grid places them into the desktop cross via explicit
 * col/row starts — grid placement is what lets visual order differ from DOM order, so the
 * phone is not being handed a shrunken desktop diagram and the content is not duplicated.
 * The connectors DO differ between the two (a hub has different edges than a chain), so
 * there are two sets of those, one per breakpoint. They carry no text and are aria-hidden,
 * so duplicating them costs nothing a reader or a screen reader can observe.
 *
 * CONTENT RULE: every node, label and sub-item below is from the brief. No statistics, no
 * outcomes, no clients, no claims about results.
 */

type NodeVariant = "core" | "node" | "outcome";

interface EcoNode {
  id: string;
  /** Which scroll stage brings this node online. Drives the gold accent, see `reached`. */
  stage: number;
  label: string;
  items: string[];
  variant: NodeVariant;
  /** Desktop grid placement. Ignored below lg, where the nodes stack in DOM order. */
  place: string;
}

/*
 * Declared in the mobile reading order — company, then the four around it, then the chain —
 * because that IS the DOM order, and the desktop cross is a placement on top of it.
 */
const NODES: EcoNode[] = [
  {
    id: "core",
    stage: 0,
    label: "Mining Company",
    items: [],
    variant: "core",
    place: "lg:col-start-3 lg:row-start-3",
  },
  {
    id: "brand",
    stage: 1,
    label: "Brand",
    items: ["Digital Branding", "Visual Identity"],
    variant: "node",
    place: "lg:col-start-3 lg:row-start-1",
  },
  {
    id: "content",
    stage: 1,
    label: "Content",
    items: ["Storytelling", "Industry Content"],
    variant: "node",
    place: "lg:col-start-1 lg:row-start-3 lg:justify-self-end",
  },
  {
    id: "media",
    stage: 1,
    label: "Media",
    items: ["PR", "Mining Discovery"],
    variant: "node",
    place: "lg:col-start-5 lg:row-start-3 lg:justify-self-start",
  },
  {
    id: "digital",
    stage: 1,
    label: "Digital",
    items: ["Web", "Social", "Paid Media"],
    variant: "node",
    place: "lg:col-start-3 lg:row-start-5",
  },
  {
    id: "audience",
    stage: 2,
    label: "Audience",
    items: ["Mining Professionals", "Industry Stakeholders"],
    variant: "node",
    place: "lg:col-start-3 lg:row-start-7",
  },
  {
    id: "investors",
    stage: 3,
    label: "Investors",
    items: ["Capital", "Market Visibility"],
    variant: "node",
    place: "lg:col-start-3 lg:row-start-9",
  },
  {
    id: "growth",
    stage: 4,
    label: "Growth",
    items: [],
    variant: "outcome",
    place: "lg:col-start-3 lg:row-start-11",
  },
];

const HEADING_LINES = ["The mining", "marketing", "ecosystem"];

/* ---------------------------------------------------------------------------------- *
 * Connectors.
 *
 * Every one is keyed by the node it LEADS TO (`data-eco-to`), which is what lets a single
 * per-node timeline find its own incoming line without knowing which layout is on screen —
 * the desktop and mobile connectors for a node share the same key, and only one of them is
 * ever displayed.
 *
 * The initial state is CSS, not JS, for the same reason it is everywhere else on these
 * pages: the server-rendered HTML paints before hydration, and a JS-only hidden state would
 * flash the finished diagram first. `transform` rather than Tailwind's scale utilities,
 * because GSAP writes `transform` and Tailwind v4's `scale-*` compiles to the separate
 * `scale` property — the two would compose instead of one replacing the other.
 * ---------------------------------------------------------------------------------- */

const LINE_BASE = "bg-[#B8860B]/45 motion-reduce:[transform:none]";

/** Vertical connector, drawn downward from the node above. */
const VLine: React.FC<{ to: string; className?: string }> = ({ to, className = "" }) => (
  <span
    data-eco-to={to}
    data-about-rule-y
    className={`block w-px origin-top [transform:scaleY(0)] ${LINE_BASE} ${className}`}
  />
);

/** A chain link: line plus the chevron that marks the direction of flow. */
const ChainLink: React.FC<{ to: string; className?: string }> = ({ to, className = "" }) => (
  <span aria-hidden="true" className={`flex flex-col items-center ${className}`}>
    <VLine to={to} className="flex-1" />
    <ChevronDown
      data-eco-arrow={to}
      className={`-mt-px h-3.5 w-3.5 shrink-0 text-[#B8860B] opacity-0 motion-reduce:opacity-100`}
    />
  </span>
);

export const ServicesEcosystem: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const diagramRef = useRef<HTMLDivElement | null>(null);

  /*
   * The furthest stage the reader has built. Monotonic on purpose: the ecosystem
   * progressively BUILDS, so a node that has come online never goes dark again — scrolling
   * back up shows the whole system, which is the point of the section.
   *
   * -1 means nothing has been driven yet: no JS, or a reader who asked for reduced motion.
   * In that state every node renders as reached, so the diagram is complete and readable
   * rather than an empty frame waiting for a scroll that will not animate anything.
   */
  const [reached, setReached] = useState(-1);

  useAboutMotion(sectionRef, () => {
    if (headerRef.current) revealBlocks(headerRef.current);

    const diagram = diagramRef.current;
    if (!diagram) return;

    /*
     * The lowest node placed so far. A node must never arrive before the one it logically
     * follows, and on the desktop cross BRAND sits ABOVE the core — so scrolling down would
     * reach it first and the system would assemble itself before the company it belongs to.
     * Anchoring such a node to the lowest one before it fixes the order, and because it is
     * decided from measured offsetTop it is self-correcting: on the phone, where DOM order
     * and visual order agree, every node simply anchors to itself.
     */
    let lowest: HTMLElement | null = null;

    NODES.forEach((node) => {
      const el = diagram.querySelector<HTMLElement>(`[data-eco-node="${node.id}"]`);
      if (!el) return;

      const anchor = !lowest || el.offsetTop >= lowest.offsetTop ? el : lowest;
      if (!lowest || anchor.offsetTop > lowest.offsetTop) lowest = anchor;

      /*
       * A beat before the four hub nodes, so the company is alone on screen first and the
       * system visibly forms AROUND it — content and media share the core's row and would
       * otherwise land on the same frame it does.
       */
      const lead = anchor !== el || node.stage === 1 ? 0.45 : 0;

      // Both layouts' connectors for this node. One of the two is display:none, and a tween
      // on a display:none element is simply not observable — cheaper than branching on a
      // breakpoint and re-branching on resize.
      const links = diagram.querySelectorAll<HTMLElement>(`[data-eco-to="${node.id}"]`);
      const arrows = diagram.querySelectorAll<HTMLElement>(`[data-eco-arrow="${node.id}"]`);

      /*
       * One timeline per node, triggered by that node's own arrival rather than one timeline
       * per stage. On the desktop cross the four hub nodes share a row and so arrive
       * together anyway; on the phone they are a column, and a stage-level trigger would
       * play three of the four to an empty screen.
       */
      const tl = gsap.timeline({
        defaults: { ease: ABOUT_EASE },
        scrollTrigger: { trigger: anchor, start: "top 85%", once: true },
      });

      // The line draws first and the node lands on the end of it: the connection is what
      // explains why the node belongs there, so it has to arrive first to mean anything.
      if (links.length) {
        tl.fromTo(
          links,
          { scaleX: 0, scaleY: 0 },
          { scaleX: 1, scaleY: 1, duration: 0.55, ease: "power2.out" },
          lead
        );
      }
      if (arrows.length) {
        tl.fromTo(arrows, { opacity: 0 }, { opacity: 1, duration: 0.3 }, lead + 0.45);
      }

      tl.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, lead + 0.32);

      /*
       * The stage advances when the node actually lands, not when its timeline starts. Those
       * are different moments once `lead` exists, and using the start would move the gold
       * onto a node that is still invisible.
       */
      tl.call(
        () => setReached((current) => Math.max(current, node.stage)),
        undefined,
        lead + 0.32
      );
    });
  });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-[#E5E4DE]"
    >
      {/*
        Contour lines, the geological texture the brief allows — five nested closed paths at
        4% opacity, scaled from one shape so they nest exactly the way a topographic map
        does. Inline SVG: no asset, no request, no dependency, and nothing to load.
      */}
      <svg
        aria-hidden="true"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-[0.04]"
      >
        <g fill="none" stroke="#0B1F3A" strokeWidth="1.5">
          {[1, 0.82, 0.64, 0.46, 0.28].map((scale) => (
            <path
              key={scale}
              transform={`translate(400 400) scale(${scale}) translate(-400 -400)`}
              d="M400 62C556 62 714 172 742 338C770 502 678 662 518 722C378 774 198 730 108 600C28 482 44 280 164 164C234 96 320 62 400 62Z"
            />
          ))}
        </g>
      </svg>

      <div className="container-editorial relative py-20 md:py-28">
        {/* --- Intro ---------------------------------------------------------- */}
        <div ref={headerRef}>
          <div data-about-rule-x className={`h-0.5 w-12 bg-[#B8860B] ${HIDDEN_RULE_X}`} />

          <h2 className="mt-8 text-balance font-geist text-[clamp(1.875rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[-0.03em] text-[#0B1F3A]">
            {HEADING_LINES.map((line) => (
              <span key={line} className="block">
                <MaskedWords text={line} />
              </span>
            ))}
          </h2>

          <p
            data-about-reveal
            className={`mt-8 max-w-[56ch] text-lg font-normal leading-relaxed text-[#3A3D42] sm:text-xl ${HIDDEN_RISE}`}
          >
            Every part of your story works together — from how you are positioned to how your
            message reaches the people who matter.
          </p>
        </div>

        {/* --- The diagram ------------------------------------------------------ */}
        {/*
          One grid, two shapes. Below lg it is a single column and the children sit in DOM
          order, which is the vertical flow the brief asks for on a phone. At lg the five
          columns open up and every node jumps to its own col/row, forming the cross with the
          chain hanging beneath it.

          The 1fr outer columns are what centre the whole figure: the fixed middle three come
          to 21rem, and whatever is left is split evenly either side, so the core stays on the
          container's centre line at every width from 1024 up.
        */}
        <div
          ref={diagramRef}
          className="mt-16 grid grid-cols-1 justify-items-center md:mt-20 lg:grid-cols-[minmax(0,1fr)_3rem_15rem_3rem_minmax(0,1fr)]"
        >
          {NODES.map((node, index) => {
            /*
             * Whether a node has been revealed is not React's business — the CSS initial
             * state hides it and its own ScrollTrigger brings it in, and once in it stays.
             * `reached` exists only to say which stage is the newest, so it is the one
             * wearing the gold. reached < 0 means nothing is driving it (no JS, or reduced
             * motion), and then every node reads as active rather than as inert.
             */
            const isActive = reached < 0 || node.stage === reached;
            const nextNode = NODES[index + 1];

            return (
              <React.Fragment key={node.id}>
                <div
                  data-eco-node={node.id}
                  data-about-reveal
                  className={`w-full max-w-[15rem] ${node.place} ${HIDDEN_RISE}`}
                >
                  <div
                    className={`rounded-xl border px-5 py-4 text-center transition-colors duration-700 sm:px-6 sm:py-5 ${
                      node.variant === "core"
                        ? `bg-[#0B1F3A] ${isActive ? "border-[#B8860B]" : "border-[#0B1F3A]"}`
                        : node.variant === "outcome"
                          ? `bg-[#FAF5E8] ${isActive ? "border-[#B8860B]" : "border-[#B8860B]/35"}`
                          : `bg-white ${
                              isActive ? "border-[#B8860B]/60" : "border-[#E5E4DE]"
                            } hover:border-[#B8860B]/40`
                    }`}
                  >
                    {/*
                      Colour carries the active accent, never opacity — GSAP writes an inline
                      opacity on the wrapper above when the node reveals, and a Tailwind
                      opacity class here would be fighting a value that has already won.
                    */}
                    <p
                      className={`font-geist font-bold uppercase tracking-[0.12em] transition-colors duration-700 ${
                        node.variant === "core"
                          ? `text-base sm:text-lg ${isActive ? "text-[#D4AF37]" : "text-white"}`
                          : node.variant === "outcome"
                            ? `text-base sm:text-lg ${isActive ? "text-[#B8860B]" : "text-[#0B1F3A]"}`
                            : `text-sm ${isActive ? "text-[#B8860B]" : "text-[#0B1F3A]"}`
                      }`}
                    >
                      {node.label}
                    </p>

                    {node.items.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {node.items.map((item) => (
                          <li key={item} className="text-xs text-[#57595E] sm:text-[13px]">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/*
                  MOBILE connector — one between each consecutive pair, making the single
                  chain the phone reads top to bottom. lg:hidden, so at desktop it is not
                  laid out at all and takes no grid slot.
                */}
                {nextNode && (
                  <span aria-hidden="true" className="flex h-10 flex-col items-center lg:hidden">
                    <VLine to={nextNode.id} className="flex-1" />
                    {nextNode.stage >= 2 && (
                      <ChevronDown
                        data-eco-arrow={nextNode.id}
                        className="-mt-px h-3.5 w-3.5 shrink-0 text-[#B8860B] opacity-0 motion-reduce:opacity-100"
                      />
                    )}
                  </span>
                )}
              </React.Fragment>
            );
          })}

          {/* --- DESKTOP connectors ------------------------------------------- */}
          {/*
            Seven of them, each sitting in the grid cell between the two nodes it joins, so
            their endpoints are decided by the same layout that positions the boxes. Hidden
            below lg, where the chain above is the diagram instead.

            The four hub lines are plain: brand, content, media and digital are what the
            company IS, and an arrowhead would claim a direction that is not being claimed.
            The three chain links carry chevrons, because that flow does have a direction.
          */}
          <span
            aria-hidden="true"
            className="hidden h-16 lg:col-start-3 lg:row-start-2 lg:flex lg:w-full lg:justify-center"
          >
            {/* origin-bottom: this one draws upward, out of the company toward the brand. */}
            <VLine to="brand" className="h-full origin-bottom" />
          </span>

          <span
            aria-hidden="true"
            className="hidden lg:col-start-2 lg:row-start-3 lg:flex lg:w-full lg:items-center"
          >
            <span
              data-eco-to="content"
              data-about-rule-x
              className={`block h-px w-full origin-right [transform:scaleX(0)] ${LINE_BASE}`}
            />
          </span>

          <span
            aria-hidden="true"
            className="hidden lg:col-start-4 lg:row-start-3 lg:flex lg:w-full lg:items-center"
          >
            <span
              data-eco-to="media"
              data-about-rule-x
              className={`block h-px w-full origin-left [transform:scaleX(0)] ${LINE_BASE}`}
            />
          </span>

          <span
            aria-hidden="true"
            className="hidden h-16 lg:col-start-3 lg:row-start-4 lg:flex lg:w-full lg:justify-center"
          >
            <VLine to="digital" className="h-full" />
          </span>

          <ChainLink to="audience" className="hidden h-20 lg:col-start-3 lg:row-start-6 lg:flex lg:w-full" />
          <ChainLink to="investors" className="hidden h-20 lg:col-start-3 lg:row-start-8 lg:flex lg:w-full" />
          <ChainLink to="growth" className="hidden h-20 lg:col-start-3 lg:row-start-10 lg:flex lg:w-full" />
        </div>
      </div>
    </section>
  );
};

export default ServicesEcosystem;
