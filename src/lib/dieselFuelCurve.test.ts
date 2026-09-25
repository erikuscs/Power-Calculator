import { describe, expect, it } from 'vitest'
import {
  estimateSunbeltDieselFleetFuel,
  estimateSunbeltDieselFuel,
  SUNBELT_DIESEL_FUEL_TABLE,
  SUNBELT_DIESEL_LOAD_POINTS,
} from './dieselFuelCurve'

const PDF_DERIVED_EXPECTED_TABLE = [
  [20, 0.6, 0.9, 1.3, 1.6],
  [30, 1.3, 1.8, 2.4, 2.9],
  [40, 1.6, 2.3, 3.2, 4],
  [60, 1.8, 2.9, 3.8, 4.8],
  [75, 2.4, 3.4, 4.6, 6.1],
  [100, 2.6, 4.1, 5.8, 7.4],
  [125, 3.1, 5, 7.1, 9.1],
  [135, 3.3, 5.4, 7.6, 9.8],
  [150, 3.6, 5.9, 8.4, 10.9],
  [175, 4.1, 6.8, 9.7, 12.7],
  [200, 4.7, 7.7, 11, 14.4],
  [230, 5.3, 8.8, 12.5, 16.6],
  [250, 5.7, 9.5, 13.6, 18],
  [300, 6.8, 11.3, 16.1, 21.5],
  [350, 7.9, 13.1, 18.7, 25.1],
  [400, 8.9, 14.9, 21.3, 28.6],
  [500, 11, 18.5, 26.4, 35.7],
  [600, 13.2, 22, 31.5, 42.8],
  [750, 16.3, 27.4, 39.3, 53.4],
  [1000, 21.6, 36.4, 52.1, 71.1],
  [1250, 26.9, 45.3, 65, 88.8],
  [1500, 32.2, 54.3, 77.8, 106.5],
  [1750, 37.5, 63.2, 90.7, 124.2],
  [2000, 42.8, 72.2, 103.5, 141.9],
  [2250, 48.1, 81.1, 116.4, 159.6],
] as const

describe('Sunbelt diesel fuel table', () => {
  it('locks every published generator and load-point value', () => {
    expect(SUNBELT_DIESEL_FUEL_TABLE).toHaveLength(PDF_DERIVED_EXPECTED_TABLE.length)
    PDF_DERIVED_EXPECTED_TABLE.forEach(([ratedKw, ...expectedRates], rowIndex) => {
      expect(SUNBELT_DIESEL_FUEL_TABLE[rowIndex].ratedKw).toBe(ratedKw)
      SUNBELT_DIESEL_LOAD_POINTS.forEach((loadFactor, index) => {
        expect(SUNBELT_DIESEL_FUEL_TABLE[rowIndex].gallonsPerHour[index]).toBe(expectedRates[index])
        expect(estimateSunbeltDieselFuel(ratedKw, ratedKw * loadFactor).gallonsPerHour)
          .toBe(expectedRates[index])
      })
    })
  })

  it('interpolates by generator size and load factor', () => {
    const estimate = estimateSunbeltDieselFuel(450, 281.25)
    expect(estimate.gallonsPerHour).toBeCloseTo(20.275, 6)
  })

  it('uses the published quarter-load value below 25 percent', () => {
    const estimate = estimateSunbeltDieselFuel(500, 50)
    expect(estimate.gallonsPerHour).toBe(11)
    expect(estimate.actualLoadFactor).toBe(0.1)
    expect(estimate.chartLoadFactor).toBe(0.25)
    expect(estimate.loadFactorClamped).toBe(true)
  })

  it('adds identical online-unit consumption for a generator fleet', () => {
    const estimate = estimateSunbeltDieselFleetFuel(500, 3, 750)
    expect(estimate.gallonsPerHour).toBe(55.5)
    expect(estimate.actualLoadFactor).toBe(0.5)
  })
})
