import { SAFETY_MARGINS, BESS_UNIT_SIZES, type BessUnitSize } from '../../lib/constants'
export type { BessUnitSize }

export function interpolateBSFC(loadFactor: number): number {
  const clamped = Math.max(0.1, Math.min(1, loadFactor))
  const points = [
    [0.25, 0.105],
    [0.50, 0.085],
    [0.75, 0.072],
    [1.00, 0.068],
  ] as const

  if (clamped <= points[0][0]) return points[0][1]
  if (clamped >= points[points.length - 1][0]) return points[points.length - 1][1]

  for (let i = 0; i < points.length - 1; i++) {
    if (clamped >= points[i][0] && clamped <= points[i + 1][0]) {
      const t = (clamped - points[i][0]) / (points[i + 1][0] - points[i][0])
      return points[i][1] + t * (points[i + 1][1] - points[i][1])
    }
  }
  return 0.068
}

export interface FacilityEntry {
  id: string
  type: string
  label: string
  quantity: number
  kwPerUnit: number
  structureType: string
  structureMultiplier: number
}

export interface TempPowerInputs {
  mode: 'single' | 'basecamp'
  loadKw: number
  sqFt: number
  ambientTemp: number
  targetTemp: number
  durationHours: number
  altitude: number
  powerFactor: number
  facilities: FacilityEntry[]
}

export interface TempPowerResults {
  totalLoadKw: number
  coolingTons: number
  coolingKw: number
  totalWithCoolingKw: number
  generatorKva: number
  generatorKw: number
  loadFactor: number
  bsfcGalPerKwh: number
  fuelGallonsPerHour: number
  totalFuelGallons: number
  altitudeDerating: number
  tempDerating: number
  facilityBreakdown: { label: string; kw: number }[]
  hybrid: HybridComparison | null
}

export interface HybridComparison {
  recommended: boolean
  reason: string
  allGen: {
    genUnits: number
    genSizeKw: number
    fuelPerDay: number
    fuel30Day: number
    loadFactor: number
  }
  hybrid: {
    genUnits: number
    genSizeKw: number
    bessUnits: number
    bessUnitSize: BessUnitSize
    fuelPerDay: number
    fuel30Day: number
    loadFactor: number
    fuelSavingsPercent: number
  }
}

export function calculateTempPower(inputs: TempPowerInputs): TempPowerResults {
  let totalLoadKw: number
  const facilityBreakdown: { label: string; kw: number }[] = []

  if (inputs.mode === 'single') {
    totalLoadKw = inputs.loadKw
    facilityBreakdown.push({ label: 'Equipment Load', kw: inputs.loadKw })
  } else {
    totalLoadKw = 0
    for (const f of inputs.facilities) {
      const kw = f.quantity * f.kwPerUnit
      totalLoadKw += kw
      facilityBreakdown.push({ label: `${f.label} × ${f.quantity}`, kw })
    }
  }

  const deltaT = Math.max(0, inputs.ambientTemp - inputs.targetTemp)
  const sqFt = inputs.mode === 'single' ? inputs.sqFt : inputs.facilities.reduce((sum, f) => sum + f.quantity * 200, 0)
  const avgMultiplier = inputs.mode === 'basecamp' && inputs.facilities.length > 0
    ? inputs.facilities.reduce((sum, f) => sum + f.structureMultiplier * f.quantity, 0) / Math.max(1, inputs.facilities.reduce((s, f) => s + f.quantity, 0))
    : 1.0

  const coolingBtu = totalLoadKw * 3412.14 + sqFt * deltaT * 0.5 * avgMultiplier
  const coolingTons = (coolingBtu / 12000) * SAFETY_MARGINS.cooling_emergency
  const coolingKw = coolingTons * 3.517

  const totalWithCoolingKw = totalLoadKw + coolingKw
  const generatorKw = totalWithCoolingKw * SAFETY_MARGINS.generator
  const generatorKva = generatorKw / inputs.powerFactor

  const altitudeDerating = 1 + Math.max(0, (inputs.altitude - 1000) / 1000) * 0.03
  const tempDerating = 1 + Math.max(0, (inputs.ambientTemp - 77) / 10) * 0.02
  const loadFactor = totalWithCoolingKw / generatorKw
  const bsfcGalPerKwh = interpolateBSFC(loadFactor)
  const fuelGallonsPerHour = totalWithCoolingKw * bsfcGalPerKwh * altitudeDerating * tempDerating
  const totalFuelGallons = fuelGallonsPerHour * inputs.durationHours * 1.1

  const hybrid = evaluateHybrid(totalWithCoolingKw, totalWithCoolingKw * 0.6, inputs.durationHours, altitudeDerating, tempDerating)

  return {
    totalLoadKw,
    coolingTons,
    coolingKw,
    totalWithCoolingKw,
    generatorKva,
    generatorKw,
    loadFactor,
    bsfcGalPerKwh,
    fuelGallonsPerHour,
    totalFuelGallons,
    altitudeDerating,
    tempDerating,
    facilityBreakdown,
    hybrid,
  }
}

export function evaluateHybrid(
  peakKw: number,
  baseKw: number,
  durationHours: number,
  altitudeDerating: number,
  tempDerating: number,
): HybridComparison | null {
  const peakBaseRatio = peakKw / Math.max(1, baseKw)
  const durationDays = durationHours / 24

  const shouldRecommend = peakBaseRatio > 1.5 || durationDays > 7

  if (!shouldRecommend && peakKw < 100) return null

  let reason = ''
  if (peakBaseRatio > 1.5) reason = `Peak-to-base ratio is ${peakBaseRatio.toFixed(1)}:1 — BESS handles peaks while generators run at optimal load`
  else if (durationDays > 7) reason = `${durationDays.toFixed(0)}-day duration — fuel savings compound over time`
  else reason = 'Hybrid configuration available for comparison'

  const genSizeAllGen = peakKw * SAFETY_MARGINS.generator
  const allGenLoadFactor = peakKw / genSizeAllGen
  const allGenBsfc = interpolateBSFC(allGenLoadFactor)
  const allGenFuelPerHour = peakKw * allGenBsfc * altitudeDerating * tempDerating
  const allGenFuelPerDay = allGenFuelPerHour * 24
  const allGenFuel30 = allGenFuelPerDay * 30

  const bestBessSize = pickBessSize(peakKw - baseKw)
  const bessUnits = Math.ceil((peakKw - baseKw) / bestBessSize)

  const hybridGenSize = baseKw * SAFETY_MARGINS.generator
  const hybridLoadFactor = baseKw / hybridGenSize
  const hybridBsfc = interpolateBSFC(hybridLoadFactor)
  const hybridFuelPerHour = baseKw * hybridBsfc * altitudeDerating * tempDerating
  const hybridFuelPerDay = hybridFuelPerHour * 24
  const hybridFuel30 = hybridFuelPerDay * 30

  const fuelSavingsPercent = allGenFuel30 > 0 ? ((allGenFuel30 - hybridFuel30) / allGenFuel30) * 100 : 0

  return {
    recommended: shouldRecommend,
    reason,
    allGen: {
      genUnits: Math.ceil(genSizeAllGen / 500),
      genSizeKw: genSizeAllGen,
      fuelPerDay: allGenFuelPerDay,
      fuel30Day: allGenFuel30,
      loadFactor: allGenLoadFactor,
    },
    hybrid: {
      genUnits: Math.ceil(hybridGenSize / 500),
      genSizeKw: hybridGenSize,
      bessUnits,
      bessUnitSize: bestBessSize,
      fuelPerDay: hybridFuelPerDay,
      fuel30Day: hybridFuel30,
      loadFactor: hybridLoadFactor,
      fuelSavingsPercent,
    },
  }
}

function pickBessSize(peakDelta: number): BessUnitSize {
  for (const size of [...BESS_UNIT_SIZES].reverse()) {
    if (peakDelta >= size) return size
  }
  return BESS_UNIT_SIZES[0]
}

export interface HybridWizardInputs {
  peakLoadKw: number
  baseLoadKw: number
  loadSource: 'panel' | 'measured'
  bessUnitSize: BessUnitSize
  peakHoursPerDay: number
  projectDurationDays: number
  redundancy: 'n' | 'n1' | '2n'
  siteVoltage: number
  altitude: number
  ambientTemp: number
  fuelCostPerGallon: number
  bessRentalPerDay: number
  genRentalPerDay: number
  startDate: string
  endDate: string
  motors: MotorEntry[]
}

export interface MotorEntry {
  id: string
  hp: number
  startMethod: 'dol' | 'soft_start' | 'vfd'
  fla: number
}

export interface HybridWizardResults {
  bessUnitsForPeak: number
  bessUnitsForEnergy: number
  bessUnits: number
  bessEnergyKwh: number
  genCapacityKw: number
  genUnits: number
  genUnitSizeKw: number
  totalCapacityKw: number
  redundancyFactor: number
  allGenFuelPerDay: number
  allGenFuel30Day: number
  hybridFuelPerDay: number
  hybridFuelTotal: number
  dailyFuelReduction: number
  totalFuelSavingsGal: number
  totalFuelSavingsDollars: number
  allGenCost30Day: number
  hybridCost30Day: number
  costSavings30Day: number
  motorAssignments: { id: string; hp: number; method: string; lra: number; assignment: 'bess' | 'generator'; reason: string }[]
  dailyFuelData: { day: number; date: string; allGenGal: number; hybridGal: number; savingsGal: number; cumulativeSavingsGal: number }[]
}

export function calculateHybridWizard(inputs: HybridWizardInputs): HybridWizardResults {
  const { peakLoadKw, baseLoadKw, bessUnitSize, peakHoursPerDay, projectDurationDays, redundancy, altitude, ambientTemp, fuelCostPerGallon, bessRentalPerDay, genRentalPerDay } = inputs

  const redundancyFactor = redundancy === '2n' ? 2.0 : redundancy === 'n1' ? 1.25 : 1.0
  const peakDelta = Math.max(0, peakLoadKw - baseLoadKw)

  const bessUnitsForPeak = Math.ceil(peakDelta / bessUnitSize)
  const bessEnergyKwh = peakDelta * peakHoursPerDay
  const batteryDuration = 4
  const bessUnitsForEnergy = Math.ceil(bessEnergyKwh / (bessUnitSize * batteryDuration))
  const bessUnits = Math.max(bessUnitsForPeak, bessUnitsForEnergy)

  const genCapacityKw = baseLoadKw * redundancyFactor
  const genUnitSizeKw = 500
  const genUnits = Math.max(1, Math.ceil(genCapacityKw / genUnitSizeKw))
  const totalCapacityKw = (bessUnits * bessUnitSize) + (genUnits * genUnitSizeKw)

  const altDerate = 1 + Math.max(0, (altitude - 1000) / 1000) * 0.03
  const tempDerate = 1 + Math.max(0, (ambientTemp - 77) / 10) * 0.02

  const allGenSizeKw = peakLoadKw * redundancyFactor
  const allGenLoadFactor = peakLoadKw / allGenSizeKw
  const allGenBsfc = interpolateBSFC(allGenLoadFactor)
  const allGenFuelPerDay = peakLoadKw * allGenBsfc * altDerate * tempDerate * 24

  const hybridGenLoadFactor = baseLoadKw / (genUnits * genUnitSizeKw)
  const hybridBsfc = interpolateBSFC(Math.min(1, hybridGenLoadFactor))
  const hybridFuelPerDay = baseLoadKw * hybridBsfc * altDerate * tempDerate * 24

  const dailyFuelReduction = allGenFuelPerDay - hybridFuelPerDay
  const totalFuelSavingsGal = dailyFuelReduction * projectDurationDays
  const totalFuelSavingsDollars = totalFuelSavingsGal * fuelCostPerGallon

  const allGenCost30Day = allGenFuelPerDay * 30 * fuelCostPerGallon + genUnits * genRentalPerDay * 30
  const hybridCost30Day = hybridFuelPerDay * 30 * fuelCostPerGallon + genUnits * genRentalPerDay * 30 + bessUnits * bessRentalPerDay * 30
  const costSavings30Day = allGenCost30Day - hybridCost30Day

  const motorAssignments = inputs.motors.map((m) => {
    const lraMultiplier = m.startMethod === 'dol' ? 7 : m.startMethod === 'soft_start' ? 3 : 1.25
    const lra = m.fla * lraMultiplier
    const bessInverterLimit = bessUnitSize * 1000 / inputs.siteVoltage * 1.5
    const canBessHandle = lra <= bessInverterLimit
    return {
      id: m.id,
      hp: m.hp,
      method: m.startMethod,
      lra,
      assignment: (m.startMethod === 'vfd' || canBessHandle ? 'bess' : 'generator') as 'bess' | 'generator',
      reason: m.startMethod === 'vfd'
        ? 'VFD — negligible inrush, BESS compatible'
        : canBessHandle
          ? `LRA ${lra.toFixed(0)}A within BESS inverter limit`
          : `LRA ${lra.toFixed(0)}A exceeds BESS inverter limit — assign to generator`,
    }
  })

  const startDate = inputs.startDate ? new Date(inputs.startDate) : new Date()
  const dailyFuelData = Array.from({ length: Math.min(projectDurationDays, 365) }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return {
      day: i + 1,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      allGenGal: allGenFuelPerDay,
      hybridGal: hybridFuelPerDay,
      savingsGal: dailyFuelReduction,
      cumulativeSavingsGal: dailyFuelReduction * (i + 1),
    }
  })

  return {
    bessUnitsForPeak, bessUnitsForEnergy, bessUnits, bessEnergyKwh,
    genCapacityKw, genUnits, genUnitSizeKw, totalCapacityKw, redundancyFactor,
    allGenFuelPerDay, allGenFuel30Day: allGenFuelPerDay * 30,
    hybridFuelPerDay, hybridFuelTotal: hybridFuelPerDay * projectDurationDays,
    dailyFuelReduction, totalFuelSavingsGal, totalFuelSavingsDollars,
    allGenCost30Day, hybridCost30Day, costSavings30Day,
    motorAssignments, dailyFuelData,
  }
}
