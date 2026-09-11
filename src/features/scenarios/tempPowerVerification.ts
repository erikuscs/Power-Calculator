import {
  calculateTempPowerSchedule,
  type TempPowerPlanningInputs,
  type TempPowerPlanningResults,
} from './scenario.formulas'

export interface TempPowerVerificationCheck {
  id: 'line_items' | 'cooling_scope' | 'total_load' | 'rental_days' | 'scheduled_hours'
  label: string
  passed: boolean
}

export interface TempPowerCalculationVerification {
  passed: boolean
  checks: TempPowerVerificationCheck[]
  passedCount: number
  checkedCount: number
}

const tolerance = 0.001

function nearlyEqual(actual: number, expected: number) {
  return Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance
}

export function verifyTempPowerPlanningBrief(
  inputs: TempPowerPlanningInputs,
  results: TempPowerPlanningResults,
): TempPowerCalculationVerification {
  const enteredLoad = inputs.mode === 'single'
    ? inputs.loadKw
    : inputs.facilities.reduce((total, facility) => total + (facility.quantity * facility.kwPerUnit), 0)
  const enteredCooling = inputs.includeCooling !== false
    ? Math.max(0, inputs.coolingElectricalKw ?? 0)
    : 0
  const schedule = inputs.rentalPeriod && inputs.runtimeSchedule
    ? calculateTempPowerSchedule(inputs.rentalPeriod, inputs.rentalPeriodCount ?? 1, inputs.runtimeSchedule)
    : {
        rentalDays: Math.max(0, inputs.durationHours) / 24,
        operatingHours: Math.max(0, inputs.durationHours),
      }

  const checks: TempPowerVerificationCheck[] = [
    {
      id: 'line_items',
      label: 'Facility and equipment line items match the connected-load total',
      passed: nearlyEqual(results.totalLoadKw, enteredLoad),
    },
    {
      id: 'cooling_scope',
      label: 'Cooling demand is included only when selected and entered',
      passed: nearlyEqual(results.coolingKw, enteredCooling),
    },
    {
      id: 'total_load',
      label: 'Connected load plus cooling demand matches the planning-load total',
      passed: nearlyEqual(results.totalWithCoolingKw, results.totalLoadKw + results.coolingKw),
    },
    {
      id: 'rental_days',
      label: 'Rental periods match the displayed rental-day count',
      passed: nearlyEqual(results.rentalDays, schedule.rentalDays),
    },
    {
      id: 'scheduled_hours',
      label: 'Rental days and operating schedule match the displayed coverage hours',
      passed: nearlyEqual(results.operatingHours, schedule.operatingHours),
    },
  ]
  const passedCount = checks.filter((check) => check.passed).length

  return {
    passed: passedCount === checks.length,
    checks,
    passedCount,
    checkedCount: checks.length,
  }
}
