# EMaaS.pro Launch — Handoff & Session Log
**Updated 2026-07-06 · Erik Herring / Sustainable Gaps LLC**
This document is self-contained: a fresh Claude session (or future Erik) on any
machine can resume from here. Add your own notes at the bottom.

---

## 1. THE PRODUCT

**EMaaS.pro Power Console** — energy planning software (BESS, generator, cooling,
hybrid strategy calculators + PDF reports). Live at **https://emaas.pro**.

| What | Where |
|---|---|
| Source of truth | github.com/erikuscs/Power-Calculator (`main` branch) |
| Working clone (MacBook) | `~/Projects/emaas-pro` — on the Mini: `git clone https://github.com/erikuscs/Power-Calculator.git ~/Projects/emaas-pro` |
| Web deploy | Push to `main` → GitHub Actions runs tests → Azure Static Web Apps → emaas.pro |
| iOS app | `ios/` in the repo (Capacitor 8, SPM, bundle id `pro.emaas.app`) |
| Store guide | `docs/APP_STORE_SUBMISSION.md` in the repo |

## 2. WHAT WAS DONE (2026-07-05 → 07-06)

**App engineering**
- Capacitor 8 iOS wrapper: icons, splash, safe-area, native share-sheet PDF
  export (blob downloads don't work in WKWebView). Verified in iPhone 17 simulator.
- Testing: 84/84 unit tests; all 23 routes; wizards end-to-end; PDF blob verified;
  persistence; mobile viewport; adversarial edge-case pass.
- **Bugs found & fixed & deployed:**
  1. Power factor > 1 was accepted in six calculators → bounds enforced.
  2. Airside tonnage used kJ/kg enthalpy in a BTU/lb formula (~2.3× overstated)
     → converted to BTU/lb, validated against ASHRAE psych chart, UI label fixed.
  3. Occupant heat hardcoded 450 BTU/person (seated) → selectable activity level
     (seated 450 / standing 550 / dancing 900) — the Atlanta Botanical Gardens
     tent lesson. 300 dancers = 19-ton swing vs seated default.
- All shipped to `main`, live on emaas.pro, synced into the iOS project.

**Company records** (OneDrive → `Sustainable Gaps/Company Registration & IDs/`)
- Sustainable Gaps LLC: GA domestic LLC formed 11/04/2024, member-managed
  (Erik + Tracy Herring), DBA "Sustainable Ventures"
- **EIN 33-1907024 · D-U-N-S 13-607-1878 · GA Control #24207499 ·
  CA Entity B20250028147 (foreign LLC, Active, all standings Good, SOI due
  03/31/2027) · FinCEN ID 2000-0333-0193**
- Address on all filings: 8735 Dunwoody Place Ste R, Atlanta, GA 30350
- Phone for everything: 813-399-2041 (permanent)
- Filed PDFs collected: GA formation doc, GA 2026 annual registration,
  CA registration, CA Statement of Information

**Apple Developer** (status: WAITING on Apple)
- Business Apple Account created: **developer@sustainablegaps.com**
- Organization enrollment SUBMITTED 2026-07-05 (D-U-N-S 13-607-1878)
- Expect verification email/call (813-399-2041) within ~2–7 days
- If Apple questions company authority → send the GA Formation Document
- After approval: pay $99/yr → Xcode signing (team: Sustainable Gaps LLC) →
  privacy page at emaas.pro/privacy → screenshots → App Store Connect listing →
  archive & upload

**D&B / D-U-N-S** (status: WAITING on D&B, ≤8 business days from 07/05)
- Profile Manager access request submitted; approval comes by email
- Public record currently WRONG: industry "clothing retail," principal
  "Lisa Borowsky" (cross-linked data from the shared registered-agent address)
- Fix-list + business-focus text ready: `Company Registration & IDs/DUNS Update Package.md`

**Sunbelt / EMaaS brand provenance** (status: RESOLVED — proceed)
- Sunbelt holds only unregistered composite applications ("SUNBELT RENTALS
  EMAAS" #98272332, "...ENERGY MANAGEMENT AS A SERVICE" #98272363)
- Evidence file complete: Erik created the EMaaS program at SBR (2023);
  PIP (7/12/24) was purely rental-utilization metrics, never mentioned app/IP;
  same-day eval = Exceeds Expectations; **HR removed the PIP from file in
  writing 8/12/24**; release agreement has no IP terms; SBR remotely wiped
  Erik's computer (forced clean-room = current app cannot derive from SBR code)
- Full fact file + exhibits: OneDrive `Company Registration & IDs/`
  → `EMaaS Provenance & SBR Timeline.md` + `SBR Evidence/` (dated copies, indexed)
- Optional: 1-hr IP attorney read of the release agreement (confirmation only)
- Rule: never reuse Sunbelt deck assets in EMaaS.pro marketing

**OneDrive restoration**
- Original flat folder structure restored (numbered taxonomy dissolved);
  every move logged: `Sustainable Gaps/RESTORE_LOG.csv`
- `personal_key.txt` moved OUT of cloud → MacBook `~/Private-Local/` (rotate if sensitive)
- Home-directory git repo issue: separate session was untangling
  (~/.git pointed at Dashboard-Repos with credential files staged)

## 3. IMMEDIATE NEXT ACTIONS

1. ⏳ Watch inbox for **Apple verification** → answer call → pay $99
2. ⏳ Watch inbox for **D&B approval** → apply DUNS Update Package fixes
3. 🔜 After Apple: privacy page, screenshots, listing, submit (~1 day, mostly Claude)
4. Optional: attorney hour (questions pre-written in the Provenance file);
   drop severance-agreement photo + emaas.pro domain receipt into `SBR Evidence/`

## 4. RESUMING WITH CLAUDE ON ANOTHER MACHINE

Claude's session memory lives per-machine; on the Mini, give Claude this file.
Suggested first prompt:
> "Read the handoff at ~/Library/Mobile Documents/com~apple~CloudDocs/EMaaS
> HANDOFF - 2026-07-06.md (also in the repo at docs/HANDOFF.md) and continue
> from the next actions."

Key file locations for any session:
- Repo: github.com/erikuscs/Power-Calculator
- OneDrive: `Sustainable Gaps/Company Registration & IDs/` (records + evidence)
- OneDrive: `Sustainable Gaps/emaas.pro/STATUS - EMaaS iOS Launch.md`
- iCloud: `Sunbelt Rentals/PIP Defense/` (original evidence)

---

## 5. ERIK'S NOTES (add below)

-
