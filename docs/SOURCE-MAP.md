# EMaaS Pro Brand Shell Source Use Record

Status: `REVIEW / NOT RELEASED / NOT DEPLOYED`

Controlled destination: `/Users/sustainablegaps/Projects/emaas-pro`

Owner and release gate: Erik Herring; exact-file owner review, target-surface evidence, and a separate deployment decision remain required.

Scope: current digital-brand implementation across the web shell, registered favicon, charts, one-line diagrams, and PDF presentation tokens. Formulas, calculation data, engineering logic, Xcode/iOS/Capacitor files, connectivity, and deployment remain outside this record.

## Source Use Record

| Resource, element, or claim | Source class | Controlled source path | Asset/decision ID | Version or SHA-256 | Lifecycle and allowed use | Transformation or use | Output location | Verified by and date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Digital brand-only scope | Owner authorization | `17-Brand-Governance-Operations-2026/02-Change-Control/DIGITAL-BRAND-ONLY-IMPLEMENTATION-AUTHORIZATION-20260830.md` | Digital brand-only implementation authorization | `8418c94df81fab079040a49479f63b4ef184c086039ea9e7bfb704dc1a12d30e` | Owner-authorized review construction; release and deployment held | Controls the bounded web-shell implementation and protected behavior boundary | This repository | EMaaS Pro web-shell SME, 2026-08-30 |
| Approved-source construction and citation rule | Governance control | `17-Brand-Governance-Operations-2026/02-Change-Control/APPROVED-SOURCE-ONLY-WORK-PRODUCT-AND-CITATION-DIRECTIVE-20260829.md` | `SG-BRAND-SOURCE-CITATION-DIRECTIVE-001` | `adcb9f789dca1937d3a6fb55c7202c7a948ba29598d29c7532534333797779e5` | `APPROVED_SOURCE`; internal governance and controlled review construction | Controls source selection, placement, citation, checksum evidence, and release boundary | This record and implementation | EMaaS Pro web-shell SME, 2026-08-30 |
| Digital palette and typography rules | Brand guideline | `01-Guidelines/BRANDING-PALETTE.md` | `SG-PALETTE-001` | `62a8c14ad2c5d1723e6fc6084aacbe9c9df60288c8fcb65cba6d492b8ad7614d` | `APPROVED_SOURCE`; digital, web, and review proofs | Remapped existing global shell semantic tokens; assigned approved display/body families | `src/index.css` | EMaaS Pro web-shell SME, 2026-08-30 |
| Sora web variable font | Controlled font binary | `13-Font-Package/Web/sora-latin-var.woff2` | Sora web benchmark | `d2909123a6a8ed2f928055f002c32f63ee93496b470c1a344873f955111fca53` | Controlled website benchmark; OFL rights record applies | Copied byte-for-byte; loaded for display and heading roles | `public/fonts/sora-latin-var.woff2` | EMaaS Pro web-shell SME, 2026-08-30 |
| Source Sans 3 web variable font | Controlled font binary | `13-Font-Package/Web/source-sans-3-latin-var.woff2` | Source Sans 3 web benchmark | `ac057a5593cbe3df0d2585da5dd5f33b8efa84aa30550c710fe061b37fc5c54b` | Controlled website benchmark; OFL rights record applies | Copied byte-for-byte; loaded for body, UI, and form roles | `public/fonts/source-sans-3-latin-var.woff2` | EMaaS Pro web-shell SME, 2026-08-30 |
| Font rights and redistribution conditions | Rights record | `13-Font-Package/FONT-RIGHTS-RECORD-20260829.md` | SG font rights record | `dd5d19bb2bf8d7d307d62dd99135ccdc70c44e7b9079639a689a15eab29e834f` | Controlled rights evidence; OFL conditions apply; no client/vendor font package | Governs local web embedding; no separate font distribution package created | `public/fonts/` and this record | EMaaS Pro web-shell SME, 2026-08-30 |
| SG horizontal reversed-dark logo | Registered production derivative | `03-Web-Assets/Logo-System/SVG/sg-logo-horizontal-reversed-dark.svg` | `SG-LOGO-MASTER-001` registered derivative | `7ae7b68b6e67266fb5f4abd48c6ea18d67618c01c64976b288460dfc7ceb8ce1` | Approved production family; dark digital field; horizontal minimum 160 px | Copied byte-for-byte and placed at 160 px in the existing home-link brand block without redrawing, recoloring, plate, shadow, or distortion | `public/brand/sg-logo-horizontal-reversed-dark.svg`; `src/components/layout/Header.tsx` | EMaaS Pro web-shell SME, 2026-08-30 |
| SG bridge deep-blue 96 px icon | Registered production derivative | `03-Web-Assets/Logo-System/Icons/sg-logo-bridge-1c-deep-blue-96.png` | `SG-LOGO-MASTER-001` registered derivative | `3bac1bc001d24963ed7a7aeb1094948349c4d022a666fac3b965bbdd584b944f` | Approved production family; controlled bridge-only raster size | Copied byte-for-byte to replace the unregistered gold lightning favicon; no redraw, recolor, plate, shadow, or distortion | `public/brand/sg-logo-bridge-1c-deep-blue-96.png`; `index.html` | EMaaS Pro release-candidate review, 2026-09-11 |
| EMaaS first-reference naming | Controlled messaging | `07-Evidence/messaging-system.md` | `MSG-03` | `db4c43d307219fe29e5880b8dbbca908b3f8768ffc595db038aa4fe7b82b08f4` | Approved controlled terminology | Metadata and first display use `Energy Management as a Service (EMaaS) Pro`; later web-shell references use `EMaaS Pro`; `emaas.pro` URL retained | `index.html`; `src/lib/brand.ts`; `src/features/dashboard/DashboardPage.tsx`; `src/components/ui/DisclaimerModal.tsx`; `src/components/layout/Header.tsx`; `src/features/legal/PrivacyPage.tsx`; `src/features/learn/LearnHubPage.tsx` | EMaaS Pro web-shell SME, 2026-08-30 |
| D-01 through D-09 correction scope | Owner correction matrix | `17-Brand-Governance-Operations-2026/02-Change-Control/BRAND-MANUAL-AND-DIGITAL-GUIDANCE-CORRECTION-MATRIX-20260829.md` | `MSG-03` and related digital-brand controls | `0528209ad49ea8d42f7f6331fc2a0756c573aaaf1f219d0d070597839e98bbce` | Approved internal correction scope; destination release remains separate | Confirms capability naming and first-reference expansion without creating a new offering or changing behavior | This implementation | EMaaS Pro web-shell SME, 2026-08-30 |

## 2026-09-11 Current-Brand Reconciliation

- Active application colors now use the controlled palette: Conductive Copper `#C27A2C`, Copper Hover `#D88A34`, Executive Blue `#1E2A38`, Blackout `#0E151C`, Motion Ink `#141D26`, Dark Raised `#1C2732`, Source Slate `#34495E`, Pewter `#5B6673`, Silver `#C5C6C7`, Bone `#E9E4D6`, Brand White `#F9FAFB`, Proof Blue `#CCD2E9`, and Skyway Light `#ABE1FA`.
- Retired gold naming and legacy gold tokens were removed from active application source, diagrams, charts, and PDF presentation styles.
- `npm run audit:brand` now blocks a production build if either registered implementation asset changes checksum or a retired gold token returns to active application files.
- The controlled-brand-tree release gate was run on 2026-09-11 and remains blocked by retired tokens in `02-Source-Masters/sg-bridge-mark-master.svg` and `02-Source-Masters/sg-bridge-mark-web.svg`. Those governed source-master files were not altered from this application repository. Brand-steward resolution and a passing rerun remain required before channel release.

## Release Boundary

This source map documents a local implementation candidate only. A passing build, local screenshot, or checksum match does not authorize publication, deployment, client issue, vendor release, print, app-store release, or any live Microsoft/Azure change.

## Target-Surface Review Evidence

- Node `v22.23.2`; `npm test`: 18 files and 123 tests passed.
- `npm run lint`: passed.
- `npm run build`: TypeScript, Vite production build, PWA generation, and the existing production-artifact audit passed.
- `npm run test:e2e`: existing desktop/mobile browser workflow passed, including the governed SG return URL, 390 px overflow check, menu dialog, focus transfer, and Escape close behavior.
- Playwright review at 320 x 844, 390 x 844, and 1440 x 900 found zero horizontal overflow at 320 and 1440 px, zero console errors, successful 200 responses for both fonts and the logo, computed Sora/Source Sans 3 assignments, and a 160 px rendered logo width.
- Review screenshots are retained under `output/playwright/emaas-brand-shell-*-20260830.png`; `output/` remains ignored review evidence and is not a release package.

Remaining release holds: owner exact-file review; public font-license/copyright accompaniment; assistive-technology/device review beyond the automated focus checks; deployment decision; and cache-busted live verification after any separately authorized deployment.

Current 2026-09-11 verification: Node `v22.23.2`; 25 test files / 156 tests; ESLint; brand asset audit; TypeScript/Vite production build; production artifact audit; and desktop/mobile E2E smoke checks all passed. The separate controlled-brand-tree gate remains blocked as documented above.
