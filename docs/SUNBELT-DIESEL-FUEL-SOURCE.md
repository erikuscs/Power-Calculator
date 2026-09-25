# Sunbelt Diesel Fuel Consumption Source

Status: controlled calculation input

## Source

- Document: `Sunbelt Fuel Consumption Chart.pdf`
- Display title: `Approximate Fuel Consumption Chart`
- Author metadata: Erik Herring
- Created: 2021-10-04
- SHA-256: `3d44f54b98ee11fea79c330fa3fc71f43a038cd2804646f760d1ce8910ad47e8`
- Reviewed from the owner-provided local source on 2026-09-24.

The source describes its diesel values as approximations based on generator size and operating load. It expressly warns that actual consumption can vary. EMaaS Pro therefore uses the table for planning estimates, not manufacturer selection, a fuel guarantee, or field release.

## Implementation contract

The complete 20-2,250 kW table and its 25%, 50%, 75%, and 100% load values are stored in `src/lib/dieselFuelCurve.ts`.

- Exact table coordinates return the exact published gallons-per-hour value.
- Values between published generator sizes use linear interpolation.
- Values between published load points use linear interpolation.
- Loads below 25% use the published 25% value; the standalone fuel report identifies the boundary condition.
- Loads above 100% use the published full-load value; the standalone fuel report identifies the boundary condition.
- Generator ratings outside 20-2,250 kW use the nearest published size; the standalone fuel report identifies the boundary condition.
- Multi-generator calculations apply the table to the online generator unit size and an equal-share load per online duty unit. Standby units do not consume fuel.
- Altitude, temperature, operating-hour, recharge-loss, and contingency adjustments remain visible separate calculation steps; they do not alter the stored source values.

Diesel cost remains a separate editable commercial input. The default worked-case rate is $8.50 per gallon, not a claim made by the Sunbelt source.
