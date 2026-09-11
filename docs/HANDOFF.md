# EMaaS.pro Launch — Handoff & Session Log
**Updated 2026-09-11 · Erik Herring / Sustainable Gaps LLC**
This document is self-contained: a fresh Claude session (or future Erik) on any
machine can resume from here. Add your own notes at the bottom.

## 2026-09-11 Release Candidate — Minimum Field-Planning Standard

Canonical source: `/Users/sustainablegaps/Projects/emaas-pro`

- Temporary power now produces a verified planning architecture with explicit source/load voltage, transformer, switchgear, cable, neutral, continuity, and field-review boundaries.
- Temporary heating supports the two primary use cases—propane and electric—and carries auxiliary or heater electrical demand into generator planning without adding steam-system complexity.
- Cooling accepts width, height, and depth for cubic-foot planning, validates bounded inputs, and preserves the existing load formulas through regression coverage.
- Build Estimate combines equipment, logistics, rates, discounts, taxes, assumptions, and approval checks in a persistent draft.
- Site Fit & One-Line links each electrical node to a dimensioned site block and customer explanation. Conservative two-dimensional packing includes access, exclusions, equipment, and service clearances; a constrained site produces a bounded power ceiling or a shape conflict rather than an area-only fit claim.
- Zero requested load withholds equipment, transformer, cable, and fit conclusions. Step-up and step-down transformer language is direction-sensitive.
- Independent cold review and focused regression review informed the corrections. The final third-party recheck reported no remaining P0-P2 findings in the reviewed Site Fit workflow and no interference with existing calculations.
- Current SG brand reconciliation replaced the unregistered gold lightning favicon with the exact registered 96 px bridge icon, migrated active chart/diagram/PDF colors to the controlled copper, blue, slate, silver, bone, and white palette, and added a build-blocking checksum/retired-color audit. The header logo remains an exact registered derivative.
- Release-candidate verification passed: 25 test files / 156 tests, ESLint, TypeScript/Vite production build, production artifact audit, and desktop/mobile E2E smoke checks. Browser review showed no console errors or warnings.
- Application-level brand checks pass. The separate controlled-brand-tree release gate is still blocked by retired colors in two governed source-master SVGs outside this repository; brand-steward resolution and a passing rerun are required before channel release.
- This checkpoint is prepared locally only. It has not been pushed, merged to `main`, deployed to Azure Static Web Apps, synchronized into a new native build, or accepted on a production device.

## 2026-08-22 Production Bundle Hardening

- Vite now explicitly uses Oxc production minification with browser source maps disabled.
- Production application and lazy chunks publish under generic hash-only paths: `assets/app/<hash>.js` and `assets/chunks/<hash>.js`. Descriptive names such as formulas, recommendations, verification, and wizard modules no longer appear in public asset filenames.
- `npm run build` now runs a production artifact audit that blocks source maps, source-map references, readable source-module paths, and descriptive JavaScript chunk names.
- The Azure Static Web Apps response policy now disables unused camera, microphone, and geolocation browser capabilities while preserving the existing Microsoft Teams frame policy.
- This is a casual-inspection deterrent, not secrecy. EMaaS calculation code delivered to a browser can still be studied; genuinely sensitive logic must move server-side in a later architecture phase.
- Verification passed under Node 22: 18 test files / 123 tests, ESLint, TypeScript/Vite production build, artifact audit, and the full desktop/mobile browser workflow.
- The verified static bundle was deployed to the existing `emaas-power-calculator` Azure Static Web App. Production serves generic hashed chunks and reports `Last-Modified: Sat, 22 Aug 2026 22:38:24 GMT`.

## 2026-08-22 Sustainable Gaps Return Path

- The application header now includes a persistent same-tab return link to `https://www.sustainablegaps.com/emaas/` on desktop and mobile.
- The return control is available from every calculator and planning route because it lives in the shared application header.
- All 123 tests, lint, production build, and the browser smoke suite passed under Node 22. The browser suite now protects the governed return URL from regression.
- The verified bundle was deployed to the existing `emaas-power-calculator` Azure Static Web App. A cache-busted production mobile check confirmed the return control is visible, points to the governed SG capability page, and introduces no horizontal overflow or browser errors.

## 2026-08-22 Calculation Verification And Production Update

Canonical source: `/Users/sustainablegaps/Projects/emaas-pro`

- Temporary Power now produces a draft planning brief before any equipment package is released.
- A five-check calculation gate verifies facility and equipment line-item sums, cooling inclusion, total planning load, rental days, and scheduled operating hours.
- The brief is withheld if any displayed result drifts from the calculation source. Passing the gate confirms internal arithmetic only; it is not engineering approval or final equipment selection.
- The 56 kW jobsite trailer worked example and the 28-day rental cycle remain explicit and editable.
- Invalid BESS power factors supplied through URL state now show a visible validation message instead of silently hiding results; zero is no longer replaced by the default value.
- Route changes now return the viewport to the top.
- Monthly equipment-rate normalization now uses the same 28-day rental cycle as the temporary-power schedule and report.
- Reusable monthly-rate selectors now identify `Monthly (28-day cycle)` instead of an unlabeled calendar month.
- Verification passed: 123 tests, TypeScript/Vite production build, ESLint, and the full Playwright desktop/mobile smoke workflow under Node 22.
- The verified bundle was deployed to the existing `emaas-power-calculator` Azure Static Web App. A cache-busted production mobile session on `emaas.pro` displayed `Monthly (28-day cycle)`, 224 scheduled hours, and 28 rental days at eight hours per day, with no overflow or console errors.

---

## 1. THE PRODUCT

**EMaaS.pro Power Console** — energy planning software (BESS, generator, cooling,
hybrid strategy calculators + PDF reports). Live at **https://emaas.pro**.

| What | Where |
|---|---|
| Source of truth | github.com/erikuscs/Power-Calculator (`main` branch) |
| Working clone (MacBook) | `~/Projects/emaas-pro` — on the Mini: `git clone https://github.com/erikuscs/Power-Calculator.git ~/Projects/emaas-pro` |
| Web deploy | Push to `main` → GitHub Actions runs tests → Azure Static Web Apps → emaas.pro |
| iOS app | `ios/` in the repo (Capacitor 8, SPM, bundle id `pro.emaas.app`) |
| Store guide | `docs/APP_STORE_SUBMISSION.md` in the repo |

## 2. WHAT WAS DONE (2026-07-05 → 07-06)

**App engineering**
- Capacitor 8 iOS wrapper: icons, splash, safe-area, native share-sheet PDF
  export (blob downloads don't work in WKWebView). Verified in iPhone 17 simulator.
- Testing: 84/84 unit tests; all 23 routes; wizards end-to-end; PDF blob verified;
  persistence; mobile viewport; adversarial edge-case pass.
- **Bugs found & fixed & deployed:**
  1. Power factor > 1 was accepted in six calculators → bounds enforced.
  2. Airside tonnage used kJ/kg enthalpy in a BTU/lb formula (~2.3× overstated)
     → converted to BTU/lb, validated against ASHRAE psych chart, UI label fixed.
  3. Occupant heat hardcoded 450 BTU/person (seated) → selectable activity level
     (seated 450 / standing 550 / dancing 900) — the Atlanta Botanical Gardens
     tent lesson. 300 dancers = 19-ton swing vs seated default.
- All shipped to `main`, live on emaas.pro, synced into the iOS project.

**Company records** (OneDrive → `Sustainable Gaps/Company Registration & IDs/`)
- Sustainable Gaps LLC: GA domestic LLC formed 11/04/2024, member-managed
  (Erik + Tracy Herring), DBA "Sustainable Ventures"
- **EIN 33-1907024 · D-U-N-S 13-607-1878 · GA Control #24207499 ·
  CA Entity B20250028147 (foreign LLC, Active, all standings Good, SOI due
  03/31/2027) · FinCEN ID 2000-0333-0193**
- Address on all filings: 8735 Dunwoody Place Ste R, Atlanta, GA 30350
- Phone for everything: 813-399-2041 (permanent)
- Filed PDFs collected: GA formation doc, GA 2026 annual registration,
  CA registration, CA Statement of Information

**Apple Developer** (status: WAITING on Apple)
- Business Apple Account created: **developer@sustainablegaps.com**
- Organization enrollment SUBMITTED 2026-07-05 (D-U-N-S 13-607-1878)
- Expect verification email/call (813-399-2041) within ~2–7 days
- If Apple questions company authority → send the GA Formation Document
- After approval: pay $99/yr → Xcode signing (team: Sustainable Gaps LLC) →
  privacy page at emaas.pro/privacy → screenshots → App Store Connect listing →
  archive & upload

**D&B / D-U-N-S** (status: WAITING on D&B, ≤8 business days from 07/05)
- Profile Manager access request submitted; approval comes by email
- Public record currently WRONG: industry "clothing retail," principal
  "Lisa Borowsky" (cross-linked data from the shared registered-agent address)
- Fix-list + business-focus text ready: `Company Registration & IDs/DUNS Update Package.md`

**Sunbelt / EMaaS brand provenance** (status: RESOLVED — proceed)
- Sunbelt holds only unregistered composite applications ("SUNBELT RENTALS
  EMAAS" #98272332, "...ENERGY MANAGEMENT AS A SERVICE" #98272363)
- Evidence file complete: Erik created the EMaaS program at SBR (2023);
  PIP (7/12/24) was purely rental-utilization metrics, never mentioned app/IP;
  same-day eval = Exceeds Expectations; **HR removed the PIP from file in
  writing 8/12/24**; release agreement has no IP terms; SBR remotely wiped
  Erik's computer (forced clean-room = current app cannot derive from SBR code)
- Full fact file + exhibits: OneDrive `Company Registration & IDs/`
  → `EMaaS Provenance & SBR Timeline.md` + `SBR Evidence/` (dated copies, indexed)
- Optional: 1-hr IP attorney read of the release agreement (confirmation only)
- Rule: never reuse Sunbelt deck assets in EMaaS.pro marketing

**OneDrive restoration**
- Original flat folder structure restored (numbered taxonomy dissolved);
  every move logged: `Sustainable Gaps/RESTORE_LOG.csv`
- `personal_key.txt` moved OUT of cloud → MacBook `~/Private-Local/` (rotate if sensitive)
- Home-directory git repo issue: separate session was untangling
  (~/.git pointed at Dashboard-Repos with credential files staged)

## 2b. UPDATE (2026-07-08 evening → overnight)

**Apple: DONE.** Org enrollment approved; $99/yr membership PAID
(order W1584667595, 07/08, developer@sustainablegaps.com,
billing 912 Town Creek Rd, Talking Rock 30175).

**Privacy page: LIVE** at https://emaas.pro/privacy (PR #2 merged, Azure
deployed). Footer links to it; /privacy route + 404 catch-all added.
App Store's hard blocker is cleared.

**Mac Mini progress:** repo cloned at `~/Projects/emaas-pro`, npm install +
build + `cap sync ios` all succeeded, CLI build SUCCEEDED. Stopped at Xcode
signing: Apple ID not yet added to Xcode on the Mini (Team=None) and run
destination was a disconnected physical phone ("Not Your iPhone").

**D&B: REJECTED 07/08** — could not verify Erik as principal (docs lacked
name+title; record still cross-linked to "Lisa Borowsky / clothing retail").
Fix: re-upload GA 2026 Annual Registration / CA SOI / EIN letter, or call D&B.

**→ Remaining submission steps are scripted click-by-click in
`docs/MORNING-CHECKLIST.md` (includes all App Store Connect listing copy).**

## 3. IMMEDIATE NEXT ACTIONS

1. 🔜 **Run docs/MORNING-CHECKLIST.md top to bottom** (~45 min): Xcode
   sign-in → team → simulator → screenshots → archive → upload → listing → submit
2. ⏳ D&B: re-upload principal docs showing name + title (see checklist bottom)
3. Optional: attorney hour (questions pre-written in the Provenance file);
   drop severance-agreement photo + emaas.pro domain receipt into `SBR Evidence/`

## 4. RESUMING WITH CLAUDE ON ANOTHER MACHINE

Claude's session memory lives per-machine; on the Mini, give Claude this file.
Suggested first prompt:
> "Read the handoff at ~/Library/Mobile Documents/com~apple~CloudDocs/EMaaS
> HANDOFF - 2026-07-06.md (also in the repo at docs/HANDOFF.md) and continue
> from the next actions."

Key file locations for any session:
- Repo: github.com/erikuscs/Power-Calculator
- OneDrive: `Sustainable Gaps/Company Registration & IDs/` (records + evidence)
- OneDrive: `Sustainable Gaps/emaas.pro/STATUS - EMaaS iOS Launch.md`
- iCloud: `Sunbelt Rentals/PIP Defense/` (original evidence)

---

## 5. ERIK'S NOTES (add below)

-
