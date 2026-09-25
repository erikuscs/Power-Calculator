import { calculateHybridWizard, type HybridWizardInputs } from './scenario.formulas'
import { buildHybridOneLineDiagram } from './oneLineDiagram'
import { buildHybridProjectPlan } from './hybridProjectPlan'

export const HYBRID_2000A_SERVICE_AMPS = 2000
export const HYBRID_2000A_CONTINUOUS_AMPS = 500
export const HYBRID_2000A_VOLTAGE = 480
export const HYBRID_2000A_POWER_FACTOR = 0.8
export const HYBRID_2000A_SERVICE_KVA = (HYBRID_2000A_SERVICE_AMPS * HYBRID_2000A_VOLTAGE * Math.sqrt(3)) / 1000
export const HYBRID_2000A_PROTECTED_KW = HYBRID_2000A_SERVICE_KVA * HYBRID_2000A_POWER_FACTOR
export const HYBRID_2000A_CONTINUOUS_KW = (HYBRID_2000A_CONTINUOUS_AMPS * HYBRID_2000A_VOLTAGE * Math.sqrt(3) * HYBRID_2000A_POWER_FACTOR) / 1000

export const HYBRID_2000A_INPUTS: HybridWizardInputs = {
  peakAmps: HYBRID_2000A_SERVICE_AMPS,
  continuousAmps: HYBRID_2000A_CONTINUOUS_AMPS,
  phase: 'three',
  peakLoadKw: HYBRID_2000A_PROTECTED_KW,
  baseLoadKw: HYBRID_2000A_CONTINUOUS_KW,
  loadSource: 'panel',
  bessUnitSize: 5,
  peakHoursPerDay: 1,
  projectDurationDays: 28,
  redundancy: 'n',
  siteVoltage: HYBRID_2000A_VOLTAGE,
  loadVoltage: 240,
  loadPhase: 'single',
  powerFactor: HYBRID_2000A_POWER_FACTOR,
  altitude: 0,
  ambientTemp: 85,
  fuelCostPerGallon: 8.5,
  bessRentalPerDay: 0,
  genRentalPerDay: 0,
  startDate: '2026-09-25',
  endDate: '2026-10-23',
  motors: [],
  longestCableRouteFt: 100,
  neutralPlan: 'required',
  siteLengthFt: 220,
  siteWidthFt: 120,
}

export const HYBRID_2000A_ZONES = Array.from({ length: 10 }, (_, index) => ({
  id: `trailer-${index + 1}`,
  name: `Job Site Trailer ${index + 1}`,
}))

export function buildHybrid2000AmpExample() {
  const results = calculateHybridWizard(HYBRID_2000A_INPUTS)
  const diagram = buildHybridOneLineDiagram(HYBRID_2000A_INPUTS, results, HYBRID_2000A_ZONES)
  const plan = buildHybridProjectPlan(HYBRID_2000A_INPUTS, results, [])

  return { inputs: HYBRID_2000A_INPUTS, results, diagram, plan, zones: HYBRID_2000A_ZONES }
}
