# Temporary Heating Planning Sources

Status: review support for the local EMaaS Pro heating candidate  
Scope: temporary enclosed-space heating with electric resistance or propane equipment only

## Calculation basis

- Sunbelt Rentals' published indirect-heater table states that heating-area coverage is based on a 40°F temperature rise in a sealed building with an 8-foot ceiling. Its 350,000 BTU/hr / 8,100 sq ft and 420,000 BTU/hr / 9,700 sq ft examples both imply approximately 0.135 BTU/hr per cubic foot per °F. EMaaS uses that as a visible sealed-space planning baseline, then applies an explicit exposure multiplier and 15% planning margin.
  - https://qawww.sunbeltrentals.com/Content/pdfs/DigitalCatalogDownloads/PumpAndPowerCatalog.pdf
- The U.S. Department of Energy Alternative Fuels Data Center publishes propane higher heating value as 91,420 BTU/gallon. EMaaS divides installed output by entered equipment efficiency and this heat content to estimate full-fire consumption.
  - https://afdc.energy.gov/fuels/properties
- Greenheck publishes electric-heat conversion as kW = BTU/hr / 3,413. EMaaS uses the equivalent 3,412.14 BTU/kWh constant already used elsewhere in the application.
  - https://content.greenheck.com/public/DAMProd/Original/10015/FTU_Fan_Powered_FCQ700_catalog.pdf

## Equipment interpretation

- A propane heater may still require separate electrical power for blowers and controls. Current Sunbelt examples list fuel, burner input/output, and an electrical power source separately. EMaaS therefore calculates propane consumption and auxiliary generator allowance as separate results.
  - https://www.sunbeltrentals.com/equipment-rental/heating-cooling-air-management/400-499k-btu-lp-ng-indirect-fired-heater/0100227/
  - https://www.sunbeltrentals.com/equipment-rental/tools/800-899k-btu-lp-ng-indirect-fired-heater/0100262/

## Limits

- The result is a planning estimate, not a Manual J calculation, engineered temporary-heat design, code determination, ventilation approval, fuel-delivery plan, or equipment release.
- Exposure multipliers are explicit planning allowances, not manufacturer ratings.
- Electric calculations apply to resistance heat, not heat pumps.
- Generator results cover the entered heater demand or auxiliary circuit allowance. Motor starting, voltage, phase, distribution, cable, grounding, and all other site loads still require nameplate and field verification.
- Propane results represent continuous full-fire consumption. Actual thermostatic cycling may reduce use, while tank vaporization, pressure, temperature, and delivery constraints may limit available fuel flow.
- Steam, hydronic systems, natural gas, fuel oil, diesel-fired heat, CNG/LNG logistics, and open-area process-heating design are outside this release.
