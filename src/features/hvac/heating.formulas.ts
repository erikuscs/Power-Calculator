const BTU_PER_ELECTRIC_KWH = 3412.14
const PROPANE_BTU_PER_GALLON = 91420
const GENERATOR_MARGIN = 1.25
const GENERATOR_RATED_POWER_FACTOR = 0.8
const HEATING_CAPACITY_MARGIN = 1.15

export type HeatingSource = 'electric' | 'propane'
export type PropaneHeaterType = 'direct' | 'indirect'
export type HeatingExposure = 'sealed' | 'some_openings' | 'frequent_openings'

export const HEATING_EXPOSURE_OPTIONS: Record<HeatingExposure, { label: string; multiplier: number }> = {
  sealed: { label: 'Sealed / controlled enclosure', multiplier: 1 },
  some_openings: { label: 'Some door or material openings', multiplier: 1.25 },
  frequent_openings: { label: 'Frequent openings / drafty enclosure', multiplier: 1.5 },
}

export interface HeatingInputs {
  widthFt: number
  heightFt: number
  depthFt: number
  outdoorTempF: number
  targetTempF: number
  exposure: HeatingExposure
  source: HeatingSource
  unitOutputBtu: number
  runtimeHours: number
  propaneHeaterType?: PropaneHeaterType
  propaneEfficiency?: number
  electricPowerSource?: 'utility' | 'generator'
  auxiliaryPowerSource?: 'none' | 'utility' | 'generator'
  auxiliaryVoltage?: number
  auxiliaryCircuitAmps?: number
}

export interface HeatingResults {
  volumeCuFt: number
  deltaT: number
  baseHeatingBtu: number
  requiredHeatingBtu: number
  planningHeatingBtu: number
  unitCount: number
  installedOutputBtu: number
  propaneGallonsPerHour: number
  totalPropaneGallons: number
  electricHeaterKw: number
  auxiliaryRunningKva: number
  generatorPlanningKw: number
  generatorPlanningKva: number
}

export function calculateHeating(inputs: HeatingInputs): HeatingResults | null {
  const {
    widthFt,
    heightFt,
    depthFt,
    outdoorTempF,
    targetTempF,
    exposure,
    source,
    unitOutputBtu,
    runtimeHours,
  } = inputs

  if (
    !Number.isFinite(outdoorTempF)
    || !Number.isFinite(targetTempF)
    || widthFt <= 0
    || heightFt <= 0
    || depthFt <= 0
    || targetTempF <= outdoorTempF
    || unitOutputBtu <= 0
    || runtimeHours <= 0
  ) {
    return null
  }

  if (source === 'propane') {
    const efficiency = inputs.propaneEfficiency ?? (inputs.propaneHeaterType === 'direct' ? 1 : 0.8)
    if (!Number.isFinite(efficiency) || efficiency <= 0 || efficiency > 1) return null
    if (
      inputs.auxiliaryPowerSource === 'generator'
      && ((inputs.auxiliaryVoltage ?? 0) <= 0 || (inputs.auxiliaryCircuitAmps ?? 0) <= 0)
    ) return null
  }

  const volumeCuFt = widthFt * heightFt * depthFt
  const deltaT = targetTempF - outdoorTempF
  // 0.135 BTU/hr per cu ft per °F reproduces the published temporary-heater
  // coverage basis of roughly 350,000 BTU/hr for 8,100 sq ft, an 8 ft ceiling,
  // and a 40°F temperature rise in a sealed building.
  const baseHeatingBtu = volumeCuFt * deltaT * 0.135
  const exposureMultiplier = HEATING_EXPOSURE_OPTIONS[exposure]?.multiplier ?? 1
  const requiredHeatingBtu = baseHeatingBtu * exposureMultiplier
  const planningHeatingBtu = requiredHeatingBtu * HEATING_CAPACITY_MARGIN
  const unitCount = Math.max(1, Math.ceil(planningHeatingBtu / unitOutputBtu))
  const installedOutputBtu = unitCount * unitOutputBtu

  let propaneGallonsPerHour = 0
  let totalPropaneGallons = 0
  let electricHeaterKw = 0
  let auxiliaryRunningKva = 0
  let generatorPlanningKw = 0
  let generatorPlanningKva = 0

  if (source === 'propane') {
    const efficiency = inputs.propaneEfficiency ?? (inputs.propaneHeaterType === 'direct' ? 1 : 0.8)
    propaneGallonsPerHour = installedOutputBtu / efficiency / PROPANE_BTU_PER_GALLON
    totalPropaneGallons = propaneGallonsPerHour * Math.max(0, runtimeHours)

    if (inputs.auxiliaryPowerSource === 'generator') {
      auxiliaryRunningKva = Math.max(0, inputs.auxiliaryVoltage ?? 0)
        * Math.max(0, inputs.auxiliaryCircuitAmps ?? 0)
        * unitCount
        / 1000
      generatorPlanningKva = auxiliaryRunningKva * GENERATOR_MARGIN
      generatorPlanningKw = generatorPlanningKva * GENERATOR_RATED_POWER_FACTOR
    }
  } else {
    electricHeaterKw = installedOutputBtu / BTU_PER_ELECTRIC_KWH
    if (inputs.electricPowerSource === 'generator') {
      generatorPlanningKw = electricHeaterKw * GENERATOR_MARGIN
      generatorPlanningKva = generatorPlanningKw / GENERATOR_RATED_POWER_FACTOR
    }
  }

  return {
    volumeCuFt,
    deltaT,
    baseHeatingBtu,
    requiredHeatingBtu,
    planningHeatingBtu,
    unitCount,
    installedOutputBtu,
    propaneGallonsPerHour,
    totalPropaneGallons,
    electricHeaterKw,
    auxiliaryRunningKva,
    generatorPlanningKw,
    generatorPlanningKva,
  }
}

export function describeHeating(inputs: HeatingInputs, results: HeatingResults) {
  const exposureMultiplier = HEATING_EXPOSURE_OPTIONS[inputs.exposure]?.multiplier ?? 1
  const steps = [
    {
      label: 'Facility Volume',
      formula: 'Volume = Width × Height × Depth',
      substituted: `${inputs.widthFt} × ${inputs.heightFt} × ${inputs.depthFt}`,
      result: `${results.volumeCuFt.toLocaleString()} cu ft`,
    },
    {
      label: 'Temporary Heating Requirement',
      formula: 'BTU/hr = Volume × Temperature Rise × 0.135 × Exposure',
      substituted: `${results.volumeCuFt} × ${results.deltaT} × 0.135 × ${exposureMultiplier}`,
      result: `${results.requiredHeatingBtu.toLocaleString()} BTU/hr`,
    },
    {
      label: 'Planning Capacity',
      formula: 'Planning BTU/hr = Required BTU/hr × 1.15',
      substituted: `${results.requiredHeatingBtu.toLocaleString()} × 1.15`,
      result: `${results.planningHeatingBtu.toLocaleString()} BTU/hr`,
    },
    {
      label: 'Equipment Quantity',
      formula: 'Units = round up(Planning BTU/hr ÷ Unit Output)',
      substituted: `${results.planningHeatingBtu.toLocaleString()} ÷ ${inputs.unitOutputBtu.toLocaleString()}`,
      result: `${results.unitCount} unit${results.unitCount === 1 ? '' : 's'}`,
    },
  ]

  if (inputs.source === 'electric') {
    steps.push({
      label: 'Electric Resistance Demand',
      formula: 'Electrical kW = Installed BTU/hr ÷ 3,412.14',
      substituted: `${results.installedOutputBtu.toLocaleString()} ÷ 3,412.14`,
      result: `${results.electricHeaterKw.toFixed(1)} kW`,
    })
  } else {
    const efficiency = inputs.propaneEfficiency ?? (inputs.propaneHeaterType === 'direct' ? 1 : 0.8)
    steps.push({
      label: 'Propane Consumption at Full Fire',
      formula: 'Gallons/hr = Installed BTU/hr ÷ Efficiency ÷ 91,420 BTU/gal',
      substituted: `${results.installedOutputBtu.toLocaleString()} ÷ ${(efficiency * 100).toFixed(0)}% ÷ 91,420`,
      result: `${results.propaneGallonsPerHour.toFixed(2)} gal/hr`,
    })
  }

  return steps
}
