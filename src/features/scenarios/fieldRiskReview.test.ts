import { describe, expect, it } from 'vitest'
import { calculateTempPower } from './scenario.formulas'
import { buildFieldRiskReview, defaultTempPowerRiskInputs } from './fieldRiskReview'

describe('buildFieldRiskReview', () => {
  it('turns temporary housing unknowns into confidence, RFIs, and planning contingency', () => {
    const results = calculateTempPower({
      mode: 'basecamp',
      loadKw: 0,
      sqFt: 0,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 24 * 974,
      altitude: 0,
      powerFactor: 0.8,
      serviceIntervalDays: 10,
      technicianCoverage: '24_7',
      containmentRequired: true,
      facilities: [
        { id: 'rv', type: 'rv', label: 'RV Pedestal (50A)', quantity: 60, kwPerUnit: 9.6, structureType: 'container', structureMultiplier: 1 },
        { id: 'bath', type: 'bathroom', label: 'Bathroom Trailer', quantity: 4, kwPerUnit: 14.4, structureType: 'container', structureMultiplier: 1 },
        { id: 'shower', type: 'shower', label: 'Shower Trailer', quantity: 2, kwPerUnit: 57.6, structureType: 'container', structureMultiplier: 1 },
        { id: 'concession', type: 'concession', label: 'Concession Structure', quantity: 2, kwPerUnit: 115.3, structureType: 'sprung', structureMultiplier: 1.4 },
      ],
    })

    const review = buildFieldRiskReview({
      inputs: {
        ...defaultTempPowerRiskInputs,
        rvService: 'unknown',
        hiddenPlugLoads: 'unknown',
        motorStarting: 'unknown',
        occupancyVariance: 'assume_typical',
        airDistribution: 'unknown',
        winterHeat: 'unknown',
        waterHeating: 'unknown',
      },
      totalLoadKw: results.totalLoadKw,
      coolingKw: results.coolingKw,
      totalWithCoolingKw: results.totalWithCoolingKw,
      powerFactor: 0.8,
    })

    expect(review.confidenceBand).toBe('low')
    expect(review.adjustedPlanningKw).toBeGreaterThan(results.totalWithCoolingKw)
    expect(review.adjustedGeneratorKva).toBeGreaterThan(results.generatorKva)
    expect(review.contingencyKw).toBeGreaterThan(0)
    expect(review.rfis).toEqual(expect.arrayContaining([
      expect.stringContaining('RV'),
      expect.stringContaining('compressor'),
      expect.stringContaining('air distribution'),
      expect.stringContaining('water heating'),
    ]))
    expect(review.reportNotes.some((note) => note.includes('easy-button'))).toBe(true)
  })
})
