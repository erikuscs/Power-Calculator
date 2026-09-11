import { describe, expect, it } from 'vitest'
import { buildTempPowerArchitecture } from './tempPowerArchitecture'

describe('buildTempPowerArchitecture', () => {
  it('keeps a small standard load on a single generator', () => {
    const plan = buildTempPowerArchitecture({
      planningLoadKw: 56,
      requiredCapacityKw: 70,
      powerFactor: 0.8,
      sourceVoltage: 240,
      loadVoltage: 240,
      continuityTarget: 'standard',
    })

    expect(plan.selected.topology).toBe('single')
    expect(plan.selected.totalCapacityKw).toBeGreaterThanOrEqual(70)
    expect(plan.transformer.required).toBe(false)
  })

  it('adds one source unit when N+1 continuity is selected', () => {
    const plan = buildTempPowerArchitecture({
      planningLoadKw: 700,
      requiredCapacityKw: 875,
      powerFactor: 0.8,
      sourceVoltage: 480,
      loadVoltage: 208,
      continuityTarget: 'n_plus_1',
    })

    expect(plan.selected.topology).toBe('n_plus_1')
    expect(plan.selected.unitCount).toBe(plan.selected.operatingUnitCount + 1)
    expect(plan.selected.firmCapacityKw).toBeGreaterThanOrEqual(875)
    expect(plan.transformer.required).toBe(true)
    expect(plan.transformer.firmCapacityKva).toBeGreaterThanOrEqual(700 / 0.8)
  })

  it('uses parallel units when the required capacity exceeds one fleet unit', () => {
    const plan = buildTempPowerArchitecture({
      planningLoadKw: 2600,
      requiredCapacityKw: 3250,
      powerFactor: 0.8,
      sourceVoltage: 480,
      loadVoltage: 480,
      continuityTarget: 'standard',
    })

    expect(plan.selected.topology).toBe('parallel')
    expect(plan.selected.unitCount).toBeGreaterThan(1)
    expect(plan.selected.firmCapacityKw).toBeGreaterThanOrEqual(3250)
  })
})
