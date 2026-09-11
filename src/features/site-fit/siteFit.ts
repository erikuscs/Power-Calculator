import { buildTempPowerArchitecture, type TempPowerArchitecturePlan } from '../../lib/tempPowerArchitecture'

export type SiteFitScenario = 'power' | 'power_cooling' | 'hybrid'
export type NeutralPlan = 'required' | 'not_carried' | 'review'
export type SiteFitView = 'integrated' | 'site' | 'one_line'

export interface SiteFitInputs {
  requestedPowerKw: number
  sourceVoltage: number
  loadVoltage: number
  powerFactor: number
  siteLengthFt: number
  siteWidthFt: number
  exclusionLengthFt: number
  exclusionWidthFt: number
  accessLaneWidthFt: number
  longestRouteFt: number
  scenario: SiteFitScenario
  neutralPlan: NeutralPlan
  continuity: 'standard' | 'n_plus_1'
}

export type SiteEquipmentKind = 'generator' | 'bess' | 'switchgear' | 'transformer' | 'fuel' | 'cooling'

export interface SiteEquipment {
  id: string
  kind: SiteEquipmentKind
  label: string
  rating: string
  lengthFt: number
  widthFt: number
  clearanceFt: number
  x: number
  y: number
  reason: string
  status: 'required' | 'conditional'
}

export interface SiteFitResult {
  architecture: TempPowerArchitecturePlan
  equipment: SiteEquipment[]
  siteAreaSqFt: number
  exclusionAreaSqFt: number
  accessAreaSqFt: number
  equipmentEnvelopeSqFt: number
  requiredAreaSqFt: number
  availableAreaSqFt: number
  remainingAreaSqFt: number
  shortfallSqFt: number
  validDemand: boolean
  geometryFeasible: boolean
  fits: boolean
  planningPowerCeilingKw: number
  ampsPerPhase: number
  cableRunsPerPhase: number
  cablePiecesPer50Ft: number | null
  cablePieceRangePer50Ft: [number, number] | null
  routeSections: number
  totalCablePieces: number | null
  totalCablePieceRange: [number, number] | null
  transformerRequired: boolean
  transformerReason: string
  neutralExplanation: string
  largeLowVoltageReview: boolean
}

export const DEFAULT_SITE_FIT_INPUTS: SiteFitInputs = {
  requestedPowerKw: 800,
  sourceVoltage: 480,
  loadVoltage: 208,
  powerFactor: 0.8,
  siteLengthFt: 90,
  siteWidthFt: 60,
  exclusionLengthFt: 10,
  exclusionWidthFt: 20,
  accessLaneWidthFt: 12,
  longestRouteFt: 100,
  scenario: 'power_cooling',
  neutralPlan: 'required',
  continuity: 'standard',
}

function equipmentEnvelopeArea(item: SiteEquipment) {
  return (item.lengthFt + (item.clearanceFt * 2)) * (item.widthFt + (item.clearanceFt * 2))
}

function generatorDimensions(footprintSqFt: number) {
  const lengthFt = Math.max(16, Math.round(Math.sqrt(footprintSqFt * 3)))
  return { lengthFt, widthFt: Math.max(8, Math.ceil(footprintSqFt / lengthFt)) }
}

function buildEquipment(inputs: SiteFitInputs, architecture: TempPowerArchitecturePlan): SiteEquipment[] {
  const generator = generatorDimensions(architecture.selected.unit.footprintSqFt)
  const sourceLabel = architecture.selected.unitCount > 1
    ? `${architecture.selected.unitCount} × ${architecture.selected.unit.kw} kW`
    : `${architecture.selected.unit.kw} kW`
  const items: SiteEquipment[] = [
    {
      id: 'GEN-1',
      kind: 'generator',
      label: architecture.selected.unitCount > 1 ? 'Generator Plant' : 'Generator',
      rating: sourceLabel,
      lengthFt: generator.lengthFt * architecture.selected.unitCount,
      widthFt: generator.widthFt,
      clearanceFt: 5,
      x: 47,
      y: 9,
      reason: `${architecture.selected.label} is required to support the ${Math.round(inputs.requestedPowerKw).toLocaleString()} kW planning load and selected continuity condition.`,
      status: 'required',
    },
    {
      id: 'SWGR-1',
      kind: 'switchgear',
      label: 'Switchgear / Bus',
      rating: `${inputs.sourceVoltage} V protected distribution`,
      lengthFt: 24,
      widthFt: 8,
      clearanceFt: 3,
      x: 40,
      y: 50,
      reason: 'Required to isolate, protect, meter, and divide the source into controlled feeders. Confirm whether it is integrated with the delivered generator package.',
      status: 'required',
    },
    {
      id: 'FUEL-1',
      kind: 'fuel',
      label: 'Fuel Tank',
      rating: 'Runtime allowance — field verify',
      lengthFt: 40,
      widthFt: 12,
      clearanceFt: 5,
      x: 18,
      y: 73,
      reason: 'Included to support the stated operating period; tank size, setbacks, containment, and refueling access require site confirmation.',
      status: 'conditional',
    },
  ]

  if (architecture.transformer.required) {
    const transformerDirection = inputs.sourceVoltage > inputs.loadVoltage ? 'Step-Down' : 'Step-Up'
    items.push({
      id: 'XFMR-1',
      kind: 'transformer',
      label: architecture.transformer.unitCount > 1 ? `${transformerDirection} Transformer Bank` : `${transformerDirection} Transformer`,
      rating: `${inputs.sourceVoltage} V → ${inputs.loadVoltage} V · ${architecture.transformer.unitCount} × ${Math.round(architecture.transformer.unitKva)} kVA`,
      lengthFt: Math.max(10, architecture.transformer.unitCount * 10),
      widthFt: 8,
      clearanceFt: 5,
      x: 18,
      y: 50,
      reason: `Required because the source bus is ${inputs.sourceVoltage} V and the connected load distribution requires ${inputs.loadVoltage} V.`,
      status: 'required',
    })
  }

  if (inputs.scenario === 'hybrid') {
    items.push({
      id: 'BESS-1',
      kind: 'bess',
      label: 'BESS',
      rating: '300 kW / 600 kWh planning block',
      lengthFt: 40,
      widthFt: 8,
      clearanceFt: 5,
      x: 18,
      y: 9,
      reason: 'Included because Hybrid was selected; usable energy, PCS rating, fire access, and dispatch controls require delivered-equipment review.',
      status: 'required',
    })
  }

  if (inputs.scenario === 'power_cooling') {
    items.push({
      id: 'COOL-1',
      kind: 'cooling',
      label: 'Cooling Equipment',
      rating: 'Electrical demand must match selected unit',
      lengthFt: 20,
      widthFt: 8,
      clearanceFt: 5,
      x: 69,
      y: 50,
      reason: 'Included because Power + Cooling was selected. Final count and electrical demand must come from the chosen cooling equipment.',
      status: 'required',
    })
  }

  return items
}

interface PackingRectangle {
  width: number
  height: number
}

function canPlaceRectangles(
  items: PackingRectangle[],
  siteLengthFt: number,
  siteWidthFt: number,
  accessLaneWidthFt: number,
  exclusionLengthFt: number,
  exclusionWidthFt: number,
) {
  const usableLength = Math.max(0, siteLengthFt - accessLaneWidthFt)
  const usableWidth = Math.max(0, siteWidthFt)
  const exclusionLength = Math.min(usableLength, exclusionLengthFt)
  const exclusionWidth = Math.min(usableWidth, exclusionWidthFt)
  if (usableLength <= 0 || usableWidth <= 0) return items.length === 0

  interface PlacedRectangle extends PackingRectangle { x: number; y: number }
  const obstacle: PlacedRectangle | null = exclusionLength > 0 && exclusionWidth > 0
    ? { x: usableLength - exclusionLength, y: usableWidth - exclusionWidth, width: exclusionLength, height: exclusionWidth }
    : null
  const remaining = [...items].sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height))

  const overlaps = (a: PlacedRectangle, b: PlacedRectangle) => !(
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y
  )

  const search = (index: number, placed: PlacedRectangle[]): boolean => {
    if (index >= remaining.length) return true
    const item = remaining[index]
    const orientations = item.width === item.height
      ? [[item.width, item.height]]
      : [[item.width, item.height], [item.height, item.width]]

    for (const [width, height] of orientations) {
      const xCandidates = new Set([0, usableLength - width])
      const yCandidates = new Set([0, usableWidth - height])
      if (obstacle) {
        xCandidates.add(obstacle.x - width)
        xCandidates.add(obstacle.x + obstacle.width)
        yCandidates.add(obstacle.y - height)
        yCandidates.add(obstacle.y + obstacle.height)
      }
      placed.forEach((other) => {
        xCandidates.add(other.x + other.width)
        xCandidates.add(other.x - width)
        yCandidates.add(other.y + other.height)
        yCandidates.add(other.y - height)
      })

      const candidates = Array.from(xCandidates)
        .flatMap((x) => Array.from(yCandidates).map((y) => ({ x, y })))
        .filter(({ x, y }) => x >= 0 && y >= 0 && x + width <= usableLength && y + height <= usableWidth)
        .sort((a, b) => (a.y - b.y) || (a.x - b.x))

      for (const candidate of candidates) {
        const next = { ...candidate, width, height }
        if (obstacle && overlaps(next, obstacle)) continue
        if (placed.some((other) => overlaps(next, other))) continue
        if (search(index + 1, [...placed, next])) return true
      }
    }

    return false
  }

  return search(0, [])
}

function equipmentRectangles(equipment: SiteEquipment[]): PackingRectangle[] {
  return equipment.map((item) => ({
    width: item.lengthFt + (item.clearanceFt * 2),
    height: item.widthFt + (item.clearanceFt * 2),
  }))
}

function neutralCounts(plan: NeutralPlan, runs: number) {
  if (plan === 'required') return { pieces: runs * 5, range: null }
  if (plan === 'not_carried') return { pieces: runs * 4, range: null }
  return { pieces: null, range: [runs * 4, runs * 5] as [number, number] }
}

export function calculateSiteFit(inputs: SiteFitInputs): SiteFitResult {
  const safe: SiteFitInputs = {
    ...inputs,
    requestedPowerKw: Math.max(0, inputs.requestedPowerKw),
    sourceVoltage: Math.max(1, inputs.sourceVoltage),
    loadVoltage: Math.max(1, inputs.loadVoltage),
    powerFactor: Math.max(0.1, Math.min(1, inputs.powerFactor)),
    siteLengthFt: Math.max(0, inputs.siteLengthFt),
    siteWidthFt: Math.max(0, inputs.siteWidthFt),
    exclusionLengthFt: Math.max(0, inputs.exclusionLengthFt),
    exclusionWidthFt: Math.max(0, inputs.exclusionWidthFt),
    accessLaneWidthFt: Math.max(0, inputs.accessLaneWidthFt),
    longestRouteFt: Math.max(0, inputs.longestRouteFt),
  }

  const architecture = buildTempPowerArchitecture({
    planningLoadKw: safe.requestedPowerKw,
    requiredCapacityKw: safe.requestedPowerKw * 1.25,
    powerFactor: safe.powerFactor,
    sourceVoltage: safe.sourceVoltage,
    loadVoltage: safe.loadVoltage,
    continuityTarget: safe.continuity,
  })
  const validDemand = safe.requestedPowerKw > 0
  const equipment = validDemand ? buildEquipment(safe, architecture) : []
  const siteAreaSqFt = safe.siteLengthFt * safe.siteWidthFt
  const exclusionAreaSqFt = Math.min(siteAreaSqFt, safe.exclusionLengthFt * safe.exclusionWidthFt)
  const accessAreaSqFt = Math.min(Math.max(0, siteAreaSqFt - exclusionAreaSqFt), safe.accessLaneWidthFt * safe.siteWidthFt)
  const equipmentEnvelopeSqFt = Math.round(equipment.reduce((sum, item) => sum + equipmentEnvelopeArea(item), 0))
  const requiredAreaSqFt = equipmentEnvelopeSqFt + accessAreaSqFt
  const availableAreaSqFt = Math.max(0, siteAreaSqFt - exclusionAreaSqFt)
  const remainingAreaSqFt = availableAreaSqFt - requiredAreaSqFt
  const geometryFeasible = validDemand && canPlaceRectangles(
    equipmentRectangles(equipment),
    safe.siteLengthFt,
    safe.siteWidthFt,
    safe.accessLaneWidthFt,
    safe.exclusionLengthFt,
    safe.exclusionWidthFt,
  )
  const fits = validDemand && remainingAreaSqFt >= 0 && geometryFeasible

  const generatorItem = equipment.find((item) => item.kind === 'generator')
  const nonGeneratorArea = equipment
    .filter((item) => item.kind !== 'generator')
    .reduce((sum, item) => sum + equipmentEnvelopeArea(item), 0)
  const unitDimensions = generatorDimensions(architecture.selected.unit.footprintSqFt)
  const generatorUnitArea = generatorItem ? equipmentEnvelopeArea({
    ...generatorItem,
    lengthFt: unitDimensions.lengthFt,
    widthFt: unitDimensions.widthFt,
  }) : 0
  const areaForGenerators = Math.max(0, availableAreaSqFt - accessAreaSqFt - nonGeneratorArea)
  const fixedRectangles = equipmentRectangles(equipment.filter((item) => item.kind !== 'generator'))
  let maximumGeneratorUnits = 0
  const areaMaximumGeneratorUnits = generatorUnitArea > 0 ? Math.max(0, Math.floor(areaForGenerators / generatorUnitArea)) : 0
  for (let units = 1; units <= Math.min(12, areaMaximumGeneratorUnits); units += 1) {
    const candidate = [
      ...fixedRectangles,
      ...Array.from({ length: units }, () => ({ width: unitDimensions.lengthFt + 10, height: unitDimensions.widthFt + 10 })),
    ]
    if (canPlaceRectangles(candidate, safe.siteLengthFt, safe.siteWidthFt, safe.accessLaneWidthFt, safe.exclusionLengthFt, safe.exclusionWidthFt)) {
      maximumGeneratorUnits = units
    }
  }
  const operatingUnits = safe.continuity === 'n_plus_1'
    ? Math.max(0, maximumGeneratorUnits - 1)
    : maximumGeneratorUnits
  const planningPowerCeilingKw = validDemand ? Math.floor((operatingUnits * architecture.selected.unit.kw) / 1.25) : 0

  const ampsPerPhase = (safe.requestedPowerKw * 1000) / (Math.sqrt(3) * safe.sourceVoltage * safe.powerFactor)
  const cableRunsPerPhase = validDemand ? Math.max(1, Math.ceil(ampsPerPhase / 400)) : 0
  const routeSections = validDemand ? Math.max(1, Math.ceil(safe.longestRouteFt / 50)) : 0
  const neutral = neutralCounts(safe.neutralPlan, cableRunsPerPhase)
  const totalCablePieces = neutral.pieces === null ? null : neutral.pieces * routeSections
  const totalCablePieceRange = neutral.range
    ? [neutral.range[0] * routeSections, neutral.range[1] * routeSections] as [number, number]
    : null

  const neutralExplanation = safe.neutralPlan === 'required'
    ? 'A/B/C/N/G planning count. Neutral is included because line-to-neutral loads or downstream distribution require it.'
    : safe.neutralPlan === 'not_carried'
      ? 'A/B/C/G planning count. Use only after confirming every served load is line-to-line and the system grounding and transfer arrangement.'
      : 'Neutral status is unresolved. The cable schedule shows both A/B/C/G and A/B/C/N/G counts until technical review confirms the system.'

  return {
    architecture,
    equipment,
    siteAreaSqFt,
    exclusionAreaSqFt,
    accessAreaSqFt,
    equipmentEnvelopeSqFt,
    requiredAreaSqFt,
    availableAreaSqFt,
    remainingAreaSqFt,
    shortfallSqFt: Math.max(0, -remainingAreaSqFt),
    validDemand,
    geometryFeasible,
    fits,
    planningPowerCeilingKw,
    ampsPerPhase,
    cableRunsPerPhase,
    cablePiecesPer50Ft: neutral.pieces,
    cablePieceRangePer50Ft: neutral.range,
    routeSections,
    totalCablePieces,
    totalCablePieceRange,
    transformerRequired: architecture.transformer.required,
    transformerReason: architecture.transformer.required
      ? `Required because the source bus is ${safe.sourceVoltage} V and the connected load distribution requires ${safe.loadVoltage} V.`
      : `Not shown because source and load voltage are both ${safe.loadVoltage} V.`,
    neutralExplanation,
    largeLowVoltageReview: safe.sourceVoltage <= 600 && (ampsPerPhase > 1200 || cableRunsPerPhase > 3 || architecture.selected.unitCount > 1),
  }
}
