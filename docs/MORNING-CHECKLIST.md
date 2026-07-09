# Good Morning — 10 Minutes to App Store Submission

> Written overnight 2026-07-08/09. You stopped at Xcode signing on the Mac Mini.
> Everything else is DONE. Follow this top to bottom — each step is one action.

## Where you left off

- ✅ Apple Developer Program: PAID (order W1584667595, 07/08)
- ✅ Privacy page LIVE: https://emaas.pro/privacy (App Store requirement — done)
- ✅ Repo cloned on Mac Mini: `~/Projects/emaas-pro`
- ✅ Command-line build: SUCCEEDED (project compiles clean on this machine)
- ⏸️ STOPPED AT: Xcode says "Signing requires a development team" — because
  your Apple ID isn't signed into Xcode on this Mini yet. That's step 2 below.
- ⚠️ Xcode's run target was "Not Your iPhone" (a disconnected physical phone).
  Step 4 switches it to a simulator.

## Step 0 — Pull overnight fixes (Terminal, 2 min)

```bash
cd ~/Projects/emaas-pro
git pull origin main
npm install
npm run build
npx cap sync ios
npx cap open ios
```

## Step 1 — (Xcode opens from step 0)

If Xcode shows the Welcome screen instead of the project, quit Xcode and
re-run `npx cap open ios` from the Terminal.

## Step 2 — Sign in to Apple (Xcode, 2 min)

1. Menu bar → **Xcode → Settings…** (Cmd+,)
2. **Accounts** tab → **"+"** (bottom-left) → **Apple ID** → Continue
3. Sign in: **developer@sustainablegaps.com**
4. Close Settings

## Step 3 — Pick the team (30 sec)

1. Left sidebar: click the blue **App** icon (top of file list)
2. Under **TARGETS**, click **App** → **Signing & Capabilities** tab
3. **Team** dropdown (says "None") → select **Sustainable Gaps LLC**
4. Red error disappears. Bundle ID should read `pro.emaas.app`.

## Step 4 — Switch to a simulator (30 sec)

1. Top toolbar: click the device name (says **"Not Your iPhone"**)
2. Scroll to **iOS Simulators** → pick the biggest **iPhone Pro Max**

## Step 5 — Run it (2 min)

Press **▶︎ Play**. A virtual iPhone boots and EMaaS.pro launches on it.
Take a moment. That's your product on an iPhone.

## Step 6 — Screenshots (5 min)

With the Simulator window focused, **Cmd+S** saves a screenshot to Desktop.
Take these 4:
1. Dashboard (home screen)
2. Temp Power & Cooling wizard (enter a load first so it shows results)
3. Fuel Consumption calculator with results visible
4. A PDF export — tap Export on any report, screenshot the share sheet

## Step 7 — Archive & upload (10 min, mostly waiting)

1. Top toolbar device dropdown → select **Any iOS Device (arm64)**
   (Archive will NOT work while a simulator is selected)
2. Menu bar → **Product → Archive** (takes a few minutes)
3. Organizer window opens → **Distribute App** → **App Store Connect**
   → **Upload** → accept defaults → **Upload**
4. Wait for "Upload Successful". Apple takes ~15–30 min to process the build.

## Step 8 — App Store Connect listing (browser, 15 min)

Go to https://appstoreconnect.apple.com → My Apps → **"+"** → New App:

| Field | Value |
|---|---|
| Platform | iOS |
| Name | **EMaaS.pro Power Console** (fallback if taken: EMaaS Power Console) |
| Primary language | English (U.S.) |
| Bundle ID | pro.emaas.app |
| SKU | emaas-pro-001 |

Then fill the version page — ALL COPY IS BELOW, copy/paste:

**Subtitle:** `Generator, BESS & cooling sizing`

**Keywords:** `generator,BESS,kVA,kW,power,cooling,HVAC,load,fuel,energy,electrical,sizing,tonnage,solar`

**Promotional text:**
> Size generators, batteries, and cooling in seconds — with fuel, CO2, and PDF reports. Works fully offline.

**Description:**
> EMaaS.pro Power Console is the field sizing tool for energy and temporary-power professionals. Size generators, battery storage (BESS), and cooling systems in seconds — then export a branded PDF report to share on-site.
>
> • 16 calculators: generator/UPS power, kW-kVA, amperes, fuel consumption, BESS runtime & ROI, cooling load, chiller, psychrometrics
> • Guided workflows: temporary power & cooling, BESS+generator hybrid strategy, project economics
> • Load-dependent fuel curves with altitude and temperature derating — not flat-rate guesses
> • Every result shows the formula with your values, so you can check the math
> • Fully offline — all calculators work in airplane mode
> • On-device PDF reports via the native share sheet
> • No account, no ads, no tracking. Nothing leaves your device.
>
> Estimates are for planning and reference. Always verify with a licensed professional engineer before final design.

**Privacy Policy URL:** `https://emaas.pro/privacy`

**App Privacy questionnaire:** select **"Data Not Collected"** (true — verify each category as not collected)

**Category:** Primary: Utilities · Secondary: Productivity
**Age rating:** 4+ (answer "None" to everything in the questionnaire)
**Price:** Free

**App Review notes (paste into the "Notes" box — this is rejection insurance):**
> Fully functional offline — all 16+ calculators work in airplane mode via local code and precache. Native share-sheet PDF generation. No account and no web redirect; this is a standalone engineering tool, not a repackaged view of emaas.pro (the site is noindexed). No login required — reviewer can use every feature immediately.

**Screenshots:** upload the 4 from Step 6 (6.9" iPhone slot).

## Step 9 — Submit

Select the processed build (from Step 7) on the version page → **Submit for Review**.
First reviews typically take 1–3 days. You'll get an email either way.

---

## Also pending (not App Store)

- **D&B**: rejection received 07/08 — docs didn't show your name + title.
  Re-upload from `Company Registration & IDs/`: GA 2026 Annual Registration,
  CA Statement of Information, and/or EIN confirmation letter (these name you).
  If rejected again, CALL D&B: the record cross-links to "Lisa Borowsky /
  clothing retail" via the shared registered-agent address — a human must fix it.

## If anything goes sideways

Open a Claude session in `~/Projects/emaas-pro` and say:
"Read docs/MORNING-CHECKLIST.md — I'm stuck at step N, here's what I see."
