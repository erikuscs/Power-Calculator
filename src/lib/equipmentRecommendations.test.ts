import { describe, expect, it } from 'vitest'
import { normalizeRateToDaily, recommendEquipment } from './equipmentRecommendations'

describe('normalizeRateToDaily', () => {
  it('uses the 28-day rental cycle for monthly equipment rates', () => {
    expect(normalizeRateToDaily(2800, 'monthly')).toBe(100)
    expect(normalizeRateToDaily(700, 'weekly')).toBe(100)
    expect(normalizeRateToDaily(100, 'daily')).toBe(100)
  })
})

describe('recommendEquipment', () => {
  it('sizes BESS alternatives to the autonomy window instead of the full project duration', () => {
    const recommendation = recommendEquipment({
      peakKw: 2000,
      baseKw: 800,
      runtimeHours: 4,
      projectDurationHours: 30 * 24,
      peakHoursPerDay: 4,
      preferredBessKw: 30,
      redundancyFactor: 2,
      siteVoltage: 208,
    })

    expect(recommendation).not.toBeNull()
    expect(recommendation!.bess.units).not.toContain('9600')
    expect(recommendation!.bess.energyKwh).toBeLessThan(11000)
    expect(recommendation!.bess.label).toBe('BESS only - autonomy window')
    expect(recommendation!.bess.notes.join(' ')).toContain('Does not imply battery support for the full project')
    expect(recommendation!.hybrid.units).toContain('40 x Viridi RPS150')
    expect(recommendation!.hybrid.capacityKw).toBeGreaterThanOrEqual(1200)
    expect(recommendation!.hybrid.notes.join(' ')).toContain('208 V at this load creates very high current')
  })
})
