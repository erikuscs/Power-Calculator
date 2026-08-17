import { describe, expect, it } from 'vitest'
import { recommendEquipment } from './equipmentRecommendations'

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
    expect(recommendation!.hybrid.units).toContain('40 x 30 kW / 150 kWh BESS')
    expect(recommendation!.hybrid.notes.join(' ')).toContain('208 V at this load creates very high current')
  })
})
