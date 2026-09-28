"use client";

import { JourneySection } from "@/components/journey";

/**
 * Preview route for the STEP 1 Journey prototype.
 *
 * This exists so the prototype can be reviewed without touching the homepage
 * or any existing section. It is not linked from anywhere in the site's
 * navigation. Delete this folder when the journey moves into the real page.
 *
 * The spacer blocks above and below are deliberate: they prove the pin engages
 * and releases against normal page content rather than only working when the
 * section is alone on the page.
 */
export default function JourneyPrototypePage() {
  return (
    <div className="bg-[#061224] text-[#F2F2F0]">
      <JourneySection />
    </div>
  );
}
