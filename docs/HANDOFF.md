# EMaaS Pro Current Handoff

Updated: 2026-09-13
Status: `WEB RELEASE AUTHORIZED / VALIDATION IN PROGRESS`

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

Independent estimator and regression reviews informed the implementation. The calculation suite, brand gate, build audit, and browser smoke suite are the repeatable local acceptance gates.

The representative acceptance case is 1,200 kW peak / 800 kW base, 250 kW / 575 kWh BESS fleet units, 480 V source, 208 V load, 0.8 power factor, 100 ft route, carried neutral, 200 × 120 ft site, eight peak hours, 30 days, and N+1 continuity. It must reconcile to four 500 kW generators (three duty plus one standby), seven BESS units, 1,500 kW firm generator capacity, voltage-specific transformer guidance, balanced 700 kW and 500 kW branch circuits, 170 total 50-foot cable pieces, and the same package and fit verdict in Site Fit, the PDF, and Build Estimate.

## Brand state

- The header uses the exact registered horizontal reversed-dark SG logo.
- Browser/PWA implementation copies use exact files from the released SG Favicon and App Icon Family V3 (`SG-FAVICON-FAMILY-001`).
- Native icon and launch-screen files are 1024 px and 2732 px implementation renders derived from the exact outlined V3 app-icon vector and current palette.
- Sora and Source Sans 3 controlled binaries are used for web and PDF presentation roles.
- The build blocks missing or changed controlled implementation assets, off-palette color literals, RGB/HSL bypasses, and retired gold terminology.

The 2026-09-13 independent brand review matched the current logo, all 14 V3 browser/PWA assets, four font binaries, and both complete OFL notices to the controlled source and built output. The former logo-ledger and font-rights holds are resolved. The broader brand integrity gate has zero failures, and the central release gate passes after the quarantined-SVG classification correction.

## Release boundary

Erik Herring authorized correction of the older live `emaas.pro` build on 2026-09-13 after the exact version mismatch was demonstrated. The existing Azure target is `emaas-power-calculator` in `rg-sg-bess-platform`, with `emaas.pro` and `www.emaas.pro` both reporting Ready. Native signing, App Store submission, and physical-device acceptance are outside this web release.

Before any release:

1. run the Node 22 gates from the exact release tree;
2. verify the generated PWA manifest and brand assets in `dist/`;
3. fast-forward `main` to the reviewed release commit and let the existing GitHub Actions workflow publish it;
4. confirm the workflow, Azure resource, custom domains, remote commit, and cache-busted production surface;
5. record the final live evidence and recovery commit.

## Resume here

Start in `/Users/sustainablegaps/Projects/emaas-pro`, read this repository front door and [SOURCE-MAP.md](SOURCE-MAP.md), check `git status`, and do not treat dated files under `docs/release-candidates/` as current authorization.
