# EMaaS Pro Current Handoff

Updated: 2026-09-11
Status: `LOCAL RELEASE CANDIDATE / NOT PUSHED / NOT DEPLOYED`

## Current product scope

The current candidate includes:

- guided temporary-power planning with voltage, transformer, switchgear, cable, neutral, continuity, runtime, and field-review boundaries;
- propane and electric temporary-heating planning without steam scope;
- cooling planning with area or width/height/depth inputs;
- integrated estimate preparation;
- linked site-fit, one-line, equipment explanation, and conceptual space planning;
- planning safeguards that withhold equipment conclusions for zero requested load.

Independent estimator and regression reviews informed the implementation. The calculation suite, brand gate, build audit, and browser smoke suite are the repeatable local acceptance gates.

## Brand state

- The header uses the exact registered horizontal reversed-dark SG logo.
- Browser/PWA implementation copies use exact files from the released SG Favicon and App Icon Family V3 (`SG-FAVICON-FAMILY-001`).
- Native icon and launch-screen files are 1024 px and 2732 px implementation renders derived from the exact outlined V3 app-icon vector and current palette.
- Sora and Source Sans 3 controlled binaries are used for web and PDF presentation roles.
- The build blocks missing or changed controlled implementation assets, off-palette color literals, RGB/HSL bypasses, and retired gold terminology.

The V3 family is released for the Sustainable Gaps website and allowed for PWA and app-store icon use, but EMaaS remains a separate destination. The central SG brand release gate is currently blocked by logo-manifest ledger drift, and the broader SG brand integrity gate has unresolved rights, live-type badge, and hosted-signature findings outside this repository. Those central controls and EMaaS device proofs remain separate from this local implementation.

## Release boundary

No current commit has been pushed, merged, deployed, submitted to App Store Connect, or accepted on a physical device as part of this work.

Before any release:

1. confirm the exact commit and target;
2. obtain a passing central SG brand gate and confirm the exact V3 files for the EMaaS destination;
3. run the Node 22 gates from a clean checkout;
4. verify the generated PWA manifest and brand assets in `dist/`;
5. sync and build iOS, then verify iPhone and iPad target surfaces;
6. perform the separately authorized push/PR/deployment;
7. verify the cache-busted production or distribution surface.

## Resume here

Start in `/Users/sustainablegaps/Projects/emaas-pro`, read this repository front door and [SOURCE-MAP.md](SOURCE-MAP.md), check `git status`, and do not treat dated files under `docs/release-candidates/` as current authorization.
