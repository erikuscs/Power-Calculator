# Design QA — 2,000 A Hybrid Worked Example

## Reference and implementation

- Reference: `/var/folders/hq/z5d6q9z92kz77nn9_ttggj900000gn/T/codex-clipboard-8ffdac00-10bd-41e5-90bb-5465c3ad2ad0.png`
- Implementation route: `/examples/2000a-hybrid`
- Implementation capture: `output/screenshots/EMAAS-Pro-2000A-Hybrid-Linked-Plan.png`
- QA viewport: 1488 × 1060 CSS pixels

## Visual comparison

- Preserved the approved dark EMaaS shell, left workflow navigation, one-line-first hierarchy, linked spatial view, right-side sizing summary, restrained copper/blue status colors, and PE-verification boundary.
- Replaced the reference's generic single-generator/single-BESS content with the verified 2,000 A package: four 500 kW generators, seven 250 kW-continuous BESS units, DEIF controls, source breakers, paralleling gear, 480 V switchgear, customer service main, and protected load handoff.
- Omitted the reference transformer because this example is 480 V source to 480 V service. The page states that reason adjacent to the one-line.
- Used a scaled equipment-envelope view rather than a photorealistic rendering. This keeps the spatial commitment legible without implying exact delivered equipment geometry.

## Interaction and output checks

- The live example is reachable from the Hybrid EMaaS Strategy workflow.
- Print / Save PDF produces the same reviewed composition.
- The customer-facing PDF excludes editable Mermaid source; Mermaid remains available only in the internal app workflow.
- Desktop screenshot and single-page PDF were rendered and visually inspected after the final label-spacing correction.

final result: passed
