# BESS Inrush Evidence Review

Date: 2026-09-24  
Status: internal calculation-basis evidence; not a customer incident register  
Owner/gate: EMaaS Pro product owner and qualified electrical reviewer

## Question

Are there public examples of rental customers experiencing BESS shutdowns because the inverter plant was sized from a model or energy number instead of continuous output and motor-starting inrush?

## Search result

Targeted public-web searches covered rental BESS overload, motor-starting inrush, Moxion MP75 shutdowns, construction-jobsite trips, and operator reports. The search did **not** find a credible, attributable rental-customer incident that documents the load schedule, selected rental unit, start current, trip point, and reset sequence well enough to use as a calculation case.

That absence is not evidence that the problem does not occur. It means EMaaS Pro must not turn marketing pages, generic failure articles, or anonymous fragments into a named customer case study.

## Evidence that is usable

1. Generac's public BESS emergency-power guidance states that motor starts can require the BESS inverter to be sized significantly larger than steady-state load to prevent overload shutdown. It also identifies soft starters and VFDs as ways to reduce starting current.
   - https://www.generac.com/industrial/tools-resources/white-papers/battery-energy-storage-for-emergency-power-systems/
2. POWR2's public guidance says motor inrush commonly determines generator size and describes BESS as a way to address transient demand. This supports asking for the motor schedule, but it is vendor guidance rather than an incident report.
   - https://powr2.com/revolutionary-energy-storage/
3. The Moxion MP75-600 manufacturer manual is the controlling source for the app's 40 kW continuous and 75 kW time-limited output values. The owner's observation of protective shutdown near 42 kW remains explicitly labeled field experience rather than a manufacturer claim.
   - https://support.moxionpower.com/manuals/mp-75-600-user-manual.pdf
4. Independent reporting confirms Moxion ceased operations, but the reviewed report does not establish inverter sizing or customer overload experience as the cause. It must not be used to make that causal claim.
   - https://www.latitudemedia.com/news/portable-battery-startup-moxion-is-bankrupt-what-happened/

## Product approach

- Size sustained demand from verified continuous kW, never the model badge or nominal kWh.
- Ask for motor/compressor HP, nameplate FLA, start method, voltage, and which starts can overlap.
- Keep the estimate governed by verified continuous kW. Do not add inrush what-if sizing or automatically add transformer/load-bank scope at this stage.
- Keep motor-start entries as informational handoff notes only; starting and protection methods belong to later vendor/engineering verification.
- Keep published time-limited kW informational. It is not continuous operating capacity.
- Model charge kW separately from discharge kW and identify any value that remains a planning assumption.
- Do not turn motor-start notes into early-estimate equipment quantities. Those details move to vendor/engineering verification before equipment release.
- Preserve owner field observations as field notes, separate from manufacturer specifications and independently documented customer incidents.

## Remaining limit

The public search did not produce an incident-quality rental case. The finding supports the continuous-power boundary and later engineering review; it does not justify adding more early-estimate what-if logic.
