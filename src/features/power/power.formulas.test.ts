import { describe, it, expect } from 'vitest'
import {
  calcGeneralPower,
  calcAmperes,
  calcKwKva,
  calcKwHp,
  calcFuelConsumption,
  interpolateBSFC,
  calcKvaAmps,
  calcLumensWatts,
  calcGeneratorPower,
  calcUpsPower,
  calcKwAmp,
} from './power.formulas'

describe('calcGeneralPower', () => {
  it('three-phase: 480V, 100A, PF 0.8 → kW ≈ 66.5, kVA ≈ 83.1', () => {
    const r = calcGeneralPower({ voltage: 480, amperes: 100, powerFactor: 0.8, phase: 'three' })
    expect(r.kw).toBeCloseTo(66.5, 0)
    expect(r.kva).toBeCloseTo(83.1, 0)
  })

  it('single-phase: 240V, 50A, PF 0.9 → kW = 10.8, kVA = 12', () => {
    const r = calcGeneralPower({ voltage: 240, amperes: 50, powerFactor: 0.9, phase: 'single' })
    expect(r.kw).toBeCloseTo(10.8, 1)
    expect(r.kva).toBeCloseTo(12.0, 1)
  })
})

describe('calcAmperes', () => {
  it('single-phase: 10 kW, 240V, PF 0.8 → I = 52.08A', () => {
    const r = calcAmperes({ kw: 10, voltage: 240, powerFactor: 0.8, phase: 'single' })
    expect(r.amperes).toBeCloseTo(52.08, 1)
  })

  it('three-phase: 50 kW, 480V, PF 0.85', () => {
    const r = calcAmperes({ kw: 50, voltage: 480, powerFactor: 0.85, phase: 'three' })
    // I = (50 * 1000) / (sqrt(3) * 480 * 0.85) = 50000 / 706.68 ≈ 70.74
    expect(r.amperes).toBeCloseTo(70.74, 0)
  })
})

describe('calcKwKva', () => {
  it('80 kW, PF 0.8 → 100 kVA', () => {
    const r = calcKwKva({ value: 80, powerFactor: 0.8, direction: 'kwToKva' })
    expect(r.result).toBeCloseTo(100, 1)
  })

  it('100 kVA, PF 0.8 → 80 kW', () => {
    const r = calcKwKva({ value: 100, powerFactor: 0.8, direction: 'kvaToKw' })
    expect(r.result).toBeCloseTo(80, 1)
  })
})

describe('calcKwHp', () => {
  it('100 kW → 134.1 HP', () => {
    const r = calcKwHp({ value: 100, direction: 'kwToHp' })
    expect(r.result).toBeCloseTo(134.1, 1)
  })

  it('100 HP → 74.57 kW', () => {
    const r = calcKwHp({ value: 100, direction: 'hpToKw' })
    expect(r.result).toBeCloseTo(74.57, 1)
  })
})

describe('calcKwAmp', () => {
  it('kW to Amps single-phase', () => {
    const r = calcKwAmp({ value: 10, voltage: 240, powerFactor: 0.8, phase: 'single', direction: 'kwToAmp' })
    expect(r.result).toBeCloseTo(52.08, 1)
  })

  it('Amps to kW three-phase', () => {
    const r = calcKwAmp({ value: 100, voltage: 480, powerFactor: 0.8, phase: 'three', direction: 'ampToKw' })
    expect(r.result).toBeCloseTo(66.5, 0)
  })
})

describe('calcGeneratorPower', () => {
  it('applies 125% safety margin', () => {
    const r = calcGeneratorPower({ voltage: 480, amperes: 100, powerFactor: 0.8, phase: 'three' })
    expect(r.kwRaw).toBeCloseTo(66.5, 0)
    expect(r.kwMargin).toBeCloseTo(66.5 * 1.25, 0)
    expect(r.kvaMargin).toBeCloseTo(83.1 * 1.25, 0)
  })
})

describe('calcUpsPower', () => {
  it('computes load and battery runtime', () => {
    const r = calcUpsPower({ voltage: 240, amperes: 50, powerFactor: 0.9, phase: 'single', batteryKwh: 20 })
    expect(r.kw).toBeCloseTo(10.8, 1)
    expect(r.runtimeHours).toBeCloseTo(20 / 10.8, 1)
  })
})

describe('interpolateBSFC', () => {
  it('returns exact value at 25% load', () => {
    expect(interpolateBSFC(0.25)).toBe(0.105)
  })

  it('returns exact value at 100% load', () => {
    expect(interpolateBSFC(1.0)).toBe(0.068)
  })

  it('37.5% load interpolates between 25% and 50% → ~0.095', () => {
    const result = interpolateBSFC(0.375)
    // Linear interpolation: 0.105 + (0.375 - 0.25) / (0.50 - 0.25) * (0.085 - 0.105)
    // = 0.105 + 0.5 * (-0.02) = 0.105 - 0.01 = 0.095
    expect(result).toBeCloseTo(0.095, 3)
  })

  it('clamps below 25% to 0.105', () => {
    expect(interpolateBSFC(0.1)).toBe(0.105)
  })

  it('clamps above 100% to 0.068', () => {
    expect(interpolateBSFC(1.5)).toBe(0.068)
  })
})

describe('calcFuelConsumption', () => {
  it('diesel: 500 kW gen at 100% load → BSFC = 0.068 → 34 gal/hr at sea level 77F', () => {
    const r = calcFuelConsumption({
      actualKw: 500,
      ratedKw: 500,
      hours: 1,
      altitude: 0,
      ambientF: 77,
      fuelType: 'diesel',
    })
    expect(r.loadFactor).toBe(1.0)
    expect(r.bsfc).toBe(0.068)
    expect(r.altitudeDerating).toBe(1.0)
    expect(r.tempDerating).toBe(1.0)
    expect(r.gallonsPerHour).toBeCloseTo(34.0, 1)
    expect(r.totalFuel).toBeCloseTo(34.0, 1)
  })

  it('diesel: 250 kW on 500 kW gen (50% load) → BSFC = 0.085 → 21.25 gal/hr', () => {
    const r = calcFuelConsumption({
      actualKw: 250,
      ratedKw: 500,
      hours: 1,
      altitude: 0,
      ambientF: 77,
      fuelType: 'diesel',
    })
    expect(r.loadFactor).toBe(0.5)
    expect(r.bsfc).toBe(0.085)
    expect(r.gallonsPerHour).toBeCloseTo(21.25, 2)
  })

  it('diesel with altitude and temperature derating', () => {
    const r = calcFuelConsumption({
      actualKw: 500,
      ratedKw: 500,
      hours: 10,
      altitude: 5000,
      ambientF: 97,
      fuelType: 'diesel',
    })
    // altitudeDerating = 1 + max(0, (5000 - 1000) / 1000) * 0.03 = 1 + 4 * 0.03 = 1.12
    expect(r.altitudeDerating).toBeCloseTo(1.12, 4)
    // tempDerating = 1 + max(0, (97 - 77) / 10) * 0.02 = 1 + 2 * 0.02 = 1.04
    expect(r.tempDerating).toBeCloseTo(1.04, 4)
    // GPH = 500 * 0.068 * 1.12 * 1.04 = 39.6032
    expect(r.gallonsPerHour).toBeCloseTo(39.6032, 2)
    expect(r.totalFuel).toBeCloseTo(396.032, 1)
  })

  it('natural gas fuel consumption', () => {
    const r = calcFuelConsumption({
      actualKw: 500,
      ratedKw: 500,
      hours: 1,
      altitude: 0,
      ambientF: 77,
      fuelType: 'naturalGas',
    })
    // CFH = 500 * 10.58 * (0.068 / 0.068) * 1 * 1 = 5290
    expect(r.gallonsPerHour).toBeCloseTo(5290, 0)
  })
})

describe('calcKvaAmps', () => {
  it('single-phase: 100 kVA, 240V → 416.67 A', () => {
    const r = calcKvaAmps({ kva: 100, voltage: 240, phase: 'single' })
    expect(r.amperes).toBeCloseTo(416.67, 0)
  })

  it('three-phase: 100 kVA, 480V → 120.28 A', () => {
    const r = calcKvaAmps({ kva: 100, voltage: 480, phase: 'three' })
    expect(r.amperes).toBeCloseTo(120.28, 0)
  })
})

describe('calcLumensWatts', () => {
  it('LED: 1800 lumens / 90 lm/W = 20 W', () => {
    const r = calcLumensWatts({ lumens: 1800, lampType: 'LED' })
    expect(r.watts).toBeCloseTo(20.0, 1)
    expect(r.efficacy).toBe(90)
  })

  it('Incandescent: 1800 lumens / 15 lm/W = 120 W', () => {
    const r = calcLumensWatts({ lumens: 1800, lampType: 'Incandescent' })
    expect(r.watts).toBeCloseTo(120.0, 1)
    expect(r.efficacy).toBe(15)
  })
})
