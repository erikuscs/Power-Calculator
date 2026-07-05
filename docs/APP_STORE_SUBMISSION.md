# EMaaS.pro — iOS App Store Submission Guide

The app is wrapped with Capacitor 8 (`ios/` folder). The web app is unchanged and
still deploys to Azure SWA at emaas.pro; the iOS app is built from the same codebase.

## What is already done

- Capacitor 8 iOS project at `ios/App/App.xcodeproj` (Swift Package Manager, no CocoaPods)
- Bundle ID: `pro.emaas.app`, display name **EMaaS.pro**
- App icons + splash screens generated from brand assets (`assets/` → regenerate with
  `npx @capacitor/assets generate --ios`)
- Safe-area (notch/home-indicator) CSS and `viewport-fit=cover`
- Native PDF export: on iOS the report is written to the app cache and opened in the
  share sheet (AirDrop, Mail, Files, print) instead of a browser download
- `ITSAppUsesNonExemptEncryption = NO` (standard HTTPS only → skips export-compliance
  questionnaire on every build)
- Status bar set to light content to match the dark theme

## Day-to-day build commands

```bash
npm run build          # build web assets
npx cap sync ios       # copy into iOS project
npx cap open ios       # open in Xcode
```

## One-time steps only you can do

### 1. Apple Developer Program ($99/year)
Enroll at https://developer.apple.com/programs/enroll — as an organization
(Sustainable Gaps) if you want the seller name to show the company; that requires a
D-U-N-S number. Individual enrollment is faster if you're fine with "Erik Herring"
as the seller.

### 2. Signing (in Xcode)
Open the project (`npx cap open ios`), select the **App** target → Signing &
Capabilities → check *Automatically manage signing* → pick your team. Xcode creates
the certificates and provisioning profile for you.

### 3. App Store Connect setup (https://appstoreconnect.apple.com)
- **New App**: platform iOS, bundle ID `pro.emaas.app`, name "EMaaS.pro Power Console"
  (App Store names must be unique; have "EMaaS Power Console" as fallback)
- **Category**: Utilities (primary), Productivity (secondary)
- **Privacy policy URL** (required): host one at https://emaas.pro/privacy —
  the app stores everything locally on-device and collects nothing, so the policy is short
- **App Privacy questionnaire**: answer "Data Not Collected" (true: no analytics,
  no accounts, no network calls after load)
- **Age rating**: 4+
- **Price**: Free (or as desired)

### 4. Screenshots (required sizes)
Take these in the iOS Simulator (`Cmd+S` saves a screenshot):
- 6.9" (iPhone 17 Pro Max): 1320 × 2868
- 6.5" fallback accepted from the 6.9" set
Recommended shots: dashboard, one wizard (Temp Power), a calculator with results,
the PDF share sheet.

### 5. Upload and submit
In Xcode: Product → Archive → Distribute App → App Store Connect → Upload.
Then in App Store Connect select the build, fill in the "What's New" text, and
Submit for Review. First reviews typically take 1–3 days.

## Review-rejection insurance (Guideline 4.2 "minimum functionality")

Apple sometimes rejects thin web wrappers. This app has a strong case — make it
explicit in the **App Review notes** field:
- Fully offline: all 20+ calculators work in airplane mode (PWA precache + local code)
- Native share-sheet PDF report generation
- No account, no web redirect — it is not a repackaged website view of emaas.pro
  (the site itself is noindexed; the app is the product)

If rejected anyway, the usual escalation is to add 1–2 more native touches
(haptics on calculate, home-screen quick actions) and resubmit.

## Privacy policy starter text (host at emaas.pro/privacy)

> EMaaS.pro Power Console does not collect, store, or transmit any personal data.
> All calculations and saved scenarios are stored locally on your device and never
> leave it. The app contains no analytics, no advertising, no user accounts, and
> makes no network requests containing user data. Contact: erik.herring@sustainablegaps.com
