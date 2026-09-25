# EMaaS Pro Quality Assurance

Status: `WEB/PWA RELEASE LIVE VERIFIED 2026-09-13`

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

## Sunbelt diesel fuel table correction - 2026-09-24

- The generic four-point diesel BSFC curve was replaced by the complete Sunbelt Rentals 20-2,250 kW gallons-per-hour table at 25%, 50%, 75%, and 100% load.
- A data-lock regression checks all 100 published table coordinates exactly, plus generator-size interpolation, load interpolation, below-quarter-load handling, and multi-generator aggregation.
- The standalone diesel calculator, temporary-power calculation, quick hybrid comparison, and detailed hybrid project model now consume the same source module.
- Natural-gas planning remains a separate model and is not represented as Sunbelt diesel-table data.
- Final gates passed: 27 test files and 169 tests, lint, controlled-brand production build and artifact audit, desktop/mobile browser smoke including the rendered 500 kW half-load value, Capacitor iOS sync, and the post-sync brand audit.
- An independent read-only reviewer compared all 25 ratings and 100 fuel cells directly with the owner-provided PDF and found zero mismatches. Its sole P3 concern - a self-referential table-lock test - was corrected with a separate PDF-derived expected-data fixture, followed by a fresh full test and lint pass.

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
- Unsigned iOS Simulator compilation with Xcode: passed (`** BUILD SUCCEEDED **`). Its isolated DerivedData was removed from the controlled disposable scratch lane after verification.

## Reconciled hybrid-planning correction — 2026-09-13

### Hybrid benchmark architecture gate — 2026-09-24

- Hybrid results and PDFs now state whether the load basis is measured demand or a panel/transformer nameplate.
- Every hybrid report includes continuous BESS power and usable energy, generator duty/standby topology, firm capacity after one generator is unavailable, protected-load headroom, and controlled recharge power.
- A one-generator recommendation is visibly red-flagged as a single-failure point. A modular plant without a standby unit is separately warned as lacking maintenance reserve.
- The customer-facing worked example uses only the 2,000 A peak / 500 A continuous request at a 480 V, three-phase source and 0.80 planning power factor. Historical customer peak telemetry is excluded from the route and generated artifact.
- The live route derives three duty 500 kW generators, automatically selects two Atlas Copco ZBC 250-575 units for 500 kW continuous BESS capacity after comparing all five governed options, applies N with no standby requirement, and preserves 169.8 kW of generator recharge headroom after the 1,330.2 kW protected peak. Generator and BESS ratings are not added as customer demand.
- The graphical one-line includes separate generator and BESS breakers, DEIF control, 480 V switchgear, 480-to-240 V transformation, the customer service main, and ten single-phase trailer connection points. The source cable basis is five 400 A runs per phase; per-trailer load, current, branch cable quantity, and phase assignment remain withheld until trailer nameplates and locations are verified.
- `npm run generate:2000a-example` captures the live route into the controlled public PNG/PDF without using `HybridEnergyPdf.tsx`. The route, generated assets, HTTP content type, and served/public byte identity must all pass before release. Deployment remains a separate authorization.

### Continuous-rating correction — 2026-09-24

- The active rental BESS selector is limited to current source-backed fleet classes: portable 5/7, Generac MBE30 24/90, Viridi RPS150 30/150, Moxion MP75-600, and Atlas Copco ZBC 250-575.
- BESS unit quantity, installed power, paralleling, load eligibility, charge power, one-line, quote, Site Fit handoff, and runtime now use verified continuous kW. Peak/model kW is descriptive only and never treated as continuous capacity.
- The Moxion MP75-600 is modeled at 40 kW continuous and 530 kWh usable; its 75 kW rating is limited to one hour. The Atlas Copco ZBC 250-575 is modeled at 250 kW continuous and 518 kWh net energy.
- Battery-first dispatch uses the owner-provided 30% generator-start and 80% generator-stop thresholds. Fuel is zero during BESS-only operation; generator fuel is counted only while carrying the live load and aggregate continuous BESS charging.
- The unverified legacy 300 kW / 1,200 kWh and 600 kW / 2,400 kWh selections were removed. Viridi's RPS1200 was verified as a manufacturer product, but it is not represented as a current Sunbelt rental unit.
- User-facing language reports fuel reduction or fuel increase without benefit-promising terminology.

- The generator duty/standby calculation, actual BESS energy rating, recharge accounting, and all-generator comparison now use one shared calculation basis.
- Hybrid dispatch is modeled as an explicit operating cycle: the BESS carries the protected load with zero fuel burn from 80% to the 30% generator-start threshold; the generator then carries the live load and fast-charges the BESS toward 80% before shutdown.
- The representative 1,200/800 kW N+1 regression sizes BESS inverter power for the full protected peak and generator firm capacity for the peak load plus modeled recharge reserve. Actual charge limits and EMS/ATS settings remain vendor-verification items.
- The one-line, source/branch 50-foot cable schedule, neutral explanation, dimensioned 3D envelope, Site Fit handoff, PDF, and Build Estimate all consume the reconciled package. The balanced acceptance case carries the same 170-piece total and fit verdict into Site Fit.
- The browser workflow verifies named 700 kW and 500 kW branches, a balanced 1,200 kW zone total, a real PDF download, exact-package Site Fit synchronization, and imported generator, BESS, fuel, distribution, and cable quote lines.
- Browser testing identified and corrected a numeric `Zone Name` input and voltage-independent transformer reminder before acceptance.
- Fuel comparison labels report reduction or increase after recharge losses; they do not imply a benefit when the entered scenario does not produce one.
- A cold independent review found five cross-surface/edge-case contradictions, then three follow-up edge cases and one final visualization mismatch. Every item was corrected and independently rechecked before commit, with no remaining P0/P1 finding. The fixes cover Site Fit cable/layout/constraint reconciliation, constrained placement coordinates, PDF branch-voltage labeling, equal-load zero-window 24-hour comparisons, stale-package invalidation, and malformed or unbalanced-zone handoff blocking.
- `npm test` passed all 26 files and 163 tests; `npm run lint`, `npm run build`, and the expanded `npm run test:e2e` suite passed.
- `npx cap sync ios` and the post-sync controlled brand audit passed. A fresh unsigned iOS Simulator build also completed with `** BUILD SUCCEEDED **`; its isolated DerivedData was removed after verification.
- Final engineering, manufacturer selection, cable ampacity/voltage drop, protection, grounding, site clearances, rates, logistics, physical-device verification, and deployment remain separate gates.

## Released V3 artwork alignment — 2026-09-11

- The complete released V3 monogram family passed its authoritative 55-file checksum manifest before promotion into EMaaS Pro.
- Browser, PWA, maskable, Safari pinned-tab, Capacitor, iOS app-icon, and iOS launch-screen assets are registered in the local checksum gate.
- The 1024 px app icon and 2732 px light and dark launch screens were visually inspected for centering, clipping, contrast, and absence of obsolete artwork.
- `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` passed after the V3 replacement. The existing calculation suite remains at 25 files and 156 passing tests.
- The built PWA contains every declared manifest icon and the complete browser icon set, including the 20, 24, 128, and monochrome Safari variants.
- `npx cap sync ios`, the post-sync brand audit, and the registered-asset checksum verification passed.
- A fresh unsigned iOS Simulator compilation passed (`** BUILD SUCCEEDED **`) with DerivedData kept in the controlled disposable scratch lane and removed after verification.

The four PDF component smoke tests use React PDF's built-in Helvetica only inside the Node test environment; browser E2E performs the actual PDF download with Sora and Source Sans 3. This keeps unit tests filesystem-independent while preserving a real target-surface font check.

## Web release brand clearance — 2026-09-13

- Independent comparison matched the exact registered horizontal reversed-dark logo, all 14 V3 browser/PWA assets, four font binaries, and both complete OFL notices across the controlled brand source, repository implementation, and production build.
- Current authority hashes: logo-system manifest `ae3a0020b75d13d20a32c1e8898b74ef94e9bcb7a44d00a0c1a5a7e54d1a234b`, V3 release manifest `8ec3b63b91749374bb9d55a2c7c5576df4b857729c1c8c1eb0872e0d5a1c8396`, font-rights record `71e2adace4831122d377a89452143a2eec74614ec4edd5cefe277f13872a6dc0`, and release ledger `4e8ccc1c457057043cea9065725b238a797fcda9dcff293ee330a487208539d6`.
- The broader brand integrity gate completed with 12 PASS, one `.DS_Store` warning, and zero failures. The central release gate completed with zero errors and zero warnings after a quarantined-evidence classification correction that also prohibits quarantine paths from becoming active ledger sources.
- The existing Azure resource, subscription, domains, and account authority were read back using official Az PowerShell modules.
- Final Node 22 gates passed: 26 test files and 163 tests, lint, controlled-brand production build and artifact audit, and the expanded browser E2E suite.
- Protected-branch release commit `bb1b77010e365cf8b20dc08e0956050a2fed0052` was read back from GitHub; Actions run `34803577367` completed successfully against the existing Azure Static Web App.
- Both production domains returned HTTP 200 with the current title, security headers, current PWA manifest, and current bundle. Released logo, favicon, controlled webfonts, and both font-license files matched the local production assets byte-for-byte.
- Cache-busted production browser review passed the new dashboard navigation, cooling dimensions/cubic-feet input, heating plan, Site Fit/one-line/3D envelope, and hybrid workflow.
- The live 1,200/800 kW hybrid case with 250 kW / 575 kWh BESS and a carried neutral returned four 500 kW generators, seven BESS units, 1,500 kW firm generation, A/B/C/N/G guidance, and 160 unzoned 50-foot cable pieces. The automated named 700/500 kW branch case passed the complete 170-piece Site Fit/PDF/estimate reconciliation.
- Service-worker upgrade behavior was observed: one normal reload replaced a previously open legacy shell with the released build.

Signed physical iPhone/iPad review and assistive-technology review remain open for their respective native/accessibility release lanes.
