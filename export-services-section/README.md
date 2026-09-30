# Services Section - Standalone Export & Migration Package

This package contains **only** the Services section from the Mining Discovery project, completely self-contained and ready to paste/install into any cloned Next.js repository.

---

## ⚡ Quick Install (Automated One-Command)

Run PowerShell in this directory (or the project root) and pass the path of your cloned project:

`powershell
.\copy-services.ps1 -TargetDir "D:\path-to-your-cloned-project"
`

If you run without arguments, it will prompt you for the target directory:
`powershell
.\copy-services.ps1
`

The script will automatically:
1. Copy the /services route (src/app/services/page.tsx).
2. Copy all Services components and CSS modules (src/components/services/*).
3. Copy supporting motion utilities (src/components/about/reveal.tsx) and brands data (src/data/trustedBrands.ts).
4. Copy all required public images & webp assets (public/services/, public/images/services/, public/images/engine/, public/cards/, public/stats/, public/about/).
5. Check and install gsap and lucide-react if not already installed.

---

## 📁 Manual Copy-Paste File Structure

If you prefer copying the files manually, copy the files from this directory into your target project:

`
target-project/
├── public/
│   ├── about/
│   │   └── open-pit-golden-hour.webp
│   ├── cards/
│   │   ├── bg_card_1.webp
│   │   ├── bg_card_2.webp
│   │   ├── bg_card_3.webp
│   │   └── bg_card_4.webp
│   ├── images/
│   │   ├── engine/
│   │   │   ├── brand_identity.webp
│   │   │   ├── conference_auditorium.webp
│   │   │   ├── digital_ads_marketing.webp
│   │   │   ├── editorial_magazine.webp
│   │   │   ├── executive_boardroom.webp
│   │   │   ├── financial_terminal.webp
│   │   │   ├── investor_meeting.webp
│   │   │   └── youtube_production.webp
│   │   ├── services/
│   │   │   └── *.webp
│   │   └── jurisdictions_map.webp
│   ├── services/
│   │   ├── 01-survey.webp
│   │   ├── 02-drill.webp
│   │   ├── 03-assay.webp
│   │   └── 04-pit.webp
│   └── stats/
│       └── newsletter-briefing.webp
│
└── src/
    ├── app/
    │   └── services/
    │       └── page.tsx
    ├── components/
    │   ├── about/
    │   │   └── reveal.tsx
    │   └── services/
    │       ├── index.ts
    │       ├── servicesData.ts
    │       ├── ServicesJourney.tsx
    │       ├── ServicesJourney.module.css
    │       ├── ServiceDetailOverlay.tsx
    │       ├── ServiceDetailOverlay.module.css
    │       ├── ServiceStoryOverlay.tsx
    │       ├── ServiceStoryOverlay.module.css
    │       ├── useReducedMotionPreference.ts
    │       ├── ServicesCapabilities.tsx
    │       ├── ServicesEcosystem.tsx
    │       ├── ServicesFinalCTA.tsx
    │       ├── ServicesHero.tsx
    │       ├── ServicesMiningStory.tsx
    │       ├── ServicesProcess.tsx
    │       ├── ServicesShowcase.tsx
    │       └── ServicesTrustedBrands.tsx
    └── data/
        └── trustedBrands.ts
`

---

## 📦 Required Dependencies

In your cloned project, ensure the following npm packages are installed:

`ash
npm install gsap lucide-react
`

---

## 🚀 How to Run & Verify

1. Start development server in your cloned project:
   `ash
   npm run dev
   `
2. Navigate to:
   [http://localhost:3000/services](http://localhost:3000/services)
3. You will see the complete, smooth scroll-scrubbed 6-chapter Services Journey with full slide overlays and detailed capability views.
