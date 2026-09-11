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
- Browser/PWA implementation copies use the selected files from the governed SG Micro Identity System V2 candidate.
- Native icon and launch-screen files use the same governed candidate geometry and current palette.
- Sora and Source Sans 3 controlled binaries are used for web and PDF presentation roles.
- The build blocks missing or changed controlled implementation assets, off-palette color literals, RGB/HSL bypasses, and retired gold terminology.

The micro-identity family remains an owner-review candidate until its small-size and device proofs are accepted. The central SG brand release gate also has unresolved source-master findings outside this repository. Both gates remain separate from this local correction.

## Release boundary

No current commit has been pushed, merged, deployed, submitted to App Store Connect, or accepted on a physical device as part of this work.

Before any release:

1. confirm the exact commit and target;
2. obtain a passing central SG brand gate and exact micro-identity owner decision;
3. run the Node 22 gates from a clean checkout;
4. verify the generated PWA manifest and brand assets in `dist/`;
5. sync and build iOS, then verify iPhone and iPad target surfaces;
6. perform the separately authorized push/PR/deployment;
7. verify the cache-busted production or distribution surface.

## Resume here

Start in `/Users/sustainablegaps/Projects/emaas-pro`, read this repository front door and [SOURCE-MAP.md](SOURCE-MAP.md), check `git status`, and do not treat dated files under `docs/release-candidates/` as current authorization.
