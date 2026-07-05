# EMaaS.pro Power Console

Energy Management as a Service planning tools — BESS, generator, cooling, and hybrid
energy calculators with PDF report generation. Built by Sustainable Gaps.

**Live:** https://emaas.pro (Azure Static Web Apps, auto-deployed from `main`)

> All outputs are planning estimates. Verify with a licensed professional engineer
> before equipment sizing, procurement, or design decisions.

## Where things live

| What | Where |
|---|---|
| Source of truth | this repo (`erikuscs/Power-Calculator`) |
| Local working clone | `~/Projects/emaas-pro` (keep it out of OneDrive — node_modules and Xcode don't sync well) |
| Web deploy | push to `main` → GitHub Actions runs tests, builds, deploys to Azure SWA |
| iOS app | `ios/` (Capacitor 8), see [docs/APP_STORE_SUBMISSION.md](docs/APP_STORE_SUBMISSION.md) |

## Stack

Vite + React 19 + TypeScript + Tailwind CSS 4 · Recharts · @react-pdf/renderer ·
vite-plugin-pwa (offline support) · Capacitor 8 (iOS) · Vitest

Fully client-side: no backend, no accounts, no data collection. Saved scenarios and
the disclaimer acceptance live in localStorage.

## Development

```bash
npm ci             # install
npm run dev        # dev server at http://localhost:5173
npm test           # run the test suite (vitest)
npm run lint       # eslint
npm run build      # production build to dist/
```

## iOS app

```bash
npm run build && npx cap sync ios   # rebuild web assets into the iOS project
npx cap open ios                    # open in Xcode to run or archive
```

- Bundle ID `pro.emaas.app`, Swift Package Manager (no CocoaPods required)
- Regenerate icons/splash after changing `assets/`: `npx @capacitor/assets generate --ios`
- On native iOS, PDF export uses the share sheet (`src/components/pdf/PdfExportButton.tsx`)
  because blob downloads don't work inside WKWebView
- Full App Store submission steps: [docs/APP_STORE_SUBMISSION.md](docs/APP_STORE_SUBMISSION.md)

## Structure

```
src/features/power/      electrical power calculators (kW, kVA, amps, fuel, ...)
src/features/hvac/       cooling load, chiller sizing, psychrometrics
src/features/bess/       battery runtime, multi-unit sizing, ROI
src/features/scenarios/  guided wizards + PDF report documents
src/components/          shared layout, UI, and PDF export components
src/lib/                 brand constants, validators, formatters
ios/                     Capacitor iOS project (open ios/App/App.xcodeproj)
assets/                  source images for app icon / splash generation
```
