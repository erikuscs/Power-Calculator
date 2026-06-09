export interface ChillerInputs {
  enteringTemp: number
  leavingTemp: number
  gpm: number
  specificHeat: number
  specificGravity: number
}

export interface ChillerResults {
  deltaT: number
  tons: number
  btuPerHour: number
}

export function calculateChiller(inputs: ChillerInputs): ChillerResults | null {
  const { enteringTemp, leavingTemp, gpm, specificHeat, specificGravity } = inputs
  if (gpm <= 0 || enteringTemp <= leavingTemp) return null
  const deltaT = enteringTemp - leavingTemp
  const btuPerHour = gpm * 500 * deltaT * specificGravity * specificHeat
  const tons = btuPerHour / 12000
  return { deltaT, tons, btuPerHour }
}

export function describeChiller(inputs: ChillerInputs, results: ChillerResults) {
  return [
    {
      label: 'Temperature Difference',
      formula: 'ΔT = Entering Temp - Leaving Temp',
      substituted: `${inputs.enteringTemp} - ${inputs.leavingTemp}`,
      result: `${results.deltaT}°F`,
    },
    {
      label: 'Cooling Capacity (BTU/hr)',
      formula: 'BTU/hr = GPM × 500 × ΔT × SpGr × SpHt',
      substituted: `${inputs.gpm} × 500 × ${results.deltaT} × ${inputs.specificGravity} × ${inputs.specificHeat}`,
      result: `${results.btuPerHour.toLocaleString()} BTU/hr`,
    },
    {
      label: 'Tonnage',
      formula: 'Tons = BTU/hr / 12,000',
      substituted: `${results.btuPerHour.toLocaleString()} / 12,000`,
      result: `${results.tons.toFixed(1)} tons`,
    },
  ]
}

export interface CoolingInputs {
  loadKw: number
  sqFt: number
  ambientTemp: number
  targetTemp: number
  occupants: number
  structureType: string
  structureMultiplier: number
  relativeHumidity?: number
}

export interface CoolingResults {
  equipmentBtu: number
  envelopeBtu: number
  latentBtu: number
  occupantBtu: number
  totalBtu: number
  tons: number
  tonsWithMargin: number
}

export function calculateCooling(inputs: CoolingInputs): CoolingResults | null {
  const { loadKw, sqFt, ambientTemp, targetTemp, occupants, structureMultiplier, relativeHumidity } = inputs
  if (loadKw <= 0) return null

  const equipmentBtu = loadKw * 3412.14
  const deltaT = Math.max(0, ambientTemp - targetTemp)
  const envelopeBtu = sqFt > 0 ? sqFt * deltaT * 0.5 * structureMultiplier : 0
  const occupantBtu = occupants * 450
  const sensibleBtu = equipmentBtu + envelopeBtu + occupantBtu

  // Latent load using Sensible Heat Ratio (SHR) — the industry-standard approach
  // SHR = sensible / total. Lower SHR = more latent load from humidity.
  // Below 60% RH: SHR ≈ 1.0 (negligible latent). At 80% RH, 90°F: SHR ≈ 0.65.
  const rh = relativeHumidity ?? 0
  let latentBtu = 0
  if (rh > 60) {
    const shr = estimateSHR(ambientTemp, rh)
    latentBtu = (sensibleBtu / shr) - sensibleBtu
  }

  const totalBtu = sensibleBtu + latentBtu
  const tons = totalBtu / 12000
  const tonsWithMargin = tons * 1.15

  return { equipmentBtu, envelopeBtu, latentBtu, occupantBtu, totalBtu, tons, tonsWithMargin }
}

function estimateSHR(tempF: number, rh: number): number {
  // SHR decreases as temperature and humidity rise
  // Based on ASHRAE data for outdoor air conditions:
  //   70°F/50%RH → 0.95,  80°F/60%RH → 0.82,  85°F/65%RH → 0.75
  //   90°F/70%RH → 0.67,  90°F/75%RH → 0.62,  95°F/80%RH → 0.55
  //   100°F/85%RH → 0.48
  const tempFactor = Math.max(0, (tempF - 70) / 30)
  const rhFactor = Math.max(0, (rh - 50) / 40)
  const shr = Math.max(0.45, Math.min(0.95, 0.95 - (tempFactor * 0.2 + rhFactor * 0.3)))
  return shr
}

export function describeCooling(inputs: CoolingInputs, results: CoolingResults) {
  const steps = [
    {
      label: 'Equipment Heat (BTU/hr)',
      formula: 'Equipment BTU = Load kW × 3,412.14',
      substituted: `${inputs.loadKw} × 3,412.14`,
      result: `${results.equipmentBtu.toLocaleString()} BTU/hr`,
    },
  ]
  if (inputs.sqFt > 0) {
    const deltaT = Math.max(0, inputs.ambientTemp - inputs.targetTemp)
    steps.push({
      label: 'Envelope Heat Gain (BTU/hr)',
      formula: 'Envelope BTU = Sq Ft × ΔT × 0.5 × Structure Multiplier',
      substituted: `${inputs.sqFt} × ${deltaT} × 0.5 × ${inputs.structureMultiplier}`,
      result: `${results.envelopeBtu.toLocaleString()} BTU/hr`,
    })
  }
  if (inputs.occupants > 0) {
    steps.push({
      label: 'Occupant Heat (BTU/hr)',
      formula: 'Occupant BTU = Occupants × 450 BTU/person',
      substituted: `${inputs.occupants} × 450`,
      result: `${results.occupantBtu.toLocaleString()} BTU/hr`,
    })
  }
  if (results.latentBtu > 0) {
    const rh = inputs.relativeHumidity ?? 0
    const shr = estimateSHR(inputs.ambientTemp, rh)
    const sensible = results.equipmentBtu + results.envelopeBtu + results.occupantBtu
    steps.push({
      label: 'Latent Load from Humidity (BTU/hr)',
      formula: `SHR = ${shr.toFixed(2)} at ${inputs.ambientTemp}°F / ${rh}% RH → Latent = (Sensible / SHR) - Sensible`,
      substituted: `(${sensible.toLocaleString()} / ${shr.toFixed(2)}) - ${sensible.toLocaleString()}`,
      result: `${results.latentBtu.toLocaleString()} BTU/hr (${((results.latentBtu / sensible) * 100).toFixed(0)}% of sensible)`,
    })
  }
  steps.push(
    {
      label: 'Total Heat Gain',
      formula: results.latentBtu > 0 ? 'Total = Sensible + Latent' : 'Total = Equipment + Envelope + Occupant',
      substituted: results.latentBtu > 0
        ? `${(results.equipmentBtu + results.envelopeBtu + results.occupantBtu).toLocaleString()} + ${results.latentBtu.toLocaleString()}`
        : `${results.equipmentBtu.toLocaleString()} + ${results.envelopeBtu.toLocaleString()} + ${results.occupantBtu.toLocaleString()}`,
      result: `${results.totalBtu.toLocaleString()} BTU/hr`,
    },
    {
      label: 'Cooling Tonnage (with 15% margin)',
      formula: 'Tons = (Total BTU / 12,000) × 1.15',
      substituted: `(${results.totalBtu.toLocaleString()} / 12,000) × 1.15`,
      result: `${results.tonsWithMargin.toFixed(1)} tons`,
    },
  )
  return steps
}

export interface PsychrometricInputs {
  dryBulb: number
  wetBulb?: number
  rh?: number
  dewPoint?: number
}

export interface AirsideTonnageInputs {
  cfm: number
  inletDryBulb: number
  inletWetBulb: number
  outletDryBulb: number
  outletWetBulb: number
}

export interface AirsideTonnageResults {
  inletEnthalpy: number
  outletEnthalpy: number
  totalCoolingBtu: number
  tonnage: number
  sensibleCoolingBtu: number
  latentCoolingBtu: number
}

export function calculateAirsideTonnage(inputs: AirsideTonnageInputs): AirsideTonnageResults | null {
  const { cfm, inletDryBulb, inletWetBulb, outletDryBulb, outletWetBulb } = inputs
  if (cfm <= 0) return null

  const inletEnthalpy = estimateEnthalpy(inletDryBulb, inletWetBulb)
  const outletEnthalpy = estimateEnthalpy(outletDryBulb, outletWetBulb)
  const totalCoolingBtu = 4.5 * cfm * (inletEnthalpy - outletEnthalpy)
  const tonnage = totalCoolingBtu / 12000
  const sensibleCoolingBtu = 1.08 * cfm * (inletDryBulb - outletDryBulb)
  const latentCoolingBtu = totalCoolingBtu - sensibleCoolingBtu

  return { inletEnthalpy, outletEnthalpy, totalCoolingBtu, tonnage, sensibleCoolingBtu, latentCoolingBtu }
}

function estimateEnthalpy(dryBulb: number, wetBulb: number): number {
  const tC = (dryBulb - 32) * 5 / 9
  const wbC = (wetBulb - 32) * 5 / 9
  const satPressWb = 610.78 * Math.exp((17.27 * wbC) / (wbC + 237.3))
  const W = 0.622 * (satPressWb / (101325 - satPressWb)) - 0.000662 * (tC - wbC)
  const Wpos = Math.max(0, W)
  return 1.006 * tC + Wpos * (2501 + 1.86 * tC)
}

export function describeAirsideTonnage(inputs: AirsideTonnageInputs, results: AirsideTonnageResults) {
  return [
    {
      label: 'Total Cooling',
      formula: 'Total BTU/hr = 4.5 × CFM × (h_inlet - h_outlet)',
      substituted: `4.5 × ${inputs.cfm} × (${results.inletEnthalpy.toFixed(2)} - ${results.outletEnthalpy.toFixed(2)})`,
      result: `${results.totalCoolingBtu.toLocaleString()} BTU/hr`,
    },
    {
      label: 'Tonnage',
      formula: 'Tons = Total BTU / 12,000',
      substituted: `${results.totalCoolingBtu.toLocaleString()} / 12,000`,
      result: `${results.tonnage.toFixed(1)} tons`,
    },
    {
      label: 'Sensible Cooling',
      formula: 'Sensible BTU/hr = 1.08 × CFM × (Tdb_in - Tdb_out)',
      substituted: `1.08 × ${inputs.cfm} × (${inputs.inletDryBulb} - ${inputs.outletDryBulb})`,
      result: `${results.sensibleCoolingBtu.toLocaleString()} BTU/hr`,
    },
    {
      label: 'Latent Cooling',
      formula: 'Latent = Total - Sensible',
      substituted: `${results.totalCoolingBtu.toLocaleString()} - ${results.sensibleCoolingBtu.toLocaleString()}`,
      result: `${results.latentCoolingBtu.toLocaleString()} BTU/hr`,
    },
  ]
}
