import { describe, it, expect } from 'vitest'
import { calculateChiller, calculateCooling, calculateAirsideTonnage } from './hvac.formulas'

describe('calculateChiller', () => {
  it('calculates chiller tonnage from flow and delta T', () => {
    const result = calculateChiller({
      enteringTemp: 55,
      leavingTemp: 45,
      gpm: 120,
      specificHeat: 1,
      specificGravity: 1,
    })
    expect(result).not.toBeNull()
    expect(result!.deltaT).toBe(10)
    expect(result!.btuPerHour).toBe(600000)
    expect(result!.tons).toBe(50)
  })

  it('returns null for zero GPM', () => {
    expect(calculateChiller({ enteringTemp: 55, leavingTemp: 45, gpm: 0, specificHeat: 1, specificGravity: 1 })).toBeNull()
  })

  it('returns null if entering <= leaving', () => {
    expect(calculateChiller({ enteringTemp: 45, leavingTemp: 55, gpm: 120, specificHeat: 1, specificGravity: 1 })).toBeNull()
  })

  it('accounts for specific gravity and heat', () => {
    const result = calculateChiller({
      enteringTemp: 55,
      leavingTemp: 45,
      gpm: 120,
      specificHeat: 0.5,
      specificGravity: 1.1,
    })
    expect(result!.tons).toBeCloseTo(27.5, 0)
  })
})

describe('calculateCooling', () => {
  it('calculates cooling load from equipment heat', () => {
    const result = calculateCooling({
      loadKw: 100,
      sqFt: 0,
      ambientTemp: 95,
      targetTemp: 72,
      occupants: 0,
      structureType: 'container',
      structureMultiplier: 1.0,
    })
    expect(result).not.toBeNull()
    expect(result!.equipmentBtu).toBeCloseTo(341214, 0)
    expect(result!.tons).toBeCloseTo(28.4, 0)
  })

  it('adds occupant heat at 450 BTU/person', () => {
    const result = calculateCooling({
      loadKw: 10,
      sqFt: 0,
      ambientTemp: 95,
      targetTemp: 72,
      occupants: 100,
      structureType: 'container',
      structureMultiplier: 1.0,
    })
    expect(result!.occupantBtu).toBe(45000)
  })

  it('applies structure multiplier to envelope load', () => {
    const container = calculateCooling({
      loadKw: 10, sqFt: 1000, ambientTemp: 95, targetTemp: 72,
      occupants: 0, structureType: 'container', structureMultiplier: 1.0,
    })
    const canvas = calculateCooling({
      loadKw: 10, sqFt: 1000, ambientTemp: 95, targetTemp: 72,
      occupants: 0, structureType: 'canvas', structureMultiplier: 1.8,
    })
    expect(canvas!.envelopeBtu).toBeCloseTo(container!.envelopeBtu * 1.8, 0)
  })

  it('adds latent load when RH > 60%', () => {
    const dry = calculateCooling({
      loadKw: 100, sqFt: 1000, ambientTemp: 95, targetTemp: 72,
      occupants: 10, structureType: 'container', structureMultiplier: 1.0,
    })
    const humid = calculateCooling({
      loadKw: 100, sqFt: 1000, ambientTemp: 95, targetTemp: 72,
      occupants: 10, structureType: 'container', structureMultiplier: 1.0,
      relativeHumidity: 80,
    })
    expect(dry!.latentBtu).toBe(0)
    expect(humid!.latentBtu).toBeGreaterThan(0)
    expect(humid!.totalBtu).toBeGreaterThan(dry!.totalBtu)
    expect(humid!.tonsWithMargin).toBeGreaterThan(dry!.tonsWithMargin)
  })

  it('produces realistic latent load at coastal conditions (90°F/75%RH)', () => {
    const result = calculateCooling({
      loadKw: 100, sqFt: 2000, ambientTemp: 90, targetTemp: 72,
      occupants: 20, structureType: 'canvas', structureMultiplier: 1.8,
      relativeHumidity: 75,
    })
    const sensible = result!.equipmentBtu + result!.envelopeBtu + result!.occupantBtu
    const latentPercent = (result!.latentBtu / sensible) * 100
    // At 90°F/75%RH, latent should be 30-60% of sensible (SHR ~0.62)
    expect(latentPercent).toBeGreaterThan(25)
    expect(latentPercent).toBeLessThan(70)
  })

  it('ignores humidity below 60% RH', () => {
    const result = calculateCooling({
      loadKw: 100, sqFt: 0, ambientTemp: 95, targetTemp: 72,
      occupants: 0, structureType: 'container', structureMultiplier: 1.0,
      relativeHumidity: 50,
    })
    expect(result!.latentBtu).toBe(0)
  })

  it('applies 15% safety margin to tonnage', () => {
    const result = calculateCooling({
      loadKw: 100, sqFt: 0, ambientTemp: 95, targetTemp: 72,
      occupants: 0, structureType: 'container', structureMultiplier: 1.0,
    })
    expect(result!.tonsWithMargin).toBeCloseTo(result!.tons * 1.15, 1)
  })
})

describe('occupant activity levels', () => {
  const base = {
    loadKw: 10, sqFt: 0, ambientTemp: 95, targetTemp: 72,
    occupants: 300, structureType: 'vinyl', structureMultiplier: 1.5,
  }

  it('defaults to seated 450 BTU/person when no activity level given', () => {
    const result = calculateCooling(base)
    expect(result!.occupantBtu).toBe(300 * 450)
  })

  it('standing crowds add ~22% more occupant heat than seated', () => {
    const standing = calculateCooling({ ...base, occupantBtuPerPerson: 550 })
    expect(standing!.occupantBtu).toBe(300 * 550)
  })

  it('a 300-person dance floor doubles occupant load vs seated (the tent-cooling gotcha)', () => {
    const seated = calculateCooling({ ...base, occupantBtuPerPerson: 450 })
    const dancing = calculateCooling({ ...base, occupantBtuPerPerson: 900 })
    expect(dancing!.occupantBtu).toBe(2 * seated!.occupantBtu)
    // 300 dancers = 270,000 BTU/hr = 11+ tons from people alone
    expect(dancing!.occupantBtu).toBe(270000)
  })
})

describe('calculateAirsideTonnage', () => {
  it('matches the ASHRAE textbook case: 80/67°F to 55/54°F at 10,000 CFM ≈ 33 tons', () => {
    // Published values: h(80°F db / 67°F wb) ≈ 31.5 BTU/lb, h(55/54) ≈ 22.6 BTU/lb,
    // total ≈ 4.5 × 10,000 × 8.9 ≈ 400,000 BTU/hr ≈ 33 tons.
    const result = calculateAirsideTonnage({
      cfm: 10000,
      inletDryBulb: 80,
      inletWetBulb: 67,
      outletDryBulb: 55,
      outletWetBulb: 54,
    })
    expect(result).not.toBeNull()
    expect(result!.inletEnthalpy).toBeGreaterThan(30.9)
    expect(result!.inletEnthalpy).toBeLessThan(32.1)
    expect(result!.outletEnthalpy).toBeGreaterThan(22.1)
    expect(result!.outletEnthalpy).toBeLessThan(23.1)
    expect(result!.tonnage).toBeGreaterThan(31)
    expect(result!.tonnage).toBeLessThan(35)
  })

  it('calculates sensible and latent cooling from CFM', () => {
    const result = calculateAirsideTonnage({
      cfm: 10000,
      inletDryBulb: 95,
      inletWetBulb: 78,
      outletDryBulb: 55,
      outletWetBulb: 54,
    })
    expect(result).not.toBeNull()
    expect(result!.tonnage).toBeGreaterThan(0)
    expect(result!.sensibleCoolingBtu).toBeCloseTo(1.08 * 10000 * (95 - 55), 0)
    // Latent must be positive when dehumidifying from 78°F to 54°F wet bulb
    expect(result!.latentCoolingBtu).toBeGreaterThan(0)
  })

  it('returns null for zero CFM', () => {
    expect(calculateAirsideTonnage({
      cfm: 0, inletDryBulb: 95, inletWetBulb: 78, outletDryBulb: 55, outletWetBulb: 54,
    })).toBeNull()
  })
})
