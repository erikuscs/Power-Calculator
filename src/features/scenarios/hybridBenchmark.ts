import type { HybridWizardInputs, HybridWizardResults } from './scenario.formulas'

export type HybridArchitectureStatus = 'resilient' | 'no_maintenance_reserve' | 'single_source'

export interface HybridBenchmarkReview {
  architectureStatus: HybridArchitectureStatus
  architectureLabel: string
  loadBasisLabel: string
  firmCapacityAfterOneUnavailableKw: number
  protectedLoadHeadroomKw: number
  checks: string[]
  warnings: string[]
}

export function reviewHybridBenchmark(
  inputs: HybridWizardInputs,
  results: HybridWizardResults,
): HybridBenchmarkReview {
  const firmCapacityAfterOneUnavailableKw = Math.max(0, results.genUnits - 1) * results.genUnitSizeKw
  const protectedLoadHeadroomKw = firmCapacityAfterOneUnavailableKw - inputs.peakLoadKw
  const warnings: string[] = []

  let architectureStatus: HybridArchitectureStatus = 'resilient'
  let architectureLabel = 'Modular generation with maintenance continuity'

  if (results.genUnits === 1) {
    architectureStatus = 'single_source'
    architectureLabel = 'RED FLAG — single-source generator plant'
    warnings.push('One generator is a single-failure point. Compare modular N+1 generation before presenting this package as continuity-ready.')
  } else if (results.generatorStandbyUnits === 0) {
    architectureStatus = 'no_maintenance_reserve'
    architectureLabel = 'WARNING — modular plant has no standby unit'
    warnings.push('Multiple generators reduce source concentration, but no unit can be removed for maintenance without reducing available capacity.')
  }

  if (results.genUnitSizeKw >= 1000) {
    warnings.push('Large-unit concentration can increase sourcing and replacement risk. Compare smaller parallel units when site space permits.')
  }

  if (inputs.loadSource === 'panel') {
    warnings.push('The load is based on a panel or transformer rating. Obtain interval or energy-manager data before treating the package as right-sized.')
  }

  if (protectedLoadHeadroomKw < 0) {
    warnings.push(`With one generator unavailable, the plant is ${Math.round(Math.abs(protectedLoadHeadroomKw)).toLocaleString()} kW short of the protected peak. Revise the topology or define load shedding.`)
  }

  return {
    architectureStatus,
    architectureLabel,
    loadBasisLabel: inputs.loadSource === 'measured'
      ? 'Measured load — suitable planning basis'
      : 'Panel/transformer rating — verification required',
    firmCapacityAfterOneUnavailableKw,
    protectedLoadHeadroomKw,
    checks: [
      `Load basis: ${inputs.loadSource === 'measured' ? 'measured demand' : 'panel/transformer rating'}`,
      `BESS basis: ${Math.round(results.bessUnitContinuousKw).toLocaleString()} kW continuous and ${Math.round(results.bessUnitUsableKwh).toLocaleString()} kWh usable per unit`,
      `Generator topology: ${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby (${results.genUnits} total)`,
      `Firm after one generator unavailable: ${Math.round(firmCapacityAfterOneUnavailableKw).toLocaleString()} kW`,
      `Generator duty includes ${Math.round(inputs.peakLoadKw).toLocaleString()} kW protected load plus up to ${Math.round(results.rechargePowerKw).toLocaleString()} kW controlled recharge`,
    ],
    warnings,
  }
}
