import { describe, expect, it } from 'vitest'
import { recommendEquipment } from '../../lib/equipmentRecommendations'
import { buildTempPowerPlainLanguageReason, panelSizingExplanation, sizingTradeoffs } from './tempPowerPresentation'

describe('temporary power presentation copy', () => {
  it('explains a hybrid recommendation in plain language and names operating risks', () => {
    const recommendation = recommendEquipment({
      peakKw: 438,
      baseKw: 263,
      runtimeHours: 8,
      projectDurationHours: 720,
      peakHoursPerDay: 8,
      siteVoltage: 480,
    })

    expect(recommendation?.preferred).toBe('hybrid')
    expect(buildTempPowerPlainLanguageReason(recommendation!)).toContain('wet stacking')
    expect(buildTempPowerPlainLanguageReason(recommendation!)).toContain('unscheduled shutdowns')
    expect(panelSizingExplanation).toContain('not the amount of power')
    expect(sizingTradeoffs.oversized).toContain('forced regeneration')
    expect(sizingTradeoffs.undersized).toContain('overload trips')
  })
})
