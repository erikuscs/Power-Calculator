import { describe, expect, it } from 'vitest'
import { calculateHybridWizard, type HybridWizardInputs } from './scenario.formulas'
import { buildHybridProjectPlan } from './hybridProjectPlan'

const inputs: HybridWizardInputs = {
  peakLoadKw: 1200,
  baseLoadKw: 800,
  loadSource: 'measured',
  bessUnitSize: 250,
  peakHoursPerDay: 8,
  projectDurationDays: 30,
  redundancy: 'n1',
  siteVoltage: 480,
  loadVoltage: 208,
  powerFactor: 0.8,
  longestCableRouteFt: 100,
  neutralPlan: 'required',
  siteLengthFt: 240,
  siteWidthFt: 140,
  altitude: 0,
  ambientTemp: 85,
  fuelCostPerGallon: 4.5,
  bessRentalPerDay: 350,
  genRentalPerDay: 500,
  startDate: '2026-09-13',
  endDate: '2026-10-13',
  motors: [],
}

describe('buildHybridProjectPlan', () => {
  it('uses exactly one 28-day cycle for the automatic amp-first package', () => {
    const ampInputs: HybridWizardInputs = {
      ...inputs,
      peakAmps: 2000,
      continuousAmps: 500,
      phase: 'three',
      peakLoadKw: (2000 * 480 * Math.sqrt(3) * 0.8) / 1000,
      baseLoadKw: (500 * 480 * Math.sqrt(3) * 0.8) / 1000,
      projectDurationDays: 90,
      redundancy: 'n1',
      bess28DayRate: 9800,
      generator28DayRate: 14000,
    }
    const results = calculateHybridWizard(ampInputs)
    const plan = buildHybridProjectPlan(ampInputs, results, [])

    expect(results.bessUnits).toBe(2)
    expect(results.genUnits).toBe(3)
    expect(plan.quoteItems).toHaveLength(2)
    expect(plan.quoteItems.every((item) => item.periods === 1 && item.rateUnit === '28-day cycle')).toBe(true)
    expect(plan.quoteItems.find((item) => item.id === 'bess-rental')?.total).toBe(19600)
    expect(plan.quoteItems.find((item) => item.id === 'generator-rental')?.total).toBe(42000)
    expect(plan.budgetaryTotal).toBe(61600)
  })

  it('keeps equipment, branch cable, site envelope, and quote quantities on one result', () => {
    const results = calculateHybridWizard(inputs)
    const plan = buildHybridProjectPlan(inputs, results, [
      { id: 'zone-a', name: 'Commissioning Block A', kw: 700 },
      { id: 'zone-b', name: 'Cooling and Controls', kw: 500 },
    ])

    expect(plan.equipment.filter((item) => item.kind === 'generator')).toHaveLength(results.genUnits)
    expect(plan.equipment.filter((item) => item.kind === 'bess')).toHaveLength(results.bessUnits)
    expect(plan.cableSchedule.map((row) => row.id)).toEqual(['MAIN', 'BR-1', 'BR-2'])
    expect(plan.totalCablePieces).toBeGreaterThan(0)
    expect(plan.quoteItems.find((item) => item.id === 'generator-rental')?.quantity).toBe(results.genUnits)
    expect(plan.quoteItems.find((item) => item.id === 'bess-rental')?.quantity).toBe(results.bessUnits)
    expect(plan.quoteItems.some((item) => item.confirmation === 'vendor_required')).toBe(true)
  })

  it('shows one 28-day equipment billing cycle without changing the normalized project cost', () => {
    const cycleInputs = {
      ...inputs,
      projectDurationDays: 28,
      fuelCostPerGallon: 8.5,
      bessRentalRate: 9800,
      bessRentalRatePeriod: 'monthly' as const,
      genRentalRate: 14000,
      genRentalRatePeriod: 'monthly' as const,
    }
    const plan = buildHybridProjectPlan(cycleInputs, calculateHybridWizard(cycleInputs), [])
    const generator = plan.quoteItems.find((item) => item.id === 'generator-rental')
    const bess = plan.quoteItems.find((item) => item.id === 'bess-rental')
    expect(generator).toMatchObject({ rate: 14000, periods: 1, rateUnit: '28-day cycle' })
    expect(bess).toMatchObject({ rate: 9800, periods: 1, rateUnit: '28-day cycle' })
    expect(generator?.total).toBe(generator!.quantity * inputs.genRentalPerDay * 28)
    expect(bess?.total).toBe(bess!.quantity * inputs.bessRentalPerDay * 28)
  })

  it('prorates a 30-day project across the 28-day billing cycle', () => {
    const cycleInputs = {
      ...inputs,
      bessRentalRate: 9800,
      bessRentalRatePeriod: 'monthly' as const,
      genRentalRate: 14000,
      genRentalRatePeriod: 'monthly' as const,
    }
    const plan = buildHybridProjectPlan(cycleInputs, calculateHybridWizard(cycleInputs), [])
    expect(plan.quoteItems.find((item) => item.id === 'generator-rental')?.periods).toBeCloseTo(30 / 28, 6)
    expect(plan.quoteItems.find((item) => item.id === 'bess-rental')?.periods).toBeCloseTo(30 / 28, 6)
  })

  it('shows a cable range when neutral status is unresolved', () => {
    const unresolved = { ...inputs, neutralPlan: 'review' as const }
    const plan = buildHybridProjectPlan(unresolved, calculateHybridWizard(unresolved), [])
    expect(plan.totalCablePieces).toBeNull()
    expect(plan.totalCablePieceRange?.[1]).toBeGreaterThan(plan.totalCablePieceRange?.[0] ?? 0)
  })

  it('keeps an unassigned branch in the cable schedule until zones balance', () => {
    const plan = buildHybridProjectPlan(inputs, calculateHybridWizard(inputs), [
      { id: 'zone-a', name: 'Commissioning Block A', kw: 700 },
    ])
    expect(plan.cableSchedule.find((row) => row.circuit.includes('Unassigned load'))?.loadKw).toBe(500)
    expect(plan.totalCablePieces).toBe(170)
  })

  it('rejects equipment that overhangs a narrow site even after row wrapping', () => {
    const narrow = { ...inputs, siteLengthFt: 40, siteWidthFt: 500 }
    const plan = buildHybridProjectPlan(narrow, calculateHybridWizard(narrow), [])
    expect(plan.layoutFits).toBe(false)
  })

  it('calculates the ten balanced 240 V single-phase trailer feeders independently of the 480 V source', () => {
    const peakLoadKw = (2000 * 480 * Math.sqrt(3) * 0.8) / 1000
    const baseLoadKw = (500 * 480 * Math.sqrt(3) * 0.8) / 1000
    const trailerInputs: HybridWizardInputs = {
      ...inputs,
      peakLoadKw,
      baseLoadKw,
      projectDurationDays: 28,
      redundancy: 'n',
      bessUnitSize: 30,
      loadVoltage: 240,
      loadPhase: 'single',
      longestCableRouteFt: 100,
      neutralPlan: 'required',
    }
    const zones = Array.from({ length: 10 }, (_, index) => ({
      id: `trailer-${index + 1}`,
      name: `Job Site Trailer ${index + 1}`,
      kw: peakLoadKw / 10,
    }))
    const plan = buildHybridProjectPlan(trailerInputs, calculateHybridWizard(trailerInputs), zones)
    const branchRows = plan.cableSchedule.filter((row) => row.id.startsWith('BR-'))

    expect(branchRows).toHaveLength(10)
    expect(plan.equipment.filter((item) => item.kind === 'bess')).toHaveLength(12)
    expect(plan.equipment.filter((item) => item.kind === 'generator')).toHaveLength(3)
    expect(branchRows[0].ampsPerPhase).toBeCloseTo(692.82, 2)
    expect(branchRows[0]).toMatchObject({ runsPerPhase: 2, routeSections: 2, pieces: 16 })
    expect(plan.cableSchedule.find((row) => row.id === 'MAIN')?.pieces).toBe(50)
    expect(plan.totalCablePieces).toBe(210)
  })
})
