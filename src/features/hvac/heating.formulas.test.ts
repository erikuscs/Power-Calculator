import { describe, expect, it } from 'vitest'
import { calculateHeating } from './heating.formulas'

const base = {
  widthFt: 40,
  heightFt: 10,
  depthFt: 50,
  outdoorTempF: 30,
  targetTempF: 70,
  exposure: 'some_openings' as const,
  unitOutputBtu: 150000,
  runtimeHours: 8,
}

describe('calculateHeating', () => {
  it('calculates temporary heating capacity and equipment quantity from the space', () => {
    const result = calculateHeating({ ...base, source: 'electric', electricPowerSource: 'utility' })

    expect(result).not.toBeNull()
    expect(result!.volumeCuFt).toBe(20000)
    expect(result!.deltaT).toBe(40)
    expect(result!.requiredHeatingBtu).toBe(135000)
    expect(result!.planningHeatingBtu).toBeCloseTo(155250, 0)
    expect(result!.unitCount).toBe(2)
    expect(result!.installedOutputBtu).toBe(300000)
  })

  it('converts installed electric resistance heat into a generator planning load', () => {
    const result = calculateHeating({ ...base, source: 'electric', electricPowerSource: 'generator' })!

    expect(result.electricHeaterKw).toBeCloseTo(87.92, 1)
    expect(result.generatorPlanningKw).toBeCloseTo(109.9, 1)
    expect(result.generatorPlanningKva).toBeCloseTo(137.4, 1)
    expect(result.propaneGallonsPerHour).toBe(0)
  })

  it('calculates propane use and generator allowance for heater auxiliary circuits', () => {
    const result = calculateHeating({
      ...base,
      source: 'propane',
      propaneHeaterType: 'indirect',
      propaneEfficiency: 0.8,
      auxiliaryPowerSource: 'generator',
      auxiliaryVoltage: 120,
      auxiliaryCircuitAmps: 15,
    })!

    expect(result.propaneGallonsPerHour).toBeCloseTo(4.10, 1)
    expect(result.totalPropaneGallons).toBeCloseTo(32.82, 1)
    expect(result.auxiliaryRunningKva).toBeCloseTo(3.6, 2)
    expect(result.generatorPlanningKva).toBeCloseTo(4.5, 2)
    expect(result.electricHeaterKw).toBe(0)
  })

  it('rejects incomplete dimensions and a non-heating temperature difference', () => {
    expect(calculateHeating({ ...base, source: 'electric', widthFt: 0 })).toBeNull()
    expect(calculateHeating({ ...base, source: 'electric', outdoorTempF: 75 })).toBeNull()
    expect(calculateHeating({ ...base, source: 'electric', outdoorTempF: Number.NaN })).toBeNull()
    expect(calculateHeating({ ...base, source: 'propane', propaneEfficiency: 0 })).toBeNull()
    expect(calculateHeating({
      ...base,
      source: 'propane',
      propaneEfficiency: 0.8,
      auxiliaryPowerSource: 'generator',
      auxiliaryVoltage: 0,
      auxiliaryCircuitAmps: 15,
    })).toBeNull()
  })
})
