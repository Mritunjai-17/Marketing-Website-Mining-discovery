/*
 * The /about page's sections, in the order the page renders them.
 *
 * Deliberately NOT under src/components/sections/. That directory already holds About.tsx
 * — the homepage's About section — and a sibling folder named `about` collides with it on
 * any case-insensitive filesystem: Windows and macOS both resolve
 * `@/components/sections/about` to the .tsx file rather than to the folder's index.
 *
 * Staying out of the sections barrel is right on its own terms too. That barrel is
 * imported by the homepage, and every file in here is a client component; folding them in
 * would pull ten "use client" boundaries into the homepage's module graph for no reason.
 */
export * from "./AboutHero";
export * from "./AboutOrigin";
export * from "./AboutManagement";
export * from "./AboutAdvisor";
export * from "./AboutPurpose";
export * from "./AboutPrinciples";
export * from "./AboutUnique";
export * from "./AboutLookingAhead";
export * from "./AboutTrustedBrands";
export * from "./AboutClosing";
