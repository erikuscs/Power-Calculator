import { describe, it, expect } from 'vitest'
import { calculateHybridWizard, calculateTempPower, calculateTempPowerPlanningBrief, calculateTempPowerSchedule, evaluateHybrid, interpolateBSFC } from './scenario.formulas'
import { calcGeneralPower } from '../power/power.formulas'

describe('interpolateBSFC', () => {
  it('returns exact values at data points', () => {
    expect(interpolateBSFC(0.25)).toBe(0.105)
    expect(interpolateBSFC(0.50)).toBe(0.085)
    expect(interpolateBSFC(0.75)).toBe(0.072)
    expect(interpolateBSFC(1.00)).toBe(0.068)
  })

  it('interpolates between data points', () => {
    const midpoint = interpolateBSFC(0.375)
    expect(midpoint).toBeCloseTo(0.095, 3)
  })

  it('clamps below minimum load factor', () => {
    expect(interpolateBSFC(0.1)).toBe(0.105)
  })
})

describe('calculateTempPower', () => {
  it('derives operating hours from rental period and schedule', () => {
    expect(calculateTempPowerSchedule('daily', 1, 'shift_8')).toEqual({
      rentalDays: 1,
      dailyRuntimeHours: 8,
      operatingHours: 8,
    })
    expect(calculateTempPowerSchedule('weekly', 2, 'shift_8')).toEqual({
      rentalDays: 14,
      dailyRuntimeHours: 8,
      operatingHours: 112,
    })
    expect(calculateTempPowerSchedule('monthly', 1, 'continuous_24_7')).toEqual({
      rentalDays: 28,
      dailyRuntimeHours: 24,
      operatingHours: 672,
    })
  })

  it('keeps generator-only scope separate from optional cooling', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 200,
      sqFt: 2000,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 240,
      rentalPeriod: 'monthly',
      rentalPeriodCount: 1,
      runtimeSchedule: 'shift_8',
      includeCooling: false,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })

    expect(result.coolingTons).toBe(0)
    expect(result.coolingKw).toBe(0)
    expect(result.totalWithCoolingKw).toBe(200)
    expect(result.rentalDays).toBe(28)
    expect(result.dailyRuntimeHours).toBe(8)
    expect(result.operatingHours).toBe(224)
  })

  it('uses selected cooling equipment demand instead of converting tons to electrical kW', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 200,
      sqFt: 2000,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 720,
      includeCooling: true,
      coolingCapacityTons: 35,
      coolingElectricalKw: 42,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })

    expect(result.totalLoadKw).toBe(200)
    expect(result.coolingTons).toBe(35)
    expect(result.coolingKw).toBe(42)
    expect(result.totalWithCoolingKw).toBe(242)
    expect(result.generatorKva).toBeGreaterThan(result.totalWithCoolingKw)
    expect(result.totalFuelGallons).toBeGreaterThan(0)
    expect(result.ampsPerPhase).toBeGreaterThan(0)
  })

  it('does not invent electrical demand when cooling equipment load is not entered', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 200,
      sqFt: 2000,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 24,
      includeCooling: true,
      coolingCapacityTons: 35,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })

    expect(result.coolingTons).toBe(35)
    expect(result.coolingKw).toBe(0)
    expect(result.totalWithCoolingKw).toBe(200)
  })

  it('flags parallel runs when amps exceed 400A per phase', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 500,
      sqFt: 5000,
      ambientTemp: 100,
      targetTemp: 72,
      durationHours: 720,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })
    expect(result.ampsPerPhase).toBeGreaterThan(400)
    expect(result.parallelRunsNeeded).toBe(true)
  })

  it('does not flag parallel runs for small loads', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 50,
      sqFt: 500,
      ambientTemp: 85,
      targetTemp: 72,
      durationHours: 24,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })
    expect(result.parallelRunsNeeded).toBe(false)
  })

  it('sums base camp facility loads', () => {
    const result = calculateTempPower({
      mode: 'basecamp',
      loadKw: 0,
      sqFt: 0,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 720,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [
        { id: '1', type: 'kitchen', label: 'Kitchen', quantity: 2, kwPerUnit: 50, structureType: 'canvas', structureMultiplier: 1.8 },
        { id: '2', type: 'berthing', label: 'Berthing', quantity: 3, kwPerUnit: 40, structureType: 'vinyl', structureMultiplier: 1.5 },
      ],
    })

    expect(result.totalLoadKw).toBe(2 * 50 + 3 * 40)
    expect(result.facilityBreakdown).toHaveLength(2)
  })

  it('applies altitude derating above 1000ft', () => {
    const seaLevel = calculateTempPower({
      mode: 'single', loadKw: 200, sqFt: 0, ambientTemp: 77, targetTemp: 72, durationHours: 24, altitude: 0, powerFactor: 0.8, facilities: [],
    })
    const highAlt = calculateTempPower({
      mode: 'single', loadKw: 200, sqFt: 0, ambientTemp: 77, targetTemp: 72, durationHours: 24, altitude: 5000, powerFactor: 0.8, facilities: [],
    })

    expect(highAlt.altitudeDerating).toBeGreaterThan(seaLevel.altitudeDerating)
    expect(highAlt.totalFuelGallons).toBeGreaterThan(seaLevel.totalFuelGallons)
  })

  it('tracks service cadence and noise fine exposure for mission-critical temporary power', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 4500,
      sqFt: 10000,
      ambientTemp: 90,
      targetTemp: 72,
      durationHours: 24 * 32,
      altitude: 0,
      powerFactor: 0.8,
      serviceIntervalDays: 10,
      technicianCoverage: '24_7',
      containmentRequired: true,
      noiseFinePerDay: 500,
      facilities: [],
    })

    expect(result.operatingDays).toBe(32)
    expect(result.serviceEvents).toBe(4)
    expect(result.noiseFineExposure).toBe(16000)
    expect(result.parallelRunsNeeded).toBe(true)
  })
})

describe('calculateTempPowerPlanningBrief', () => {
  it('returns only entered-load and schedule facts for the planning workflow', () => {
    const result = calculateTempPowerPlanningBrief({
      mode: 'basecamp',
      loadKw: 0,
      durationHours: 0,
      rentalPeriod: 'monthly',
      rentalPeriodCount: 1,
      runtimeSchedule: 'shift_8',
      includeCooling: true,
      coolingElectricalKw: 12,
      siteVoltage: 240,
      loadVoltage: 208,
      continuityTarget: 'n_plus_1',
      facilities: [
        { id: 'office', type: 'jobsite_trailer', label: 'Office', quantity: 2, kwPerUnit: 16, structureType: 'container', structureMultiplier: 1 },
      ],
    })

    expect(result).toEqual({
      totalLoadKw: 32,
      coolingKw: 12,
      totalWithCoolingKw: 44,
      rentalDays: 28,
      dailyRuntimeHours: 8,
      operatingHours: 224,
    })
    expect('generatorKva' in result).toBe(false)
    expect('fuelGallonsPerHour' in result).toBe(false)
    expect('ampsPerPhase' in result).toBe(false)
    expect('hybrid' in result).toBe(false)
  })
})

describe('evaluateHybrid', () => {
  it('recommends hybrid when peak/base ratio > 1.5', () => {
    const result = evaluateHybrid(1000, 400, 720, 1, 1)
    expect(result).not.toBeNull()
    expect(result!.recommended).toBe(true)
    expect(result!.hybrid.fuelSavingsPercent).toBeGreaterThan(0)
  })

  it('recommends hybrid for long-duration jobs', () => {
    const result = evaluateHybrid(400, 350, 240, 1, 1)
    expect(result).not.toBeNull()
    expect(result!.recommended).toBe(true)
  })

  it('shows fuel savings in hybrid mode', () => {
    const result = evaluateHybrid(800, 300, 720, 1, 1)
    expect(result).not.toBeNull()
    expect(result!.hybrid.fuel30Day).toBeLessThan(result!.allGen.fuel30Day)
  })
})

describe('calculateHybridWizard', () => {
  it('calculates BESS + generator configuration', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 800,
      baseLoadKw: 400,
      loadSource: 'measured',
      bessUnitSize: 300,
      peakHoursPerDay: 8,
      projectDurationDays: 30,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      motors: [],
    })

    expect(result.bessUnits).toBeGreaterThan(0)
    expect(result.genUnits).toBeGreaterThan(0)
    expect(result.totalCapacityKw).toBeGreaterThanOrEqual(800)
    expect(result.generatorRequiredUnits).toBe(2)
    expect(result.generatorStandbyUnits).toBe(1)
    expect(result.genUnits).toBe(3)
    expect(result.bessUnits).toBe(4)
    expect(result.hybridGeneratorDailyEnergyKwh).toBeGreaterThan(result.allGeneratorDailyEnergyKwh)
    expect(Number.isFinite(result.dailyFuelReduction)).toBe(true)
    expect(result.dailyFuelData).toHaveLength(30)
  })

  it('assigns DOL motors to generator circuits', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 800,
      baseLoadKw: 400,
      loadSource: 'measured',
      bessUnitSize: 300,
      peakHoursPerDay: 8,
      projectDurationDays: 30,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      motors: [
        { id: 'm1', hp: 200, startMethod: 'dol', fla: 248 },
        { id: 'm2', hp: 50, startMethod: 'vfd', fla: 65 },
      ],
    })

    const dolMotor = result.motorAssignments.find((m) => m.id === 'm1')
    const vfdMotor = result.motorAssignments.find((m) => m.id === 'm2')
    expect(dolMotor!.assignment).toBe('generator')
    expect(vfdMotor!.assignment).toBe('bess')
  })

  it('calculates cost savings including equipment rental', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 800,
      baseLoadKw: 400,
      loadSource: 'measured',
      bessUnitSize: 300,
      peakHoursPerDay: 8,
      projectDurationDays: 30,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-01-01',
      endDate: '',
      motors: [],
    })

    expect(result.allGenCost30Day).toBeGreaterThan(0)
    expect(result.hybridCost30Day).toBeGreaterThan(0)
    expect(result.totalFuelSavingsDollars).toBeCloseTo(result.totalFuelSavingsGal * 4.5, 5)
    expect(result.costSavings30Day).toBeCloseTo(result.allGenCost30Day - result.hybridCost30Day, 5)
  })

  it('handles commissioning-scale hybrid blocks without capping at small event loads', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 4500,
      baseLoadKw: 50,
      loadSource: 'measured',
      bessUnitSize: 600,
      peakHoursPerDay: 12,
      projectDurationDays: 5,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-01-01',
      endDate: '2026-01-06',
      motors: [],
    })

    expect(result.bessUnits).toBeGreaterThan(0)
    expect(result.totalCapacityKw).toBeGreaterThanOrEqual(4500)
    expect(Number.isFinite(result.totalFuelSavingsGal)).toBe(true)
    expect(result.parallelRunsNeeded).toBe(true)
  })

  it('models battery-first generator recharge coverage for 24/7 hybrid operation', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 2000,
      baseLoadKw: 800,
      loadSource: 'measured',
      bessUnitSize: 30,
      peakHoursPerDay: 4,
      projectDurationDays: 30,
      redundancy: '2n',
      siteVoltage: 208,
      altitude: 1400,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-08-17',
      endDate: '2026-09-16',
      motors: [],
    })

    expect(result.coverage.bessInstalledKwh).toBe(6000)
    expect(result.coverage.canCarryBaseWhileCharging).toBe(true)
    expect(result.coverage.canCarryPeakOnGenerator).toBe(false)
    expect(result.coverage.scenarios[0].label).toBe('Battery-first hybrid microgrid')
    expect(result.coverage.scenarios[0].status).toBe('24_7_ready')
    expect(result.coverage.scenarios[0].dispatch).toContain('remote-starts the generator')
  })

  it('flags peak coverage as conditional when generator cannot carry peak without charged BESS', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 800,
      baseLoadKw: 400,
      loadSource: 'measured',
      bessUnitSize: 300,
      peakHoursPerDay: 8,
      projectDurationDays: 30,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      motors: [],
    })

    expect(result.coverage.canCoverPeakWithHybrid).toBe(true)
    expect(result.coverage.canCarryPeakOnGenerator).toBe(true)
    expect(result.coverage.scenarios.find((scenario) => scenario.label === 'Generator-backed 24/7 fallback')?.status).toBe('24_7_ready')
  })

  it('reconciles the 1200 kW data-center N+1 capture scenario', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 1200,
      baseLoadKw: 800,
      loadSource: 'measured',
      bessUnitSize: 250,
      peakHoursPerDay: 8,
      projectDurationDays: 30,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-09-13',
      endDate: '2026-10-13',
      motors: [],
    })

    expect(result.generatorRequiredUnits).toBe(3)
    expect(result.generatorStandbyUnits).toBe(1)
    expect(result.genUnits).toBe(4)
    expect(result.generatorFirmCapacityKw).toBe(1500)
    expect(result.bessUnitsForPeak).toBe(2)
    expect(result.bessUnitsForEnergy).toBe(7)
    expect(result.bessUnits).toBe(7)
    expect(result.coverage.bessInstalledKwh).toBe(4025)
    expect(result.allGeneratorDailyEnergyKwh).toBe(22400)
    expect(result.hybridGeneratorDailyEnergyKwh).toBeCloseTo(22755.56, 2)
  })

  it('does not invent a recharge window for a 24-hour peak load', () => {
    const result = calculateHybridWizard({
      peakLoadKw: 1200,
      baseLoadKw: 800,
      loadSource: 'measured',
      bessUnitSize: 250,
      peakHoursPerDay: 24,
      projectDurationDays: 30,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-09-13',
      endDate: '2026-10-13',
      motors: [],
    })

    expect(result.bessUnitsForEnergy).toBe(0)
    expect(result.bessUnits).toBe(2)
    expect(result.generatorRequiredUnits).toBe(3)
    expect(result.rechargeEnergyKwh).toBe(0)
    expect(result.allGeneratorDailyEnergyKwh).toBe(28800)
    expect(result.hybridGeneratorDailyEnergyKwh).toBe(28800)
    expect(result.coverage.estimatedRechargeHours).toBeNull()
    expect(result.coverage.scenarios[0].status).toBe('conditional')
    expect(result.coverage.scenarios[0].requirement).toContain('No daily recharge window')
  })
})

describe('data-center source-load power smoke checks', () => {
  it('converts temporary construction power amperage into kW/kVA planning values', () => {
    const dayLoad = calcGeneralPower({ voltage: 208, amperes: 250, powerFactor: 0.8, phase: 'three' })
    const nightLoad = calcGeneralPower({ voltage: 208, amperes: 75, powerFactor: 0.8, phase: 'three' })
    const weekendLoad = calcGeneralPower({ voltage: 208, amperes: 60, powerFactor: 0.8, phase: 'three' })

    expect(dayLoad.kw).toBeCloseTo(72.1, 1)
    expect(dayLoad.kva).toBeCloseTo(90.1, 1)
    expect(nightLoad.kw).toBeCloseTo(21.6, 1)
    expect(weekendLoad.kw).toBeCloseTo(17.3, 1)
  })

  it('converts a 6000A commissioning block at 480V three-phase into MW-scale planning load', () => {
    const commissioningBlock = calcGeneralPower({ voltage: 480, amperes: 6000, powerFactor: 0.8, phase: 'three' })

    expect(commissioningBlock.kw).toBeCloseTo(3991, 0)
    expect(commissioningBlock.kva).toBeCloseTo(4988, 0)
  })
})
