export type RiskPosture = 'known' | 'assume_typical' | 'unknown'
export type RvServicePosture = 'known_30a' | 'known_50a' | 'mixed' | 'unknown'
export type ConfidenceBand = 'high' | 'medium' | 'low'

export interface TempPowerRiskInputs {
  rvService: RvServicePosture
  hiddenPlugLoads: RiskPosture
  motorStarting: RiskPosture
  occupancyVariance: RiskPosture
  airDistribution: RiskPosture
  winterHeat: RiskPosture
  waterHeating: RiskPosture
}

export interface FieldRiskReviewContext {
  inputs: TempPowerRiskInputs
  totalLoadKw: number
  coolingKw: number
  totalWithCoolingKw: number
  powerFactor?: number
}

export interface FieldRiskItem {
  id: keyof TempPowerRiskInputs
  label: string
  status: string
  severity: 'watch' | 'review' | 'critical'
  impact: string
}

export interface FieldRiskReview {
  confidenceScore: number
  confidenceBand: ConfidenceBand
  loadContingencyPct: number
  coolingContingencyPct: number
  contingencyKw: number
  adjustedPlanningKw: number
  adjustedGeneratorKw: number
  adjustedGeneratorKva: number
  rfis: string[]
  reportNotes: string[]
  items: FieldRiskItem[]
}

export const defaultTempPowerRiskInputs: TempPowerRiskInputs = {
  rvService: 'unknown',
  hiddenPlugLoads: 'assume_typical',
  motorStarting: 'unknown',
  occupancyVariance: 'assume_typical',
  airDistribution: 'assume_typical',
  winterHeat: 'unknown',
  waterHeating: 'unknown',
}

function posturePenalty(posture: RiskPosture) {
  if (posture === 'unknown') return 12
  if (posture === 'assume_typical') return 6
  return 0
}

function postureLoadAdder(posture: RiskPosture, unknownPct: number, typicalPct: number) {
  if (posture === 'unknown') return unknownPct
  if (posture === 'assume_typical') return typicalPct
  return 0
}

function postureStatus(posture: RiskPosture) {
  if (posture === 'unknown') return 'Unknown'
  if (posture === 'assume_typical') return 'Assume typical'
  return 'Known'
}

function severityFromPenalty(penalty: number): FieldRiskItem['severity'] {
  if (penalty >= 12) return 'critical'
  if (penalty >= 6) return 'review'
  return 'watch'
}

function confidenceBand(score: number): ConfidenceBand {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

export function buildFieldRiskReview({
  inputs,
  totalLoadKw,
  coolingKw,
  totalWithCoolingKw,
  powerFactor = 0.8,
}: FieldRiskReviewContext): FieldRiskReview {
  const items: FieldRiskItem[] = []
  const rfis: string[] = []
  const reportNotes: string[] = [
    'This easy-button review does not replace field judgment; it forces hidden load and unknown-risk assumptions into the quote record.',
  ]

  let score = 100
  let loadContingencyPct = 0
  let coolingContingencyPct = 0

  const addItem = (
    id: keyof TempPowerRiskInputs,
    label: string,
    penalty: number,
    status: string,
    impact: string,
    rfi?: string,
    note?: string,
  ) => {
    score -= penalty
    items.push({ id, label, status, severity: severityFromPenalty(penalty), impact })
    if (rfi) rfis.push(rfi)
    if (note) reportNotes.push(note)
  }

  if (inputs.rvService === 'unknown') {
    loadContingencyPct += 0.08
    addItem(
      'rvService',
      'RV pedestal service',
      14,
      'Unknown',
      'RV service type can swing connected load and voltage strategy materially.',
      'Confirm RV pedestal mix: 30A, 50A, mixed, and whether true 120/240V service is required.',
      'RV pedestal assumptions should be shown as a quote assumption until confirmed.',
    )
  } else if (inputs.rvService === 'mixed') {
    loadContingencyPct += 0.04
    addItem(
      'rvService',
      'RV pedestal service',
      7,
      'Mixed',
      'Mixed RV services require row-level distribution planning and phase balancing.',
      'Provide RV schedule by pedestal type and expected occupancy by row.',
    )
  } else {
    addItem(
      'rvService',
      'RV pedestal service',
      0,
      inputs.rvService === 'known_50a' ? 'Known 50A' : 'Known 30A',
      'RV service assumption is defined.',
    )
  }

  const hiddenPenalty = posturePenalty(inputs.hiddenPlugLoads)
  loadContingencyPct += postureLoadAdder(inputs.hiddenPlugLoads, 0.06, 0.03)
  addItem(
    'hiddenPlugLoads',
    'Hidden trailer plug loads',
    hiddenPenalty,
    postureStatus(inputs.hiddenPlugLoads),
    'Microwaves, heaters, coffee makers, chargers, and added office equipment often appear after quote.',
    inputs.hiddenPlugLoads === 'known' ? undefined : 'Ask whether jobsite trailers, offices, or RVs include electric heaters, microwaves, coffee makers, chargers, or added IT loads.',
    inputs.hiddenPlugLoads === 'known' ? undefined : 'Hidden plug loads are carried as a planning contingency until field inventory is confirmed.',
  )

  const motorPenalty = posturePenalty(inputs.motorStarting)
  loadContingencyPct += postureLoadAdder(inputs.motorStarting, 0.04, 0.02)
  addItem(
    'motorStarting',
    'Motor and compressor starting',
    motorPenalty,
    postureStatus(inputs.motorStarting),
    'Pump or compressor inrush can create generator transient, voltage sag, and BESS assignment risk.',
    inputs.motorStarting === 'known' ? undefined : 'Confirm compressor and pump horsepower, LRA, start method, and whether starts can be sequenced.',
    inputs.motorStarting === 'known' ? undefined : 'Motor starting should be reviewed before treating BESS or small generators as acceptable sources.',
  )

  const occupancyPenalty = posturePenalty(inputs.occupancyVariance)
  loadContingencyPct += postureLoadAdder(inputs.occupancyVariance, 0.05, 0.025)
  addItem(
    'occupancyVariance',
    'Occupancy creep',
    occupancyPenalty,
    postureStatus(inputs.occupancyVariance),
    'More occupants than planned increases plug load, hot water, restroom, and HVAC duty cycle.',
    inputs.occupancyVariance === 'known' ? undefined : 'Confirm expected occupancy, max shift overlap, and whether the camp can exceed the planned headcount.',
  )

  const airPenalty = posturePenalty(inputs.airDistribution)
  coolingContingencyPct += postureLoadAdder(inputs.airDistribution, 0.10, 0.04)
  addItem(
    'airDistribution',
    'Tent and air distribution',
    airPenalty,
    postureStatus(inputs.airDistribution),
    'Poor supply/return placement can leave one end of a long tent hot even when tonnage looks adequate.',
    inputs.airDistribution === 'known' ? undefined : 'Confirm tent length, duct layout, supply/return locations, door openings, and whether air distribution is balanced across the full space.',
    inputs.airDistribution === 'known' ? undefined : 'Cooling risk is carried separately from connected electrical load because distribution can fail even when tonnage is adequate.',
  )

  const winterPenalty = posturePenalty(inputs.winterHeat)
  loadContingencyPct += postureLoadAdder(inputs.winterHeat, 0.06, 0.03)
  addItem(
    'winterHeat',
    'Winter heat creep',
    winterPenalty,
    postureStatus(inputs.winterHeat),
    'Chicago winter behavior can shift loads from normal plug demand to space-heater and heat-trace demand.',
    inputs.winterHeat === 'known' ? undefined : 'Confirm electric heat, propane heat, heat trace, block heaters, and whether occupants may add portable heaters.',
  )

  const waterPenalty = posturePenalty(inputs.waterHeating)
  loadContingencyPct += postureLoadAdder(inputs.waterHeating, 0.05, 0.025)
  addItem(
    'waterHeating',
    'Water heating source',
    waterPenalty,
    postureStatus(inputs.waterHeating),
    'Electric shower or concession water heating can dominate morning and shift-change peaks.',
    inputs.waterHeating === 'known' ? undefined : 'Confirm shower and concession water heating source, tank recovery rate, and simultaneous shower use.',
  )

  loadContingencyPct = Math.min(loadContingencyPct, 0.28)
  coolingContingencyPct = Math.min(coolingContingencyPct, 0.14)

  const contingencyKw = (totalLoadKw * loadContingencyPct) + (coolingKw * coolingContingencyPct)
  const adjustedPlanningKw = totalWithCoolingKw + contingencyKw
  const adjustedGeneratorKw = adjustedPlanningKw * 1.25
  const adjustedGeneratorKva = adjustedGeneratorKw / Math.max(0.1, powerFactor)
  const confidenceScore = Math.max(0, Math.round(score))

  return {
    confidenceScore,
    confidenceBand: confidenceBand(confidenceScore),
    loadContingencyPct,
    coolingContingencyPct,
    contingencyKw,
    adjustedPlanningKw,
    adjustedGeneratorKw,
    adjustedGeneratorKva,
    rfis,
    reportNotes,
    items,
  }
}
