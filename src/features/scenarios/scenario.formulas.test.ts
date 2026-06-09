import { describe, it, expect } from 'vitest'
import { interpolateBSFC, calculateTempPower, evaluateHybrid, calculateHybridWizard } from './scenario.formulas'

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
  it('calculates single-load mode correctly', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 200,
      sqFt: 2000,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 720,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })

    expect(result.totalLoadKw).toBe(200)
    expect(result.coolingTons).toBeGreaterThan(0)
    expect(result.generatorKva).toBeGreaterThan(result.totalWithCoolingKw)
    expect(result.totalFuelGallons).toBeGreaterThan(0)
    expect(result.ampsPerPhase).toBeGreaterThan(0)
  })

  it('flags parallel runs when amps exceed 200A per phase (banded 5 threshold)', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 200,
      sqFt: 2000,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 720,
      altitude: 0,
      powerFactor: 0.8,
      facilities: [],
    })
    expect(result.ampsPerPhase).toBeGreaterThan(200)
    expect(result.parallelRunsNeeded).toBe(true)
  })

  it('does not flag parallel runs for small loads', () => {
    const result = calculateTempPower({
      mode: 'single',
      loadKw: 20,
      sqFt: 200,
      ambientTemp: 80,
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
    expect(result.dailyFuelReduction).toBeGreaterThan(0)
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
    expect(result.totalFuelSavingsDollars).toBeGreaterThan(0)
  })
})
