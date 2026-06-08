import { SQRT3, DIESEL_BSFC, NATURAL_GAS_CFH_PER_KW, LAMP_EFFICACY } from '../../lib/constants'
import { fmt, fmtPercent } from '../../lib/formatters'

export interface FormulaStep {
  label: string
  formula: string
  substituted: string
  result: string
}

// ---------------------------------------------------------------------------
// Helper: interpolate BSFC from the load-factor curve
// ---------------------------------------------------------------------------
const BSFC_POINTS = [
  { load: 0.25, bsfc: DIESEL_BSFC[25] },
  { load: 0.50, bsfc: DIESEL_BSFC[50] },
  { load: 0.75, bsfc: DIESEL_BSFC[75] },
  { load: 1.00, bsfc: DIESEL_BSFC[100] },
]

export function interpolateBSFC(loadFactor: number): number {
  if (loadFactor <= BSFC_POINTS[0].load) return BSFC_POINTS[0].bsfc
  if (loadFactor >= BSFC_POINTS[BSFC_POINTS.length - 1].load)
    return BSFC_POINTS[BSFC_POINTS.length - 1].bsfc

  for (let i = 0; i < BSFC_POINTS.length - 1; i++) {
    const lo = BSFC_POINTS[i]
    const hi = BSFC_POINTS[i + 1]
    if (loadFactor >= lo.load && loadFactor <= hi.load) {
      const t = (loadFactor - lo.load) / (hi.load - lo.load)
      return lo.bsfc + t * (hi.bsfc - lo.bsfc)
    }
  }
  return BSFC_POINTS[BSFC_POINTS.length - 1].bsfc
}

// ---------------------------------------------------------------------------
// B1. General Power
// ---------------------------------------------------------------------------
export interface GeneralPowerInputs {
  voltage: number
  amperes: number
  powerFactor: number
  phase: 'single' | 'three'
}

export interface GeneralPowerResults {
  kw: number
  kva: number
}

export function calcGeneralPower(i: GeneralPowerInputs): GeneralPowerResults {
  if (i.phase === 'single') {
    return {
      kw: (i.voltage * i.amperes * i.powerFactor) / 1000,
      kva: (i.voltage * i.amperes) / 1000,
    }
  }
  return {
    kw: (SQRT3 * i.voltage * i.amperes * i.powerFactor) / 1000,
    kva: (SQRT3 * i.voltage * i.amperes) / 1000,
  }
}

export function describeGeneralPower(i: GeneralPowerInputs, r: GeneralPowerResults): FormulaStep[] {
  if (i.phase === 'single') {
    return [
      {
        label: 'Real Power (kW)',
        formula: 'P = (V x I x PF) / 1000',
        substituted: `(${fmt(i.voltage, 0)} x ${fmt(i.amperes, 1)} x ${fmt(i.powerFactor, 2)}) / 1000`,
        result: `${fmt(r.kw, 2)} kW`,
      },
      {
        label: 'Apparent Power (kVA)',
        formula: 'S = (V x I) / 1000',
        substituted: `(${fmt(i.voltage, 0)} x ${fmt(i.amperes, 1)}) / 1000`,
        result: `${fmt(r.kva, 2)} kVA`,
      },
    ]
  }
  return [
    {
      label: 'Real Power (kW)',
      formula: 'P = (√3 x V x I x PF) / 1000',
      substituted: `(${fmt(SQRT3, 4)} x ${fmt(i.voltage, 0)} x ${fmt(i.amperes, 1)} x ${fmt(i.powerFactor, 2)}) / 1000`,
      result: `${fmt(r.kw, 2)} kW`,
    },
    {
      label: 'Apparent Power (kVA)',
      formula: 'S = (√3 x V x I) / 1000',
      substituted: `(${fmt(SQRT3, 4)} x ${fmt(i.voltage, 0)} x ${fmt(i.amperes, 1)}) / 1000`,
      result: `${fmt(r.kva, 2)} kVA`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B2. Amperes
// ---------------------------------------------------------------------------
export interface AmperesInputs {
  kw: number
  voltage: number
  powerFactor: number
  phase: 'single' | 'three'
}

export interface AmperesResults {
  amperes: number
}

export function calcAmperes(i: AmperesInputs): AmperesResults {
  if (i.phase === 'single') {
    return { amperes: (i.kw * 1000) / (i.voltage * i.powerFactor) }
  }
  return { amperes: (i.kw * 1000) / (SQRT3 * i.voltage * i.powerFactor) }
}

export function describeAmperes(i: AmperesInputs, r: AmperesResults): FormulaStep[] {
  if (i.phase === 'single') {
    return [
      {
        label: 'Current (Amperes)',
        formula: 'I = (kW x 1000) / (V x PF)',
        substituted: `(${fmt(i.kw, 2)} x 1000) / (${fmt(i.voltage, 0)} x ${fmt(i.powerFactor, 2)})`,
        result: `${fmt(r.amperes, 2)} A`,
      },
    ]
  }
  return [
    {
      label: 'Current (Amperes)',
      formula: 'I = (kW x 1000) / (√3 x V x PF)',
      substituted: `(${fmt(i.kw, 2)} x 1000) / (${fmt(SQRT3, 4)} x ${fmt(i.voltage, 0)} x ${fmt(i.powerFactor, 2)})`,
      result: `${fmt(r.amperes, 2)} A`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B3. kW <-> kVA
// ---------------------------------------------------------------------------
export interface KwKvaInputs {
  value: number
  powerFactor: number
  direction: 'kwToKva' | 'kvaToKw'
}

export interface KwKvaResults {
  result: number
}

export function calcKwKva(i: KwKvaInputs): KwKvaResults {
  if (i.direction === 'kwToKva') {
    return { result: i.value / i.powerFactor }
  }
  return { result: i.value * i.powerFactor }
}

export function describeKwKva(i: KwKvaInputs, r: KwKvaResults): FormulaStep[] {
  if (i.direction === 'kwToKva') {
    return [
      {
        label: 'kW to kVA',
        formula: 'kVA = kW / PF',
        substituted: `${fmt(i.value, 2)} / ${fmt(i.powerFactor, 2)}`,
        result: `${fmt(r.result, 2)} kVA`,
      },
    ]
  }
  return [
    {
      label: 'kVA to kW',
      formula: 'kW = kVA x PF',
      substituted: `${fmt(i.value, 2)} x ${fmt(i.powerFactor, 2)}`,
      result: `${fmt(r.result, 2)} kW`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B4. kW <-> HP
// ---------------------------------------------------------------------------
export interface KwHpInputs {
  value: number
  direction: 'kwToHp' | 'hpToKw'
}

export interface KwHpResults {
  result: number
}

export function calcKwHp(i: KwHpInputs): KwHpResults {
  if (i.direction === 'kwToHp') {
    return { result: i.value * 1.341 }
  }
  return { result: i.value * 0.7457 }
}

export function describeKwHp(i: KwHpInputs, r: KwHpResults): FormulaStep[] {
  if (i.direction === 'kwToHp') {
    return [
      {
        label: 'kW to Horsepower',
        formula: 'HP = kW x 1.341',
        substituted: `${fmt(i.value, 2)} x 1.341`,
        result: `${fmt(r.result, 2)} HP`,
      },
    ]
  }
  return [
    {
      label: 'Horsepower to kW',
      formula: 'kW = HP x 0.7457',
      substituted: `${fmt(i.value, 2)} x 0.7457`,
      result: `${fmt(r.result, 2)} kW`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B5. kW <-> Amps (wraps B1/B2)
// ---------------------------------------------------------------------------
export interface KwAmpInputs {
  value: number
  voltage: number
  powerFactor: number
  phase: 'single' | 'three'
  direction: 'kwToAmp' | 'ampToKw'
}

export interface KwAmpResults {
  result: number
}

export function calcKwAmp(i: KwAmpInputs): KwAmpResults {
  if (i.direction === 'kwToAmp') {
    const r = calcAmperes({ kw: i.value, voltage: i.voltage, powerFactor: i.powerFactor, phase: i.phase })
    return { result: r.amperes }
  }
  const r = calcGeneralPower({ voltage: i.voltage, amperes: i.value, powerFactor: i.powerFactor, phase: i.phase })
  return { result: r.kw }
}

export function describeKwAmp(i: KwAmpInputs, r: KwAmpResults): FormulaStep[] {
  if (i.direction === 'kwToAmp') {
    return describeAmperes(
      { kw: i.value, voltage: i.voltage, powerFactor: i.powerFactor, phase: i.phase },
      { amperes: r.result },
    )
  }
  const gp = calcGeneralPower({ voltage: i.voltage, amperes: i.value, powerFactor: i.powerFactor, phase: i.phase })
  return describeGeneralPower(
    { voltage: i.voltage, amperes: i.value, powerFactor: i.powerFactor, phase: i.phase },
    gp,
  )
}

// ---------------------------------------------------------------------------
// B6. Generator Power (B1 + 125% safety margin)
// ---------------------------------------------------------------------------
export interface GeneratorPowerInputs {
  voltage: number
  amperes: number
  powerFactor: number
  phase: 'single' | 'three'
}

export interface GeneratorPowerResults {
  kwRaw: number
  kvaRaw: number
  kwMargin: number
  kvaMargin: number
}

export function calcGeneratorPower(i: GeneratorPowerInputs): GeneratorPowerResults {
  const raw = calcGeneralPower(i)
  return {
    kwRaw: raw.kw,
    kvaRaw: raw.kva,
    kwMargin: raw.kw * 1.25,
    kvaMargin: raw.kva * 1.25,
  }
}

export function describeGeneratorPower(i: GeneratorPowerInputs, r: GeneratorPowerResults): FormulaStep[] {
  const base = describeGeneralPower(i, { kw: r.kwRaw, kva: r.kvaRaw })
  return [
    ...base,
    {
      label: 'Generator kW (125% margin)',
      formula: 'Gen kW = kW x 1.25',
      substituted: `${fmt(r.kwRaw, 2)} x 1.25`,
      result: `${fmt(r.kwMargin, 2)} kW`,
    },
    {
      label: 'Generator kVA (125% margin)',
      formula: 'Gen kVA = kVA x 1.25',
      substituted: `${fmt(r.kvaRaw, 2)} x 1.25`,
      result: `${fmt(r.kvaMargin, 2)} kVA`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B7. UPS Power
// ---------------------------------------------------------------------------
export interface UpsPowerInputs {
  voltage: number
  amperes: number
  powerFactor: number
  phase: 'single' | 'three'
  batteryKwh: number
}

export interface UpsPowerResults {
  kw: number
  kva: number
  runtimeHours: number
}

export function calcUpsPower(i: UpsPowerInputs): UpsPowerResults {
  const base = calcGeneralPower({
    voltage: i.voltage,
    amperes: i.amperes,
    powerFactor: i.powerFactor,
    phase: i.phase,
  })
  return {
    kw: base.kw,
    kva: base.kva,
    runtimeHours: base.kw > 0 ? i.batteryKwh / base.kw : 0,
  }
}

export function describeUpsPower(i: UpsPowerInputs, r: UpsPowerResults): FormulaStep[] {
  const base = describeGeneralPower(
    { voltage: i.voltage, amperes: i.amperes, powerFactor: i.powerFactor, phase: i.phase },
    { kw: r.kw, kva: r.kva },
  )
  return [
    ...base,
    {
      label: 'Battery Runtime',
      formula: 'Runtime = Battery kWh / Load kW',
      substituted: `${fmt(i.batteryKwh, 1)} / ${fmt(r.kw, 2)}`,
      result: `${fmt(r.runtimeHours, 2)} hours`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B8. Fuel Consumption
// ---------------------------------------------------------------------------
export interface FuelConsumptionInputs {
  actualKw: number
  ratedKw: number
  hours: number
  altitude: number
  ambientF: number
  fuelType: 'diesel' | 'naturalGas'
}

export interface FuelConsumptionResults {
  loadFactor: number
  bsfc: number
  gallonsPerHour: number // or CFH for natural gas
  totalFuel: number
  altitudeDerating: number
  tempDerating: number
}

export function calcFuelConsumption(i: FuelConsumptionInputs): FuelConsumptionResults {
  const loadFactor = i.ratedKw > 0 ? i.actualKw / i.ratedKw : 0
  const bsfc = interpolateBSFC(loadFactor)
  const altitudeDerating = 1 + Math.max(0, (i.altitude - 1000) / 1000) * 0.03
  const tempDerating = 1 + Math.max(0, (i.ambientF - 77) / 10) * 0.02

  if (i.fuelType === 'diesel') {
    const gallonsPerHour = i.actualKw * bsfc * altitudeDerating * tempDerating
    return {
      loadFactor,
      bsfc,
      gallonsPerHour,
      totalFuel: gallonsPerHour * i.hours,
      altitudeDerating,
      tempDerating,
    }
  }

  // Natural Gas: CFH adjusted for load factor
  const bsfcAt100 = DIESEL_BSFC[100]
  const cfh = i.actualKw * NATURAL_GAS_CFH_PER_KW * (bsfc / bsfcAt100) * altitudeDerating * tempDerating
  return {
    loadFactor,
    bsfc,
    gallonsPerHour: cfh,
    totalFuel: cfh * i.hours,
    altitudeDerating,
    tempDerating,
  }
}

export function describeFuelConsumption(i: FuelConsumptionInputs, r: FuelConsumptionResults): FormulaStep[] {
  const steps: FormulaStep[] = [
    {
      label: 'Load Factor',
      formula: 'Load Factor = Actual kW / Rated kW',
      substituted: `${fmt(i.actualKw, 1)} / ${fmt(i.ratedKw, 1)}`,
      result: fmtPercent(r.loadFactor, 1),
    },
    {
      label: 'BSFC (interpolated)',
      formula: 'Interpolated from {25%: 0.105, 50%: 0.085, 75%: 0.072, 100%: 0.068} gal/kWh',
      substituted: `Load factor = ${fmtPercent(r.loadFactor, 1)}`,
      result: `${fmt(r.bsfc, 4)} gal/kWh`,
    },
    {
      label: 'Altitude Derating',
      formula: '1 + max(0, (altitude - 1000) / 1000) x 0.03',
      substituted: `1 + max(0, (${fmt(i.altitude, 0)} - 1000) / 1000) x 0.03`,
      result: fmt(r.altitudeDerating, 4),
    },
    {
      label: 'Temperature Derating',
      formula: '1 + max(0, (temp - 77) / 10) x 0.02',
      substituted: `1 + max(0, (${fmt(i.ambientF, 0)} - 77) / 10) x 0.02`,
      result: fmt(r.tempDerating, 4),
    },
  ]

  if (i.fuelType === 'diesel') {
    steps.push(
      {
        label: 'Gallons per Hour',
        formula: 'GPH = kW x BSFC x Alt Derating x Temp Derating',
        substituted: `${fmt(i.actualKw, 1)} x ${fmt(r.bsfc, 4)} x ${fmt(r.altitudeDerating, 4)} x ${fmt(r.tempDerating, 4)}`,
        result: `${fmt(r.gallonsPerHour, 2)} gal/hr`,
      },
      {
        label: 'Total Fuel',
        formula: 'Total = GPH x Hours',
        substituted: `${fmt(r.gallonsPerHour, 2)} x ${fmt(i.hours, 1)}`,
        result: `${fmt(r.totalFuel, 1)} gallons`,
      },
    )
  } else {
    steps.push(
      {
        label: 'Cubic Feet per Hour',
        formula: 'CFH = kW x 10.58 x (BSFC / BSFC@100%) x Alt Derating x Temp Derating',
        substituted: `${fmt(i.actualKw, 1)} x 10.58 x (${fmt(r.bsfc, 4)} / 0.0680) x ${fmt(r.altitudeDerating, 4)} x ${fmt(r.tempDerating, 4)}`,
        result: `${fmt(r.gallonsPerHour, 1)} CFH`,
      },
      {
        label: 'Total Fuel',
        formula: 'Total = CFH x Hours',
        substituted: `${fmt(r.gallonsPerHour, 1)} x ${fmt(i.hours, 1)}`,
        result: `${fmt(r.totalFuel, 0)} cubic feet`,
      },
    )
  }

  return steps
}

// ---------------------------------------------------------------------------
// B9. Lumens & Watts
// ---------------------------------------------------------------------------
export interface LumensWattsInputs {
  lumens: number
  lampType: string
}

export interface LumensWattsResults {
  watts: number
  efficacy: number
}

export function calcLumensWatts(i: LumensWattsInputs): LumensWattsResults {
  const efficacy = LAMP_EFFICACY[i.lampType] ?? 90
  return {
    watts: i.lumens / efficacy,
    efficacy,
  }
}

export function describeLumensWatts(i: LumensWattsInputs, r: LumensWattsResults): FormulaStep[] {
  return [
    {
      label: 'Watts Required',
      formula: 'Watts = Lumens / Efficacy (lm/W)',
      substituted: `${fmt(i.lumens, 0)} / ${fmt(r.efficacy, 0)}`,
      result: `${fmt(r.watts, 1)} W`,
    },
  ]
}

// ---------------------------------------------------------------------------
// B10. kVA -> Amps
// ---------------------------------------------------------------------------
export interface KvaAmpsInputs {
  kva: number
  voltage: number
  phase: 'single' | 'three'
}

export interface KvaAmpsResults {
  amperes: number
}

export function calcKvaAmps(i: KvaAmpsInputs): KvaAmpsResults {
  if (i.phase === 'single') {
    return { amperes: (i.kva * 1000) / i.voltage }
  }
  return { amperes: (i.kva * 1000) / (SQRT3 * i.voltage) }
}

export function describeKvaAmps(i: KvaAmpsInputs, r: KvaAmpsResults): FormulaStep[] {
  if (i.phase === 'single') {
    return [
      {
        label: 'Current from kVA (Single-Phase)',
        formula: 'I = (kVA x 1000) / V',
        substituted: `(${fmt(i.kva, 2)} x 1000) / ${fmt(i.voltage, 0)}`,
        result: `${fmt(r.amperes, 2)} A`,
      },
    ]
  }
  return [
    {
      label: 'Current from kVA (Three-Phase)',
      formula: 'I = (kVA x 1000) / (√3 x V)',
      substituted: `(${fmt(i.kva, 2)} x 1000) / (${fmt(SQRT3, 4)} x ${fmt(i.voltage, 0)})`,
      result: `${fmt(r.amperes, 2)} A`,
    },
  ]
}
