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
})
