"use client";

import React, { useRef } from "react";
import styles from "./Journey2D.module.css";
import { smoothstep, type StageMetrics } from "./journeySideView";
import { LAMP_SPACING } from "./JourneyRoad";
import { TRUCK_ASSET, TRUCK_UNITS, type TruckAsset } from "./journeyTruckAsset";
import { useJourneyFrame } from "./journeyScroll";

/**
 * The truck, in profile, facing right.
 *
 * Drawn in its own coordinate space — 100 units long, origin at the road
 * contact line — and placed by a single transform. That separation is what
 * lets the scroll system decide where it goes without the illustration
 * knowing anything about world units or parallax.
 *
 * The body is either the built-in vector or a supplied image — see
 * journeyTruckAsset.ts for the swap and the spec. Everything around it is a
 * separate layer either way: the suspension bob, the contact shadow, the wet
 * road reflection, the headlight wash and the rear-lamp glow all belong to the
 * scene rather than to the artwork, so a photographic truck inherits them
 * without the image needing any of it baked in.
 *
 * LIGHTING IS SPLIT IN TWO, and the split is deliberate. Light that is the
 * same everywhere along the route — cool sky on the upward faces, warm bounce
 * off the carriageway on the underside — is baked into the asset, where it is
 * exact about the silhouette and free at runtime. Light that depends on where
 * the truck is cannot be baked without freezing one moment of the journey
 * into all of it, so the warm wash from the road lamps is drawn here, keyed
 * off the same LAMP_SPACING the road places its lamps on. That one is masked
 * to the truck's own alpha, because light that spills past the silhouette is
 * exactly the halo the composition must not have.
 */

/** The illustration's own width. Everything below is in these units. */
const ART_W = 100;
const ART_H = 46;

/** Where the wheels sit, in art units from the left. */
const WHEELS = [19, 30, 68, 79];
const WHEEL_R = 7.2;

/**
 * The supplied image, drawn into the same art space as the vector.
 *
 * Mapped so the artwork's tyre contact line lands on y = 0 and its length
 * spans ART_W — which means everything positioned around the truck (shadow,
 * reflection, headlight wash) keeps working against a photograph exactly as it
 * did against the drawing, with no per-asset tuning.
 */
const AssetBody: React.FC<{
  asset: TruckAsset;
  wheelRefs: React.RefObject<(SVGGElement | null)[]>;
  lampWashRef: React.RefObject<SVGGElement | null>;
}> = ({ asset, wheelRefs, lampWashRef }) => {
  const imageH = ART_W / asset.aspect;
  // `contact` says where the tyres sit in the image; shifting by it puts that
  // line on the art space's ground.
  const top = -imageH * asset.contact;

  return (
    <>
      <image
        href={asset.body}
        x="0"
        y={top}
        width={ART_W}
        height={imageH}
        preserveAspectRatio="xMidYMid meet"
        /*
         * The flip mirrors about the art space's own centre, so the truck
         * keeps its position and only changes which way it points. Applied to
         * the image alone — the branding below must not be mirrored, or the
         * wordmark reads backwards.
         */
        transform={asset.flip ? `translate(${ART_W} 0) scale(-1 1)` : undefined}
      />

      {/*
       * Branding, drawn over the clean plate the artwork leaves. Type stays
       * vector, so it is crisp at any size and can change without re-rendering
       * the truck — which is exactly why the image is asked to leave the flank
       * empty rather than carry the mark itself.
       *
       * Drawn to read as printed rather than laid on top, which is three
       * things and not one. It takes the same vertical light ramp as the body,
       * so the top of the wordmark is sky-lit and the bottom falls away. Its
       * value is set against the flank rather than absolutely — white vinyl
       * has a few times the albedo of graphite paint but is lit by the same
       * dusk, so it lands near luma 170 against the flank's 85, where flat
       * #f4f7fb sat at 246 and floated. And it is fractionally transparent, so
       * the panel seams and highlights under it modulate through, which is the
       * detail that actually sells ink on metal.
       */}
      {/*
       * Branding matching the reference screenshot:
       * 1. Circular Gold MD Crest (radial compass notches + serif MD)
       * 2. "Mining Discovery" gold serif wordmark
       * 3. Gold frame rule with "PEOPLE · STORIES · OPPORTUNITIES"
       */}
      <g opacity="0.95">
        {/* Circular Gold MD Emblem */}
        <g transform="translate(24 -12.5)">
          {/* Outer circle */}
          <circle cx="0" cy="0" r="4.3" fill="none" stroke="url(#journey-gold-linear)" strokeWidth="0.32" />
          {/* Subtle dark background fill */}
          <circle cx="0" cy="0" r="4.1" fill="#0c1017" opacity="0.6" />
          {/* Radial compass tick marks */}
          <circle cx="0" cy="0" r="3.7" fill="none" stroke="url(#journey-gold-foil)" strokeWidth="0.3" strokeDasharray="0.35 0.55" opacity="0.75" />
          {/* Inner ring */}
          <circle cx="0" cy="0" r="3.2" fill="none" stroke="url(#journey-gold-linear)" strokeWidth="0.22" />
          {/* Center MD Monogram */}
          <text
            x="0"
            y="1.05"
            textAnchor="middle"
            fill="url(#journey-gold-foil)"
            fontFamily="var(--font-display-custom), 'Playfair Display', Georgia, serif"
            fontSize="2.9"
            fontWeight="700"
            letterSpacing="-0.02em"
          >
            MD
          </text>
        </g>

        {/* Wordmark: "Mining Discovery" */}
        <g transform="translate(30.6 -12.5)">
          <text
            x="0"
            y="-0.8"
            fill="url(#journey-gold-linear)"
            fontFamily="var(--font-display-custom), 'Playfair Display', Georgia, serif"
            fontSize="3.1"
            fontWeight="600"
            letterSpacing="0.02em"
          >
            Mining
          </text>
          <text
            x="0"
            y="2.6"
            fill="url(#journey-gold-linear)"
            fontFamily="var(--font-display-custom), 'Playfair Display', Georgia, serif"
            fontSize="3.1"
            fontWeight="600"
            letterSpacing="0.02em"
          >
            Discovery
          </text>
        </g>

        {/* Slogan banner: PEOPLE · STORIES · OPPORTUNITIES with gold rules */}
        <g transform="translate(0 0)">
          <line x1="12" y1="-7.8" x2="56" y2="-7.8" stroke="url(#journey-gold-linear)" strokeWidth="0.2" opacity="0.7" />
          <text
            x="34"
            y="-6.5"
            textAnchor="middle"
            fill="url(#journey-gold-foil)"
            fontFamily="var(--font-mono-custom), ui-monospace, monospace"
            fontSize="1.0"
            letterSpacing="0.28em"
            fontWeight="500"
            opacity="0.9"
          >
            PEOPLE   STORIES   OPPORTUNITIES
          </text>
          <line x1="12" y1="-5.6" x2="56" y2="-5.6" stroke="url(#journey-gold-linear)" strokeWidth="0.2" opacity="0.7" />
        </g>
      </g>

      {/* Red LED Tail Light on trailer rear */}
      <g>
        <rect x="0.8" y="-7.8" width="1.2" height="2.4" rx="0.3" fill="#ff2020" />
        <circle cx="1.4" cy="-6.6" r="3.2" fill="url(#journey-tail-light-glow)" opacity="0.9" />
        <ellipse cx="1.4" cy="0.3" rx="3.8" ry="0.6" fill="url(#journey-tail-light-glow)" opacity="0.4" />
      </g>

      {/* Amber Side Marker LEDs along trailer skirt */}
      <g>
        {[10, 21, 32, 43, 54, 65].map((mx) => (
          <g key={mx}>
            <circle cx={mx} cy="-4.3" r="0.3" fill="#ffb74d" />
            <circle cx={mx} cy="-4.3" r="1.1" fill="url(#journey-amber-marker)" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* Front Cab Headlight Cluster & Flare */}
      <g>
        {/* Main projector bulb */}
        <circle cx="97.2" cy="-7.2" r="0.8" fill="#fffdf2" />
        {/* Amber turn/marker signal */}
        <circle cx="96.5" cy="-8.5" r="0.4" fill="#ffb300" />
        {/* Headlight volumetric flare */}
        <circle cx="97.4" cy="-7.2" r="4.2" fill="url(#journey-headlight-flare)" opacity="0.95" />
      </g>

      {/*
       * The road lamps, falling on the truck as it passes under them.
       *
       * Masked to the body's own alpha so the light stops exactly where the
       * vehicle does. Warm and strongest along the roof, because the lamps are
       * overhead and their arms reach in over the carriageway. Opacity is the
       * only thing that animates, which keeps this on the compositor; the
       * group sits inside the body so it rides the suspension bob with the
       * metal rather than sliding against it.
       */}
      <g ref={lampWashRef} mask="url(#journey-truck-silhouette)" opacity="0.04">
        <rect
          x="0"
          y={top}
          width={ART_W}
          height={imageH}
          fill="url(#journey-truck-lamp)"
        />
      </g>

      {/*
       * Wheels, only when supplied separately. A single flat image cannot have
       * turning wheels, so this is opt-in rather than faked — overlaying
       * synthetic rims on a photographed truck looks worse than wheels that
       * simply do not spin at this size.
       */}
      {asset.wheelImage &&
        asset.wheels?.map((wheel, index) => {
          const d = ART_W * wheel.d;
          return (
            <g
              key={index}
              transform={`translate(${ART_W * wheel.x} ${top + imageH * wheel.y})`}
            >
              <g
                ref={(node) => {
                  wheelRefs.current[index] = node;
                }}
              >
                <image href={asset.wheelImage} x={-d / 2} y={-d / 2} width={d} height={d} />
              </g>
            </g>
          );
        })}
    </>
  );
};

/**
 * Height of whichever body is in use, in art units.
 *
 * The shadow, the reflection and the headlight wash were all proportioned
 * against the vector's 46-unit height. A photographed tractor-trailer is 4.7:1
 * rather than 2.2:1, so in the same 100-unit length it stands about 21 units
 * tall — less than half. Keying the effects off this rather than a constant is
 * what keeps the shadow from ballooning to twice the truck's own height.
 */
const BODY_H = TRUCK_ASSET ? ART_W / TRUCK_ASSET.aspect : ART_H;

/**
 * The truck's width in plan, in art units.
 *
 * A tractor-trailer is about 2.55m wide against the 16.5m that ART_W stands
 * for, which is where 15.5 comes from. It is the depth the roof occupies when
 * the camera is looking straight down, and getting it from the real ratio
 * rather than by eye is what stops the plan view reading as a barge.
 */
const PLAN_DEPTH = 15.5;

/**
 * The truck's roof, as real geometry rather than a second picture of a truck.
 *
 * WHY THIS EXISTS AT ALL: the truck asset is a side-profile photograph, and a
 * side-profile photograph has no roof in it. The descent asks to come down on
 * the vehicle from above and see its top, and no amount of camera work
 * conjures pixels that were never photographed. The previous attempt at this
 * transition solved it by drawing a whole second truck with a roof and
 * crossfading — which is where the two trucks came from. This is the same
 * problem answered the other way: one truck that has a second *face*, the way
 * any solid object does, rigidly attached to the same origin and revealed by
 * the same camera.
 *
 * HOW IT IS REVEALED, and this is the important part: it is not faded in. The
 * stage is tilted by rotateX, so everything drawn in it is foreshortened
 * vertically by cos(pitch). A surface lying flat on the ground should appear
 * PLAN_DEPTH * sin(pitch) deep, so it has to be drawn PLAN_DEPTH * tan(pitch)
 * tall to come out that way. At side view tan(0) is 0 and the roof has no
 * height at all — it vanishes edge-on because it genuinely is edge-on, which
 * is exactly what the roof of a truck does when you stand beside it. Opacity
 * is never touched.
 *
 * Drawn in a fixed plan rectangle ART_W x PLAN_DEPTH and scaled per frame, so
 * the markup is static and only a transform changes.
 */
const TruckRoof: React.FC<{ roofRef: React.RefObject<SVGGElement | null> }> = ({ roofRef }) => (
  // Starts collapsed: at side view there is no roof to see, and that is also
  // the state it must be in before the first frame runs.
  <g ref={roofRef} style={{ transform: `translate(0px, ${-BODY_H}px) scale(1, 0)` }}>
    {/* Trailer roof panel. Its far edge is darker: at this hour the sky is
        brightest toward the horizon the camera is tilted away from. */}
    <rect x="1.5" y={-PLAN_DEPTH} width="63" height={PLAN_DEPTH} fill="url(#journey-roof-panel)" />
    {/* Structural ribs, the detail that makes a plan view read as a trailer
        rather than as a grey rectangle. */}
    {Array.from({ length: 12 }).map((_, i) => (
      <rect
        key={i}
        x={5 + i * 5}
        y={-PLAN_DEPTH + 0.6}
        width="0.55"
        height={PLAN_DEPTH - 1.2}
        fill="#8a99b3"
        opacity="0.28"
      />
    ))}
    {/* Trailer edge rails, catching the sky along both flanks. */}
    <rect x="1.5" y={-PLAN_DEPTH} width="63" height="0.7" fill="#93a4bd" opacity="0.5" />
    <rect x="1.5" y="-0.7" width="63" height="0.7" fill="#93a4bd" opacity="0.38" />

    {/* The gap over the fifth wheel, where the trailer ends and the cab
        begins — a real break in the roofline and a useful read of length. */}
    <rect x="64.5" y={-PLAN_DEPTH * 0.82} width="4" height={PLAN_DEPTH * 0.64} fill="#131b29" opacity="0.7" />
    {/* Exhaust stack, seen end-on from above. */}
    <circle cx="66.5" cy={-PLAN_DEPTH * 0.76} r="0.85" fill="#6f7f96" />

    {/* Cab roof and its aerodynamic fairing, narrowing to the nose. */}
    <path
      d={`M 69 ${-PLAN_DEPTH * 0.94} L 88 ${-PLAN_DEPTH * 0.94} Q 94 ${-PLAN_DEPTH * 0.94} 95.5 ${-PLAN_DEPTH * 0.72} L 95.5 ${-PLAN_DEPTH * 0.28} Q 94 ${-PLAN_DEPTH * 0.06} 88 ${-PLAN_DEPTH * 0.06} L 69 ${-PLAN_DEPTH * 0.06} Z`}
      fill="url(#journey-roof-cab)"
    />
    {/* Windscreen, raked away under the fairing's leading edge. */}
    <path
      d={`M 95.8 ${-PLAN_DEPTH * 0.66} Q 98.6 ${-PLAN_DEPTH * 0.5} 95.8 ${-PLAN_DEPTH * 0.34} Z`}
      fill="#0c1726"
      opacity="0.85"
    />
    {/* Amber clearance lamps across the front of the fairing. */}
    {[0.36, 0.5, 0.64].map((f) => (
      <circle key={f} cx="93.4" cy={-PLAN_DEPTH * f} r="0.5" fill="#ffb703" opacity="0.9" />
    ))}
  </g>
);

export const JourneyTruck: React.FC<{ metrics: StageMetrics }> = ({ metrics }) => {
  const groupRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const wheelCount = TRUCK_ASSET ? (TRUCK_ASSET.wheels?.length ?? 0) : WHEELS.length;
  const wheelRefs = useRef<(SVGGElement | null)[]>(Array.from({ length: wheelCount }, () => null));
  const lampRef = useRef<SVGGElement>(null);
  const lampWashRef = useRef<SVGGElement>(null);
  const roofRef = useRef<SVGGElement>(null);
  const beamRef = useRef<SVGEllipseElement>(null);
  const flankShadeRef = useRef<SVGGElement>(null);
  const reflectionRef = useRef<SVGGElement>(null);
  const groundShadowRef = useRef<SVGGElement>(null);

  useJourneyFrame((scene) => {
    const group = groupRef.current;
    if (!group) return;
    const m = scene.metrics;

    // Scale so the truck is TRUCK_UNITS long on the road plane.
    const scale = (TRUCK_UNITS * m.pxPerUnit) / ART_W;
    // Sits on the carriageway, a little forward of its centre line so the
    // wheels meet road rather than the band's far edge.
    const y = m.roadFarY + (m.roadNearY - m.roadFarY) * 0.66;

    group.style.transform =
      `translate3d(${(scene.truckScreenX - TRUCK_UNITS * m.pxPerUnit * 0.5).toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
      `scale(${scale.toFixed(4)})`;

    /*
     * Suspension. A small vertical bob and an even smaller pitch, both driven
     * by time rather than progress so the vehicle is never completely dead
     * when the page is still. Fractions of an art unit — enough to suggest
     * springs, not enough to read as floating.
     */
    if (bodyRef.current) {
      const bob = Math.sin(scene.time * 2.3) * 0.5 + Math.sin(scene.time * 3.7) * 0.22;
      const pitch = Math.sin(scene.time * 1.9) * 0.22;
      bodyRef.current.style.transform = `translate(0px, ${bob.toFixed(2)}px) rotate(${pitch.toFixed(2)}deg)`;
    }

    /*
     * Wheels roll at the rate the truck actually travels: progress delta over
     * the journey's length, divided by the rolling radius. Integrated from
     * real displacement rather than a timer, so they stop when scrolling
     * stops, reverse when it reverses, and never slip.
     */
    // World units travelled, converted to art units, over the rolling radius.
    const artUnitsTravelled = (scene.truckWorldX / TRUCK_UNITS) * ART_W;
    const angle = (artUnitsTravelled / WHEEL_R) * (180 / Math.PI);
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    });

    // Rear lamps breathe fractionally, as LED clusters do under load. A
    // supplied image carries its own lamps, so this only drives the vector.
    if (lampRef.current) {
      lampRef.current.style.opacity = (0.8 + Math.sin(scene.time * 1.4) * 0.1).toFixed(3);
    }
    /*
     * Warm wash from the road lamps, peaking as the truck passes under each
     * one and falling away between them.
     *
     * Distance to the *nearest* lamp, not to a particular one: lamps stand
     * every LAMP_SPACING units, so rounding the truck's position to the
     * nearest multiple finds whichever it is currently closest to, and the
     * distance can never exceed half a span. That makes the wash periodic in
     * step with the lamps the road actually draws, which is the whole reason
     * the spacing is imported rather than copied.
     *
     * It never reaches zero. A truck between lamps at dusk is still lit by
     * the sky and by the pools ahead and behind; taking the warmth to nothing
     * would make the metal go dead and cold halfway through every span.
     */
    if (lampWashRef.current) {
      const nearest = Math.round(scene.truckWorldX / LAMP_SPACING) * LAMP_SPACING;
      const wash = 1 - smoothstep(4, LAMP_SPACING * 0.55, Math.abs(scene.truckWorldX - nearest));
      lampWashRef.current.style.opacity = (0.04 + wash * 0.24).toFixed(3);
    }

    /*
     * The roof, opened out by the camera's own tilt.
     *
     * tan(pitch) is the exact compensation for the foreshortening the stage's
     * rotateX applies, so the roof always comes out the right plan depth for
     * wherever the camera is. It needs no reveal of its own and no opacity:
     * at side view tan(0) is 0, the roof has zero height, and it is gone
     * because it is edge-on — which is what a roof is when you stand beside a
     * truck. The clamp is only a guard against a pitch close enough to 90 for
     * the tangent to run away.
     */
    const pitchRad = (scene.pitch * Math.PI) / 180;
    /*
     * The two numbers every face of the truck is lit and sized by.
     *
     * `overhead` is how much the camera is above the vehicle and `sideOn` how
     * much it is beside it — sin and cos of the same angle, so they are never
     * independently tuned and never disagree. At the descent's 78 degrees
     * they are 0.98 and 0.21; at the Journey's own side elevation, 0 and 1.
     */
    const overhead = Math.max(0, Math.sin(pitchRad));
    const sideOn = Math.max(0, Math.cos(pitchRad));

    if (roofRef.current) {
      const open = Math.min(6, Math.tan(pitchRad));
      roofRef.current.style.transform =
        `translate(0px, ${(-BODY_H).toFixed(2)}px) scale(1, ${Math.max(0, open).toFixed(4)})`;
    }

    /*
     * The flank, turned away from the camera.
     *
     * THIS IS WHAT THE SECOND TRUCK WAS. The body is a side-profile
     * photograph, and the stage's rotateX squashes it to 21% of its height at
     * the overhead pitch — but a photograph squashed to a fifth is still a
     * photograph of a whole truck, legible right down to the wheels and the
     * windscreen. So the descent showed a grey plan-view truck with a
     * full-colour side-view truck lying underneath it, and that pair is what
     * reads as two vehicles. Geometry alone could never have fixed it: 4.4
     * art units of truck is the correct projected height, and it is correct
     * *and* wrong-looking at the same time.
     *
     * Light fixes it, because light is what was missing. A flank is a
     * vertical surface: with the camera overhead it faces the horizon, sees
     * almost none of the sky, and goes dark — which is exactly what the side
     * of any solid object does when you stand over it. Shading it by the same
     * sine that opens the roof turns the pair into one box with a lit top and
     * a dark side, and the dark side then reads as the truck's own edge
     * rather than as a second vehicle.
     *
     * Nothing is faded in or out: both faces are drawn at every angle, the
     * way both faces of a solid exist at every angle. Only how much light
     * each one catches changes, and it changes with the camera because that
     * is the only thing that is moving.
     */
    if (flankShadeRef.current) {
      flankShadeRef.current.style.opacity = (0.94 * overhead ** 1.5).toFixed(3);
    }

    /*
     * The wet-road reflection is a side-elevation phenomenon and nothing
     * else. It is the flank mirrored in the carriageway, so it can only be
     * seen from where the flank can — stand over the truck and the road
     * beside it shows you nothing. Left running through the descent it was a
     * third truck-shaped object under the other two.
     */
    if (reflectionRef.current) {
      reflectionRef.current.style.opacity = (0.5 * sideOn ** 1.2).toFixed(3);
    }

    /*
     * The contact shadow lies flat on the road, so it takes the same
     * foreshortening the roof does — but unlike the roof it must survive at
     * side view, where the brief's existing composition draws it as a soft
     * ellipse under the wheels rather than as the edge-on nothing strict
     * geometry would give. Opening it part of the way keeps the truck
     * grounded from above without touching how it looks from beside: at
     * pitch 0 this is exactly 1, which is the scene as it already ships.
     */
    if (groundShadowRef.current) {
      const spread = 1 + Math.min(6, Math.tan(pitchRad)) * 0.55;
      groundShadowRef.current.style.transform = `scale(1, ${spread.toFixed(3)})`;
    }

    // Headlight wash on the road ahead, stronger in the darker second half.
    if (beamRef.current) {
      beamRef.current.style.opacity = (0.22 + Math.min(0.2, scene.progress * 0.28)).toFixed(3);
    }
  });

  return (
    <svg
      className={`${styles.layer} ${styles.svgLayer}`}
      viewBox={`0 0 ${metrics.width} ${metrics.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="journey-truck-trailer" x1="0" y1="0" x2="0" y2="1">
          {/* Lit from the sky above, falling into shadow at the skirt. */}
          <stop offset="0%" stopColor="#e9eef6" />
          <stop offset="46%" stopColor="#aab6c8" />
          <stop offset="100%" stopColor="#4d5a6e" />
        </linearGradient>
        <linearGradient id="journey-truck-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfe6f0" />
          <stop offset="55%" stopColor="#93a1b6" />
          <stop offset="100%" stopColor="#414d60" />
        </linearGradient>
        <radialGradient id="journey-truck-shadow">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        {/*
         * The dark core directly beneath a tyre. Tighter and harder than the
         * body shadow above: an occluder touching the ground puts a small very
         * dark patch under itself and a broad soft one around itself, and it
         * is the small hard one that makes something look like it is standing
         * on a surface rather than hovering a little above it.
         */}
        <radialGradient id="journey-truck-contact">
          <stop offset="0%" stopColor="#04070c" stopOpacity="0.72" />
          <stop offset="55%" stopColor="#04070c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#04070c" stopOpacity="0" />
        </radialGradient>
        {/*
         * The lamp wash. Warm at the roof where the lamp arm reaches over the
         * carriageway, thinning down the flank, and barely present at the
         * skirt where the body shades itself.
         */}
        <linearGradient id="journey-truck-lamp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffce8c" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#ffbe78" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffaa64" stopOpacity="0.1" />
        </linearGradient>
        {/* The livery's own light ramp — the body's, one step brighter. */}
        <linearGradient id="journey-truck-decal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9c8dc" />
          <stop offset="100%" stopColor="#7e90a9" />
        </linearGradient>
        <radialGradient id="journey-gold-foil" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FFF2D1" />
          <stop offset="30%" stopColor="#E5C378" />
          <stop offset="65%" stopColor="#C59E3F" />
          <stop offset="100%" stopColor="#96701B" />
        </radialGradient>
        <linearGradient id="journey-gold-linear" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C59E3F" />
          <stop offset="35%" stopColor="#FFF2D1" />
          <stop offset="65%" stopColor="#E5C378" />
          <stop offset="100%" stopColor="#B38728" />
        </linearGradient>
        <radialGradient id="journey-tail-light-glow">
          <stop offset="0%" stopColor="#FF3333" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#D50000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#900000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-amber-marker">
          <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#FF9800" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF9800" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-headlight-flare">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="25%" stopColor="#FFF2B2" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#FFCA28" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="journey-truck-beam" cx="15%" cy="50%" r="85%">
          <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.85" />
          <stop offset="25%" stopColor="#FFE082" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#FFCA28" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFA000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="journey-truck-reflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fa3bd" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8fa3bd" stopOpacity="0" />
        </linearGradient>
        {/*
         * The truck's own silhouette, as a mask for light falling on it.
         *
         * maskType alpha rather than the default luminance: the mask is a
         * photograph, and under luminance the truck's dark half — tyres,
         * skirt, glass — would reject the light instead of receiving it,
         * which is backwards. Alpha asks the only question that matters here,
         * which is whether a pixel is truck or is nothing.
         *
         * The flip is repeated verbatim from the body image. A mask that is
         * not mirrored the same way would clip the light to a truck facing
         * the other direction.
         */}
        {TRUCK_ASSET && (
          <mask
            id="journey-truck-silhouette"
            maskUnits="userSpaceOnUse"
            x="0"
            y={-BODY_H * TRUCK_ASSET.contact}
            width={ART_W}
            height={BODY_H}
            style={{ maskType: "alpha" }}
          >
            <image
              href={TRUCK_ASSET.body}
              x="0"
              y={-BODY_H * TRUCK_ASSET.contact}
              width={ART_W}
              height={BODY_H}
              preserveAspectRatio="xMidYMid meet"
              transform={TRUCK_ASSET.flip ? `translate(${ART_W} 0) scale(-1 1)` : undefined}
            />
          </mask>
        )}
        {/*
         * The roof's own light. It is the most sky-facing surface on the
         * vehicle, so it is the lightest thing on it — but keyed to the same
         * dusk as the graded flank (roof band luma 100, rgb 82/102/134)
         * rather than lit independently, or the truck would change material
         * as the camera came round.
         */}
        <linearGradient id="journey-roof-panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c5a74" />
          <stop offset="45%" stopColor="#687894" />
          <stop offset="100%" stopColor="#56657e" />
        </linearGradient>
        <linearGradient id="journey-roof-cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#54637e" />
          <stop offset="40%" stopColor="#76879f" />
          <stop offset="100%" stopColor="#5b6a83" />
        </linearGradient>
        {/*
         * The flank once the camera is over the truck: a vertical face that
         * has lost the sky and kept only what the carriageway bounces back at
         * it, which is a little warmth along the skirt and almost nothing
         * above. Not flat black — a face in shadow at dusk still reads as
         * metal, and killing it outright would leave a truck-shaped hole
         * under the roof instead of the truck's own dark side.
         */}
        <linearGradient id="journey-flank-turn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a111d" stopOpacity="0.97" />
          <stop offset="58%" stopColor="#0d1626" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#1b2537" stopOpacity="0.86" />
        </linearGradient>
      </defs>

      {/*
       * Art space: origin at road level under the truck's midpoint, +x toward
       * the front. The group transform does the placing and the scaling.
       */}
      <g ref={groupRef}>
        {/* Headlight beam wash on the road ahead with forward spread and asphalt sheen */}
        <g ref={beamRef} opacity="0.4">
          {/* Main forward illuminated road path */}
          <polygon
            points={`${ART_W - 2},-6.5 ${ART_W + 55},1.8 ${ART_W + 50},8.5 ${ART_W - 3},-4.5`}
            fill="url(#journey-truck-beam)"
            opacity="0.32"
          />
          {/* Intense core road pool right in front of the cab */}
          <ellipse cx={ART_W + 16} cy="0.8" rx={18} ry={3.2} fill="url(#journey-truck-beam)" opacity="0.65" />
          {/* Far reaching softer beam */}
          <ellipse cx={ART_W + 38} cy="1.2" rx={32} ry={4.5} fill="url(#journey-truck-beam)" opacity="0.3" />
        </g>

        {/*
         * Wet-road reflection: the body's silhouette, flipped, faded and
         * squashed. One transform and a gradient, and it is what stops the
         * truck reading as pasted onto the surface.
         *
         * Drawn under the shadows rather than over them, which is the order
         * the physics gives: where the truck blocks the light there is no
         * reflection either, so the contact patches have to occlude it.
         */}
        <g ref={reflectionRef} transform="translate(0 2) scale(1 -0.42)" opacity="0.5">
          {TRUCK_ASSET ? (
            /* A photographed truck reflects itself: the same image, flipped by
               the parent transform and faded, which matches the real body far
               better than a pair of stand-in rectangles could. */
            <image
              href={TRUCK_ASSET.body}
              x="0"
              y={-BODY_H * TRUCK_ASSET.contact}
              width={ART_W}
              height={BODY_H}
              preserveAspectRatio="xMidYMid meet"
              transform={TRUCK_ASSET.flip ? `translate(${ART_W} 0) scale(-1 1)` : undefined}
              opacity="0.45"
            />
          ) : (
            <>
              <rect x="2" y={-ART_H} width="58" height={ART_H - 9} rx="1.5" fill="url(#journey-truck-reflect)" />
              <rect x="62" y={-ART_H + 6} width="30" height={ART_H - 15} rx="2.5" fill="url(#journey-truck-reflect)" />
            </>
          )}
        </g>

        {/*
         * Grounding, in two parts, because an occluder resting on a surface
         * casts two different shadows at once and only drawing both reads as
         * contact. The broad soft one is the whole vehicle blocking the sky.
         * The tight dark ones are the tyres themselves, at the axle positions
         * measured off the cutout — under the rubber, where the light cannot
         * reach at all, rather than smeared under the middle of the trailer.
         *
         * Outside the body group on purpose: shadows stay put while the
         * suspension bobs. A contact shadow that rises and falls with the
         * spring is a shadow attached to the truck rather than to the road,
         * and it un-grounds the very thing it exists to ground.
         */}
        <g ref={groundShadowRef}>
          <ellipse cx={ART_W * 0.5} cy={BODY_H * 0.04} rx={ART_W * 0.54} ry={BODY_H * 0.24} fill="url(#journey-truck-shadow)" opacity="0.8" />
          {TRUCK_ASSET?.axles?.map((axle) => (
            <ellipse
              key={axle.x}
              cx={ART_W * axle.x}
              cy={BODY_H * 0.02}
              rx={ART_W * axle.halfWidth * 1.2}
              ry={BODY_H * 0.11}
              fill="url(#journey-truck-contact)"
            />
          ))}
        </g>

        <g ref={bodyRef} style={{ transformOrigin: `${ART_W * 0.5}px 0px` }}>
          {/*
           * The roof, drawn before the flank because it lies further from
           * camera — it extends back from the flank's top edge, so the flank
           * must paint over its near lip.
           */}
          <TruckRoof roofRef={roofRef} />
          {TRUCK_ASSET ? (
            <AssetBody asset={TRUCK_ASSET} wheelRefs={wheelRefs} lampWashRef={lampWashRef} />
          ) : (
            <BuiltInBody lampRef={lampRef} />
          )}
          {/*
           * The flank's own shadow, drawn last so it falls over everything on
           * that face — the photograph, the livery and the marker lamps alike,
           * because all of them are on a surface that has turned away from the
           * sky. Masked to the truck's silhouette, so the shade stops exactly
           * where the vehicle does and never spills onto the road beside it.
           *
           * Zero at side view, which is the composition that already ships: at
           * pitch 0 this element is present and completely transparent, so the
           * Journey proper is pixel-for-pixel what it was.
           */}
          <g
            ref={flankShadeRef}
            mask={TRUCK_ASSET ? "url(#journey-truck-silhouette)" : undefined}
            opacity="0"
          >
            <rect x="0" y={-BODY_H} width={ART_W} height={BODY_H} fill="url(#journey-flank-turn)" />
          </g>
        </g>

        {/*
         * Vector wheels only. A supplied image either carries its own wheels or
         * declares them separately, in which case AssetBody places them.
         */}
        {!TRUCK_ASSET && (
          <VectorWheels wheelRefs={wheelRefs} />
        )}
      </g>
    </svg>
  );
};

/** The built-in illustration's body. Unchanged; now one of two options. */
const BuiltInBody: React.FC<{ lampRef: React.RefObject<SVGGElement | null> }> = ({ lampRef }) => (
  <>
    {/* Trailer. */}
    <rect x="2" y={-ART_H} width="58" height={ART_H - 9} rx="1.5" fill="url(#journey-truck-trailer)" />
    {/* Panel seams, so the flank is not one flat field. */}
    {[14, 26, 38, 50].map((x) => (
      <rect key={x} x={x} y={-ART_H + 2} width="0.5" height={ART_H - 13} fill="#5f6d82" opacity="0.35" />
    ))}
    {/* The single gold livery stripe — the brand note, bound to an edge. */}
    <rect x="2" y={-ART_H * 0.44} width="58" height="1.6" fill="#b8860b" opacity="0.9" />
    {/* Roof lip and side skirt. */}
    <rect x="1" y={-ART_H - 1.4} width="60" height="1.8" rx="0.7" fill="#5f6d82" />
    <rect x="4" y="-9.6" width="54" height="3.4" fill="#8e9bb0" opacity="0.6" />

    {/* Rear lamp cluster, on the trailing edge. */}
    <g ref={lampRef}>
      <rect x="1.2" y="-15" width="2.6" height="5" rx="0.7" fill="#c33b28" />
      <rect x="1.4" y="-14.4" width="2.2" height="2" rx="0.5" fill="#ff6a4d" />
    </g>

    {/* Tractor unit: sleeper, cab and a raked windscreen. */}
    <rect x="62" y={-ART_H + 6} width="16" height={ART_H - 15} rx="2" fill="url(#journey-truck-cab)" />
    <path
      d={`M 78 ${-ART_H + 6} L 92 ${-ART_H + 13} L 92 -9 L 78 -9 Z`}
      fill="url(#journey-truck-cab)"
    />
    <path d={`M 79.5 ${-ART_H + 9} L 90.5 ${-ART_H + 14.5} L 90.5 -22 L 79.5 -22 Z`} fill="#0d1b2c" opacity="0.92" />
    {/* Mirror, exhaust and fuel tank: the details that say "tractor unit". */}
    <rect x="77" y={-ART_H + 12} width="1" height="5" fill="#2d3747" />
    <rect x="61" y={-ART_H + 1} width="1.6" height="9" rx="0.8" fill="#4b586c" />
    <rect x="63" y="-12" width="9" height="4.4" rx="2.2" fill="#6b7a91" />

    {/* Bumper and headlamp. */}
    <rect x="88" y="-9" width="5" height="4" rx="1" fill="#2b3648" />
    <rect x="89.5" y="-13.5" width="3.4" height="2.4" rx="0.8" fill="#ffeec8" />
  </>
);

/** The built-in wheels, rotated about their own centres outside the body's bob. */
const VectorWheels: React.FC<{ wheelRefs: React.RefObject<(SVGGElement | null)[]> }> = ({
  wheelRefs,
}) => (
  <>
    {WHEELS.map((x, index) => (
      <g key={x} transform={`translate(${x} ${-WHEEL_R})`}>
        <circle r={WHEEL_R} fill="#0a0e15" />
        <circle r={WHEEL_R * 0.52} fill="#39434f" />
        <g
          ref={(node) => {
            wheelRefs.current[index] = node;
          }}
        >
          {/* Four spokes: enough that the rotation is legible at size. */}
          {[0, 45, 90, 135].map((angle) => (
            <rect
              key={angle}
              x={-WHEEL_R * 0.48}
              y="-0.5"
              width={WHEEL_R * 0.96}
              height="1"
              fill="#6b7686"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
        <circle r={WHEEL_R * 0.14} fill="#8e9bb0" />
      </g>
    ))}
  </>
);

export default JourneyTruck;
