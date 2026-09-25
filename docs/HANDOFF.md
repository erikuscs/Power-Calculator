# EMaaS Pro Current Handoff

Updated: 2026-09-25
Status: `CALCULATION CORRECTION LIVE / PRODUCTION VERIFIED`

## Current product scope

The current candidate includes:

- guided temporary-power planning with voltage, transformer, switchgear, cable, neutral, continuity, runtime, and field-review boundaries;
- propane and electric temporary-heating planning without steam scope;
- cooling planning with area or width/height/depth inputs;
- integrated estimate preparation;
- linked site-fit, one-line, equipment explanation, and conceptual space planning;
- reconciled hybrid project packages that keep generator duty/standby counts, actual BESS kW/kWh, cable pieces, equipment envelopes, site-fit inputs, PDF content, and estimate lines on one calculation basis;
- named branch power zones with 50-foot source/branch cable-piece schedules and an explicit neutral decision;
- a dimensioned conceptual 3D equipment envelope that supplements the linked one-line without presenting itself as a construction drawing;
- planning safeguards that withhold equipment conclusions for zero requested load.
- one governed owner-provided diesel-consumption table covering 20-2,250 kW generator classes across the fuel, temporary-power, and hybrid workflows; the product UI remains supplier-neutral.
- BESS selection based on verified continuous output and usable energy; motor-start and protection details remain later vendor/engineering verification and do not alter the early estimate.
- a benchmark architecture review in the hybrid UI and PDF that identifies measured-versus-nameplate load basis, continuous BESS ratings, generator duty/standby counts, firm capacity after one generator is unavailable, controlled recharge, and single-source or no-maintenance-reserve red flags.

Independent estimator and regression reviews informed the implementation. The calculation suite, brand gate, build audit, and browser smoke suite are the repeatable local acceptance gates.

The current representative acceptance case is a 2,000 A peak / 500 A continuous request at a 480 V, three-phase source and 0.80 planning power factor. The calculated customer-load bases are 1,330.2 kW protected peak and 332.6 kW continuous. The automatic selector compares all five governed BESS options and chooses two Atlas Copco ZBC 250-575 units for 500 kW continuous capacity. The obtainable package also uses three duty 500 kW generators; both source plants use N with no standby requirement. The generator plant carries the peak load and retains 169.8 kW of controlled recharge headroom; generator and BESS ratings are never summed as customer demand. The source schedule requires five 400 A runs per phase. The linked one-line includes source/BESS breakers, DEIF control, 480 V switchgear, 480-to-240 V transformation, the customer service main, and ten 240 V single-phase trailer connection points. Because trailer nameplates and locations were not provided, the example does not invent per-trailer kW, branch current, branch cable quantity, or phase assignment. Motor-start, protection, exact trailer loads, equipment dimensions, branch conductors, and final phase balance remain later vendor/field/engineering verification boundaries.

The customer-facing example is rendered from the calculator-backed `/examples/2000a-hybrid` route by `npm run generate:2000a-example`. The route contains the graphical electrical one-line, linked site envelope, exact sizing summary, browser print action, and a link to the controlled public PDF. The generator command captures that route into `public/examples/EMAAS-Pro-2000A-Hybrid-Linked-Plan.pdf` and `.png`, with review copies under `output/`; it is the PDF integration boundary and does not depend on `HybridEnergyPdf.tsx`. Regeneration and visual/byte-identity checks are required whenever the route changes. The controlled example intentionally excludes historical customer telemetry and daily fuel projections.

## Brand state

- The header uses the exact registered horizontal reversed-dark SG logo.
- Browser/PWA implementation copies use exact files from the released SG Favicon and App Icon Family V3 (`SG-FAVICON-FAMILY-001`).
- Native icon and launch-screen files are 1024 px and 2732 px implementation renders derived from the exact outlined V3 app-icon vector and current palette.
- Sora and Source Sans 3 controlled binaries are used for web and PDF presentation roles.
- The build blocks missing or changed controlled implementation assets, off-palette color literals, RGB/HSL bypasses, and retired gold terminology.

The 2026-09-13 independent brand review matched the current logo, all 14 V3 browser/PWA assets, four font binaries, and both complete OFL notices to the controlled source and built output. The former logo-ledger and font-rights holds are resolved. The broader brand integrity gate has zero failures, and the central release gate passes after the quarantined-SVG classification correction.

## Release boundary

The 2026-09-25 release corrects BESS runtime and sizing, the 30%-to-80% coverage readout for automatically selected equipment, cooling envelope geometry, psychrometric validation, modular large-generator selection, 200 A-and-below banded cable planning, 28-day rental defaults, and removal of invented generic fuel/BESS scope. It passed 31 test files / 205 tests, TypeScript, lint, a production PWA build, the isolated browser smoke suite, and three independent read-only reviews. PR #5 was squash-merged as `e4ee9887543d26fae1fdb36777cf0e9e7c9b2db9`; Azure Actions run `36109173052` completed successfully. Both production domains, the critical calculator routes, the 2,000 A worked example, and the controlled PDF checksum were verified on the live target.

Erik Herring authorized correction of the older live `emaas.pro` build on 2026-09-13 after the exact version mismatch was demonstrated. The existing Azure target is `emaas-power-calculator` in `rg-sg-bess-platform`, with `emaas.pro` and `www.emaas.pro` both reporting Ready. Native signing, App Store submission, and physical-device acceptance are outside this web release.

## Historical live release evidence (2026-09-13 baseline)

- Release commit `bb1b77010e365cf8b20dc08e0956050a2fed0052` was pushed to the protected GitHub `main` branch and independently read back before publication.
- GitHub Actions run `34803577367` completed successfully and published to the existing Azure Static Web App `emaas-power-calculator` in `rg-sg-bess-platform`.
- `https://emaas.pro/` and `https://www.emaas.pro/` returned HTTP 200, the current application title, security headers, current PWA manifest, and current bundle after publication.
- The released logo, favicon, controlled webfonts, and both OFL notices matched the reviewed local production files byte-for-byte.
- Cache-busted live browser review passed the dashboard, cooling dimensions/cubic-feet option, propane/electric heating, Site Fit and one-line, conceptual equipment envelope, and hybrid workflow.
- The live 1,200/800 kW case with 250 kW / 575 kWh BESS and carried neutral returned four 500 kW generators, seven BESS units, 1,500 kW firm generation, and 160 unzoned 50-foot cable pieces. The automated named 700/500 kW branch-zone case remains the authoritative 170-piece cross-surface acceptance because it adds the two branch feeder schedules to the source schedule.
- An already-open browser tab initially retained the previous service-worker shell, then updated to the released application after one normal reload. Staff with a tab left open from before the release may need that single reload.
- Recovery reference for the former production build is commit `d51cb37d1af9699bcb1db30fe2d0faa25a3db64f`.

The browser/PWA release is closed. Native signing, App Store submission, physical-device acceptance, final engineering, and vendor selection remain separate gates.

## Resume here

Start in `/Users/sustainablegaps/Projects/emaas-pro`, read this repository front door and [SOURCE-MAP.md](SOURCE-MAP.md), check `git status`, and do not treat dated files under `docs/release-candidates/` as current authorization.
