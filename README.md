# Energy Management as a Service (EMaaS) Pro

EMaaS Pro is a Sustainable Gaps planning application for temporary power, cooling, heating, BESS, hybrid energy, site fit, one-line diagrams, and estimate preparation.

All results are planning estimates. Equipment selection, electrical design, procurement, and field release require the stated vendor, manufacturer, licensed engineer, and site-verification checks.

## Source and release boundary

- Canonical checkout: `/Users/sustainablegaps/Projects/emaas-pro`
- Git source: `github.com/erikuscs/Power-Calculator`
- Production domain: `https://emaas.pro`
- Deployment workflow: `.github/workflows/azure-swa.yml`
- Current work is not deployed merely because it builds, is committed, or appears in a local preview.
- A push or pull request can trigger Azure Static Web Apps activity. Do not push or create a PR without an explicit deployment decision for the exact commit and target.

The SG brand source of truth is outside this repository at:

`/Volumes/SG-Clean/SG-OFFICE/Company and Brand/02 Brand Guidelines/01-Current-SG-Brand`

This repository contains only implementation copies and its source-use record. It is never the identity master.

## Development

CI uses Node 22.

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run test:e2e
```

`npm run build` runs the brand checksum/palette gate before TypeScript and Vite, then audits the production artifacts after the bundle is created.

## Main folders

| Path | Purpose |
| --- | --- |
| `src/features/` | Power, HVAC, BESS, scenario, estimate, learning, and site-fit workflows |
| `src/components/` | Shared application, diagram, and PDF components |
| `src/lib/` | Shared formulas, validation, brand naming, formatting, and planning logic |
| `public/brand/` | Controlled web/PWA implementation copies |
| `public/fonts/` | Controlled web and report-font binaries with licenses |
| `assets/` | Native icon and launch-screen source inputs |
| `ios/` | Capacitor iOS project and generated native assets |
| `docs/` | Current source maps, QA, engineering sources, and release procedures |
| `docs/release-candidates/` | Dated historical evidence; not current release authority |

## Native preparation

Use [NATIVE-RELEASE-CHECKLIST.md](docs/NATIVE-RELEASE-CHECKLIST.md). Native icon and splash candidates must pass iPhone/iPad and App Store target-surface review before release.

## Current evidence

- [Source-use record](docs/SOURCE-MAP.md)
- [QA record](docs/QA.md)
- [Repository custody record](docs/REPOSITORY-CUSTODY-20260911.md)
- [Brand implementation manifest](docs/BRAND-ASSET-MANIFEST-SHA256.txt)
- [Handoff](docs/HANDOFF.md)
