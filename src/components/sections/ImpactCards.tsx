"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLatestMagazine } from "@/data/magazines";
import { MagazineShowcase } from "./MagazineShowcase";
import styles from "./ImpactCards.module.css";

export const ImpactCards: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const featuredMagazine = getLatestMagazine();

  // Natural editorial scroll through Featured Magazine and Previous Editions archive

  return (
    <section ref={sectionRef} className={styles.impactSection}>
      <div className={styles.impactScrollArea}>
        <div ref={viewportRef} className={styles.impactViewport}>
          <div aria-hidden="true" className={styles.impactGlow} />

          {/* ---------------------------------------------------------- intro */}
          <div className={styles.impactIntro}>
            <div className={styles.impactIntroCopy}>
              <span className={styles.impactEyebrow}>
                <span aria-hidden="true" className={styles.impactEyebrowRule} />
                Our Impact
              </span>

              <h2 className={styles.impactHeadline}>
                THE LATEST FROM
                <br className={styles.desktopBr} />
                THE MINING WORLD
              </h2>

              <p className={styles.impactLede}>
                From industry news to expert insights, explore the stories driving
                <br className={styles.desktopBr} />
                conversations across mining.
              </p>
            </div>

            <div className={styles.impactIntroAside}>
              <span className={styles.impactKicker}>Real campaigns. Tangible outcomes.</span>
              <Link
                href="/work"
                aria-label="View all campaigns and outcomes"
                className={styles.impactArrow}
              >
                <ArrowRight className={styles.impactArrowIcon} />
              </Link>
            </div>
          </div>

          {/* ---------------------------------------------------------- showcase */}
          <div className={styles.impactStage}>
            <MagazineShowcase magazine={featuredMagazine} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ reduced-motion static */}
      <div className={styles.impactStatic}>
        <div aria-hidden="true" className={styles.impactGlow} />

        <div className={styles.impactIntroCopy}>
          <span className={styles.impactEyebrow}>
            <span aria-hidden="true" className={styles.impactEyebrowRule} />
            Our Impact
          </span>
          <h2 className={styles.impactHeadline}>
            THE LATEST FROM
            <br className={styles.desktopBr} />
            THE MINING WORLD
          </h2>
          <p className={styles.impactLede}>
            From industry news to expert insights, explore the stories driving
            <br className={styles.desktopBr} />
            conversations across mining.
          </p>
          <p className={styles.impactKicker}>Real campaigns. Tangible outcomes.</p>
        </div>

        <div className={styles.impactStage} style={{ marginTop: "2rem" }}>
          <MagazineShowcase magazine={featuredMagazine} />
        </div>
      </div>

      {/* Seamless editorial handoff into Market Influence & Reach */}
      <div aria-hidden="true" className={styles.impactOutroSeam} />
    </section>
  );
};

export default ImpactCards;
