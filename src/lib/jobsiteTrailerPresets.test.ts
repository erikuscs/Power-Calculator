import { describe, expect, it } from 'vitest'
import { JOBSITE_TRAILER_PRESETS } from './jobsiteTrailerPresets'

describe('jobsite trailer presets', () => {
  it('provides sourced choices from multiple manufacturers', () => {
    expect(new Set(JOBSITE_TRAILER_PRESETS.map((preset) => preset.id)).size).toBe(JOBSITE_TRAILER_PRESETS.length)
    expect(new Set(JOBSITE_TRAILER_PRESETS.map((preset) => preset.manufacturer)).size).toBeGreaterThanOrEqual(3)

    for (const preset of JOBSITE_TRAILER_PRESETS) {
      expect(preset.planningKw).toBe(0)
      expect(preset.sourceUrl).toMatch(/^https:\/\//)
      expect(preset.basis.length).toBeGreaterThan(20)
    }
  })

  it('does not convert published Mobile Modular service ratings into operating load', () => {
    expect(JOBSITE_TRAILER_PRESETS.find((preset) => preset.id === 'mobile-modular-2161-8x20')).toMatchObject({
      planningKw: 0,
      loadBasis: 'published-service',
    })
    expect(JOBSITE_TRAILER_PRESETS.find((preset) => preset.id === 'mobile-modular-jobsite-12x60')).toMatchObject({
      planningKw: 0,
      loadBasis: 'published-service',
    })
  })

  it('requires an entered load for manufacturer model references', () => {
    const inferred = JOBSITE_TRAILER_PRESETS.filter((preset) => preset.loadBasis === 'planning-estimate')

    expect(inferred.length).toBeGreaterThan(0)
    expect(inferred.every((preset) => preset.planningKw === 0)).toBe(true)
    expect(inferred.every((preset) => preset.basis.includes('Enter the operating load'))).toBe(true)
  })
})
