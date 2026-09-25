import { SAFETY_MARGINS, BESS_UNIT_SIZES, SQRT3, CO2_LBS_PER_GALLON_DIESEL, type BessUnitSize, type RatePeriod } from '../../lib/constants'
import { estimateSunbeltDieselFleetFuel } from '../../lib/dieselFuelCurve'
export type { BessUnitSize }

const BESS_UNIT_ENERGY_KWH: Record<BessUnitSize, number> = {
  5: 7,
  24: 72,
  30: 132,
  75: 530,
  250: 518,
}

const BESS_UNIT_CONTINUOUS_KW: Record<BessUnitSize, number> = {
  5: 4.8,
  24: 24,
  30: 30,
  75: 40,
  250: 250,
}

// Charge capability is modeled separately from discharge output. Values marked
// planning assumption remain an equipment-release hold until the selected
// vendor confirms the delivered unit and connection method.
const BESS_UNIT_CHARGE_KW: Record<BessUnitSize, { kw: number; basis: 'published' | 'planning_assumption' }> = {
  5: { kw: 2.6, basis: 'planning_assumption' },
  24: { kw: 24, basis: 'planning_assumption' },
  30: { kw: 30, basis: 'published' },
  75: { kw: 19.2, basis: 'published' },
  250: { kw: 250, basis: 'planning_assumption' },
}

export interface FacilityEntry {
  id: string
  type: string
  label: string
  quantity: number
  kwPerUnit: number
  structureType: string
  structureMultiplier: number
  loadBasis?: string
  loadBasisType?: 'published-service' | 'planning-estimate' | 'user-defined'
  sourceLabel?: string
  sourceUrl?: string
}

export type RentalPeriod = 'daily' | 'weekly' | 'monthly'
export type RuntimeSchedule = 'shift_8' | 'continuous_24_7'

const RENTAL_PERIOD_DAYS: Record<RentalPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 28,
}

export interface TempPowerSchedule {
  rentalDays: number
  dailyRuntimeHours: number
  operatingHours: number
}

export function calculateTempPowerSchedule(
  rentalPeriod: RentalPeriod,
  rentalPeriodCount: number,
  runtimeSchedule: RuntimeSchedule,
): TempPowerSchedule {
  const periodCount = Math.max(1, rentalPeriodCount || 1)
  const rentalDays = RENTAL_PERIOD_DAYS[rentalPeriod] * periodCount
  const dailyRuntimeHours = runtimeSchedule === 'continuous_24_7' ? 24 : 8

  return {
    rentalDays,
    dailyRuntimeHours,
    operatingHours: rentalDays * dailyRuntimeHours,
  }
}

type TempPowerScheduleSource = {
  durationHours: number
  rentalPeriod?: RentalPeriod
  rentalPeriodCount?: number
  runtimeSchedule?: RuntimeSchedule
}

export function resolveTempPowerSchedule(inputs: TempPowerScheduleSource): TempPowerSchedule {
  if (inputs.rentalPeriod && inputs.runtimeSchedule) {
    return calculateTempPowerSchedule(inputs.rentalPeriod, inputs.rentalPeriodCount ?? 1, inputs.runtimeSchedule)
  }

  const operatingHours = Math.max(0, inputs.durationHours)
  return {
    rentalDays: operatingHours / 24,
    dailyRuntimeHours: 24,
    operatingHours,
  }
}

export interface TempPowerInputs {
  mode: 'single' | 'basecamp'
  loadKw: number
  sqFt: number
  ambientTemp: number
  targetTemp: number
  durationHours: number
  rentalPeriod?: RentalPeriod
  rentalPeriodCount?: number
  runtimeSchedule?: RuntimeSchedule
  includeCooling?: boolean
  coolingCapacityTons?: number
  coolingElectricalKw?: number
  altitude: number
  siteVoltage?: number
  loadVoltage?: number
  continuityTarget?: 'standard' | 'n_plus_1'
  powerFactor: number
  serviceIntervalDays?: number
  technicianCoverage?: 'none' | 'business_hours' | '24_7'
  containmentRequired?: boolean
  noiseFinePerDay?: number
  facilities: FacilityEntry[]
}

export interface TempPowerPlanningInputs {
  mode: 'single' | 'basecamp'
  loadKw: number
  durationHours: number
  rentalPeriod?: RentalPeriod
  rentalPeriodCount?: number
  runtimeSchedule?: RuntimeSchedule
  includeCooling?: boolean
  coolingCapacityTons?: number
  coolingElectricalKw?: number
  siteVoltage?: number
  loadVoltage?: number
  continuityTarget?: 'standard' | 'n_plus_1'
  facilities: FacilityEntry[]
}

export interface TempPowerPlanningResults {
  totalLoadKw: number
  coolingKw: number
  totalWithCoolingKw: number
  rentalDays: number
  dailyRuntimeHours: number
  operatingHours: number
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
  rentalDays: number
  dailyRuntimeHours: number
  operatingHours: number
  operatingDays: number
  serviceEvents: number
  noiseFineExposure: number
  altitudeDerating: number
  tempDerating: number
  ampsPerPhase: number
  parallelRunsNeeded: boolean
  facilityBreakdown: { label: string; kw: number }[]
  hybrid: HybridComparison | null
  co2AvoidedLbs: number
  co2AvoidedTons: number
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
    fuelReductionPercent: number
  }
}

function calculateEnteredTempPowerLoad(inputs: Pick<TempPowerPlanningInputs, 'mode' | 'loadKw' | 'facilities' | 'includeCooling' | 'coolingElectricalKw'>) {
  const facilityBreakdown: { label: string; kw: number }[] = []
  let totalLoadKw = inputs.loadKw

  if (inputs.mode === 'single') {
    facilityBreakdown.push({ label: 'Equipment Load', kw: inputs.loadKw })
  } else {
    totalLoadKw = 0
    for (const facility of inputs.facilities) {
      const kw = facility.quantity * facility.kwPerUnit
      totalLoadKw += kw
      facilityBreakdown.push({ label: `${facility.label} × ${facility.quantity}`, kw })
    }
  }

  const coolingKw = inputs.includeCooling !== false
    ? Math.max(0, inputs.coolingElectricalKw ?? 0)
    : 0

  return {
    totalLoadKw,
    coolingKw,
    totalWithCoolingKw: totalLoadKw + coolingKw,
    facilityBreakdown,
  }
}

export function calculateTempPowerPlanningBrief(inputs: TempPowerPlanningInputs): TempPowerPlanningResults {
  const load = calculateEnteredTempPowerLoad(inputs)
  const schedule = resolveTempPowerSchedule(inputs)

  return {
    totalLoadKw: load.totalLoadKw,
    coolingKw: load.coolingKw,
    totalWithCoolingKw: load.totalWithCoolingKw,
    rentalDays: schedule.rentalDays,
    dailyRuntimeHours: schedule.dailyRuntimeHours,
    operatingHours: schedule.operatingHours,
  }
}

export function calculateTempPower(inputs: TempPowerInputs): TempPowerResults {
  const load = calculateEnteredTempPowerLoad(inputs)
  const { totalLoadKw, coolingKw, totalWithCoolingKw, facilityBreakdown } = load
  const includeCooling = inputs.includeCooling !== false
  const coolingTons = includeCooling ? Math.max(0, inputs.coolingCapacityTons ?? 0) : 0
  const generatorKw = totalWithCoolingKw * SAFETY_MARGINS.generator
  const generatorKva = generatorKw / inputs.powerFactor

  const altitudeDerating = 1 + Math.max(0, (inputs.altitude - 1000) / 1000) * 0.03
  const tempDerating = 1 + Math.max(0, (inputs.ambientTemp - 77) / 10) * 0.02
  const loadFactor = totalWithCoolingKw / generatorKw
  const generatorUnits = Math.max(1, Math.ceil(generatorKw / 2250))
  const generatorUnitRatedKw = generatorKw / generatorUnits
  const sourceFuel = estimateSunbeltDieselFleetFuel(generatorUnitRatedKw, generatorUnits, totalWithCoolingKw)
  const bsfcGalPerKwh = sourceFuel.equivalentGalPerKwh
  const fuelGallonsPerHour = sourceFuel.gallonsPerHour * altitudeDerating * tempDerating
  const schedule = resolveTempPowerSchedule(inputs)
  const totalFuelGallons = fuelGallonsPerHour * schedule.operatingHours * 1.1
  const operatingDays = schedule.rentalDays
  const serviceIntervalDays = Math.max(0, inputs.serviceIntervalDays ?? 10)
  const serviceEvents = serviceIntervalDays > 0
    ? Math.ceil(operatingDays / serviceIntervalDays)
    : 0
  const noiseFineExposure = Math.max(0, inputs.noiseFinePerDay ?? 0) * Math.ceil(operatingDays)

  const hybrid = evaluateHybrid(totalWithCoolingKw, totalWithCoolingKw * 0.6, schedule.operatingHours, altitudeDerating, tempDerating)

  const siteVoltage = inputs.siteVoltage ?? 480
  const ampsPerPhase = (generatorKva * 1000) / (SQRT3 * siteVoltage)
  const parallelRunsNeeded = ampsPerPhase > 400

  const hybridFuelReductionGal = hybrid
    ? (hybrid.allGen.fuel30Day - hybrid.hybrid.fuel30Day)
    : 0
  const co2AvoidedLbs = hybridFuelReductionGal * CO2_LBS_PER_GALLON_DIESEL
  const co2AvoidedTons = co2AvoidedLbs / 2000

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
    rentalDays: schedule.rentalDays,
    dailyRuntimeHours: schedule.dailyRuntimeHours,
    operatingHours: schedule.operatingHours,
    operatingDays,
    serviceEvents,
    noiseFineExposure,
    altitudeDerating,
    tempDerating,
    ampsPerPhase,
    parallelRunsNeeded,
    facilityBreakdown,
    hybrid,
    co2AvoidedLbs,
    co2AvoidedTons,
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

  const reason = peakBaseRatio > 1.5
    ? `Peak-to-base ratio is ${peakBaseRatio.toFixed(1)}:1 — BESS handles peaks while generators run at optimal load`
    : durationDays > 7
      ? `${durationDays.toFixed(0)}-day duration - fuel-consumption reduction increases over time`
      : 'Hybrid configuration available for comparison'

  const genSizeAllGen = peakKw * SAFETY_MARGINS.generator
  const allGenLoadFactor = peakKw / genSizeAllGen
  const allGenUnits = Math.max(1, Math.ceil(genSizeAllGen / 500))
  const allGenFuelPerHour = estimateSunbeltDieselFleetFuel(500, allGenUnits, peakKw).gallonsPerHour * altitudeDerating * tempDerating
  const allGenFuelPerDay = allGenFuelPerHour * 24
  const allGenFuel30 = allGenFuelPerDay * 30

  const bestBessSize = pickBessSize(peakKw - baseKw)
  const bessUnits = Math.ceil((peakKw - baseKw) / BESS_UNIT_CONTINUOUS_KW[bestBessSize])

  const hybridGenSize = baseKw * SAFETY_MARGINS.generator
  const hybridLoadFactor = baseKw / hybridGenSize
  const hybridGenUnits = Math.max(1, Math.ceil(hybridGenSize / 500))
  const hybridFuelPerHour = estimateSunbeltDieselFleetFuel(500, hybridGenUnits, baseKw).gallonsPerHour * altitudeDerating * tempDerating
  const hybridFuelPerDay = hybridFuelPerHour * 24
  const hybridFuel30 = hybridFuelPerDay * 30

  const fuelReductionPercent = allGenFuel30 > 0 ? ((allGenFuel30 - hybridFuel30) / allGenFuel30) * 100 : 0

  return {
    recommended: shouldRecommend,
    reason,
    allGen: {
      genUnits: allGenUnits,
      genSizeKw: genSizeAllGen,
      fuelPerDay: allGenFuelPerDay,
      fuel30Day: allGenFuel30,
      loadFactor: allGenLoadFactor,
    },
    hybrid: {
      genUnits: hybridGenUnits,
      genSizeKw: hybridGenSize,
      bessUnits,
      bessUnitSize: bestBessSize,
      fuelPerDay: hybridFuelPerDay,
      fuel30Day: hybridFuel30,
      loadFactor: hybridLoadFactor,
      fuelReductionPercent,
    },
  }
}

function pickBessSize(peakDelta: number): BessUnitSize {
  for (const size of [...BESS_UNIT_SIZES].reverse()) {
    if (peakDelta >= BESS_UNIT_CONTINUOUS_KW[size]) return size
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
  redundancy: 'field_verify' | 'n' | 'n1' | '2n'
  siteVoltage: number
  altitude: number
  ambientTemp: number
  fuelCostPerGallon: number
  bessRentalPerDay: number
  genRentalPerDay: number
  bessRentalRate?: number
  bessRentalRatePeriod?: RatePeriod
  genRentalRate?: number
  genRentalRatePeriod?: RatePeriod
  startDate: string
  endDate: string
  motors: MotorEntry[]
  powerFactor?: number
  loadVoltage?: number
  loadPhase?: 'single' | 'three'
  longestCableRouteFt?: number
  neutralPlan?: 'required' | 'not_carried' | 'review'
  siteLengthFt?: number
  siteWidthFt?: number
}

export interface MotorEntry {
  id: string
  hp: number
  startMethod: 'dol' | 'soft_start' | 'vfd'
  fla: number
}

export interface HybridWizardResults {
  bessUnitsForContinuousLoad: number
  bessUnitsForEnergy: number
  bessRequiredUnits: number
  bessStandbyUnits: number
  bessFirmCapacityKw: number
  bessUnits: number
  bessUnitChargeKw: number
  bessChargeBasis: 'published' | 'planning_assumption'
  bessEnergyKwh: number
  bessUnitContinuousKw: number
  bessUnitUsableKwh: number
  genCapacityKw: number
  genUnits: number
  genUnitSizeKw: number
  generatorRequiredUnits: number
  generatorStandbyUnits: number
  generatorFirmCapacityKw: number
  allGenUnits: number
  protectedPeakLoadKw: number
  redundancyFactor: number
  allGenFuelPerDay: number
  allGenFuelProject: number
  hybridFuelPerDay: number
  hybridFuelTotal: number
  averageLoadKw: number
  batteryRuntimeHoursPerCycle: number
  generatorRuntimeHoursPerCycle: number
  generatorRuntimeHoursPerDay: number
  cyclesPerDay: number
  rechargePowerKw: number
  allGeneratorDailyEnergyKwh: number
  hybridGeneratorDailyEnergyKwh: number
  batteryDailyEnergyKwh: number
  rechargeEnergyKwh: number
  dailyFuelReduction: number
  totalFuelReductionGal: number
  totalFuelCostDifferenceDollars: number
  allGenCostProject: number
  hybridCostProject: number
  costDifferenceProject: number
  peakAmpsPerPhase: number
  baseAmpsPerPhase: number
  parallelRunsNeeded: boolean
  co2AvoidedLbs: number
  co2AvoidedTons: number
  coverage: HybridCoverageResults
  motorAssignments: { id: string; hp: number; method: string; lra: number; assignment: 'review'; reason: string }[]
  dailyFuelData: { day: number; date: string; allGenGal: number; hybridGal: number; reductionGal: number; cumulativeReductionGal: number }[]
}

export interface HybridCoverageResults {
  bessInstalledKw: number
  bessInstalledKwh: number
  bessUsableKwh: number
  generatorOnlineKw: number
  generatorRechargeReserveKw: number
  baseBatteryHours: number
  peakBatteryHours: number
  peakShavingHours: number
  estimatedRechargeHours: number | null
  canCarryBaseWhileCharging: boolean
  canCarryPeakOnGenerator: boolean
  canCoverPeakWithHybrid: boolean
  scenarios: HybridCoverageScenario[]
}

export interface HybridCoverageScenario {
  label: string
  status: '24_7_ready' | 'conditional' | 'not_feasible'
  dispatch: string
  coverage: string
  requirement: string
}

export function calculateHybridWizard(inputs: HybridWizardInputs): HybridWizardResults {
  const { peakLoadKw, baseLoadKw, bessUnitSize, peakHoursPerDay, redundancy, altitude, ambientTemp } = inputs
  const projectDurationDays = Math.max(1, inputs.projectDurationDays)
  const fuelCostPerGallon = Math.max(0, inputs.fuelCostPerGallon)
  const bessRentalPerDay = Math.max(0, inputs.bessRentalPerDay)
  const genRentalPerDay = Math.max(0, inputs.genRentalPerDay)

  const redundancyFactor = redundancy === '2n' ? 2.0 : redundancy === 'n1' || redundancy === 'field_verify' ? 1.25 : 1.0
  const peakWindowHours = Math.max(0, Math.min(24, peakHoursPerDay))
  const offPeakHoursPerDay = 24 - peakWindowHours
  const allGeneratorDailyEnergyKwh = (peakLoadKw * peakWindowHours) + (baseLoadKw * offPeakHoursPerDay)
  const averageLoadKw = allGeneratorDailyEnergyKwh / 24

  const motorAssignments = inputs.motors.map((m) => {
    const lraMultiplier = m.startMethod === 'dol' ? 7 : m.startMethod === 'soft_start' ? 3 : 1.25
    const lra = m.fla * lraMultiplier
    return {
      id: m.id,
      hp: m.hp,
      method: m.startMethod,
      lra,
      assignment: 'review' as const,
      reason: 'Informational only. Continuous power governs this estimate; motor starting and protection remain vendor/engineering verification before equipment release.',
    }
  })

  // The BESS inverter plant is sized to the entered continuous/base load. A
  // demand rise above that operating level starts and parallels the generator
  // plant; the customer peak is not used to oversize the battery plant.
  const bessUnitContinuousKw = BESS_UNIT_CONTINUOUS_KW[bessUnitSize]
  const bessUnitUsableKwh = BESS_UNIT_ENERGY_KWH[bessUnitSize]
  const bessUnitsForContinuousLoad = Math.max(1, Math.ceil(baseLoadKw / bessUnitContinuousKw))
  const bessUnitsForEnergy = 0
  const bessRequiredUnits = Math.max(bessUnitsForContinuousLoad, bessUnitsForEnergy)
  const bessStandbyUnits = redundancy === '2n'
    ? bessRequiredUnits
    : redundancy === 'n1' || redundancy === 'field_verify' ? 1 : 0
  const bessUnits = bessRequiredUnits + bessStandbyUnits
  const bessFirmCapacityKw = bessRequiredUnits * bessUnitContinuousKw
  // The operating SOC band is 80% down to the 30% generator-start threshold.
  // That 50% nameplate swing is the energy delivered during each BESS-only leg.
  const bessEnergyKwh = bessRequiredUnits * bessUnitUsableKwh * 0.5

  const genUnitSizeKw = 500
  const rechargeEfficiency = 0.9
  // Size generator duty capacity to carry the protected customer load. BESS
  // recharge is staged by the controller inside actual generator headroom;
  // requiring every PCS to charge at full input simultaneously would
  // incorrectly inflate the source plant.
  const chargeRating = BESS_UNIT_CHARGE_KW[bessUnitSize]
  const bessUnitChargeKw = chargeRating.kw
  const bessChargeBasis = chargeRating.basis
  const targetRechargePowerKw = bessRequiredUnits * bessUnitChargeKw
  const generatorRequiredUnits = Math.max(1, Math.ceil(peakLoadKw / genUnitSizeKw))
  const generatorStandbyUnits = redundancy === '2n'
    ? generatorRequiredUnits
    : redundancy === 'n1' || redundancy === 'field_verify' ? 1 : 0
  const genUnits = generatorRequiredUnits + generatorStandbyUnits
  const genCapacityKw = genUnits * genUnitSizeKw
  const generatorFirmCapacityKw = generatorRequiredUnits * genUnitSizeKw
  const allGenRequiredUnits = Math.max(1, Math.ceil(peakLoadKw / genUnitSizeKw))
  const allGenUnits = allGenRequiredUnits + (redundancy === '2n' ? allGenRequiredUnits : redundancy === 'n1' || redundancy === 'field_verify' ? 1 : 0)
  // Generator and BESS ratings describe two controlled sources on the same
  // load bus. They must not be added and presented as customer demand.
  const protectedPeakLoadKw = peakLoadKw

  const altDerate = 1 + Math.max(0, (altitude - 1000) / 1000) * 0.03
  const tempDerate = 1 + Math.max(0, (ambientTemp - 77) / 10) * 0.02

  const availableRechargePowerKw = Math.max(0, generatorFirmCapacityKw - peakLoadKw)
  const rechargePowerKw = Math.min(targetRechargePowerKw, availableRechargePowerKw)
  const batteryRuntimeHoursPerCycle = averageLoadKw > 0 ? bessEnergyKwh / averageLoadKw : 0
  const rechargeEnergyPerCycleKwh = bessEnergyKwh / rechargeEfficiency
  const generatorRuntimeHoursPerCycle = rechargePowerKw > 0 ? rechargeEnergyPerCycleKwh / rechargePowerKw : 24
  const cycleHours = batteryRuntimeHoursPerCycle + generatorRuntimeHoursPerCycle
  const cyclesPerDay = cycleHours > 0 && rechargePowerKw > 0 ? 24 / cycleHours : 0
  const generatorRuntimeHoursPerDay = rechargePowerKw > 0
    ? Math.min(24, cyclesPerDay * generatorRuntimeHoursPerCycle)
    : 24
  const batteryDailyEnergyKwh = averageLoadKw * Math.max(0, 24 - generatorRuntimeHoursPerDay)
  const rechargeEnergyKwh = cyclesPerDay * rechargeEnergyPerCycleKwh
  const hybridGeneratorDailyEnergyKwh = (averageLoadKw * generatorRuntimeHoursPerDay) + rechargeEnergyKwh
  const allGenPeakFuelPerHour = estimateSunbeltDieselFleetFuel(500, allGenRequiredUnits, peakLoadKw).gallonsPerHour
  const allGenBaseFuelPerHour = estimateSunbeltDieselFleetFuel(500, allGenRequiredUnits, baseLoadKw).gallonsPerHour
  const allGenFuelPerDay = (
    (allGenPeakFuelPerHour * peakWindowHours)
    + (allGenBaseFuelPerHour * offPeakHoursPerDay)
  ) * altDerate * tempDerate

  const generatorOnLoadKw = Math.min(generatorFirmCapacityKw, averageLoadKw + rechargePowerKw)
  const hybridGeneratorFuelPerHour = estimateSunbeltDieselFleetFuel(500, generatorRequiredUnits, generatorOnLoadKw).gallonsPerHour
  // BESS-only intervals burn no fuel. Fuel is counted only while the generator
  // carries customer load and supplies the modeled recharge block.
  const hybridFuelPerDay = hybridGeneratorFuelPerHour * generatorRuntimeHoursPerDay * altDerate * tempDerate

  const dailyFuelReduction = allGenFuelPerDay - hybridFuelPerDay
  const totalFuelReductionGal = dailyFuelReduction * projectDurationDays
  const totalFuelCostDifferenceDollars = totalFuelReductionGal * fuelCostPerGallon

  const allGenCostProject = (allGenFuelPerDay * fuelCostPerGallon + allGenUnits * genRentalPerDay) * projectDurationDays
  const hybridCostProject = (hybridFuelPerDay * fuelCostPerGallon + genUnits * genRentalPerDay + bessUnits * bessRentalPerDay) * projectDurationDays
  const costDifferenceProject = allGenCostProject - hybridCostProject

  const startDate = inputs.startDate ? new Date(inputs.startDate) : new Date()
  const dailyFuelData = Array.from({ length: Math.min(projectDurationDays, 365) }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return {
      day: i + 1,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      allGenGal: allGenFuelPerDay,
      hybridGal: hybridFuelPerDay,
      reductionGal: dailyFuelReduction,
      cumulativeReductionGal: dailyFuelReduction * (i + 1),
    }
  })

  const siteVoltage3ph = inputs.siteVoltage
  const powerFactor = Math.max(0.1, Math.min(1, inputs.powerFactor ?? 0.8))
  const peakAmpsPerPhase = (peakLoadKw * 1000) / (SQRT3 * siteVoltage3ph * powerFactor)
  const baseAmpsPerPhase = (baseLoadKw * 1000) / (SQRT3 * siteVoltage3ph * powerFactor)
  const parallelRunsNeeded = peakAmpsPerPhase > 400

  const co2AvoidedLbs = totalFuelReductionGal * CO2_LBS_PER_GALLON_DIESEL
  const co2AvoidedTons = co2AvoidedLbs / 2000
  const coverage = buildHybridCoverage(inputs, {
    bessUnits,
    bessRequiredUnits,
    genUnits,
    genUnitSizeKw,
  })

  return {
    bessUnitsForContinuousLoad, bessUnitsForEnergy, bessRequiredUnits, bessStandbyUnits, bessFirmCapacityKw,
    bessUnits, bessUnitChargeKw, bessChargeBasis,
    bessEnergyKwh, bessUnitContinuousKw, bessUnitUsableKwh,
    genCapacityKw, genUnits, genUnitSizeKw, generatorRequiredUnits, generatorStandbyUnits,
    generatorFirmCapacityKw, allGenUnits, protectedPeakLoadKw, redundancyFactor,
    allGenFuelPerDay, allGenFuelProject: allGenFuelPerDay * projectDurationDays,
    hybridFuelPerDay, hybridFuelTotal: hybridFuelPerDay * projectDurationDays,
    averageLoadKw, batteryRuntimeHoursPerCycle, generatorRuntimeHoursPerCycle,
    generatorRuntimeHoursPerDay, cyclesPerDay, rechargePowerKw,
    allGeneratorDailyEnergyKwh, hybridGeneratorDailyEnergyKwh, batteryDailyEnergyKwh, rechargeEnergyKwh,
    dailyFuelReduction, totalFuelReductionGal, totalFuelCostDifferenceDollars,
    allGenCostProject, hybridCostProject, costDifferenceProject,
    peakAmpsPerPhase, baseAmpsPerPhase, parallelRunsNeeded,
    co2AvoidedLbs, co2AvoidedTons,
    coverage,
    motorAssignments, dailyFuelData,
  }
}

function buildHybridCoverage(
  inputs: HybridWizardInputs,
  sizing: { bessUnits: number; bessRequiredUnits: number; genUnits: number; genUnitSizeKw: number },
): HybridCoverageResults {
  const unitKwh = BESS_UNIT_ENERGY_KWH[inputs.bessUnitSize]
  const bessInstalledKw = sizing.bessUnits * BESS_UNIT_CONTINUOUS_KW[inputs.bessUnitSize]
  const bessInstalledKwh = sizing.bessUnits * unitKwh
  const bessUsableKwh = sizing.bessRequiredUnits * unitKwh * 0.5
  const unavailableUnits = inputs.redundancy === '2n'
    ? sizing.genUnits / 2
    : inputs.redundancy === 'n1' || inputs.redundancy === 'field_verify' ? 1 : 0
  const generatorOnlineKw = Math.max(0, sizing.genUnits - unavailableUnits) * sizing.genUnitSizeKw
  const baseLoadKw = Math.max(1, inputs.baseLoadKw)
  const peakLoadKw = Math.max(1, inputs.peakLoadKw)
  const peakDeltaKw = Math.max(0, inputs.peakLoadKw - inputs.baseLoadKw)
  const generatorRechargeReserveKw = Math.max(0, generatorOnlineKw - inputs.peakLoadKw)
  const aggregateChargeTargetKw = sizing.bessRequiredUnits * BESS_UNIT_CHARGE_KW[inputs.bessUnitSize].kw
  const modeledRechargePowerKw = Math.min(generatorRechargeReserveKw, aggregateChargeTargetKw)
  const baseBatteryHours = bessUsableKwh / baseLoadKw
  const peakBatteryHours = bessUsableKwh / peakLoadKw
  const peakShavingHours = peakDeltaKw > 0 ? bessUsableKwh / peakDeltaKw : Infinity
  const estimatedRechargeHours = modeledRechargePowerKw > 0
    ? bessUsableKwh / (modeledRechargePowerKw * 0.9)
    : null
  const canCarryBaseWhileCharging = generatorOnlineKw >= inputs.baseLoadKw && generatorRechargeReserveKw > 0
  const canCarryPeakOnGenerator = generatorOnlineKw >= inputs.peakLoadKw
  const canCoverPeakWithHybrid = generatorOnlineKw + bessInstalledKw >= inputs.peakLoadKw
  const hasFuelAndServiceWindow = inputs.projectDurationDays >= 1

  const scenarios: HybridCoverageScenario[] = [
    {
      label: 'Battery-first hybrid microgrid',
      status: canCarryBaseWhileCharging && canCoverPeakWithHybrid && hasFuelAndServiceWindow
        ? '24_7_ready'
        : canCoverPeakWithHybrid || canCarryPeakOnGenerator
          ? 'conditional'
          : 'not_feasible',
      dispatch: 'Run BESS at the entered continuous load. EMS remote-starts the generator at the low-SOC or high-load threshold; the generator carries customer load and recharges the BESS from available headroom.',
      coverage: canCarryBaseWhileCharging
        ? `Generator has ${Math.round(generatorRechargeReserveKw)} kW reserve above protected peak; modeled charging is capped at ${Math.round(modeledRechargePowerKw)} kW.`
        : 'Generator cannot both serve the protected peak and recharge BESS without reducing customer load.',
      requirement: 'EMS starts the generator at 30% SOC, fast-charges toward 80% while serving load, then signals shutdown. Verify ATS/paralleling logic, vendor charge limits, fuel plan, service windows, inverter sync, and remote monitoring.',
    },
    {
      label: 'Silent overnight with recharge window',
      status: baseBatteryHours >= 8
        ? '24_7_ready'
        : baseBatteryHours >= 4
          ? 'conditional'
          : 'not_feasible',
      dispatch: 'Use BESS for quiet or emissions-sensitive hours, then recharge from generator before the reserve threshold is reached.',
      coverage: `${baseBatteryHours.toFixed(1)} hours of base-load battery runtime before generator recharge.`,
      requirement: baseBatteryHours >= 8
        ? 'Can support an 8-hour quiet window at base load before recharge.'
        : 'Increase BESS energy or shorten the quiet window for overnight coverage.',
    },
    {
      label: 'Parallel BESS for peak support',
      status: sizing.bessUnits > 1 && canCoverPeakWithHybrid && canCarryBaseWhileCharging
        ? '24_7_ready'
        : canCoverPeakWithHybrid
          ? 'conditional'
          : 'not_feasible',
      dispatch: 'Parallel multiple BESS units for peak shaving, voltage support, and staged recharge.',
      coverage: peakDeltaKw > 0
        ? `${peakShavingHours === Infinity ? 'Unlimited' : peakShavingHours.toFixed(1)} hours of peak-delta support from usable battery energy.`
        : 'No peak delta entered; BESS is operating as reserve or power-quality support.',
      requirement: 'Needs compatible paralleling controls, balanced cable runs, and verified inverter limits for motor starts.',
    },
    {
      label: 'Generator-backed 24/7 fallback',
      status: canCarryPeakOnGenerator
        ? '24_7_ready'
        : canCarryBaseWhileCharging
          ? 'conditional'
          : 'not_feasible',
      dispatch: 'Generator plant stays available as the fallback source while BESS handles silent runtime and transitions.',
      coverage: canCarryPeakOnGenerator
        ? 'Generator plant can carry peak load if BESS is depleted or offline.'
        : 'Generator plant can carry base load, but peak load depends on charged BESS capacity.',
      requirement: 'For critical 24/7 coverage, size generator fallback to the protected load or define which loads shed during recharge.',
    },
  ]

  return {
    bessInstalledKw,
    bessInstalledKwh,
    bessUsableKwh,
    generatorOnlineKw,
    generatorRechargeReserveKw,
    baseBatteryHours,
    peakBatteryHours,
    peakShavingHours,
    estimatedRechargeHours,
    canCarryBaseWhileCharging,
    canCarryPeakOnGenerator,
    canCoverPeakWithHybrid,
    scenarios,
  }
}
