import type { EquipmentRecommendation } from '../../lib/equipmentRecommendations'
import type { RentalPeriod, RuntimeSchedule } from './scenario.formulas'

export function buildTempPowerPlainLanguageReason(recommendation: EquipmentRecommendation, includeCooling = true) {
  if (recommendation.preferred === 'hybrid') {
    return 'The generator carries the base load; the BESS handles peaks. This reduces wet stacking, forced regeneration, overload trips, and unscheduled shutdowns.'
  }

  if (recommendation.preferred === 'bess') {
    return 'The expected load and operating window fit a battery-first plan. It provides quiet power without continuously running a generator, provided the recharge window and motor-starting requirements are confirmed.'
  }

  return includeCooling
    ? 'The source plant is sized from the confirmed equipment demand, starting load, selected cooling-equipment demand, and field allowance—not the breaker-panel rating. The continuity target then determines whether the job uses one source or a parallel generator plant.'
    : 'The source plant is sized from the confirmed equipment demand, starting load, and field allowance—not the breaker-panel rating. The continuity target then determines whether the job uses one source or a parallel generator plant.'
}

export function rentalPeriodLabel(period: RentalPeriod, count: number) {
  const unit = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : '28-day cycle'
  const safeCount = Math.max(1, count || 1)
  return `${safeCount.toLocaleString()} ${unit}${safeCount === 1 ? '' : 's'}`
}

export function runtimeScheduleLabel(schedule?: RuntimeSchedule) {
  return schedule === 'shift_8' ? '8-hour shift' : '24/7 continuous'
}

export function compactEquipmentLabel(label: string) {
  return label.replace(/\s+legacy \/ large-system(?=\s+BESS)/i, '')
}

export const panelSizingExplanation =
  'The breaker-panel rating is the maximum the distribution system can accommodate, not the amount of power the site is expected to use. Source selection should begin with verified equipment demand, starting behavior, and the operating schedule.'

export const sizingTradeoffs = {
  oversized:
    'Too large: sustained low-load operation can increase fuel consumption, wet stacking, emissions-system loading, and forced regeneration, while adding rental cost.',
  undersized:
    'Too small: motor starts and demand peaks can cause voltage or frequency instability, overload trips, and unscheduled shutdowns.',
}
