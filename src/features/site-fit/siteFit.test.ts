import { describe, expect, it } from 'vitest'
import { calculateSiteFit, DEFAULT_SITE_FIT_INPUTS } from './siteFit'

describe('site fit planning', () => {
  it('requires a transformer when source and load voltages differ', () => {
    const result = calculateSiteFit(DEFAULT_SITE_FIT_INPUTS)
    expect(result.transformerRequired).toBe(true)
    expect(result.equipment.some((item) => item.id === 'XFMR-1')).toBe(true)
    expect(result.transformerReason).toContain('480 V')
    expect(result.transformerReason).toContain('208 V')
  })

  it('removes the transformer when source and load voltage match', () => {
    const result = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, loadVoltage: 480 })
    expect(result.transformerRequired).toBe(false)
    expect(result.equipment.some((item) => item.id === 'XFMR-1')).toBe(false)
  })

  it('shows a lower planning power ceiling when site area is constrained', () => {
    const roomy = calculateSiteFit(DEFAULT_SITE_FIT_INPUTS)
    const constrained = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, siteLengthFt: 55, siteWidthFt: 35 })
    expect(constrained.fits).toBe(false)
    expect(constrained.planningPowerCeilingKw).toBeLessThan(roomy.planningPowerCeilingKw)
    expect(constrained.shortfallSqFt).toBeGreaterThan(0)
  })

  it('calculates neutral and no-neutral cable counts in 50-foot sections', () => {
    const withNeutral = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, longestRouteFt: 51, neutralPlan: 'required' })
    const withoutNeutral = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, longestRouteFt: 51, neutralPlan: 'not_carried' })
    expect(withNeutral.routeSections).toBe(2)
    expect(withNeutral.totalCablePieces).toBe(withNeutral.cableRunsPerPhase * 5 * 2)
    expect(withoutNeutral.totalCablePieces).toBe(withoutNeutral.cableRunsPerPhase * 4 * 2)
  })

  it('uses one banded assembly per 50-foot section at 200 A or below', () => {
    const result = calculateSiteFit({
      ...DEFAULT_SITE_FIT_INPUTS,
      requestedPowerKw: 100,
      sourceVoltage: 480,
      loadVoltage: 480,
      powerFactor: 0.8,
      longestRouteFt: 101,
    })

    expect(result.ampsPerPhase).toBeLessThanOrEqual(200)
    expect(result.cableMethod).toBe('banded-assembly')
    expect(result.routeSections).toBe(3)
    expect(result.totalCablePieces).toBe(3)
  })

  it('does not add an unsized fuel tank to the generic site-fit package', () => {
    const result = calculateSiteFit(DEFAULT_SITE_FIT_INPUTS)
    expect(result.equipment.some((item) => item.kind === 'fuel')).toBe(false)
  })

  it('flags large low-voltage high-current plans', () => {
    const result = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, requestedPowerKw: 1500, sourceVoltage: 480 })
    expect(result.ampsPerPhase).toBeGreaterThan(2200)
    expect(result.cableRunsPerPhase).toBe(6)
    expect(result.largeLowVoltageReview).toBe(true)
  })

  it('rejects area-only false positives when the site is too narrow for equipment envelopes', () => {
    const result = calculateSiteFit({
      ...DEFAULT_SITE_FIT_INPUTS,
      siteLengthFt: 1000,
      siteWidthFt: 6,
      exclusionLengthFt: 0,
      exclusionWidthFt: 0,
      accessLaneWidthFt: 0,
    })
    expect(result.requiredAreaSqFt).toBeLessThan(result.availableAreaSqFt)
    expect(result.geometryFeasible).toBe(false)
    expect(result.fits).toBe(false)
    expect(result.planningPowerCeilingKw).toBe(0)
  })

  it('uses direction-sensitive transformer language', () => {
    const result = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, sourceVoltage: 208, loadVoltage: 480, requestedPowerKw: 100 })
    expect(result.equipment.find((item) => item.kind === 'transformer')?.label).toContain('Step-Up')
  })

  it('withholds source and cable quantities when requested power is zero', () => {
    const result = calculateSiteFit({ ...DEFAULT_SITE_FIT_INPUTS, requestedPowerKw: 0 })
    expect(result.validDemand).toBe(false)
    expect(result.equipment).toEqual([])
    expect(result.cableRunsPerPhase).toBe(0)
    expect(result.totalCablePieces).toBe(0)
    expect(result.planningPowerCeilingKw).toBe(0)
  })

  it('uses a synced hybrid package instead of independently repicking equipment', () => {
    const result = calculateSiteFit({
      ...DEFAULT_SITE_FIT_INPUTS,
      requestedPowerKw: 1200,
      scenario: 'hybrid',
      continuity: 'n_plus_1',
      packageOverride: {
        source: 'hybrid',
        generatorCount: 4,
        generatorRequiredUnits: 3,
        generatorUnitKw: 500,
        generatorFirmCapacityKw: 1500,
        bessCount: 7,
        bessUnitKw: 250,
        bessUnitKwh: 575,
        layoutFits: true,
        equipmentEnvelopeSqFt: 4200,
        totalCablePieces: 170,
        totalCablePieceRange: null,
        layoutEquipment: [
          { id: 'GEN-1', kind: 'generator', label: 'Duty generator', detail: '500 kW', lengthFt: 30, widthFt: 10, xFt: 6, yFt: 6 },
          { id: 'BESS-1', kind: 'bess', label: 'BESS unit', detail: '250 kW / 575 kWh', lengthFt: 24, widthFt: 10, xFt: 50, yFt: 6 },
        ],
      },
    })
    expect(result.equipment.find((item) => item.id === 'GEN-1')?.rating).toBe('500 kW')
    expect(result.equipment.find((item) => item.id === 'BESS-1')?.rating).toBe('250 kW / 575 kWh')
    expect(result.totalCablePieces).toBe(170)
    expect(result.fits).toBe(true)
    expect(result.planningPowerCeilingKw).toBe(1500)
    expect(result.equipment.every((item) => item.x >= (DEFAULT_SITE_FIT_INPUTS.accessLaneWidthFt / DEFAULT_SITE_FIT_INPUTS.siteLengthFt) * 100)).toBe(true)
  })

  it('does not invent a generic BESS block for an unsynced hybrid plan', () => {
    const result = calculateSiteFit({
      ...DEFAULT_SITE_FIT_INPUTS,
      scenario: 'hybrid',
      packageOverride: undefined,
    })

    expect(result.equipment.some((item) => item.kind === 'bess')).toBe(false)
    expect(result.equipment.some((item) => item.rating.includes('300 kW / 600 kWh'))).toBe(false)
  })
})
