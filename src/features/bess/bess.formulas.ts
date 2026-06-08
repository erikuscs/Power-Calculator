// ── BESS Formula Types ──────────────────────────────────────────────

export interface RuntimeInputs {
  kWh: number
  voltage: number
  amps: number
  powerFactor: number
}

export interface RuntimeResults {
  ampHours: number
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

export interface FormulaStep {
  label: string
  formula: string
  substituted: string
  result: string
}

// ── A1. Runtime Calculator ──────────────────────────────────────────

export function calculateRuntime(inputs: RuntimeInputs): RuntimeResults {
  const { kWh, voltage, amps, powerFactor } = inputs
  const ampHours = (kWh * 1000) / voltage
  const runtime = (ampHours / amps) * powerFactor
  return { ampHours, runtime }
}

export function describeRuntime(inputs: RuntimeInputs, results: RuntimeResults): FormulaStep[] {
  const { kWh, voltage, amps, powerFactor } = inputs
  const { ampHours, runtime } = results
  return [
    {
      label: 'Amp-Hours',
      formula: 'AmpHours = (kWh x 1000) / Voltage',
      substituted: `(${kWh} x 1000) / ${voltage}`,
      result: `${ampHours.toLocaleString('en-US', { maximumFractionDigits: 1 })} Ah`,
    },
    {
      label: 'Runtime',
      formula: 'Runtime = (AmpHours / Amps) x PowerFactor',
      substituted: `(${ampHours.toLocaleString('en-US', { maximumFractionDigits: 1 })} / ${amps}) x ${powerFactor}`,
      result: `${runtime.toLocaleString('en-US', { maximumFractionDigits: 1 })} hrs`,
    },
  ]
}

// ── A2. Multi-Unit Sizing ───────────────────────────────────────────

export function calculateSizing(inputs: SizingInputs): SizingResults {
  const { loadKW, hours, dodPercent, unitCapacity, lossesPercent } = inputs
  const totalEnergy = (loadKW * hours) / (dodPercent / 100)
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
      formula: 'TotalEnergy = (LoadKW x Hours) / (DoD / 100)',
      substituted: `(${loadKW} x ${hours}) / (${dodPercent} / 100)`,
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
  const {
    systemCost, capacity, peakRate, offPeakRate,
    roundTripEfficiency, cyclesPerDay,
    monthlyPeakReduction, demandChargeRate,
    degradationRate, discountRate, analysisPeriod,
  } = inputs

  const dailyArbitrage = capacity * (peakRate - offPeakRate) * roundTripEfficiency * cyclesPerDay
  const annualArbitrage = dailyArbitrage * 365
  const annualDemandReduction = monthlyPeakReduction * demandChargeRate * 12

  const annualRevenue = annualArbitrage + annualDemandReduction

  const yearlyData: YearlyData[] = []
  let cumulativeCashFlow = -systemCost
  let npvSum = -systemCost

  for (let y = 1; y <= analysisPeriod; y++) {
    const revenue = (annualArbitrage + annualDemandReduction) * (1 - degradationRate * y)
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
      formula: 'DailyArbitrage = Capacity x (PeakRate - OffPeakRate) x RTE x CyclesPerDay',
      substituted: `${capacity} x (${peakRate} - ${offPeakRate}) x ${roundTripEfficiency} x ${cyclesPerDay}`,
      result: `${fmtUsd(dailyArbitrage)} / day`,
    },
    {
      label: 'Annual Demand Reduction',
      formula: 'AnnualDemandReduction = MonthlyPeakReduction x DemandChargeRate x 12',
      substituted: `${monthlyPeakReduction} x ${demandChargeRate} x 12`,
      result: `${fmtUsd(monthlyPeakReduction * demandChargeRate * 12)} / year`,
    },
    {
      label: 'Year 1 Revenue (with degradation)',
      formula: 'Revenue[y] = (AnnualArbitrage + AnnualDemandReduction) x (1 - DegradationRate x y)',
      substituted: `${fmtUsd(annualRevenue)} x (1 - ${degradationRate} x 1)`,
      result: `${fmtUsd(annualRevenue * (1 - degradationRate))} / year`,
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
