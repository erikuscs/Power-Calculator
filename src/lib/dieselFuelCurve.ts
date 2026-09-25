export const SUNBELT_DIESEL_LOAD_POINTS = [0.25, 0.5, 0.75, 1] as const

export interface SunbeltDieselFuelRow {
  ratedKw: number
  gallonsPerHour: readonly [number, number, number, number]
}

// Source: Sunbelt Rentals, "Approximate Fuel Consumption Chart" (2021).
// The source identifies these as planning approximations, not exact engine data.
export const SUNBELT_DIESEL_FUEL_TABLE: readonly SunbeltDieselFuelRow[] = [
  { ratedKw: 20, gallonsPerHour: [0.6, 0.9, 1.3, 1.6] },
  { ratedKw: 30, gallonsPerHour: [1.3, 1.8, 2.4, 2.9] },
  { ratedKw: 40, gallonsPerHour: [1.6, 2.3, 3.2, 4] },
  { ratedKw: 60, gallonsPerHour: [1.8, 2.9, 3.8, 4.8] },
  { ratedKw: 75, gallonsPerHour: [2.4, 3.4, 4.6, 6.1] },
  { ratedKw: 100, gallonsPerHour: [2.6, 4.1, 5.8, 7.4] },
  { ratedKw: 125, gallonsPerHour: [3.1, 5, 7.1, 9.1] },
  { ratedKw: 135, gallonsPerHour: [3.3, 5.4, 7.6, 9.8] },
  { ratedKw: 150, gallonsPerHour: [3.6, 5.9, 8.4, 10.9] },
  { ratedKw: 175, gallonsPerHour: [4.1, 6.8, 9.7, 12.7] },
  { ratedKw: 200, gallonsPerHour: [4.7, 7.7, 11, 14.4] },
  { ratedKw: 230, gallonsPerHour: [5.3, 8.8, 12.5, 16.6] },
  { ratedKw: 250, gallonsPerHour: [5.7, 9.5, 13.6, 18] },
  { ratedKw: 300, gallonsPerHour: [6.8, 11.3, 16.1, 21.5] },
  { ratedKw: 350, gallonsPerHour: [7.9, 13.1, 18.7, 25.1] },
  { ratedKw: 400, gallonsPerHour: [8.9, 14.9, 21.3, 28.6] },
  { ratedKw: 500, gallonsPerHour: [11, 18.5, 26.4, 35.7] },
  { ratedKw: 600, gallonsPerHour: [13.2, 22, 31.5, 42.8] },
  { ratedKw: 750, gallonsPerHour: [16.3, 27.4, 39.3, 53.4] },
  { ratedKw: 1000, gallonsPerHour: [21.6, 36.4, 52.1, 71.1] },
  { ratedKw: 1250, gallonsPerHour: [26.9, 45.3, 65, 88.8] },
  { ratedKw: 1500, gallonsPerHour: [32.2, 54.3, 77.8, 106.5] },
  { ratedKw: 1750, gallonsPerHour: [37.5, 63.2, 90.7, 124.2] },
  { ratedKw: 2000, gallonsPerHour: [42.8, 72.2, 103.5, 141.9] },
  { ratedKw: 2250, gallonsPerHour: [48.1, 81.1, 116.4, 159.6] },
] as const

export interface DieselFuelEstimate {
  gallonsPerHour: number
  equivalentGalPerKwh: number
  actualLoadFactor: number
  chartLoadFactor: number
  chartRatedKw: number
  ratedKwClamped: boolean
  loadFactorClamped: boolean
}

function interpolate(lo: number, hi: number, fraction: number): number {
  return lo + (hi - lo) * fraction
}

function rateForRow(row: SunbeltDieselFuelRow, loadFactor: number): number {
  const boundedLoad = Math.max(SUNBELT_DIESEL_LOAD_POINTS[0], Math.min(1, loadFactor))

  for (let index = 0; index < SUNBELT_DIESEL_LOAD_POINTS.length - 1; index += 1) {
    const lowLoad = SUNBELT_DIESEL_LOAD_POINTS[index]
    const highLoad = SUNBELT_DIESEL_LOAD_POINTS[index + 1]
    if (boundedLoad >= lowLoad && boundedLoad <= highLoad) {
      const fraction = (boundedLoad - lowLoad) / (highLoad - lowLoad)
      return interpolate(row.gallonsPerHour[index], row.gallonsPerHour[index + 1], fraction)
    }
  }

  return row.gallonsPerHour[row.gallonsPerHour.length - 1]
}

export function estimateSunbeltDieselFuel(ratedKw: number, actualKw: number): DieselFuelEstimate {
  const safeRatedKw = Math.max(0, ratedKw)
  const safeActualKw = Math.max(0, actualKw)
  const actualLoadFactor = safeRatedKw > 0 ? safeActualKw / safeRatedKw : 0
  const chartLoadFactor = Math.max(SUNBELT_DIESEL_LOAD_POINTS[0], Math.min(1, actualLoadFactor))
  const minimumRow = SUNBELT_DIESEL_FUEL_TABLE[0]
  const maximumRow = SUNBELT_DIESEL_FUEL_TABLE[SUNBELT_DIESEL_FUEL_TABLE.length - 1]
  const chartRatedKw = Math.max(minimumRow.ratedKw, Math.min(maximumRow.ratedKw, safeRatedKw))

  let gallonsPerHour: number
  if (chartRatedKw <= minimumRow.ratedKw) {
    gallonsPerHour = rateForRow(minimumRow, chartLoadFactor)
  } else if (chartRatedKw >= maximumRow.ratedKw) {
    gallonsPerHour = rateForRow(maximumRow, chartLoadFactor)
  } else {
    const upperIndex = SUNBELT_DIESEL_FUEL_TABLE.findIndex((row) => row.ratedKw >= chartRatedKw)
    const lowerRow = SUNBELT_DIESEL_FUEL_TABLE[upperIndex - 1]
    const upperRow = SUNBELT_DIESEL_FUEL_TABLE[upperIndex]
    const sizeFraction = (chartRatedKw - lowerRow.ratedKw) / (upperRow.ratedKw - lowerRow.ratedKw)
    gallonsPerHour = interpolate(
      rateForRow(lowerRow, chartLoadFactor),
      rateForRow(upperRow, chartLoadFactor),
      sizeFraction,
    )
  }

  return {
    gallonsPerHour,
    equivalentGalPerKwh: safeActualKw > 0 ? gallonsPerHour / safeActualKw : 0,
    actualLoadFactor,
    chartLoadFactor,
    chartRatedKw,
    ratedKwClamped: chartRatedKw !== safeRatedKw,
    loadFactorClamped: chartLoadFactor !== actualLoadFactor,
  }
}

export function estimateSunbeltDieselFleetFuel(
  unitRatedKw: number,
  onlineUnitCount: number,
  totalActualKw: number,
): DieselFuelEstimate {
  const unitCount = Math.max(1, Math.ceil(onlineUnitCount))
  const perUnitActualKw = Math.max(0, totalActualKw) / unitCount
  const unitEstimate = estimateSunbeltDieselFuel(unitRatedKw, perUnitActualKw)
  const gallonsPerHour = unitEstimate.gallonsPerHour * unitCount

  return {
    ...unitEstimate,
    gallonsPerHour,
    equivalentGalPerKwh: totalActualKw > 0 ? gallonsPerHour / totalActualKw : 0,
  }
}
