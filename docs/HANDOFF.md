# EMaaS Pro Current Handoff

Updated: 2026-09-13
Status: `WEB/PWA RELEASED / LIVE VERIFIED`

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
- one governed diesel-consumption source using the complete Sunbelt Rentals 20-2,250 kW size/load table across the fuel, temporary-power, and hybrid workflows.

Independent estimator and regression reviews informed the implementation. The calculation suite, brand gate, build audit, and browser smoke suite are the repeatable local acceptance gates.

The representative acceptance case is 1,200 kW peak / 800 kW base, 250 kW / 575 kWh BESS fleet units, 480 V source, 208 V load, 0.8 power factor, 100 ft route, carried neutral, 200 × 120 ft site, eight peak hours within continuous 24/7 operation, one 28-day billing cycle (672 hours), $8.50 per gallon diesel, and N+1 continuity. It must reconcile to four 500 kW generators (three duty plus one standby), seven BESS units, 1,500 kW firm generator capacity, voltage-specific transformer guidance, balanced 700 kW and 500 kW branch circuits, 170 total 50-foot cable pieces, recharge energy and losses in the generator fuel basis, and the same package and fit verdict in Site Fit, the PDF, and Build Estimate.

## Brand state

- The header uses the exact registered horizontal reversed-dark SG logo.
- Browser/PWA implementation copies use exact files from the released SG Favicon and App Icon Family V3 (`SG-FAVICON-FAMILY-001`).
- Native icon and launch-screen files are 1024 px and 2732 px implementation renders derived from the exact outlined V3 app-icon vector and current palette.
- Sora and Source Sans 3 controlled binaries are used for web and PDF presentation roles.
- The build blocks missing or changed controlled implementation assets, off-palette color literals, RGB/HSL bypasses, and retired gold terminology.

The 2026-09-13 independent brand review matched the current logo, all 14 V3 browser/PWA assets, four font binaries, and both complete OFL notices to the controlled source and built output. The former logo-ledger and font-rights holds are resolved. The broader brand integrity gate has zero failures, and the central release gate passes after the quarantined-SVG classification correction.

## Release boundary

Erik Herring authorized correction of the older live `emaas.pro` build on 2026-09-13 after the exact version mismatch was demonstrated. The existing Azure target is `emaas-power-calculator` in `rg-sg-bess-platform`, with `emaas.pro` and `www.emaas.pro` both reporting Ready. Native signing, App Store submission, and physical-device acceptance are outside this web release.

## Live release evidence

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
