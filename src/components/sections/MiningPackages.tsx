"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

/* ==========================================================================
   DATA TYPES & PACKAGES (User defined deliverables & pricing)
   ========================================================================== */

export interface PricingPlan {
  id: string;
  name: string;
  popular?: boolean;
  popularLabel?: string;
  cadenceNote: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  primaryCta: {
    label: string;
    href: string;
  };
}

export const DEFAULT_PACKAGES: PricingPlan[] = [
  {
    id: "plan-discovery",
    name: "Discovery",
    popular: false,
    cadenceNote: "Starting from",
    price: "$700",
    period: "/mo",
    description:
      "Essential market visibility featuring monthly articles, unlimited press release distribution, daily social reach across all channels, and featured monthly magazine placement.",
    features: [
      "2 Dedicated articles per month",
      "Unlimited press release distribution",
      "Substack publication & results graphics",
      "Daily social posting on all channels (7 days/week)",
      "4 Shorts/Reels & custom thumbnails",
      "1 Dedicated email campaign per month",
      "Featured placement in monthly magazine",
      "Sidebar website banner placement",
      "Company, CEO & PR archive pages logo",
      "Conference promotion campaign & recap",
      "Written monthly performance report",
      "Same-day news turnaround (Shared manager)",
    ],
    primaryCta: {
      label: "SELECT PLAN",
      href: "/contact?tier=discovery",
    },
  },
  {
    id: "plan-momentum",
    name: "Momentum",
    popular: true,
    popularLabel: "POPULAR",
    cadenceNote: "Starting from",
    price: "$1,200",
    period: "/mo",
    description:
      "Accelerate market growth featuring monthly editorial articles, full YouTube channel management, high-visibility homepage banner placement, and dedicated investor collateral.",
    features: [
      "3 Dedicated articles per month",
      "Unlimited press release distribution",
      "Substack publication & results graphics",
      "Daily posting + CEO.CA, StockTwits & Reddit",
      "8 Shorts/Reels & full YouTube channel management",
      "Interview / podcast placement (every 6 months)",
      "2 Dedicated email campaigns & 3 branded templates",
      "Full-page placement in monthly magazine",
      "Homepage website banner placement",
      "1 Event booth, banner & poster design pack/year",
      "Quarterly presentation deck & fact sheet refresh",
      "Quarterly IR review deck & strategy call",
      "Fast 3-hour news turnaround (Dedicated manager)",
    ],
    primaryCta: {
      label: "SELECT PLAN",
      href: "/contact?tier=momentum",
    },
  },
  {
    id: "plan-premier",
    name: "Premier",
    popular: false,
    cadenceNote: "Starting from",
    price: "$1,599",
    period: "/mo",
    description:
      "Institutional dominance featuring functional website chatbot integration, dedicated monthly articles, magazine front covers, website takeovers, and 1-hour news turnaround.",
    features: [
      "Functional website chatbot integration",
      "4 Dedicated articles per month",
      "Unlimited press release distribution",
      "Substack publication & results graphics",
      "Daily posting + CEO.CA, StockTwits & Reddit",
      "2 Monthly subscriber-growth campaigns",
      "12 Shorts/Reels & full YouTube channel management",
      "Quarterly interview / podcast placement",
      "4 Dedicated email campaigns & unlimited templates",
      "Full-page magazine placement + 2 front covers/year",
      "Premium website banner + takeover week",
      "2 Events booth, banner & poster design packs/year",
      "Monthly presentation deck design & fact sheet refresh",
      "All-Language content syndication",
      "Priority 1-hour news turnaround (Dedicated manager + direct line)",
    ],
    primaryCta: {
      label: "SELECT PLAN",
      href: "/contact?tier=premier",
    },
  },
];


/* ==========================================================================
   COMPONENT: MINING PACKAGES (3-CARD PRICING SECTION)
   ========================================================================== */

export const MiningPackages: React.FC = () => {
  const plans = DEFAULT_PACKAGES;

  return (
    <section className="miningPackagesSection" aria-label="Service Packages and Pricing">
      <style dangerouslySetInnerHTML={{
        __html: `
/* ==========================================================================
   MINING PACKAGES SECTION STYLES
   ========================================================================== */

.miningPackagesSection {
  position: relative;
  width: 100%;
  background-color: #FAF7F2;
  color: #1A202C;
  padding: clamp(4.5rem, 9vh, 7.5rem) clamp(1.25rem, 5vw, 4rem);
  box-sizing: border-box;
  overflow: hidden;
  font-family: var(--font-inter, "Inter", -apple-system, BlinkMacSystemFont, sans-serif);
}

/* Subtle Architectural Vertical Lines (matching rest of site) */
.pkgsGridOverlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 clamp(1rem, 6vw, 6rem);
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
}

.pkgsGridLine {
  width: 1px;
  height: 100%;
  background: rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.pkgsContainer {
  position: relative;
  z-index: 2;
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* --------------------------------------------------------------------------
   EDITORIAL HEADER (MATCHING PREVIOUS STYLE)
   -------------------------------------------------------------------------- */

.pkgsHeader {
  text-align: center;
  max-width: 820px;
  margin: 0 auto clamp(2.5rem, 5.5vh, 4rem);
}

.pkgsEyebrowRow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-bottom: 0.95rem;
}

.pkgsEyebrowRule {
  width: clamp(24px, 3.5vw, 42px);
  height: 1px;
  background: rgba(200, 154, 50, 0.45);
  display: inline-block;
}

.pkgsEyebrowText {
  font-family: var(--font-ibm-plex-mono), "IBM Plex Mono", monospace;
  font-size: clamp(0.70rem, 0.85vw, 0.82rem);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #7A5E22;
  white-space: nowrap;
}

.pkgsEyebrowPip {
  display: inline-block;
  color: #D4AF37;
  font-size: 0.85em;
  margin: 0 0.35em;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
  vertical-align: middle;
}

/* Main Title Typography & Shimmering Metallic Gold Treatment */
.pkgsMainTitle {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: clamp(1.85rem, 3.2vw, 3rem);
  font-weight: 700;
  color: #0F172A;
  line-height: 1.15;
  letter-spacing: -0.025em;
  margin: 0 0 clamp(0.75rem, 1.4vh, 1.1rem) 0;
  text-transform: uppercase;
  text-align: center;
}

.pkgsTitleLine {
  display: block;
}

.pkgsWordSpan {
  display: inline-block;
  margin-right: 0.28em;
  color: #0F172A;
  font-weight: 700;
}

.pkgsGoldWordSpan {
  display: inline-block;
  margin-right: 0.28em;
  font-style: normal;
  font-weight: 700;
  background: linear-gradient(135deg,
      #FCE8A6 0%,
      #D4AF37 25%,
      #FFF2B2 45%,
      #AA771C 70%,
      #D4AF37 88%,
      #FCE8A6 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: metallicGoldFlow 6s ease-in-out infinite;
}

@keyframes metallicGoldFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.pkgsSubtitle {
  font-size: clamp(0.92rem, 1.25vw, 1.05rem);
  line-height: 1.6;
  color: #556070;
  margin: 0 auto;
  max-width: 660px;
}

/* --------------------------------------------------------------------------
   3-CARD GRID
   -------------------------------------------------------------------------- */

.pkgsGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1.25rem, 2.4vw, 2.2rem);
  width: 100%;
  align-items: stretch;
  box-sizing: border-box;
}

.pkgCard {
  position: relative;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 4px 20px -4px rgba(15, 35, 65, 0.05), 0 2px 6px -1px rgba(15, 35, 65, 0.03);
  display: flex;
  flex-direction: column;
  padding: clamp(1.75rem, 3.2vw, 2.5rem);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  box-sizing: border-box;
}

/* Hover on ANY card (Left, Right, etc.): Golden outer line & warm ambient glow */
.pkgCard:hover {
  transform: translateY(-6px);
  border-color: #C89A32;
  box-shadow: 0 16px 36px -8px rgba(200, 154, 50, 0.22), 0 6px 16px -2px rgba(15, 35, 65, 0.05);
}

/* Featured / Popular Card (Center Card): Golden outer line by default matching Image 2 */
.pkgCardPopular {
  border: 1.5px solid #C89A32;
  box-shadow: 0 10px 32px -6px rgba(200, 154, 50, 0.16), 0 4px 12px -2px rgba(15, 35, 65, 0.04);
}

.pkgCardPopular:hover {
  border-color: #AA771C;
  box-shadow: 0 22px 46px -10px rgba(200, 154, 50, 0.28), 0 8px 20px -4px rgba(15, 35, 65, 0.08);
}

/* Popular Badge: Elegant Gold Badge with white text */
.pkgPopularBadge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%);
  color: #FFFFFF;
  border: 1px solid #966614;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 0.28rem 1.15rem;
  border-radius: 9999px;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(170, 119, 28, 0.28);
  user-select: none;
}

/* --------------------------------------------------------------------------
   CARD CONTENT
   -------------------------------------------------------------------------- */

.pkgCardHead {
  text-align: center;
  margin-bottom: 1.25rem;
}

.pkgCardName {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: clamp(1.25rem, 2vw, 1.45rem);
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}

.pkgCadenceNote {
  font-size: 0.78rem;
  font-weight: 500;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
}

.pkgPriceRow {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.pkgPrice {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: clamp(2.3rem, 3.8vw, 3rem);
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.03em;
  line-height: 1;
}

.pkgPeriod {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748B;
}


.pkgDivider {
  width: 100%;
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
  margin: 1.25rem 0;
}

.pkgDescription {
  font-size: 0.9rem;
  line-height: 1.55;
  color: #475569;
  text-align: center;
  min-height: 5.6rem;
  margin: 0 0 1.5rem;
  text-wrap: balance;
}

/* Feature list */
.pkgFeaturesList {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-grow: 1;
}

.pkgFeatureItem {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #334155;
}

.pkgFeatureCheck {
  flex-shrink: 0;
  margin-top: 0.15rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(200, 154, 50, 0.12);
  color: #B8860B;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pkgFeatureCheckPopular {
  background: #FFF7ED;
  color: #EA580C;
}

/* --------------------------------------------------------------------------
   CTA BUTTONS (EXACT MATCH TO .viewAllArchiveBtn: IDLE LIGHT GOLD TINT -> HOVER GOLD GRADIENT)
   -------------------------------------------------------------------------- */

.pkgButtonStack {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  width: 100%;
}

/* Base button in IDLE state: light golden tint background, 1.5px gold border, dark text */
.pkgPrimaryBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.95rem 1.85rem;
  border-radius: 999px;
  border: 1.5px solid rgba(200, 154, 50, 0.6);
  background: rgba(200, 154, 50, 0.08);
  color: #0F172A;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(200, 154, 50, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-decoration: none;
  box-sizing: border-box;
}

.pkgPrimaryBtn svg {
  color: inherit;
  transition: transform 0.25s ease;
}

/* Hover state: exact match to Image 1: golden gradient, white text & white arrow */
.pkgPrimaryBtn:hover {
  background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%);
  color: #FFFFFF;
  border-color: #AA771C;
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(170, 119, 28, 0.32);
}

.pkgPrimaryBtn:hover svg {
  transform: translateX(4px);
  color: #FFFFFF;
}

/* Featured / Most Popular Card Idle & Hover */
.pkgPrimaryBtnPopular {
  border-color: rgba(200, 154, 50, 0.85);
  background: rgba(200, 154, 50, 0.12);
}

.pkgPrimaryBtnPopular:hover {
  background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%);
  color: #FFFFFF;
  border-color: #AA771C;
  box-shadow: 0 8px 24px rgba(170, 119, 28, 0.40);
}

/* --------------------------------------------------------------------------
   FOOTER DISCLAIMER
   -------------------------------------------------------------------------- */

.pkgsFooter {
  text-align: center;
  margin-top: clamp(2.5rem, 5vh, 3.5rem);
  max-width: 720px;
}

.pkgsFooterNote {
  font-size: 0.88rem;
  line-height: 1.6;
  color: #64748B;
  margin: 0 0 0.35rem;
}

.pkgsCustomLink {
  color: #8C6D23;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.pkgsCustomLink:hover {
  color: #5A4310;
}



/* --------------------------------------------------------------------------
   RESPONSIVE DESIGN (TABLETS & PHONES)
   -------------------------------------------------------------------------- */

@media (max-width: 1024px) {
  .pkgsGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
  }
  .pkgCard {
    padding: 1.5rem 1.15rem;
  }
  .pkgPrice {
    font-size: 2.2rem;
  }
}

@media (max-width: 860px) {
  .pkgsGrid {
    grid-template-columns: 1fr;
    max-width: 480px;
    gap: 2rem;
    margin: 0 auto;
  }
  .pkgCard {
    padding: 2rem 1.5rem;
  }
  .pkgDescription {
    min-height: auto;
  }
  .pkgPrimaryBtn,
  .pkgPrimaryBtnPopular {
    background: linear-gradient(135deg, #D4AF37 0%, #AA771C 100%);
    color: #FFFFFF;
    border-color: #AA771C;
    box-shadow: 0 6px 18px rgba(170, 119, 28, 0.30);
  }
  .pkgPrimaryBtn svg,
  .pkgPrimaryBtnPopular svg {
    color: #FFFFFF;
  }
  .pkgPrimaryBtn:active,
  .pkgPrimaryBtnPopular:active {
    transform: scale(0.98);
  }
}

@media (max-width: 640px) {
  .pkgsHeader {
    margin: 0 auto clamp(1.75rem, 4vh, 2.5rem);
    padding: 0 0.5rem;
  }
  .pkgsMainTitle {
    font-size: clamp(1.25rem, 5.5vw, 1.85rem);
    line-height: 1.22;
    text-wrap: balance;
  }
  .pkgsTitleLine {
    display: block;
    text-wrap: balance;
  }
  .pkgsSubtitle {
    font-size: 0.92rem;
    line-height: 1.55;
    padding: 0 0.5rem;
    text-align: center;
    text-wrap: balance;
  }
}

@media (max-width: 480px) {
  .miningPackagesSection {
    padding: 3.5rem clamp(0.75rem, 3.5vw, 1rem) 4rem;
  }
  .pkgsEyebrowRow {
    gap: 0.5rem;
  }
  .pkgsEyebrowRule {
    width: 18px;
  }
  .pkgsEyebrowText {
    font-size: clamp(0.60rem, 2.8vw, 0.68rem);
    letter-spacing: 0.12em;
  }
  .pkgsSubtitle {
    font-size: 0.88rem;
    line-height: 1.55;
    padding: 0 0.25rem;
    text-align: center;
    text-wrap: balance;
  }
  .pkgPrice {
    font-size: 2.1rem;
  }
  .pkgCard {
    padding: 1.75rem clamp(1rem, 3.5vw, 1.25rem);
    border-radius: 16px;
  }
  .pkgDescription {
    font-size: 0.88rem;
    line-height: 1.5;
    text-align: center;
    text-wrap: balance;
    margin: 0 0 1.25rem;
    min-height: auto;
  }
}

@media (max-width: 360px) {
  .pkgsMainTitle {
    font-size: 1.15rem;
  }
  .pkgsTitleLine {
    white-space: normal;
  }
  .pkgCard {
    padding: 1.4rem 0.9rem;
  }
}
` }} />

      {/* Architectural Grid Lines */}
      <div className="pkgsGridOverlay" aria-hidden="true">
        <div className="pkgsGridLine" />
        <div className="pkgsGridLine" />
        <div className="pkgsGridLine" />
        <div className="pkgsGridLine" />
        <div className="pkgsGridLine" />
        <div className="pkgsGridLine" />
      </div>

      <div className="pkgsContainer">
        {/* Header Section */}
        <div className="pkgsHeader">
          <div className="pkgsEyebrowRow">
            <span className="pkgsEyebrowRule" aria-hidden="true" />
            <span className="pkgsEyebrowText">
              <span className="pkgsEyebrowPip">✦</span> PARTNERSHIP PACKAGES <span className="pkgsEyebrowPip">✦</span>
            </span>
            <span className="pkgsEyebrowRule" aria-hidden="true" />
          </div>

          <h2 className="pkgsMainTitle">
            <span className="pkgsTitleLine">
              {["FLEXIBLE", "SOLUTIONS", "FOR"].map((word, idx) => (
                <span key={idx} className="pkgsWordSpan">
                  {word}{" "}
                </span>
              ))}
            </span>
            <span className="pkgsTitleLine">
              {["EVERY", "STAGE", "OF"].map((word, idx) => (
                <span key={idx} className="pkgsWordSpan">
                  {word}{" "}
                </span>
              ))}
              <span className="pkgsGoldWordSpan">
                GROWTH
              </span>
            </span>
          </h2>

          <p className="pkgsSubtitle">
            Mining Discovery offers tailored solutions designed to support companies at different stages — from exploration and discovery to development and production.
          </p>
        </div>

        {/* 3-Card Grid */}
        <div className="pkgsGrid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`pkgCard ${plan.popular ? "pkgCardPopular" : ""}`}
            >
              {plan.popular && plan.popularLabel && (
                <div className="pkgPopularBadge">
                  {plan.popularLabel}
                </div>
              )}

              {/* Head / Pricing Info */}
              <div className="pkgCardHead">
                <h3 className="pkgCardName">{plan.name}</h3>
                <div className="pkgCadenceNote">{plan.cadenceNote}</div>

                <div className="pkgPriceRow">
                  <span className="pkgPrice">{plan.price}</span>
                  <span className="pkgPeriod">{plan.period}</span>
                </div>
              </div>

              <div className="pkgDivider" />

              <p className="pkgDescription">{plan.description}</p>

              {/* Bullet Points */}
              <ul className="pkgFeaturesList">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="pkgFeatureItem">
                    <span className={`pkgFeatureCheck ${plan.popular ? "pkgFeatureCheckPopular" : ""}`}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button (Exact .viewAllArchiveBtn match: Idle light tint -> Hover golden fill) */}
              <div className="pkgButtonStack">
                <Link
                  href={plan.primaryCta.href}
                  className={`pkgPrimaryBtn ${plan.popular ? "pkgPrimaryBtnPopular" : ""}`}
                >
                  <span>{plan.primaryCta.label}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>



        {/* Footer Notes */}
        <div className="pkgsFooter">
          <p className="pkgsFooterNote">
            All prices are starting benchmarks. The final scope depends on your mineral asset stage, market capitalization, and strategic goals.
          </p>
          <p className="pkgsFooterNote">
            Need a custom package?{" "}
            <Link href="/contact" className="pkgsCustomLink">
              Request a free proposal
            </Link>{" "}
            and our strategic advisory team will reply within 24 hours.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MiningPackages;
