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

  it('applies 15% safety margin to tonnage', () => {
    const result = calculateCooling({
      loadKw: 100, sqFt: 0, ambientTemp: 95, targetTemp: 72,
      occupants: 0, structureType: 'container', structureMultiplier: 1.0,
    })
    expect(result!.tonsWithMargin).toBeCloseTo(result!.tons * 1.15, 1)
  })
})

describe('calculateAirsideTonnage', () => {
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
  })

  it('returns null for zero CFM', () => {
    expect(calculateAirsideTonnage({
      cfm: 0, inletDryBulb: 95, inletWetBulb: 78, outletDryBulb: 55, outletWetBulb: 54,
    })).toBeNull()
  })
})
