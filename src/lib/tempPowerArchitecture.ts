import { GENERATOR_FLEET, type GeneratorFleetUnit } from './equipmentRecommendations'

export type TempPowerContinuityTarget = 'standard' | 'n_plus_1'

export interface TempPowerArchitectureInputs {
  planningLoadKw: number
  requiredCapacityKw: number
  powerFactor: number
  sourceVoltage: number
  loadVoltage: number
  continuityTarget: TempPowerContinuityTarget
}

export interface TempPowerSourceArchitecture {
  topology: 'single' | 'parallel' | 'n_plus_1'
  label: string
  unit: GeneratorFleetUnit
  unitCount: number
  operatingUnitCount: number
  totalCapacityKw: number
  firmCapacityKw: number
  normalLoadFactor: number
  firmLoadFactor: number
  generatorFootprintSqFt: number
  planningEnvelopeSqFt: number
  parallelingRequired: boolean
  continuityTarget: TempPowerContinuityTarget
  commercialPosture: string
  rationale: string[]
}

export interface TempPowerTransformerPlan {
  required: boolean
  primaryVoltage: number
  secondaryVoltage: number
  requiredKva: number
  unitKva: number
  unitCount: number
  firmCapacityKva: number
  planningFootprintSqFt: number
  continuityNote: string
}

export interface TempPowerArchitecturePlan {
  selected: TempPowerSourceArchitecture
  standard: TempPowerSourceArchitecture
  resilient: TempPowerSourceArchitecture
  transformer: TempPowerTransformerPlan
  sourceNote: string
}

interface Candidate {
  unit: GeneratorFleetUnit
  unitCount: number
  operatingUnitCount: number
  totalCapacityKw: number
  firmCapacityKw: number
  generatorFootprintSqFt: number
  planningEnvelopeSqFt: number
  score: number
}

const TRANSFORMER_CLASSES_KVA = [15, 30, 45, 75, 150, 300, 375, 500]

function buildCandidate(
  unit: GeneratorFleetUnit,
  requiredCapacityKw: number,
  continuityTarget: TempPowerContinuityTarget,
): Candidate {
  const operatingUnitCount = Math.max(1, Math.ceil(requiredCapacityKw / unit.kw))
  const unitCount = operatingUnitCount + (continuityTarget === 'n_plus_1' ? 1 : 0)
  const totalCapacityKw = unit.kw * unitCount
  const firmCapacityKw = unit.kw * operatingUnitCount
  const generatorFootprintSqFt = unit.footprintSqFt * unitCount
  const planningEnvelopeSqFt = Math.ceil(generatorFootprintSqFt * 1.35)
  const excessRatio = (firmCapacityKw - requiredCapacityKw) / Math.max(1, requiredCapacityKw)
  const score = (unitCount * 0.55) + (excessRatio * 1.4) + (planningEnvelopeSqFt / 1800)

  return {
    unit,
    unitCount,
    operatingUnitCount,
    totalCapacityKw,
    firmCapacityKw,
    generatorFootprintSqFt,
    planningEnvelopeSqFt,
    score,
  }
}

function selectArchitecture(
  planningLoadKw: number,
  requiredCapacityKw: number,
  continuityTarget: TempPowerContinuityTarget,
): TempPowerSourceArchitecture {
  // Above 1 MW, favor the rental-market 500 kW modular plant instead of a
  // single hard-to-source, single-failure large generator. Very large plants
  // may step to 1 MW modules to keep the practical unit count bounded.
  const eligibleFleet = requiredCapacityKw > 6000
    ? GENERATOR_FLEET.filter((unit) => unit.kw === 1000)
    : requiredCapacityKw > 1000
      ? GENERATOR_FLEET.filter((unit) => unit.kw === 500)
      : GENERATOR_FLEET
  const candidates = eligibleFleet
    .map((unit) => buildCandidate(unit, requiredCapacityKw, continuityTarget))
    .filter((candidate) => candidate.unitCount <= 12)
    .sort((a, b) => a.score - b.score)

  const candidate = candidates[0] ?? buildCandidate(
    eligibleFleet[eligibleFleet.length - 1] ?? GENERATOR_FLEET[GENERATOR_FLEET.length - 1],
    requiredCapacityKw,
    continuityTarget,
  )
  const parallelingRequired = candidate.unitCount > 1
  const topology = continuityTarget === 'n_plus_1'
    ? 'n_plus_1'
    : parallelingRequired ? 'parallel' : 'single'
  const label = topology === 'single'
    ? `1 x ${candidate.unit.kw} kW generator`
    : `${candidate.unitCount} x ${candidate.unit.kw} kW generators`
  const normalLoadFactor = planningLoadKw / Math.max(1, candidate.totalCapacityKw)
  const firmLoadFactor = planningLoadKw / Math.max(1, candidate.firmCapacityKw)

  return {
    topology,
    label,
    unit: candidate.unit,
    unitCount: candidate.unitCount,
    operatingUnitCount: candidate.operatingUnitCount,
    totalCapacityKw: candidate.totalCapacityKw,
    firmCapacityKw: candidate.firmCapacityKw,
    normalLoadFactor,
    firmLoadFactor,
    generatorFootprintSqFt: candidate.generatorFootprintSqFt,
    planningEnvelopeSqFt: candidate.planningEnvelopeSqFt,
    parallelingRequired,
    continuityTarget,
    commercialPosture: continuityTarget === 'n_plus_1'
      ? 'Higher equipment and controls cost; planned load remains supported with one generator unavailable.'
      : parallelingRequired
        ? 'Multiple units and paralleling controls add cost, but allow the source plant to scale beyond a single rental unit.'
        : 'Lowest equipment count and simplest controls for the stated load; no generator redundancy is included.',
    rationale: [
      `${Math.round(requiredCapacityKw)} kW source-capacity target after load and field allowances.`,
      continuityTarget === 'n_plus_1'
        ? `${Math.round(candidate.firmCapacityKw)} kW remains after one generator is unavailable.`
        : `${Math.round(candidate.totalCapacityKw)} kW installed capacity supports the stated planning target.`,
      parallelingRequired
        ? 'Paralleling switchgear, synchronization, load sharing, isolation, and sequence of operation require project-specific confirmation.'
        : 'A single source avoids paralleling controls; maintenance or source failure interrupts service unless another source is added.',
    ],
  }
}

function transformerFootprint(unitKva: number, count: number) {
  const perUnitAllowance = Math.max(24, Math.min(90, unitKva * 0.15))
  return Math.ceil(perUnitAllowance * count * 1.25)
}

function buildTransformerPlan(inputs: TempPowerArchitectureInputs): TempPowerTransformerPlan {
  const required = inputs.sourceVoltage !== inputs.loadVoltage
  if (!required) {
    return {
      required: false,
      primaryVoltage: inputs.sourceVoltage,
      secondaryVoltage: inputs.loadVoltage,
      requiredKva: 0,
      unitKva: 0,
      unitCount: 0,
      firmCapacityKva: 0,
      planningFootprintSqFt: 0,
      continuityNote: 'No step-down transformer is shown because source and load voltages match.',
    }
  }

  const requiredKva = inputs.planningLoadKw / Math.max(0.1, inputs.powerFactor)
  let best: { unitKva: number; unitCount: number; firmCapacityKva: number; score: number } | null = null

  for (const unitKva of TRANSFORMER_CLASSES_KVA) {
    const operatingCount = Math.max(1, Math.ceil(requiredKva / unitKva))
    const unitCount = operatingCount + (inputs.continuityTarget === 'n_plus_1' ? 1 : 0)
    if (unitCount > 12) continue
    const firmCapacityKva = unitKva * operatingCount
    const excessRatio = (firmCapacityKva - requiredKva) / Math.max(1, requiredKva)
    const score = (unitCount * 0.65) + (excessRatio * 1.25) + (transformerFootprint(unitKva, unitCount) / 500)
    if (!best || score < best.score) best = { unitKva, unitCount, firmCapacityKva, score }
  }

  const selected = best ?? {
    unitKva: 500,
    unitCount: Math.ceil(requiredKva / 500) + (inputs.continuityTarget === 'n_plus_1' ? 1 : 0),
    firmCapacityKva: Math.ceil(requiredKva / 500) * 500,
    score: 0,
  }

  return {
    required: true,
    primaryVoltage: inputs.sourceVoltage,
    secondaryVoltage: inputs.loadVoltage,
    requiredKva,
    unitKva: selected.unitKva,
    unitCount: selected.unitCount,
    firmCapacityKva: selected.firmCapacityKva,
    planningFootprintSqFt: transformerFootprint(selected.unitKva, selected.unitCount),
    continuityNote: inputs.continuityTarget === 'n_plus_1'
      ? 'Conceptual N+1 transformer capacity is included; isolation, secondary ties, and selective coordination require engineering review.'
      : 'Transformer capacity covers the planning load without a redundant transformer bank.',
  }
}

export function buildTempPowerArchitecture(inputs: TempPowerArchitectureInputs): TempPowerArchitecturePlan {
  const planningLoadKw = Math.max(0, inputs.planningLoadKw)
  const requiredCapacityKw = Math.max(planningLoadKw, inputs.requiredCapacityKw)
  const standard = selectArchitecture(planningLoadKw, requiredCapacityKw, 'standard')
  const resilient = selectArchitecture(planningLoadKw, requiredCapacityKw, 'n_plus_1')

  return {
    selected: inputs.continuityTarget === 'n_plus_1' ? resilient : standard,
    standard,
    resilient,
    transformer: buildTransformerPlan(inputs),
    sourceNote: 'Generator classes are rental-fleet planning anchors. Transformer classes reflect common temporary 480 V to 208/120 V rental offerings. Footprints are conceptual equipment-and-service envelopes; vendor submittals and site layout control final selection.',
  }
}
