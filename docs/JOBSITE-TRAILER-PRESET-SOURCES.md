# Jobsite Trailer Preset Sources

## Purpose

The temporary-power workflow includes editable jobsite trailer presets so a planner can begin with a recognizable unit instead of a blank load row. These values support preliminary sizing only. The delivered unit panel, voltage, phase, HVAC, electric heat, water heating, appliances, and equipment nameplates govern the final load plan.

## Basis Rules

- **Published service:** EMaaS calculates the connected-service ceiling from manufacturer-published voltage and amperage. This is available capacity, not measured operating demand.
- **Planning estimate:** The manufacturer publishes the configuration or features but not enough electrical detail to calculate a defensible service ceiling. EMaaS provides a conservative, editable starting value and labels it as an estimate.
- **Project example:** The preloaded 56 kW setup is an aggregate planning example. It is not assigned to a manufacturer model.

## Preset Register

| Manufacturer | Model or configuration | EMaaS starting load | Basis | Source |
| --- | --- | ---: | --- | --- |
| Mobile Modular | 8 x 20 WMS Office, Model 2161 | 6.6 kW | Typical 60 A at 110 V for an 8-foot-wide office trailer | [Electrical FAQ](https://www.mobilemodular.com/resources/frequently-asked-questions) |
| Mobile Modular | 12 x 60 jobsite building with restroom | 22 kW | Published 100 A, 220 V single-phase panel | [Jobsite building guide](https://www.mobilemodular.com/Content/Documents/ProductGuides/California/California_HCD_Jobsite_Buildings.pdf) |
| Mobile Modular | 10 x 44 wide office trailer | 22 kW | Typical 100 A at 220 V for 10- and 12-foot-wide trailers | [Electrical FAQ](https://www.mobilemodular.com/resources/frequently-asked-questions) |
| Satellite Shelters | 8 x 20 ground-level office | 12 kW | Editable estimate for published 120/240 V configuration with electric HVAC | [Ground-level offices](https://www.satelliteco.com/products/ground-level-offices/) |
| Satellite Shelters | 8 x 40 ground-level office | 18 kW | Editable estimate for published 120/240 V configuration with electric HVAC | [Ground-level offices](https://www.satelliteco.com/products/ground-level-offices/) |
| Satellite Shelters | 10 x 40 standard mobile office | 20 kW | Editable estimate for standard size, heating, and air conditioning | [Electrical specifications](https://www.satelliteco.com/blog/questions-answered-by-satellite-shelters-sales-representatives/) |
| WillScot | 8 x 20 mobile office | 12 kW | Editable estimate for a small office with electric HVAC and heat | [Mobile offices](https://www.willscot.com/en/work-collaborate/mobile-offices) |
| WillScot | 8 x 24 mobile office | 16 kW | Editable estimate for an office with central HVAC and electric heat | [Mobile offices](https://www.willscot.com/en/work-collaborate/mobile-offices) |
| WillScot | 10 x 48 office with restroom | 28 kW | Editable estimate including central HVAC, electric heat, and water-heating review | [Mobile offices](https://www.willscot.com/en/work-collaborate/mobile-offices) |

## Release Check

Before releasing equipment, replace planning estimates with the delivered-unit submittal and confirm simultaneous loads, motor or compressor starting, voltage drop, phase balance, overcurrent protection, grounding, and applicable code requirements.
