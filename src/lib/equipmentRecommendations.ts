import { SAFETY_MARGINS } from './constants'

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
  label: string
  voltage: string
  footprintSqFt: number
  source: string
}

export interface EquipmentRecommendationInputs {
  peakKw: number
  baseKw?: number
  runtimeHours?: number
  peakHoursPerDay?: number
  powerFactor?: number
  preferredBessKw?: number
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

export const GENERATOR_FLEET: GeneratorFleetUnit[] = [
  { kw: 20, label: '20 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 70, source: 'Sunbelt 20 kW class' },
  { kw: 45, label: '45 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 90, source: 'Sunbelt 45-80 kW class' },
  { kw: 80, label: '80 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 110, source: 'Sunbelt 45-80 kW class' },
  { kw: 100, label: '100 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 135, source: 'Sunbelt 100-119 kW class' },
  { kw: 150, label: '150 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 160, source: 'Sunbelt 150-200 kW class' },
  { kw: 200, label: '200 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 175, source: 'Sunbelt 150-200 kW class' },
  { kw: 300, label: '300 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 210, source: 'Sunbelt 250-350 kW class' },
  { kw: 500, label: '500 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 260, source: 'Sunbelt 500-700 kW class' },
  { kw: 700, label: '700 kW diesel generator', voltage: 'multi-voltage', footprintSqFt: 300, source: 'Sunbelt 500-700 kW class' },
  { kw: 1000, label: '1000 kW diesel generator', voltage: '480 V typical', footprintSqFt: 320, source: 'Sunbelt 1000-1200 kW class' },
  { kw: 1500, label: '1500 kW diesel generator', voltage: '480 V typical', footprintSqFt: 360, source: 'Sunbelt 1300-1500 kW class' },
  { kw: 2000, label: '2000 kW diesel generator', voltage: '480 V typical', footprintSqFt: 390, source: 'Sunbelt 1700-2000 kW class' },
]

export const BESS_FLEET: BessFleetUnit[] = [
  { kw: 5, kwh: 7, label: '5 kW / 7 kWh portable BESS', voltage: '120/240 V', footprintSqFt: 12, source: 'Sunbelt 5 kW / 7 kWh BESS' },
  { kw: 24, kwh: 90, label: '24 kW / 90 kWh BESS', voltage: '208/120 V', footprintSqFt: 80, source: 'Sunbelt 24 kW / 90 kWh BESS' },
  { kw: 30, kwh: 150, label: '30 kW / 150 kWh BESS', voltage: '208 V typical', footprintSqFt: 100, source: 'Sunbelt 30 kW / 150 kWh BESS' },
  { kw: 75, kwh: 600, label: '75 kW / 600 kWh BESS', voltage: '480/208 V typical', footprintSqFt: 180, source: 'Sunbelt 75 kW / 600 kWh BESS' },
  { kw: 250, kwh: 575, label: '250 kW / 575 kWh BESS', voltage: '480 V typical', footprintSqFt: 220, source: 'Sunbelt 250 kW / 575 kWh BESS' },
  { kw: 300, kwh: 1200, label: '300 kW legacy / large-system BESS', voltage: '480 V typical', footprintSqFt: 300, source: 'Legacy planning option' },
  { kw: 600, kwh: 2400, label: '600 kW legacy / large-system BESS', voltage: '480 V typical', footprintSqFt: 480, source: 'Legacy planning option' },
]

export function normalizeRateToDaily(value: number, period: 'daily' | 'weekly' | 'monthly'): number {
  if (period === 'weekly') return value / 7
  if (period === 'monthly') return value / 30
  return value
}

export function recommendEquipment(inputs: EquipmentRecommendationInputs): EquipmentRecommendation | null {
  const peakKw = Math.max(0, inputs.peakKw)
  if (peakKw <= 0) return null

  const runtimeHours = Math.max(1, inputs.runtimeHours ?? 4)
  const peakHoursPerDay = Math.max(1, inputs.peakHoursPerDay ?? Math.min(runtimeHours, 8))
  const baseKw = Math.max(0, Math.min(inputs.baseKw ?? peakKw * 0.6, peakKw))
  const peakDeltaKw = Math.max(0, peakKw - baseKw)

  const generatorRequiredKw = peakKw * SAFETY_MARGINS.generator
  const generatorPick = pickGenerator(generatorRequiredKw)
  const fullBessPick = pickBess(peakKw, peakKw * runtimeHours, inputs.preferredBessKw)
  const hybridGenPick = pickGenerator(Math.max(baseKw, peakKw * 0.35) * SAFETY_MARGINS.generator)
  const hybridBessPick = pickBess(Math.max(peakDeltaKw, peakKw * 0.15), Math.max(peakDeltaKw, peakKw * 0.15) * peakHoursPerDay, inputs.preferredBessKw)
  const bessOnlyImpractical = fullBessPick.count > 12 || fullBessPick.footprintSqFt > 2500

  const hasMeaningfulPeakSwing = peakDeltaKw / peakKw >= 0.25
  const longRuntime = runtimeHours >= 8
  const preferred = hasMeaningfulPeakSwing || longRuntime ? 'hybrid' : peakKw <= 24 && runtimeHours <= 4 ? 'bess' : 'generator'

  return {
    sourceNote: 'Fleet classes modeled from public Sunbelt Rentals generator and BESS catalog groupings; footprints are planning allowances and need site verification.',
    preferred,
    generator: {
      label: 'Generator only',
      units: formatUnitCount(generatorPick.unit.label, generatorPick.count),
      capacityKw: generatorPick.capacityKw,
      footprintSqFt: generatorPick.footprintSqFt,
      notes: [
        `${Math.round(generatorRequiredKw)} kW required after 125% continuous-load margin.`,
        'Best when load is steady, runtime is short, or battery charging logistics are unclear.',
      ],
    },
    bess: {
      label: 'BESS only',
      units: formatUnitCount(fullBessPick.unit.label, fullBessPick.count),
      capacityKw: fullBessPick.capacityKw,
      energyKwh: fullBessPick.energyKwh,
      footprintSqFt: fullBessPick.footprintSqFt,
      practicality: bessOnlyImpractical ? 'impractical' : 'normal',
      notes: [
        ...(bessOnlyImpractical ? ['Usually impractical as a battery-only rental setup at this load or duration; compare against hybrid.'] : []),
        `${Math.round(peakKw * runtimeHours)} kWh target energy for ${runtimeHours.toFixed(1)} hours at peak load.`,
        'Best for quiet, emissions-sensitive, short-duration loads with controlled inrush.',
      ],
    },
    hybrid: {
      label: 'Hybrid generator + BESS',
      units: `${formatUnitCount(hybridGenPick.unit.label, hybridGenPick.count)} + ${formatUnitCount(hybridBessPick.unit.label, hybridBessPick.count)}`,
      capacityKw: hybridGenPick.capacityKw + hybridBessPick.capacityKw,
      energyKwh: hybridBessPick.energyKwh,
      footprintSqFt: hybridGenPick.footprintSqFt + hybridBessPick.footprintSqFt,
      practicality: 'normal',
      notes: [
        `Generator carries about ${Math.round(baseKw)} kW base load; BESS covers about ${Math.round(Math.max(peakDeltaKw, peakKw * 0.15))} kW of peaks.`,
        'Best default when peak load swings, noise windows, fuel logistics, or emissions targets matter.',
      ],
    },
    fuelCell: assessFuelCellFit(peakKw, baseKw, runtimeHours),
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
    const count = Math.max(Math.ceil(requiredKw / preferred.kw), Math.ceil(requiredKwh / preferred.kwh), 1)
    return {
      unit: preferred,
      count,
      capacityKw: preferred.kw * count,
      energyKwh: preferred.kwh * count,
      footprintSqFt: preferred.footprintSqFt * count,
    }
  }

  let best = BESS_FLEET[0]
  let bestCount = Infinity
  let bestExcess = Infinity

  for (const unit of BESS_FLEET) {
    const count = Math.max(Math.ceil(requiredKw / unit.kw), Math.ceil(requiredKwh / unit.kwh), 1)
    const excess = (unit.kw * count - requiredKw) + (unit.kwh * count - requiredKwh) / 4
    if (count < bestCount || (count === bestCount && excess < bestExcess)) {
      best = unit
      bestCount = count
      bestExcess = excess
    }
  }

  return {
    unit: best,
    count: bestCount,
    capacityKw: best.kw * bestCount,
    energyKwh: best.kwh * bestCount,
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
