import { describe, expect, it } from 'vitest'
import { calculateHybridWizard, type HybridWizardInputs } from './scenario.formulas'
import { reviewHybridBenchmark } from './hybridBenchmark'

const baseInputs: HybridWizardInputs = {
  peakLoadKw: 176.4,
  baseLoadKw: 176.4,
  loadSource: 'measured',
  bessUnitSize: 30,
  peakHoursPerDay: 24,
  projectDurationDays: 28,
  redundancy: 'n1',
  siteVoltage: 480,
  altitude: 0,
  ambientTemp: 85,
  fuelCostPerGallon: 8.5,
  bessRentalPerDay: 0,
  genRentalPerDay: 0,
  startDate: '2026-09-24',
  endDate: '2026-10-22',
  motors: [],
  powerFactor: 0.8,
}

describe('hybrid benchmark review', () => {
  it('shows measured-load, continuous-power, modularity, firm-capacity, and recharge checks', () => {
    const results = calculateHybridWizard(baseInputs)
    const review = reviewHybridBenchmark(baseInputs, results)

    expect(review.loadBasisLabel).toContain('Measured load')
    expect(review.checks).toHaveLength(5)
    expect(review.checks.join(' ')).toContain('continuous')
    expect(review.checks.join(' ')).toContain('Firm after one generator unavailable')
    expect(review.checks.join(' ')).toContain('controlled recharge')
    expect(review.architectureStatus).toBe('resilient')
  })

  it('red-flags a single-source generator package', () => {
    const inputs = { ...baseInputs, peakLoadKw: 50, baseLoadKw: 50, bessUnitSize: 250 as const, redundancy: 'n' as const }
    const results = calculateHybridWizard(inputs)
    const review = reviewHybridBenchmark(inputs, results)

    expect(results.genUnits).toBe(1)
    expect(review.architectureStatus).toBe('single_source')
    expect(review.architectureLabel).toContain('RED FLAG')
    expect(review.warnings.join(' ')).toContain('single-failure point')
  })

  it('warns when a panel rating is used as the load basis', () => {
    const inputs = { ...baseInputs, loadSource: 'panel' as const }
    const review = reviewHybridBenchmark(inputs, calculateHybridWizard(inputs))

    expect(review.loadBasisLabel).toContain('verification required')
    expect(review.warnings.join(' ')).toContain('energy-manager data')
  })

  it('warns when modular generation has no maintenance reserve', () => {
    const inputs = { ...baseInputs, peakLoadKw: 600, baseLoadKw: 400, bessUnitSize: 250 as const, redundancy: 'n' as const }
    const review = reviewHybridBenchmark(inputs, calculateHybridWizard(inputs))

    expect(review.architectureStatus).toBe('no_maintenance_reserve')
    expect(review.architectureLabel).toContain('no standby unit')
    expect(review.warnings.join(' ')).toContain('removed for maintenance')
  })
})
