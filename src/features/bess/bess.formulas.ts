// ── BESS Formula Types ──────────────────────────────────────────────

export interface RuntimeInputs {
  kWh: number
  loadKw: number
  usablePercent: number
  efficiencyPercent: number
}

export interface RuntimeResults {
  usableEnergyKwh: number
  deliveredEnergyKwh: number
  runtime: number
}

export interface SizingInputs {
  loadKW: number
  hours: number
  dodPercent: number
  unitCapacity: number
  lossesPercent: number
}

export interface SizingResults {
  totalEnergy: number
  usablePerUnit: number
  unitsRequired: number
}

export interface ROIInputs {
  systemCost: number
  capacity: number
  peakRate: number
  offPeakRate: number
  roundTripEfficiency: number
  cyclesPerDay: number
  monthlyPeakReduction: number
  demandChargeRate: number
  degradationRate: number
  discountRate: number
  analysisPeriod: number
}

export interface YearlyData {
  year: number
  revenue: number
  cumulative: number
  npv: number
}

export interface ROIResults {
  dailyArbitrage: number
  annualRevenue: number
  npv: number
  simplePayback: number
  yearlyData: YearlyData[]
}

export function validateROIInputs(inputs: ROIInputs): string | null {
  if (!Number.isFinite(inputs.systemCost) || inputs.systemCost <= 0) return 'System cost must be greater than zero.'
  if (!Number.isFinite(inputs.capacity) || inputs.capacity <= 0) return 'Capacity must be greater than zero.'
  if (!Number.isFinite(inputs.peakRate) || inputs.peakRate < 0 || !Number.isFinite(inputs.offPeakRate) || inputs.offPeakRate < 0) return 'Energy rates cannot be negative.'
  if (!Number.isFinite(inputs.roundTripEfficiency) || inputs.roundTripEfficiency <= 0 || inputs.roundTripEfficiency > 1) return 'Round-trip efficiency must be greater than 0 and no more than 1.'
  if (!Number.isFinite(inputs.cyclesPerDay) || inputs.cyclesPerDay <= 0) return 'Cycles per day must be greater than zero.'
  if (!Number.isFinite(inputs.monthlyPeakReduction) || inputs.monthlyPeakReduction < 0 || !Number.isFinite(inputs.demandChargeRate) || inputs.demandChargeRate < 0) return 'Demand-reduction inputs cannot be negative.'
  if (!Number.isFinite(inputs.degradationRate) || inputs.degradationRate < 0 || inputs.degradationRate >= 1) return 'Degradation rate must be at least 0 and less than 1.'
  if (!Number.isFinite(inputs.discountRate) || inputs.discountRate < 0) return 'Discount rate cannot be negative.'
  if (!Number.isInteger(inputs.analysisPeriod) || inputs.analysisPeriod < 1 || inputs.analysisPeriod > 30) return 'Analysis period must be a whole number from 1 to 30 years.'
  return null
}

export interface FormulaStep {
  label: string
  formula: string
  substituted: string
  result: string
}

// ── A1. Runtime Calculator ──────────────────────────────────────────

export function calculateRuntime(inputs: RuntimeInputs): RuntimeResults {
  const { kWh, loadKw, usablePercent, efficiencyPercent } = inputs
  const usableEnergyKwh = kWh * (usablePercent / 100)
  const deliveredEnergyKwh = usableEnergyKwh * (efficiencyPercent / 100)
  const runtime = deliveredEnergyKwh / loadKw
  return { usableEnergyKwh, deliveredEnergyKwh, runtime }
}

export function describeRuntime(inputs: RuntimeInputs, results: RuntimeResults): FormulaStep[] {
  const { kWh, loadKw, usablePercent, efficiencyPercent } = inputs
  const { usableEnergyKwh, deliveredEnergyKwh, runtime } = results
  return [
    {
      label: 'Usable Energy Window',
      formula: 'UsableEnergy = NameplateEnergy x UsablePercent',
      substituted: `${kWh} x (${usablePercent} / 100)`,
      result: `${usableEnergyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`,
    },
    {
      label: 'Delivered Energy',
      formula: 'DeliveredEnergy = UsableEnergy x DeliveryEfficiency',
      substituted: `${usableEnergyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} x (${efficiencyPercent} / 100)`,
      result: `${deliveredEnergyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`,
    },
    {
      label: 'Estimated Runtime',
      formula: 'Runtime = DeliveredEnergy / ContinuousLoad',
      substituted: `${deliveredEnergyKwh.toLocaleString('en-US', { maximumFractionDigits: 1 })} / ${loadKw}`,
      result: `${runtime.toLocaleString('en-US', { maximumFractionDigits: 1 })} hrs`,
    },
  ]
}

// ── A2. Multi-Unit Sizing ───────────────────────────────────────────

export function calculateSizing(inputs: SizingInputs): SizingResults {
  const { loadKW, hours, dodPercent, unitCapacity, lossesPercent } = inputs
  const totalEnergy = loadKW * hours
  const usablePerUnit = unitCapacity * (dodPercent / 100) * (1 - lossesPercent / 100)
  const unitsRequired = Math.ceil(totalEnergy / usablePerUnit)
  return { totalEnergy, usablePerUnit, unitsRequired }
}

export function describeSizing(inputs: SizingInputs, results: SizingResults): FormulaStep[] {
  const { loadKW, hours, dodPercent, unitCapacity, lossesPercent } = inputs
  const { totalEnergy, usablePerUnit, unitsRequired } = results
  return [
    {
      label: 'Total Energy Required',
      formula: 'TotalEnergy = LoadKW x Hours',
      substituted: `${loadKW} x ${hours}`,
      result: `${totalEnergy.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`,
    },
    {
      label: 'Usable Energy per Unit',
      formula: 'UsablePerUnit = UnitCapacity x (DoD / 100) x (1 - Losses / 100)',
      substituted: `${unitCapacity} x (${dodPercent} / 100) x (1 - ${lossesPercent} / 100)`,
      result: `${usablePerUnit.toLocaleString('en-US', { maximumFractionDigits: 1 })} kWh`,
    },
    {
      label: 'Units Required',
      formula: 'UnitsRequired = ceil(TotalEnergy / UsablePerUnit)',
      substituted: `ceil(${totalEnergy.toLocaleString('en-US', { maximumFractionDigits: 1 })} / ${usablePerUnit.toLocaleString('en-US', { maximumFractionDigits: 1 })})`,
      result: `${unitsRequired} units`,
    },
  ]
}

// ── A3. Revenue / ROI Analysis ──────────────────────────────────────

export function calculateROI(inputs: ROIInputs): ROIResults {
  const validationError = validateROIInputs(inputs)
  if (validationError) throw new Error(validationError)
  const {
    systemCost, capacity, peakRate, offPeakRate,
    roundTripEfficiency, cyclesPerDay,
    monthlyPeakReduction, demandChargeRate,
    degradationRate, discountRate, analysisPeriod,
  } = inputs

  // Capacity is the usable energy delivered to the load. Recharge energy is
  // therefore capacity / round-trip efficiency; applying efficiency to the
  // entire rate spread understates discharge revenue and misstates charge cost.
  const dailyArbitrage = (capacity * peakRate - (capacity / roundTripEfficiency) * offPeakRate) * cyclesPerDay
  const annualArbitrage = dailyArbitrage * 365
  const annualDemandReduction = monthlyPeakReduction * demandChargeRate * 12

  const annualRevenue = annualArbitrage + annualDemandReduction

  const yearlyData: YearlyData[] = []
  let cumulativeCashFlow = -systemCost
  let npvSum = -systemCost

  for (let y = 1; y <= analysisPeriod; y++) {
    // Year 1 begins at the entered usable capacity. Degradation compounds from
    // Year 2 onward rather than being charged before the first operating year.
    const degradationFactor = Math.pow(1 - degradationRate, y - 1)
    const revenue = annualArbitrage * degradationFactor + annualDemandReduction
    cumulativeCashFlow += revenue
    npvSum += revenue / Math.pow(1 + discountRate, y)

    yearlyData.push({
      year: y,
      revenue,
      cumulative: cumulativeCashFlow,
      npv: npvSum,
    })
  }

  const annualNetCashFlow = annualRevenue
  const simplePayback = annualNetCashFlow > 0 ? systemCost / annualNetCashFlow : Infinity

  return {
    dailyArbitrage,
    annualRevenue,
    npv: npvSum,
    simplePayback,
    yearlyData,
  }
}

export function describeROI(inputs: ROIInputs, results: ROIResults): FormulaStep[] {
  const {
    capacity, peakRate, offPeakRate, roundTripEfficiency, cyclesPerDay,
    monthlyPeakReduction, demandChargeRate, degradationRate, discountRate, systemCost,
  } = inputs
  const { dailyArbitrage, annualRevenue, npv, simplePayback } = results

  const fmtUsd = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

  return [
    {
      label: 'Daily Arbitrage Revenue',
      formula: 'DailyArbitrage = (DeliveredEnergy x PeakRate - RechargeEnergy x OffPeakRate) x Cycles',
      substituted: `(${capacity} x ${peakRate} - (${capacity} / ${roundTripEfficiency}) x ${offPeakRate}) x ${cyclesPerDay}`,
      result: `${fmtUsd(dailyArbitrage)} / day`,
    },
    {
      label: 'Annual Demand Reduction',
      formula: 'AnnualDemandReduction = MonthlyPeakReduction x DemandChargeRate x 12',
      substituted: `${monthlyPeakReduction} x ${demandChargeRate} x 12`,
      result: `${fmtUsd(monthlyPeakReduction * demandChargeRate * 12)} / year`,
    },
    {
      label: 'Year 1 Revenue',
      formula: 'Revenue[y] = AnnualArbitrage x (1 - DegradationRate)^(y - 1) + AnnualDemandReduction',
      substituted: `Year 1 = ${fmtUsd(annualRevenue)}; degradation begins in Year 2 at ${(degradationRate * 100).toFixed(1)}%/yr`,
      result: `${fmtUsd(annualRevenue)} / year`,
    },
    {
      label: 'NPV',
      formula: 'NPV = Sum(CashFlow[y] / (1 + DiscountRate)^y) - SystemCost',
      substituted: `Sum over ${inputs.analysisPeriod} years at ${(discountRate * 100).toFixed(0)}% discount - ${fmtUsd(systemCost)}`,
      result: fmtUsd(npv),
    },
    {
      label: 'Simple Payback',
      formula: 'SimplePayback = SystemCost / AnnualNetCashFlow',
      substituted: `${fmtUsd(systemCost)} / ${fmtUsd(annualRevenue)}`,
      result: `${simplePayback.toLocaleString('en-US', { maximumFractionDigits: 1 })} years`,
    },
  ]
}
