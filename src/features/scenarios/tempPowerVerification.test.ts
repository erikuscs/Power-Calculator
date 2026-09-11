import { describe, expect, it } from 'vitest'
import { calculateTempPowerPlanningBrief, type TempPowerPlanningInputs } from './scenario.formulas'
import { verifyTempPowerPlanningBrief } from './tempPowerVerification'

const inputs: TempPowerPlanningInputs = {
  mode: 'basecamp',
  loadKw: 0,
  durationHours: 0,
  rentalPeriod: 'monthly',
  rentalPeriodCount: 1,
  runtimeSchedule: 'continuous_24_7',
  includeCooling: true,
  coolingElectricalKw: 12,
  siteVoltage: 240,
  loadVoltage: 240,
  continuityTarget: 'standard',
  facilities: [
    {
      id: 'trailer',
      type: 'jobsite_trailer',
      label: 'Jobsite Trailer',
      quantity: 1,
      kwPerUnit: 56,
      structureType: 'container',
      structureMultiplier: 1,
    },
  ],
}

describe('verifyTempPowerPlanningBrief', () => {
  it('passes when line-item, cooling, total, rental, and schedule arithmetic agree', () => {
    const results = calculateTempPowerPlanningBrief(inputs)
    const verification = verifyTempPowerPlanningBrief(inputs, results)

    expect(verification.passed).toBe(true)
    expect(verification.passedCount).toBe(5)
    expect(verification.checkedCount).toBe(5)
  })

  it('fails closed when a displayed result drifts from the calculation source', () => {
    const results = calculateTempPowerPlanningBrief(inputs)
    const verification = verifyTempPowerPlanningBrief(inputs, {
      ...results,
      totalWithCoolingKw: results.totalWithCoolingKw + 1,
    })

    expect(verification.passed).toBe(false)
    expect(verification.checks.find((check) => check.id === 'total_load')?.passed).toBe(false)
  })
})
