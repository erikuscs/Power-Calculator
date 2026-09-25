# Northern Virginia Hybrid Microgrid Benchmark

Status: `INTERNAL BENCHMARK / CONCEPTUAL / NOT FOR CONSTRUCTION`

Owner and release gate: Erik Herring. The source PDF is internal-safe reference material. Customer, staff, asset, and pricing identifiers are not reproduced in the benchmark artwork.

## Evidence classes

### Known from the internal source

- Original system voltage: 208 V, three-phase.
- Recorded site peak: 502 A.
- Documented generator peak output: 176.4 kW.
- The customer-requested service target was 2,000 A.

The 502 A and 176.4 kW values are separate recorded fields. The benchmark does not claim they occurred at the same instant or use one to prove the other.

### Calculated for the 480 V example

- Requested apparent power: `2,000 A × 480 V × √3 ÷ 1,000 = 1,662.8 kVA`.
- Requested real-power planning value at 0.80 power factor: `1,662.8 kVA × 0.80 = 1,330.2 kW`.
- Equivalent current for the documented 176.4 kW generator peak at 480 V and 0.80 power factor: `176.4 kW × 1,000 ÷ (√3 × 480 V × 0.80) = 265.2 A`.
- Four 500 kW generators provide 2,000 kW installed. With one unit unavailable, three units provide 1,500 kW firm, leaving `1,500 - 1,330.2 = 169.8 kW` above the requested contingency planning value.
- Seven Viridi RPS150 units provide 210 kW installed continuous and 924 kWh usable. With one unit unavailable, six units provide 180 kW firm continuous and 792 kWh usable, which is 3.6 kW above the documented 176.4 kW generator peak benchmark.
- The firm 30%-to-80% BESS dispatch band is `792 kWh × 50% = 396 kWh`.

### Planning choices

- Primary distribution is 480 V, three-phase.
- A step-down transformer is shown only for downstream 208/120 V loads that actually require it.
- Four parallel 500 kW generators are preferred when space and availability permit. DEIF controls rotate lead/lag duty, manage parallel operation and transfer, and preserve a rotating maintenance reserve.
- Seven RPS150 units are shown as six firm units plus one maintenance reserve.
- Generator recharge is controlled and can be curtailed during the full 2,000 A contingency. The 169.8 kW contingency headroom is less than the full 210 kW installed BESS charge capability.

### Field, vendor, and engineering verification

- Actual interval real power and power factor at the new 480 V point of connection.
- Delivered generator and BESS model availability, continuous ratings, charge limits, and exact dimensions.
- Transformer arrangement, fault duty, grounding, protection coordination, switchgear/bus rating, neutral requirements, cable ampacity, voltage drop, cable routing, fire separation, fuel storage, access, and site civil conditions.

## Report rule

Every EMaaS Pro hybrid report must show the load-source basis, continuous BESS power and usable energy, duty and standby generator counts, firm capacity after one source is unavailable, controlled recharge power, and a visible red flag when the proposed plant relies on one generator or has no maintenance reserve. A panel, breaker, or transformer nameplate is not a substitute for measured demand.

## Controlled artifacts

- Editable vector: `docs/VA-MICROGRID-HYBRID-BENCHMARK.svg`
- Report-ready screenshot: `docs/VA-MICROGRID-HYBRID-BENCHMARK.png`

Verified SHA-256 values:

- SVG: `87d4ea73021ccd947970e89a21ad4620b5dbd78280d8b24272c00534e91d890d`
- PNG: `fdb0f8f5bbda0bffaa4397ef589dc9ce67db77ec19481999da9240568747fbd6`

These artifacts are conceptual planning aids, not stamped one-line drawings, procurement specifications, or construction documents.
