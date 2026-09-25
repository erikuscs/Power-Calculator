import { SAFETY_MARGINS } from './constants'
import { DIESEL_GENERATOR_SIZES_KW } from './dieselFuelCurve'

export interface GeneratorFleetUnit {
  kw: number
  label: string
  voltage: string
  footprintSqFt: number
  source: string
}

export interface BessFleetUnit {
  kw: number
  kwh: number
  continuousKw?: number
  chargeKw?: number
  chargeBasis?: 'published' | 'planning_assumption'
  usableKwh?: number
  peakKw?: number
  peakDurationHours?: number
  fieldNote?: string
  label: string
  voltage: string
  footprintSqFt: number
  source: string
  sourceUrl?: string
}

export interface EquipmentRecommendationInputs {
  peakKw: number
  baseKw?: number
  runtimeHours?: number
  projectDurationHours?: number
  peakHoursPerDay?: number
  powerFactor?: number
  preferredBessKw?: number
  redundancyFactor?: number
  siteVoltage?: number
}

export interface EquipmentRecommendation {
  sourceNote: string
  generator: EquipmentRecommendationOption
  bess: EquipmentRecommendationOption
  hybrid: EquipmentRecommendationOption
  preferred: 'generator' | 'bess' | 'hybrid'
  fuelCell: {
    fit: 'strong' | 'possible' | 'not_ideal'
    label: string
    reason: string
  }
}

export interface EquipmentRecommendationOption {
  label: string
  units: string
  capacityKw: number
  energyKwh?: number
  footprintSqFt: number
  practicality?: 'normal' | 'impractical'
  notes: string[]
}

function generatorPlanningFootprintSqFt(kw: number): number {
  if (kw <= 40) return 70
  if (kw <= 75) return 90
  if (kw <= 100) return 135
  if (kw <= 150) return 160
  if (kw <= 200) return 175
  if (kw <= 300) return 210
  if (kw <= 500) return 260
  if (kw <= 750) return 300
  if (kw <= 1250) return 320
  if (kw <= 1750) return 360
  return 390
}

export const GENERATOR_FLEET: GeneratorFleetUnit[] = DIESEL_GENERATOR_SIZES_KW.map((kw) => ({
  kw,
  label: `${kw} kW diesel generator`,
  voltage: kw >= 1000 ? '480 V typical' : 'multi-voltage',
  footprintSqFt: generatorPlanningFootprintSqFt(kw),
  source: 'Generic rental-market planning class; availability and dimensions require field verification',
}))

export const BESS_FLEET: BessFleetUnit[] = [
  { kw: 5, kwh: 7, continuousKw: 4.8, chargeKw: 2.6, chargeBasis: 'planning_assumption', peakKw: 5.8, peakDurationHours: 3 / 3600, label: 'Portable 5/7 — 4.8 kW continuous / 7 kWh nominal', voltage: '120 V', footprintSqFt: 12, source: 'Published equipment data; rental availability requires field verification' },
  { kw: 24, kwh: 90, continuousKw: 24, chargeKw: 24, chargeBasis: 'planning_assumption', usableKwh: 72, label: 'Generac MBE30 — 24 kW continuous / 72 kWh usable', voltage: '208/120 V', footprintSqFt: 80, source: 'Generac MBE30 manufacturer data; rental availability requires field verification' },
  { kw: 30, kwh: 146.7, continuousKw: 30, chargeKw: 30, chargeBasis: 'published', usableKwh: 132, label: 'Viridi RPS150 — 30 kW continuous / 132 kWh usable', voltage: '480/208 V', footprintSqFt: 100, source: 'Viridi RPS150 manufacturer data; rental availability requires field verification' },
  { kw: 75, kwh: 600, continuousKw: 40, chargeKw: 19.2, chargeBasis: 'published', usableKwh: 530, peakKw: 75, peakDurationHours: 1, fieldNote: 'Owner field experience reports protective shutdown near 42 kW. Use 40 kW as the planning ceiling; AC charging is 19.2 kW and is modeled after transfer of the customer load to the generator.', label: 'Moxion MP75-600 — 40 kW continuous / 530 kWh usable (75 kW for 1 hr)', voltage: '480 V 3-phase continuous rating', footprintSqFt: 180, source: 'Moxion MP75-600 Rev E manufacturer manual and owner field note; rental availability requires field verification' },
  { kw: 250, kwh: 575, continuousKw: 250, chargeKw: 250, chargeBasis: 'planning_assumption', usableKwh: 518, peakKw: 275, peakDurationHours: 10 / 60, label: 'Atlas Copco ZBC 250-575 — 250 kW continuous / 518 kWh net', voltage: '480 V 3-phase', footprintSqFt: 220, source: 'Atlas Copco ZBC 250-575 manufacturer data; rental availability requires field verification' },
]

export function normalizeRateToDaily(value: number, period: 'daily' | 'weekly' | 'monthly'): number {
  if (period === 'weekly') return value / 7
  if (period === 'monthly') return value / 28
  return value
}

export function recommendEquipment(inputs: EquipmentRecommendationInputs): EquipmentRecommendation | null {
  const peakKw = Math.max(0, inputs.peakKw)
  if (peakKw <= 0) return null

  const bessAutonomyHours = Math.max(1, inputs.runtimeHours ?? 4)
  const projectDurationHours = Math.max(bessAutonomyHours, inputs.projectDurationHours ?? bessAutonomyHours)
  const peakHoursPerDay = Math.max(1, inputs.peakHoursPerDay ?? Math.min(bessAutonomyHours, 8))
  const capacityFactor = Math.max(SAFETY_MARGINS.generator, inputs.redundancyFactor ?? SAFETY_MARGINS.generator)
  const hasEnteredBaseLoad = inputs.baseKw !== undefined && Number.isFinite(inputs.baseKw)
  const baseKw = hasEnteredBaseLoad
    ? Math.max(0, Math.min(inputs.baseKw ?? 0, peakKw))
    : peakKw
  const peakDeltaKw = Math.max(0, peakKw - baseKw)
  const hasHybridDelta = hasEnteredBaseLoad && peakDeltaKw > 0
  const lowVoltageDistributionNotes = inputs.siteVoltage && inputs.siteVoltage <= 240 && peakKw >= 500
    ? [
        `${inputs.siteVoltage} V at this load creates very high current; plan around 480 V or medium-voltage distribution with step-down transformers where practical.`,
      ]
    : []

  const generatorRequiredKw = peakKw * capacityFactor
  const generatorPick = pickGenerator(generatorRequiredKw)
  const fullBessPick = pickBess(peakKw, peakKw * bessAutonomyHours, inputs.preferredBessKw)
  const hybridGenPick = hasEnteredBaseLoad
    ? pickGenerator(Math.max(baseKw * capacityFactor, peakKw * 0.35 * SAFETY_MARGINS.generator))
    : null
  const hybridBessPick = hasHybridDelta
    ? pickBess(peakDeltaKw, peakDeltaKw * peakHoursPerDay, inputs.preferredBessKw)
    : null
  const bessOnlyImpractical = fullBessPick.count > 12 || fullBessPick.footprintSqFt > 2500

  const hasMeaningfulPeakSwing = peakDeltaKw / peakKw >= 0.25
  const longRuntime = bessAutonomyHours >= 8 || projectDurationHours >= 24 * 7
  const preferred = hasEnteredBaseLoad && (hasMeaningfulPeakSwing || longRuntime)
    ? 'hybrid'
    : peakKw <= 24 && bessAutonomyHours <= 4
      ? 'bess'
      : 'generator'

  return {
    sourceNote: 'Generator classes use the governed diesel reference sizes. BESS quantities are sized to the stated autonomy or peak window, not unattended full-project duration; rental availability, footprints, and dimensions require site and provider verification.',
    preferred,
    generator: {
      label: 'Generator only',
      units: formatUnitCount(generatorPick.unit.label, generatorPick.count),
      capacityKw: generatorPick.capacityKw,
      footprintSqFt: generatorPick.footprintSqFt,
      notes: [
        `${Math.round(generatorRequiredKw)} kW planning requirement after margin or redundancy factor.`,
        ...lowVoltageDistributionNotes,
        'Best when load is steady, runtime is short, or battery charging logistics are unclear.',
      ],
    },
    bess: {
      label: 'BESS only - autonomy window',
      units: formatUnitCount(fullBessPick.unit.label, fullBessPick.count),
      capacityKw: fullBessPick.capacityKw,
      energyKwh: fullBessPick.energyKwh,
      footprintSqFt: fullBessPick.footprintSqFt,
      practicality: bessOnlyImpractical ? 'impractical' : 'normal',
      notes: [
        ...(bessOnlyImpractical ? ['Usually impractical as a battery-only rental setup at this load or duration; compare against hybrid.'] : []),
        `${Math.round(peakKw * bessAutonomyHours)} kWh target energy for ${bessAutonomyHours.toFixed(1)} hours at peak load.`,
        'Does not imply battery support for the full project without recharge from grid, generator, or another source.',
        'Best for quiet, emissions-sensitive, short-duration loads with controlled inrush.',
      ],
    },
    hybrid: {
      label: hasHybridDelta ? 'Hybrid generator + BESS' : 'Hybrid evaluation withheld',
      units: hasHybridDelta && hybridGenPick && hybridBessPick
        ? `${formatUnitCount(hybridGenPick.unit.label, hybridGenPick.count)} + ${formatUnitCount(hybridBessPick.unit.label, hybridBessPick.count)}`
        : hasEnteredBaseLoad
          ? 'Peak demand must exceed continuous/base load'
          : 'Enter measured continuous/base load and peak duration',
      capacityKw: hybridGenPick && hybridBessPick ? hybridGenPick.capacityKw + hybridBessPick.capacityKw : 0,
      energyKwh: hybridBessPick?.energyKwh,
      footprintSqFt: hybridGenPick && hybridBessPick ? hybridGenPick.footprintSqFt + hybridBessPick.footprintSqFt : 0,
      practicality: 'normal',
      notes: hasHybridDelta
        ? [
            `Generator carries the entered ${Math.round(baseKw)} kW continuous/base load; BESS covers the entered ${Math.round(peakDeltaKw)} kW peak difference.`,
            ...lowVoltageDistributionNotes,
            'Hybrid suitability depends on the measured load profile, recharge window, controls, and rental availability.',
          ]
        : hasEnteredBaseLoad
          ? [
              'The entered peak and continuous loads are equal, so there is no peak difference for a BESS to cover.',
              'EMaaS Pro will not add a battery unit when the entered load profile does not create a hybrid duty.',
            ]
          : [
              'No continuous/base load was entered, so EMaaS Pro will not invent a load split or recommend hybrid equipment from peak demand alone.',
              'Enter measured continuous load and peak duration in Hybrid EMaaS Strategy to compare the governed rental fleet.',
            ],
    },
    fuelCell: hasEnteredBaseLoad
      ? assessFuelCellFit(peakKw, baseKw, projectDurationHours)
      : { fit: 'not_ideal', label: 'Fuel-cell evaluation withheld', reason: 'A measured continuous/base load is required before evaluating a steady-load fuel-cell application.' },
  }
}

function pickGenerator(requiredKw: number) {
  const single = GENERATOR_FLEET.find((unit) => unit.kw >= requiredKw)
  if (single) {
    return {
      unit: single,
      count: 1,
      capacityKw: single.kw,
      footprintSqFt: single.footprintSqFt,
    }
  }

  const largest = GENERATOR_FLEET[GENERATOR_FLEET.length - 1]
  const count = Math.ceil(requiredKw / largest.kw)
  return {
    unit: largest,
    count,
    capacityKw: largest.kw * count,
    footprintSqFt: largest.footprintSqFt * count,
  }
}

function pickBess(requiredKw: number, requiredKwh: number, preferredBessKw?: number) {
  const preferred = BESS_FLEET.find((unit) => unit.kw === preferredBessKw)
  if (preferred) {
    const continuousKw = preferred.continuousKw ?? preferred.kw
    const usableKwh = preferred.usableKwh ?? preferred.kwh
    const count = Math.max(Math.ceil(requiredKw / continuousKw), Math.ceil(requiredKwh / usableKwh), 1)
    return {
      unit: preferred,
      count,
      capacityKw: continuousKw * count,
      energyKwh: usableKwh * count,
      footprintSqFt: preferred.footprintSqFt * count,
    }
  }

  let best = BESS_FLEET[0]
  let bestCount = Infinity
  let bestExcess = Infinity

  for (const unit of BESS_FLEET) {
    const continuousKw = unit.continuousKw ?? unit.kw
    const usableKwh = unit.usableKwh ?? unit.kwh
    const count = Math.max(Math.ceil(requiredKw / continuousKw), Math.ceil(requiredKwh / usableKwh), 1)
    const excess = (continuousKw * count - requiredKw) + (usableKwh * count - requiredKwh) / 4
    if (count < bestCount || (count === bestCount && excess < bestExcess)) {
      best = unit
      bestCount = count
      bestExcess = excess
    }
  }

  return {
    unit: best,
    count: bestCount,
    capacityKw: (best.continuousKw ?? best.kw) * bestCount,
    energyKwh: (best.usableKwh ?? best.kwh) * bestCount,
    footprintSqFt: best.footprintSqFt * bestCount,
  }
}

function formatUnitCount(label: string, count: number) {
  return count === 1 ? label : `${count} x ${label}`
}

function assessFuelCellFit(peakKw: number, baseKw: number, runtimeHours: number): EquipmentRecommendation['fuelCell'] {
  const baseRatio = baseKw / Math.max(1, peakKw)
  if (runtimeHours >= 72 && baseRatio >= 0.65) {
    return {
      fit: 'strong',
      label: 'Strong fuel-cell candidate',
      reason: 'Long-duration, steady base load favors fuel cells if hydrogen logistics, permitting, and interconnection are workable.',
    }
  }
  if (runtimeHours >= 24 && baseRatio >= 0.45) {
    return {
      fit: 'possible',
      label: 'Possible fuel-cell candidate',
      reason: 'Consider fuel cells for emissions or noise constraints, but keep generator/BESS as the practical rental baseline.',
    }
  }
  return {
    fit: 'not_ideal',
    label: 'Fuel cell not ideal',
    reason: 'Short duration or peaky load profile usually fits generator/BESS rentals better than fuel-cell deployment.',
  }
}
