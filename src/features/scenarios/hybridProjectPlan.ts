import { BESS_FLEET, GENERATOR_FLEET } from '../../lib/equipmentRecommendations'
import type { HybridWizardInputs, HybridWizardResults } from './scenario.formulas'

export interface HybridZone {
  id: string
  name: string
  kw: number
}

export interface HybridCableRow {
  id: string
  circuit: string
  loadKw: number
  voltage: number
  ampsPerPhase: number
  runsPerPhase: number
  routeSections: number
  pieces: number | null
  pieceRange: [number, number] | null
  neutral: 'carried' | 'not_carried' | 'review'
}

export interface HybridLayoutItem {
  id: string
  label: string
  detail: string
  kind: 'generator' | 'bess' | 'control' | 'switchgear' | 'transformer' | 'fuel'
  lengthFt: number
  widthFt: number
  heightFt: number
  xFt: number
  yFt: number
}

export interface HybridQuoteItem {
  id: string
  category: 'equipment' | 'accessory' | 'fuel'
  description: string
  modelSku: string
  quantity: number
  rate: number
  periods: number
  rateUnit: string
  total: number
  confirmation: 'entered_rate' | 'vendor_required'
}

export interface HybridProjectPlan {
  cableSchedule: HybridCableRow[]
  totalCablePieces: number | null
  totalCablePieceRange: [number, number] | null
  neutralExplanation: string
  equipment: HybridLayoutItem[]
  siteLengthFt: number
  siteWidthFt: number
  layoutFits: boolean
  equipmentEnvelopeSqFt: number
  quoteItems: HybridQuoteItem[]
  budgetaryTotal: number
}

function cableRow(
  id: string,
  circuit: string,
  loadKw: number,
  voltage: number,
  powerFactor: number,
  routeSections: number,
  neutral: HybridWizardInputs['neutralPlan'],
): HybridCableRow {
  const ampsPerPhase = loadKw > 0 ? (loadKw * 1000) / (Math.sqrt(3) * voltage * powerFactor) : 0
  const runsPerPhase = loadKw > 0 ? Math.max(1, Math.ceil(ampsPerPhase / 400)) : 0
  const basePieces = runsPerPhase * routeSections
  const pieces = neutral === 'review' ? null : basePieces * (neutral === 'not_carried' ? 4 : 5)
  const pieceRange = neutral === 'review'
    ? [basePieces * 4, basePieces * 5] as [number, number]
    : null
  return {
    id,
    circuit,
    loadKw,
    voltage,
    ampsPerPhase,
    runsPerPhase,
    routeSections,
    pieces,
    pieceRange,
    neutral: neutral === 'not_carried' ? 'not_carried' : neutral === 'review' ? 'review' : 'carried',
  }
}

function dimensions(footprintSqFt: number, minLength: number, minWidth: number) {
  const lengthFt = Math.max(minLength, Math.ceil(Math.sqrt(footprintSqFt * 2.4)))
  return { lengthFt, widthFt: Math.max(minWidth, Math.ceil(footprintSqFt / lengthFt)) }
}

export function buildHybridProjectPlan(
  inputs: HybridWizardInputs,
  results: HybridWizardResults,
  zones: HybridZone[],
): HybridProjectPlan {
  const powerFactor = Math.max(0.1, Math.min(1, inputs.powerFactor ?? 0.8))
  const loadVoltage = Math.max(1, inputs.loadVoltage ?? inputs.siteVoltage)
  const routeSections = Math.max(1, Math.ceil(Math.max(1, inputs.longestCableRouteFt ?? 100) / 50))
  const neutral = inputs.neutralPlan ?? 'review'
  const validZones = zones.filter((zone) => zone.kw > 0)
  const assignedZoneKw = validZones.reduce((sum, zone) => sum + zone.kw, 0)
  const unassignedLoadKw = Math.max(0, inputs.peakLoadKw - assignedZoneKw)
  const branches = validZones.length > 0
    ? [
        ...validZones,
        ...(unassignedLoadKw > 1 ? [{ id: 'unassigned-load', name: 'Unassigned load — resolve before handoff', kw: unassignedLoadKw }] : []),
      ]
    : [{ id: 'protected-load', name: 'Protected load bus', kw: inputs.peakLoadKw }]
  const cableSchedule = [
    cableRow('MAIN', 'Source plant to main switchgear', inputs.peakLoadKw, inputs.siteVoltage, powerFactor, routeSections, neutral),
    ...branches.map((zone, index) => cableRow(`BR-${index + 1}`, zone.name, zone.kw, loadVoltage, powerFactor, routeSections, neutral)),
  ]
  const exactPieces = cableSchedule.every((row) => row.pieces !== null)
  const totalCablePieces = exactPieces ? cableSchedule.reduce((sum, row) => sum + (row.pieces ?? 0), 0) : null
  const totalCablePieceRange = exactPieces ? null : cableSchedule.reduce<[number, number]>((sum, row) => {
    const range = row.pieceRange ?? [row.pieces ?? 0, row.pieces ?? 0]
    return [sum[0] + range[0], sum[1] + range[1]]
  }, [0, 0])

  const generatorFleet = GENERATOR_FLEET.find((unit) => unit.kw === results.genUnitSizeKw) ?? GENERATOR_FLEET[7]
  const bessFleet = BESS_FLEET.find((unit) => unit.kw === inputs.bessUnitSize) ?? BESS_FLEET[BESS_FLEET.length - 1]
  const genSize = dimensions(generatorFleet.footprintSqFt, 18, 8)
  const bessSize = dimensions(bessFleet.footprintSqFt, 12, 7)
  const rawEquipment: Omit<HybridLayoutItem, 'xFt' | 'yFt'>[] = [
    ...Array.from({ length: results.genUnits }, (_, index) => ({
      id: `GEN-${index + 1}`,
      label: index >= results.generatorRequiredUnits ? 'Standby generator' : 'Duty generator',
      detail: `${results.genUnitSizeKw} kW`,
      kind: 'generator' as const,
      ...genSize,
      heightFt: 10,
    })),
    ...Array.from({ length: results.bessUnits }, (_, index) => ({
      id: `BESS-${index + 1}`,
      label: 'BESS unit',
      detail: `${inputs.bessUnitSize} kW / ${bessFleet.kwh} kWh`,
      kind: 'bess' as const,
      ...bessSize,
      heightFt: 10,
    })),
    { id: 'EMS-1', label: 'EMS / paralleling controls', detail: 'Dispatch and source control', kind: 'control' as const, lengthFt: 12, widthFt: 8, heightFt: 8 },
    { id: 'SWGR-1', label: 'Main switchgear / bus', detail: `${inputs.siteVoltage} V protected bus`, kind: 'switchgear' as const, lengthFt: 24, widthFt: 8, heightFt: 9 },
    ...(inputs.siteVoltage !== loadVoltage ? [{ id: 'XFMR-1', label: 'Transformer bank', detail: `${inputs.siteVoltage} V to ${loadVoltage} V`, kind: 'transformer' as const, lengthFt: 16, widthFt: 10, heightFt: 11 }] : []),
    { id: 'FUEL-1', label: 'Fuel and service zone', detail: 'Tank size and setbacks field verify', kind: 'fuel' as const, lengthFt: 30, widthFt: 12, heightFt: 8 },
  ]

  const siteLengthFt = Math.max(40, inputs.siteLengthFt ?? 160)
  const siteWidthFt = Math.max(30, inputs.siteWidthFt ?? 100)
  let xFt = 6
  let yFt = 6
  let rowWidthFt = 0
  let layoutFits = true
  const equipment = rawEquipment.map((item) => {
    const envelopeLength = item.lengthFt + 10
    const envelopeWidth = item.widthFt + 10
    if (xFt + envelopeLength > siteLengthFt) {
      xFt = 6
      yFt += rowWidthFt + 6
      rowWidthFt = 0
    }
    if (yFt + envelopeWidth > siteWidthFt) layoutFits = false
    const placed = { ...item, xFt, yFt }
    xFt += envelopeLength + 4
    rowWidthFt = Math.max(rowWidthFt, envelopeWidth)
    return placed
  })
  const equipmentEnvelopeSqFt = rawEquipment.reduce((sum, item) => sum + (item.lengthFt + 10) * (item.widthFt + 10), 0)

  const projectDays = Math.max(1, inputs.projectDurationDays)
  const fuelGallons = results.hybridFuelPerDay * projectDays
  const quoteItems: HybridQuoteItem[] = [
    { id: 'generator-rental', category: 'equipment', description: `${results.genUnitSizeKw} kW generator rental`, modelSku: 'FLEET-CLASS-VERIFY', quantity: results.genUnits, rate: inputs.genRentalPerDay, periods: projectDays, rateUnit: 'day', total: results.genUnits * inputs.genRentalPerDay * projectDays, confirmation: 'entered_rate' },
    { id: 'bess-rental', category: 'equipment', description: `${inputs.bessUnitSize} kW / ${bessFleet.kwh} kWh BESS rental`, modelSku: 'FLEET-CLASS-VERIFY', quantity: results.bessUnits, rate: inputs.bessRentalPerDay, periods: projectDays, rateUnit: 'day', total: results.bessUnits * inputs.bessRentalPerDay * projectDays, confirmation: 'entered_rate' },
    { id: 'diesel-fuel', category: 'fuel', description: 'Estimated diesel consumption', modelSku: 'FUEL-ALLOWANCE', quantity: fuelGallons, rate: inputs.fuelCostPerGallon, periods: 1, rateUnit: 'gallon', total: fuelGallons * inputs.fuelCostPerGallon, confirmation: 'entered_rate' },
    { id: 'distribution', category: 'accessory', description: 'ATS/paralleling controls, switchgear, transformer and protection package', modelSku: 'VENDOR-SELECTION-REQUIRED', quantity: 1, rate: 0, periods: 1, rateUnit: 'lot', total: 0, confirmation: 'vendor_required' },
    { id: 'cable', category: 'accessory', description: `4/0 planning cable schedule — ${totalCablePieces ?? `${totalCablePieceRange?.[0]}-${totalCablePieceRange?.[1]}`} pieces`, modelSku: 'CABLE-GAUGE-VENDOR-VERIFY', quantity: totalCablePieces ?? totalCablePieceRange?.[1] ?? 0, rate: 0, periods: 1, rateUnit: '50-ft piece', total: 0, confirmation: 'vendor_required' },
  ]

  return {
    cableSchedule,
    totalCablePieces,
    totalCablePieceRange,
    neutralExplanation: neutral === 'required'
      ? 'Carry A/B/C/N/G because line-to-neutral loads or downstream distribution are expected.'
      : neutral === 'not_carried'
        ? 'A/B/C/G only. Use this only after confirming every served load is line-to-line and the grounding and transfer arrangement do not require a neutral.'
        : 'Neutral is unresolved, so the schedule shows a four-to-five conductor range. Resolve line-to-neutral loads, transfer switching, grounding, and harmonics before release.',
    equipment,
    siteLengthFt,
    siteWidthFt,
    layoutFits,
    equipmentEnvelopeSqFt,
    quoteItems,
    budgetaryTotal: quoteItems.reduce((sum, item) => sum + item.total, 0),
  }
}
