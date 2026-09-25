# EMaaS Pro energy-sector reference case

**Status:** synthetic acceptance specification; local default inputs do not constitute an engineered design or a field quote. **Owner direction:** 24/7 jobsite, one 28-day rental billing cycle, editable example diesel input of $8.50/gal. The former 56 kW trailer is retained only as an optional facility preset, not the main project.

## Shared case ledger: DC-COMMISSION-28D, revision 0

| Input | Example value | Evidence needed to replace the synthetic value |
| --- | --- | --- |
| Work | Data-center commissioning with a temporary utility bridge | Project scope, one-line, utility and commissioning sequence |
| Schedule | 28 days × 24 h/day = **672 operating hours** | Calendar and load schedule; do not treat eight peak hours as the whole daily runtime |
| Load | 800 kW base, 1,200 kW peak, eight peak hours per day; zones 700 and 500 kW at peak | Interval load profile, simultaneity, UPS and cooling electrical input, motor start list |
| Electrical | 480 V source; 208/120 V load; power factor 0.8; neutral required; N+1 planning target | Distribution one-line, transformer and protection study, load phase balance, manufacturer data |
| Routing and site | 100 ft longest modeled run; 200 × 120 ft available area | Scaled site plan, setbacks, access, fuel/service clearances, cable installation conditions |
| Hybrid | 250 kW / 575 kWh BESS planning class; generator and BESS counts calculated | Actual fleet submittals, continuous/peak/inverter ratings, protection and control sequence |
| Diesel | $8.50/gal **example input**, editable | Dated delivered-fuel quotation; taxes, delivery, tank, service and contingency |

The base and peak loads are **total electrical demand**. Cooling electrical kW, UPS losses, lighting and motors must be broken out within that total, then reconciled to the 800/1,200 kW profile. Adding them again on another screen would double count. Cooling tons describe thermal duty and are not electrical kW. Winter heating is a separate season scenario.

## Cross-tool acceptance map

| App route | What this case must demonstrate | Reconciliation check |
| --- | --- | --- |
| Temporary Power | 24/7 schedule, 28-day rental term, named facilities, source/load voltage, open field checks | 672 h; facility kW sum equals the shared load ledger; no unverified ready claim |
| Hybrid EMaaS Strategy | Base/peak dispatch, eight daily peak hours, $8.50 fuel, N+1, 250 kW BESS class | Energy balance includes peak demand and recharge losses; project cost uses 28 days; compare both fuel scenarios honestly |
| Site Fit & One-Line | Equipment placement, branch zones, transformer, neutral/cable schedule | X and Y fit; 700 + 500 = 1,200 kW; cable sizing and protections await engineering confirmation |
| Build Estimate | Generator/BESS rental, fuel, cable and logistics allowance | Quantity and duration match Hybrid/Site Fit; flag unpriced service, fuel delivery, ATS, installation and tax |
| BESS Runtime, Multi-Unit Sizing, BESS Project Economics | Peak support, energy capacity and recharge basis | Use the same duty cycle and losses; tariff ROI is **not applicable** to the islanded phase; a grid-connected phase needs its own tariff and metering |
| Electrical conversion, generator, UPS, fuel and lighting tools | kW/kVA/ampere, HP/motor, UPS and lighting component checks | 480/208 V and 0.8 power factor stay explicit; components sum into, rather than add to, total load |
| Cooling Load Strategy, Cooling, Chiller, Psychrometrics, Heating | Summer cooling thermal/electrical basis and separate winter heating alternative | Weather/design conditions and equipment COP verified; no simultaneous summer/winter addition |
| PDF exports | Decision, inputs, method, open checks and estimate on a single case revision | Visible case ID, source date, 28-day labels and amounts match screen and estimate |

## Additional energy-sector examples

- **Substation construction:** temporary construction services and test/commissioning equipment, with utility interface, grounding, and start-current questions explicit. Local starting loads are synthetic 250 + 125 kW.
- **Multi-load temporary power:** field equipment and site services with lighting/auxiliary checks. Local starting loads are synthetic 180 + 80 kW.

These are domain examples, not claims about completed customer projects. They require real load schedules before equipment selection.

## Release evidence required

1. Independently recalculate power, energy, daily/project fuel, rental normalization, and estimate totals from the ledger. Retain a reviewer-signed calculation sheet and representative PDF.
2. Test at least the 28-day 24/7 case, a 30-calendar-day project billed under 28-day rental terms, a changed fuel price, a narrow site, a voltage variant, and both positive and negative hybrid fuel differences.
3. Check manufacturer transient, inverter surge, fuel autonomy, cable ampacity/derating, protection, ATS/control, and acoustic/environmental data with actual submittals. Obtain qualified electrical and mechanical review for construction use.
4. Replace the current cross-tool placeholders with one versioned case ledger and carry its revision through each route and PDF. Verify the live application after an approved deployment before any public screenshot or website claim.
