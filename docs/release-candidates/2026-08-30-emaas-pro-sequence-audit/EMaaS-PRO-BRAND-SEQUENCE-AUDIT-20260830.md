# EMaaS Pro Brand and Sequence Audit

Status: `REVIEW EVIDENCE / NOT RELEASED / NOT DEPLOYED`

Audit date: 2026-08-30

Owner and release authority: Erik Herring

Canonical application source: `/Users/sustainablegaps/Projects/emaas-pro`

Canonical public SG entry source: `/Users/sustainablegaps/SG-OFFICE/sustainablegaps-site-prod`

Controlled brand authority:

- `/Users/sustainablegaps/SG-OFFICE/Brand Guidelines/01-Current-SG-Brand/07-Evidence/messaging-system.md`
- `/Users/sustainablegaps/SG-OFFICE/Brand Guidelines/01-Current-SG-Brand/17-Brand-Governance-Operations-2026/02-Change-Control/DIGITAL-BRAND-IMPLEMENTATION-CORRECTION-MATRIX-20260830.md`
- `/Users/sustainablegaps/SG-OFFICE/Brand Guidelines/01-Current-SG-Brand/17-Brand-Governance-Operations-2026/02-Change-Control/DIGITAL-BRAND-IMPLEMENTATION-STEP-3-OWNER-AUTHORIZATION-20260830.md`

Exact EMaaS candidate package:
`/Users/sustainablegaps/Projects/emaas-pro/docs/release-candidates/2026-08-30-emaas-pro-brand`

## Scope and protected boundary

This audit checked the conference-facing route from the Sustainable Gaps EMaaS capability page into the live EMaaS Pro workspace, Temporary Power worked example and requirements path, review brief, Privacy page, mobile navigation, and the governed return route to Sustainable Gaps. It also rendered the already-assembled exact brand candidate locally for direct live-versus-candidate comparison.

No calculation, engineering, data, PDF, PWA identity, Capacitor, Xcode/native, deployment, or user-owned dirty source was edited. No dependency install, production build, bulk copy, or public release was performed.

## Sequence matrix

| Step | Sequence path | Current target-surface result | Health | Evidence and remaining limit |
| --- | --- | --- | --- | --- |
| 1 | `https://www.sustainablegaps.com/emaas/` | The governed SG capability page loads on desktop and 390 px mobile, introduces EMaaS Pro as a planning system, retains the professional-review boundary, and has no horizontal overflow or console error in the observed states. | `PASS` | Screenshots `01-sg-emaas-entry-desktop-1440.png` and `07-sg-emaas-entry-mobile-390.png`. |
| 2 | `Open the EMaaS Pro workspace` -> `https://emaas.pro/` | The same-tab CTA reaches the EMaaS dashboard. The destination provides an immediate Back to Sustainable Gaps control. | `PASS` | Live navigation observed. Production is functionally connected but visually stale. |
| 3 | `https://emaas.pro/` dashboard | Dashboard loads, workflow cards and navigation are present, and no browser error was observed. | `FUNCTIONAL PASS / BRAND FAIL` | Production uses system fonts, the retired gold lightning mark, `EMaaS.pro` naming, and no approved SG horizontal logo. Screenshot `02-emaas-dashboard-desktop-1440.png`. |
| 4 | Dashboard/mobile navigation -> `/scenarios/temp-power` | Desktop and mobile navigation reach the Temporary Power worked example. The mobile menu opens as a dialog, moves focus to Close, exposes the route, closes through the route selection, and does not overflow at 390 px. | `PASS` | Screenshots `09-emaas-mobile-navigation-open-390.png`, `03b-emaas-temp-power-start-desktop-1440-recheck.png`, and `10-emaas-temp-power-mobile-390.png`. |
| 5 | Worked example -> `Use as My Starting Point` -> requirements | The requirements dialog opens, moves focus to its heading, exposes labeled client/project, voltage, schedule, facility, and continuity controls, and enables Done after required context is supplied. | `PASS WITH UX/A11Y RISKS` | Desktop and mobile screenshots `04-emaas-temp-power-inputs-desktop-1440.png` and `11-emaas-temp-power-inputs-mobile-390.png`. The disabled Done control looks active, and the dialog does not trap focus. |
| 6 | Requirements -> `Done` -> planning brief | With non-sensitive test context entered, Done returns to the planning brief. The 56.0 kW, 240 V, 672-hour, five-open-check sequence remains visible; the UI says arithmetic agreement is not engineering approval. | `PASS` | Screenshot `05-emaas-temp-power-review-desktop-1440.png`; no console errors. No calculation values or model logic were changed. |
| 7 | Planning brief -> Print / Save / Share Draft | All three actions are visibly wired, have a live-region status path, and have fallback/error handling in controlled source. Fresh unit/e2e tests cover the visible actions and the main workflow. | `SOURCE/TEST PASS / LIVE SIDE EFFECT NOT TRIGGERED` | No print, download, native share, or external transmission was initiated during this audit. |
| 8 | Footer -> `/privacy` | Direct route and footer route load on desktop and 390 px mobile with the local-only/no-user-data statement, offline statement, PDF-sharing boundary, contact, and Back to calculators path. | `PASS` | Screenshots `06b-emaas-privacy-desktop-1440-recheck.png` and `12-emaas-privacy-mobile-390.png`. Policy claims were checked against source behavior and existing tests, not independently network-forensically certified. |
| 9 | EMaaS header -> `Back to Sustainable Gaps` | The persistent control returns to `https://www.sustainablegaps.com/emaas/`; the correct SG H1 is rendered and no browser error was observed. | `PASS` | Live same-tab navigation observed from Privacy. |
| 10 | Direct-route recovery | React includes a wildcard Not Found page with a Back to Dashboard action; Azure Static Web Apps rewrites non-asset paths to `/index.html`; direct live Temporary Power and Privacy loads both succeeded. | `PASS FOR CHECKED ROUTES` | This is not a fresh exhaustive live sweep of every calculator route. The full existing local browser smoke test passed. |

## Exact candidate verification

The controlled package was already assembled. It was not applied a second time.

- Branch / Git anchor: `codex/emaas-multi-device-reconcile` / `2c27ed215942836177c2607f571074424f83f6b2`.
- `PACKAGE-SHA256.txt`: `5/5 PASS`.
- `OUTPUT-SHA256.txt`: `14/14 PASS`.
- Correction matrix SHA-256: `431c065deb13eee53b60e611dd61c7ac7754164336f726d813bbdd16a4f73ab4`.
- Step 3 authorization SHA-256: `f3c30a536d47b610cae50c5575f5ecabdf37b857257f945cf77a0754186d1ed9`.
- `git apply --reverse --check` on the exact patch: `PASS`, confirming the exact hunk set is present.
- Node: `v22.23.2`.
- Fresh unit tests: `18/18` files and `123/123` tests passed.
- Fresh lint: `PASS`.
- Fresh local desktop/mobile browser smoke: `PASS`.
- Production build: not rerun because the Data volume was below the 50 GiB operating floor and the task prohibited large/repeated output. The package's prior controlled build evidence remains in `docs/SOURCE-MAP.md`; it is not represented here as a fresh build.

Fresh local rendering confirmed the candidate uses:

- exact first reference `Energy Management as a Service (EMaaS) Pro`;
- later web-shell reference `EMaaS Pro`;
- approved SG reversed-dark horizontal logo at 160 px;
- Sora for headings and Source Sans 3 for body/UI; and
- the controlled copper/slate palette without changing the Temporary Power layout or workflow.

Candidate screenshots: `13-candidate-disclaimer-desktop-1440.png`, `14-candidate-dashboard-desktop-1440.png`, `15b-candidate-temp-power-desktop-1440-recheck.png`, and `16-candidate-temp-power-mobile-390.png`.

## Remaining brand and release gates

1. **Production is stale.** The live domain still serves the older gold/system-font shell. Passing local checks do not correct that target surface.
2. **Font redistribution notice is not assembled.** The candidate publicly serves controlled Sora and Source Sans 3 `.woff2` files, but neither the repository nor controlled font package currently contains an OFL/LICENSE/NOTICE file. The controlled rights record requires the applicable copyright notice and complete license to accompany redistribution.
3. **Protected PWA/browser identity is still old.** `public/favicon.svg` remains the gold lightning mark with `#c89a3c`; `vite.config.ts` still declares `EMaaS.pro Power Console - Sustainable Gaps` and short name `EMaaS.pro`. Step 3 explicitly withheld authority to change PWA identity, so this was not edited.
4. **Protected PDF identity is still old.** `src/components/pdf/PdfReportShell.tsx` still emits creator `Sustainable Gaps EMaaS.pro`, footer `EMaaS.pro calculations`, and `APP_BRAND.reportBrand` remains `Sustainable Gaps EMaaS`. Step 3 explicitly withheld authority to change PDFs, so this was not edited.
5. **Two visible later-use labels remain outside the frozen web-shell patch.** The sidebar says `EMaaS Dashboard` and the footer uses `Sustainable Gaps EMaaS`, while the controlled messaging rule says later public use is `EMaaS Pro`. An exact owner decision is needed before expanding the frozen candidate.
6. **Disabled-state clarity.** `TempPowerWizard.tsx` correctly disables Done until a reviewable brief exists, but the shared `Button.tsx` has no disabled visual class. After `Use as My Starting Point` clears the two required context fields, Done looks active while being disabled. The close control prevents a hard dead end, but the state can feel broken.
7. **Modal keyboard containment.** The initial disclaimer moves focus to Continue but does not trap focus or support Escape; the requirements dialog moves and restores focus and supports Escape but does not trap focus. This is an accessibility risk, not a claim of full WCAG failure.
8. **Fresh device/assistive-technology and post-deploy cache checks remain open.** Browser emulation and automation are not physical-device, screen-reader, standalone PWA, native iOS, or cache-busted production proof.

## Release recommendation

`GO FOR OWNER REVIEW OF THE EXACT ISOLATED WEB-SHELL CANDIDATE; NO-GO PUBLIC DEPLOYMENT AS CURRENTLY PACKAGED.`

The shortest safe path is to add and checksum the applicable OFL copyright/license accompaniment, obtain an explicit owner disposition for the intentionally protected PWA/favicon and PDF naming, and then release only the frozen web-shell hunk/assets—not the broad dirty worktree. After any separate deployment decision, run cache-busted desktop/mobile verification of the SG entry, dashboard, Temporary Power worked example and requirements dialog, Privacy, font/logo responses, and Back to Sustainable Gaps.

## Files and storage

- Application source files changed by this audit: none.
- Live/public systems changed: none.
- Browser localStorage used: non-sensitive workflow test values only; no form submission or external data transmission.
- Audit evidence location: this folder.
- Rejected transient screenshots removed before handoff: three.
- Retained audit evidence size before this report: approximately `1.2 MiB`.
- Data volume after audit: approximately `19 GiB` free, still below the 50 GiB operating floor.
