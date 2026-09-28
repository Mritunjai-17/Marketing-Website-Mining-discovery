/**
 * GLSL for the hero globe.
 *
 * Two materials:
 *  - earth      : lit sphere with a soft day/night terminator, a warm band along that
 *                 terminator, ocean-only specular, cheap coastal relief derived from
 *                 the mask gradient, and limb darkening toward the silhouette.
 *  - atmosphere : slightly larger shell producing the limb haze. It uses normal
 *                 blending rather than additive, because the hero sits on a white
 *                 card where additive light would be invisible.
 *  - arc        : hairline great-circle connections between mining regions, hidden
 *                 analytically where the planet is in front of them.
 */

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vTangentWorld;
  varying vec3 vBitangentWorld;
  varying float vLatitudeCos;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;

    // Build the tangent frame here: modelMatrix is only available to the vertex
    // stage, and the transform is linear, so perturbing the interpolated world-space
    // frame in the fragment shader gives the same result as perturbing in object space.
    vec3 n = normalize(normal);
    vec3 t = normalize(cross(vec3(0.0, 1.0, 0.0), n) + vec3(1e-5, 0.0, 0.0)); // east
    vec3 b = cross(n, t);                                                     // north

    mat3 model = mat3(modelMatrix);
    vNormalWorld = normalize(model * n);
    vTangentWorld = normalize(model * t);
    vBitangentWorld = normalize(model * b);

    // Meridians converge toward the poles, so a fixed step in u spans less surface
    // there. Clamped so high latitudes do not turn the relief into noise.
    vLatitudeCos = max(sqrt(max(1.0 - n.y * n.y, 0.0)), 0.25);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uMaskMap;
  uniform vec2 uMaskTexel;
  uniform vec3 uSunDirection;
  uniform vec3 uHazeColor;
  uniform float uAmbient;
  uniform float uSunIntensity;
  uniform float uReliefStrength;
  uniform float uHazeStrength;
  uniform float uOpacity;
  uniform float uDesaturate;
  uniform float uSpecularStrength;
  uniform float uLimbDarkening;
  uniform vec3 uTerminatorColor;
  uniform float uTerminatorStrength;

  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vTangentWorld;
  varying vec3 vBitangentWorld;
  varying float vLatitudeCos;
  varying vec3 vWorldPosition;

  void main() {
    // --- Coastal / terrain relief -------------------------------------------------
    // Sample the mask around the fragment and rebuild a tangent-space gradient.
    // Tangent runs east, bitangent runs north, matching the equirectangular layout.
    float hL = texture2D(uMaskMap, vUv - vec2(uMaskTexel.x, 0.0)).r;
    float hR = texture2D(uMaskMap, vUv + vec2(uMaskTexel.x, 0.0)).r;
    float hD = texture2D(uMaskMap, vUv - vec2(0.0, uMaskTexel.y)).r;
    float hU = texture2D(uMaskMap, vUv + vec2(0.0, uMaskTexel.y)).r;

    vec3 N = normalize(
      normalize(vNormalWorld)
      - (
          ((hR - hL) / vLatitudeCos) * normalize(vTangentWorld)
          + (hU - hD) * normalize(vBitangentWorld)
        ) * uReliefStrength
    );

    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(uSunDirection);

    float mask = texture2D(uMaskMap, vUv).r;
    float land = smoothstep(0.04, 0.14, mask);

    // --- Day / night: disabled ------------------------------------------------------
    // Held at full day across the whole sphere, so the surface is evenly lit at every
    // rotation angle and no part of it is ever turned away from the light. This was
    // smoothstep(-0.25, 0.58, dot(N, L)) — the terminator, and the dark band that swept
    // the disc as the planet turned.
    //
    // Pinning it to 1.0 rather than deleting the term is deliberate: every downstream
    // effect reads this one value, so they all resolve correctly for free. The sunset
    // band is daylight * (1 - daylight), which is now exactly 0; the limb haze and the
    // ocean glint go to their full-day weighting. Nothing else has to be touched, and
    // restoring the terminator is a one-line change.
    float daylight = 1.0;

    vec3 albedo = texture2D(uDayMap, vUv).rgb;

    // Pull saturation down before lighting so the whole globe stays in the muted
    // green/brown/grey and blue-grey range the hero calls for.
    float luma = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    albedo = mix(albedo, vec3(luma), uDesaturate);

    vec3 color = albedo * (uAmbient + uSunIntensity * daylight);

    // --- Terminator warmth ----------------------------------------------------------
    // The sunset band this file's header has always described and which was never
    // actually here. Low sun travels a long slant through the atmosphere, the short
    // wavelengths scatter out of it, and the light that reaches the ground under it is
    // warm — so the strip of surface where the sun sits near the horizon is warmer than
    // either the day side or the night.
    //
    // daylight * (1 - daylight) IS that strip, for free. It is zero wherever the ramp
    // above has resolved to full day or full night and peaks at 0.25 in the middle of the
    // transition, so the warmth cannot leak onto the lit face or into the shadow, and it
    // tracks the terminator by construction — there is no second angle to keep in sync
    // with the sun as it drifts.
    //
    // This is the only warm note on the sphere, and it is deliberately ochre rather than
    // orange and additive at a few percent of the albedo: the section rules out anything
    // that reads as a glow, and the point is that the planet looks lit by a real sun, not
    // that anything on it looks bright. Placed BEFORE limb darkening so the band falls
    // away toward the silhouette with everything around it instead of surviving as a
    // bright edge where the rest of the surface has dimmed. Set uTerminatorStrength to 0
    // to remove it entirely.
    float sunset = daylight * (1.0 - daylight);
    color += uTerminatorColor * sunset * uTerminatorStrength;

    // --- Limb darkening -------------------------------------------------------------
    // A lit sphere loses brightness toward its silhouette, where the view grazes the
    // surface. Without it the disc stays uniformly bright to its edge and reads flat no
    // matter how strong the terminator is. Deliberately driven by the geometric normal
    // rather than the relief-perturbed one, so terrain cannot punch false dark patches
    // into the middle of the disc.
    float grazing = 1.0 - max(dot(normalize(vNormalWorld), V), 0.0);
    color *= mix(1.0, 1.0 - uLimbDarkening, grazing * grazing);

    // --- Ocean sheen ---------------------------------------------------------------
    // A sun glint on water is the other cue that sells curvature: it slides across the
    // ocean as the planet turns, which a flat map cannot do. Broadened (a tighter lobe
    // reads as a smudge at small viewport sizes) and brought up to where it is actually
    // visible instead of merely present.
    vec3 halfway = normalize(L + V);
    float specular = pow(max(dot(N, halfway), 0.0), 58.0) * (1.0 - land) * daylight;
    color += vec3(0.52, 0.64, 0.78) * specular * uSpecularStrength;

    // --- Limb haze on the sphere itself -------------------------------------------
    // Exponent raised 2.8 -> 5.0. At 2.8 the haze still carried 12% of its weight at
    // 0.85 of the disc radius and 3% at 0.7, which over a surface this dark is a broad
    // blue veil lying across most of the visible cap rather than a rim. At 5.0 the same
    // radii see 2.4% and 0.2%: the term collapses onto the last few percent of the
    // silhouette and is gone everywhere else, which is where an atmosphere actually is.
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
    color += uHazeColor * fresnel * (0.35 + 0.65 * daylight) * uHazeStrength;

    // The limb also thins out: fading alpha toward the silhouette keeps the sphere from
    // ending on a hard cut-out edge against the white card.
    // Floor raised 0.72 -> 0.88. That 28% of transparency at the silhouette was there
    // to stop the sphere ending on a hard cut-out edge against a WHITE card; against the
    // #0A1128 the hero actually uses it does the opposite job, letting the backdrop bleed
    // through the limb and dissolving the one edge the planet is read by. Kept short of
    // 1.0 so the boundary is still resolved rather than aliased.
    float edgeSoftening = mix(0.88, 1.0, 1.0 - fresnel);

    gl_FragColor = vec4(color, uOpacity * edgeSoftening);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Connection arcs.
 *
 * One THREE.Line per arc, drawn in the earth's own rotating frame so the geometry is
 * physically attached to the planet rather than projected onto it.
 */
export const arcVertexShader = /* glsl */ `
  attribute float aT;

  varying float vT;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormalWorld;

  void main() {
    vUv = uv;
    // uv.x runs from 0.0 to 1.0 along the tube length
    vT = uv.x > 0.0 || uv.y > 0.0 ? uv.x : aT;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const arcFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uPulseColor;
  uniform float uOpacity;
  /** 0 = resting, 1 = this arc touches the region the user is pointing at. */
  uniform float uEmphasis;
  /** Head of the travelling pulse, in the same 0..1 space as aT. Off screen when idle. */
  uniform float uPulse;
  /** Scales the pulse away to nothing; 0 under prefers-reduced-motion. */
  uniform float uPulseGain;

  varying float vT;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormalWorld;

  void main() {
    // --- Occlusion by the planet ---------------------------------------------------
    vec3 toCamera = cameraPosition - vWorldPosition;
    vec3 V = normalize(toCamera);
    float t = -dot(vWorldPosition, V);
    float miss = sqrt(max(dot(vWorldPosition, vWorldPosition) - t * t, 0.0));
    float visible = t <= 0.0 ? 1.0 : smoothstep(0.985, 1.002, miss);

    // --- Soft ends -----------------------------------------------------------------
    float taper = smoothstep(0.0, 0.03, vT) * smoothstep(0.0, 0.03, 1.0 - vT);

    // --- Travelling pulse ------------------------------------------------------------
    float d = vT - uPulse;
    float head = exp(-d * d * 350.0) * uPulseGain;
    float headGlow = exp(-d * d * 55.0) * 0.7 * uPulseGain;

    // Crisp, delicate, clearly visible thin gold line with glowing travelling pulse
    float alpha = (uOpacity * 0.92 + headGlow * 0.45 + head * 0.6) * taper * visible;

    // Rich, glowing deep dark gold / warm bronze-gold base with luminous dark amber pulse
    vec3 darkBronzeGold = vec3(0.78, 0.48, 0.08); // Deep burnished antique dark gold
    vec3 richDarkGold   = vec3(0.92, 0.62, 0.14); // Intense glowing dark amber gold
    vec3 pulseGold      = vec3(1.0, 0.82, 0.32);  // Radiant warm golden pulse

    vec3 color = mix(darkBronzeGold, richDarkGold, clamp(0.4 + uEmphasis * 0.6, 0.0, 1.0));
    color = mix(color, pulseGold, clamp(head * 1.5, 0.0, 1.0));

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * --- Arc endpoint nodes ------------------------------------------------------------
 *
 * One THREE.Points draw for every endpoint in the arc set. Points rather than HTML
 * overlays on purpose: these live inside the globe's own canvas, so they are occluded by
 * the planet by the same analytic ray-sphere test the arcs use, they rotate with the
 * surface for free, and they cannot overlap the headline or the CTAs under any layout —
 * the canvas sits below the copy in the stacking order, so the constraint is structural
 * rather than a z-index that has to be maintained.
 *
 * Each node carries its own period and phase as attributes, so no two share a cycle.
 */
export const arcNodeVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aPeriod;

  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uPulseGain;

  varying float vPulse;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // 0.5 .. 1.0, per the brief. Own period AND own phase, so the set never lines up.
    float wave = 0.5 + 0.5 * sin(uTime * 6.2831853 / aPeriod + aPhase);
    vPulse = mix(1.0, wave, uPulseGain);

    vec4 viewPosition = viewMatrix * worldPosition;
    // gl_PointSize is in framebuffer pixels; uPixelRatio converts from the CSS pixels
    // uSize is authored in, so the dot is the same physical size on any display.
    gl_PointSize = uSize * uPixelRatio;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const arcNodeFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vPulse;
  varying vec3 vWorldPosition;

  void main() {
    // Analytic ray-sphere occlusion
    vec3 V = normalize(cameraPosition - vWorldPosition);
    float t = -dot(vWorldPosition, V);
    float miss = sqrt(max(dot(vWorldPosition, vWorldPosition) - t * t, 0.0));
    float visible = t <= 0.0 ? 1.0 : smoothstep(0.99, 1.002, miss);

    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p) * 2.0;

    // --- Shiny starburst flare rays ---
    // Primary cross flare rays
    float rayX = max(0.0, 1.0 - abs(p.y) * 16.0) * max(0.0, 1.0 - abs(p.x) * 2.2);
    float rayY = max(0.0, 1.0 - abs(p.x) * 16.0) * max(0.0, 1.0 - abs(p.y) * 2.2);
    float starFlare = (rayX + rayY) * 0.85;

    // Diagonal flare rays
    vec2 pDiag = vec2(p.x + p.y, p.x - p.y) * 0.7071;
    float dRay1 = max(0.0, 1.0 - abs(pDiag.y) * 20.0) * max(0.0, 1.0 - abs(pDiag.x) * 2.8);
    float dRay2 = max(0.0, 1.0 - abs(pDiag.x) * 20.0) * max(0.0, 1.0 - abs(pDiag.y) * 2.8);
    starFlare += (dRay1 + dRay2) * 0.40;

    // --- Brilliant core and golden bloom ---
    float whiteHotCore = exp(-d * d * 30.0);
    float goldCore = exp(-d * d * 8.0);
    float wideGlow = exp(-d * 3.4) * 0.55;

    float totalGlow = (whiteHotCore * 1.1 + goldCore * 0.9 + wideGlow + starFlare);
    float alpha = clamp(totalGlow, 0.0, 1.0) * vPulse * uOpacity * visible;

    if (alpha < 0.005) discard;

    // Color gradient: warm amber outer glow -> brilliant gold -> incandescent white center
    vec3 warmAmber = vec3(1.0, 0.68, 0.18);
    vec3 radiantGold = vec3(1.0, 0.88, 0.38);
    vec3 whiteHot = vec3(1.0, 0.98, 0.92);

    vec3 pointColor = mix(warmAmber, radiantGold, clamp(goldCore + starFlare * 0.6, 0.0, 1.0));
    pointColor = mix(pointColor, whiteHot, clamp(whiteHotCore * 1.25, 0.0, 1.0));

    gl_FragColor = vec4(pointColor, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const cloudVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalWorld;

  void main() {
    vUv = uv;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

export const cloudFragmentShader = /* glsl */ `
  uniform sampler2D uCloudMap;
  uniform vec3 uSunDirection;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormalWorld;

  void main() {
    vec3 N = normalize(vNormalWorld);
    // Matched to the earth's own flat lighting above, so the cloud sheet cannot carry a
    // dark side across a surface that no longer has one.
    float daylight = 1.0;

    float coverage = texture2D(uCloudMap, vUv).a;

    // Clouds only catch the light they are given; on the unlit side they settle to a
    // dim grey rather than glowing white.
    vec3 color = vec3(mix(0.62, 1.0, daylight));
    float alpha = coverage * uOpacity * mix(0.45, 1.0, daylight);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vNormalWorld = normalize(mat3(modelMatrix) * normal);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunDirection;
  uniform float uStrength;
  /** dot(N, V) at which a view ray grazes the earth surface: sqrt(1 - (1/shellRadius)^2). */
  uniform float uLimb;
  uniform float uInnerFalloff;

  varying vec3 vNormalWorld;
  varying vec3 vWorldPosition;

  void main() {
    vec3 N = normalize(vNormalWorld);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // Front faces with depth testing off. The profile has to fall back to zero at the
    // shell silhouette (d = 0) or the halo terminates in a hard ring; it peaks around
    // the limb of the earth beneath and decays toward the centre of the disc.
    float d = max(dot(N, V), 0.0);
    float outward = smoothstep(0.0, 1.0, d / uLimb);
    float inward = exp(-max(d - uLimb, 0.0) * uInnerFalloff);
    float lit = smoothstep(-0.45, 0.55, dot(N, normalize(uSunDirection)));

    float alpha = outward * inward * (0.18 + 0.82 * lit) * uStrength;

    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;
