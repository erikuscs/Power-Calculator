# EMaaS Pro Quality Assurance

Status: `CURRENT LOCAL QA PASSED 2026-09-11 / NOT RELEASED OR DEPLOYED`

## Required automated gates

Run under Node 22:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
npx cap sync ios
npm run audit:brand
```

The final brand audit is intentionally after the Capacitor sync so a stale native web bundle cannot pass behind a current web build.

## Required review surfaces

- Desktop and narrow mobile browser layouts.
- Keyboard navigation, focus, dialogs, and overflow.
- Temporary power, cooling, heating, estimate, site-fit, and one-line workflows.
- Zero-load withholding and calculation-regression checks.
- PDF generation with Sora/Source Sans 3 loading and complete material inputs.
- PWA manifest icons, maskable behavior, browser tab appearance, and offline update behavior.
- iPhone and iPad icon, launch screen, safe areas, rotation, PDF share, and offline behavior.

## Independent crew review — 2026-09-11

Three independent reviews found no P0 issue and identified the following release blockers in the pre-correction tree:

- broken PWA icon paths and legacy manifest colors/naming;
- retired lightning artwork in Capacitor and iOS assets;
- native assets and fonts missing from the brand checksum gate;
- a stale iOS packaged web bundle;
- PDF typography and EMaaS naming drift;
- copper contrast and Resolved Mint semantic misuse;
- unused starter icons and generated 3D images;
- stale release, business, and QA documents in active repository locations.

The current correction addresses these items in source.

## Verified results — 2026-09-11

- `npm test`: passed, 25 files and 156 tests.
- `npm run lint`: passed.
- `npm run build`: passed, including the controlled-brand audit, TypeScript, production PWA build, and production-artifact audit.
- `npm run test:e2e`: passed at desktop and narrow-mobile viewports. The flow covers temporary power, temporary heating, cooling validation, estimate transfer, site fit, one-line content, persistence, overflow, and an actual browser PDF download using the controlled report fonts.
- `npx cap sync ios`: passed; the built web application was recopied into the iOS package.
- Final `npm run audit:brand`: passed after the native sync.
- `shasum -a 256 -c docs/BRAND-ASSET-MANIFEST-SHA256.txt`: passed for every registered web, PWA, font, Capacitor, and iOS asset.
- PWA manifest readback: passed; all declared icons exist in the built artifact and the current name/theme values are present.
- Compiled web and copied iOS bundle scan: passed; no retired SG color value was found.
- Unsigned iOS Simulator compilation with Xcode: passed (`** BUILD SUCCEEDED **`). Derived data is isolated at `/Users/sustainablegaps/SG-OFFICE/tmp/agent-work/emaas-brand-qa-20260911/DerivedData`.

The four PDF component smoke tests use React PDF's built-in Helvetica only inside the Node test environment; browser E2E performs the actual PDF download with Sora and Source Sans 3. This keeps unit tests filesystem-independent while preserving a real target-surface font check.

Remaining release work is deliberately separate: exact-file owner review of the micro-identity candidate, brand-steward resolution of the two blocked central source masters, signed-device/App Store review, assistive-technology review, deployment authorization, and cache-busted live verification.
