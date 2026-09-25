import { describe, expect, it } from 'vitest'
import { DIESEL_GENERATOR_SIZES_KW } from './dieselFuelCurve'
import { GENERATOR_FLEET, normalizeRateToDaily, recommendEquipment } from './equipmentRecommendations'

describe('generator fleet catalog', () => {
  it('uses every governed diesel reference size and no unsupported size', () => {
    expect(GENERATOR_FLEET.map((unit) => unit.kw)).toEqual(DIESEL_GENERATOR_SIZES_KW)
    expect(GENERATOR_FLEET).toHaveLength(25)
    expect(GENERATOR_FLEET.map((unit) => unit.kw)).not.toContain(45)
    expect(GENERATOR_FLEET.map((unit) => unit.kw)).not.toContain(80)
    expect(GENERATOR_FLEET.map((unit) => unit.kw)).not.toContain(700)
  })

  it('uses supplier-neutral public metadata', () => {
    const retiredSupplierName = ['sun', 'belt'].join('')
    for (const unit of GENERATOR_FLEET) {
      expect(`${unit.label} ${unit.source}`.toLowerCase()).not.toContain(retiredSupplierName)
      expect(`${unit.label} ${unit.source}`).not.toMatch(/catalog|cat\s*\d/i)
    }
  })
})

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
