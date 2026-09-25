import { describe, it, expect } from 'vitest'
import { calculateRuntime, calculateSizing, calculateROI } from './bess.formulas'

describe('calculateRuntime', () => {
  it('computes runtime from the usable window and delivery efficiency', () => {
    const result = calculateRuntime({ kWh: 60, loadKw: 10, usablePercent: 80, efficiencyPercent: 95 })
    expect(result.usableEnergyKwh).toBe(48)
    expect(result.deliveredEnergyKwh).toBeCloseTo(45.6, 2)
    expect(result.runtime).toBeCloseTo(4.56, 2)
  })

  it('uses the full nameplate energy only when both factors are 100%', () => {
    const result = calculateRuntime({ kWh: 60, loadKw: 2.4, usablePercent: 100, efficiencyPercent: 100 })
    expect(result.deliveredEnergyKwh).toBe(60)
    expect(result.runtime).toBeCloseTo(25.0, 1)
  })

  it('does not mix DC bus voltage or AC power factor into an energy/runtime calculation', () => {
    const result = calculateRuntime({ kWh: 100, loadKw: 20, usablePercent: 80, efficiencyPercent: 90 })
    expect(result.deliveredEnergyKwh).toBe(72)
    expect(result.runtime).toBeCloseTo(3.6, 2)
  })
})

describe('calculateSizing', () => {
  it('computes sizing for 100 kW, 8 hrs, 80% DoD, 500 kWh unit, 5% losses', () => {
    const result = calculateSizing({
      loadKW: 100,
      hours: 8,
      dodPercent: 80,
      unitCapacity: 500,
      lossesPercent: 5,
    })
    expect(result.totalEnergy).toBe(800)
    expect(result.usablePerUnit).toBe(380)
    expect(result.unitsRequired).toBe(3)
  })

  it('rounds up units when not evenly divisible', () => {
    const result = calculateSizing({
      loadKW: 50,
      hours: 4,
      dodPercent: 80,
      unitCapacity: 150,
      lossesPercent: 5,
    })
    // TotalEnergy = 50 * 4 = 200. DoD belongs only in usable unit energy.
    expect(result.totalEnergy).toBe(200)
    // UsablePerUnit = 150 * 0.8 * 0.95 = 114
    expect(result.usablePerUnit).toBe(114)
    // Units = ceil(200 / 114) = ceil(1.754...) = 2
    expect(result.unitsRequired).toBe(2)
  })

  it('handles 100% DoD and 0% losses', () => {
    const result = calculateSizing({
      loadKW: 100,
      hours: 5,
      dodPercent: 100,
      unitCapacity: 500,
      lossesPercent: 0,
    })
    expect(result.totalEnergy).toBe(500)
    expect(result.usablePerUnit).toBe(500)
    expect(result.unitsRequired).toBe(1)
  })
})

describe('calculateROI', () => {
  const baseInputs = {
    systemCost: 500000,
    capacity: 1000,
    peakRate: 0.25,
    offPeakRate: 0.08,
    roundTripEfficiency: 0.85,
    cyclesPerDay: 1,
    monthlyPeakReduction: 200,
    demandChargeRate: 15,
    degradationRate: 0.02,
    discountRate: 0.08,
    analysisPeriod: 10,
  }

  it('computes daily arbitrage correctly', () => {
    const result = calculateROI(baseInputs)
    // 1,000 kWh is delivered; charging requires 1,000 / 0.85 kWh.
    expect(result.dailyArbitrage).toBeCloseTo(155.882, 2)
  })

  it('computes annual revenue including demand reduction', () => {
    const result = calculateROI(baseInputs)
    // Annual arbitrage = 155.882... * 365 = 56,897.06
    // Annual demand reduction = 200 * 15 * 12 = 36,000
    expect(result.annualRevenue).toBeCloseTo(92897.06, 1)
  })

  it('returns correct number of yearly data entries', () => {
    const result = calculateROI(baseInputs)
    expect(result.yearlyData).toHaveLength(10)
    expect(result.yearlyData[0].year).toBe(1)
    expect(result.yearlyData[9].year).toBe(10)
  })

  it('applies degradation to yearly revenue', () => {
    const result = calculateROI(baseInputs)
    expect(result.yearlyData[0].revenue).toBeCloseTo(result.annualRevenue, 2)
    const annualArbitrage = result.dailyArbitrage * 365
    const annualDemandReduction = 200 * 15 * 12
    expect(result.yearlyData[4].revenue).toBeCloseTo(annualArbitrage * Math.pow(0.98, 4) + annualDemandReduction, 2)
  })

  it('computes simple payback', () => {
    const result = calculateROI(baseInputs)
    expect(result.simplePayback).toBeCloseTo(500000 / result.annualRevenue, 2)
  })

  it('cumulative starts negative and grows', () => {
    const result = calculateROI(baseInputs)
    // Year 1 cumulative = -500000 + 86967.65 = -413032.35
    expect(result.yearlyData[0].cumulative).toBeLessThan(0)
    // Later years should be positive (payback ~ 5.6 years)
    expect(result.yearlyData[9].cumulative).toBeGreaterThan(0)
  })

  it('rejects invalid efficiency and financial bounds before calculating', () => {
    expect(() => calculateROI({ ...baseInputs, roundTripEfficiency: 0 })).toThrow(/efficiency/i)
    expect(() => calculateROI({ ...baseInputs, roundTripEfficiency: 1.2 })).toThrow(/efficiency/i)
    expect(() => calculateROI({ ...baseInputs, cyclesPerDay: 0 })).toThrow(/cycles/i)
    expect(() => calculateROI({ ...baseInputs, degradationRate: 1 })).toThrow(/degradation/i)
    expect(() => calculateROI({ ...baseInputs, analysisPeriod: 0 })).toThrow(/analysis period/i)
  })
})
