/*
 * The /services page's own sections.
 *
 * Kept out of src/components/sections/ for the same reason the /about ones are: that
 * directory already holds Services.tsx and ServicesScrollStory.tsx, which belong to the
 * homepage, and a sibling folder named `services` would collide with Services.tsx on any
 * case-insensitive filesystem. Nothing in here is imported by the homepage, and nothing in
 * here imports the homepage's components — the two Services experiences are independent by
 * construction, not by convention.
 */
export * from "./servicesData";
export * from "./ServiceDetailOverlay";
export * from "./ServiceStoryOverlay";
export * from "./ServicesJourney";
export * from "./ServicesHero";
export * from "./ServicesCapabilities";
export * from "./ServicesEcosystem";
export * from "./ServicesProcess";
export * from "./ServicesShowcase";
export * from "./ServicesMiningStory";
export * from "./ServicesTrustedBrands";
export * from "./ServicesFinalCTA";

