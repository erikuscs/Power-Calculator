import { describe, it, expect } from 'vitest'
import { calculateRuntime, calculateSizing, calculateROI } from './bess.formulas'

describe('calculateRuntime', () => {
  it('computes amp-hours and runtime with PF 0.8', () => {
    const result = calculateRuntime({ kWh: 60, voltage: 48, amps: 50, powerFactor: 0.8 })
    expect(result.ampHours).toBe(1250)
    expect(result.runtime).toBeCloseTo(20.0, 1)
  })

  it('computes runtime with PF 1.0', () => {
    const result = calculateRuntime({ kWh: 60, voltage: 48, amps: 50, powerFactor: 1.0 })
    expect(result.ampHours).toBe(1250)
    expect(result.runtime).toBeCloseTo(25.0, 1)
  })

  it('handles high voltage system', () => {
    const result = calculateRuntime({ kWh: 100, voltage: 480, amps: 20, powerFactor: 0.8 })
    // AmpHours = (100 * 1000) / 480 = 208.333...
    expect(result.ampHours).toBeCloseTo(208.333, 2)
    // Runtime = (208.333 / 20) * 0.8 = 8.333...
    expect(result.runtime).toBeCloseTo(8.333, 2)
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
    expect(result.totalEnergy).toBe(1000)
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
    // TotalEnergy = (50 * 4) / 0.8 = 250
    expect(result.totalEnergy).toBe(250)
    // UsablePerUnit = 150 * 0.8 * 0.95 = 114
    expect(result.usablePerUnit).toBe(114)
    // Units = ceil(250 / 114) = ceil(2.193...) = 3
    expect(result.unitsRequired).toBe(3)
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
    // DailyArbitrage = 1000 * (0.25 - 0.08) * 0.85 * 1 = 144.5
    expect(result.dailyArbitrage).toBeCloseTo(144.5, 2)
  })

  it('computes annual revenue including demand reduction', () => {
    const result = calculateROI(baseInputs)
    // Annual arbitrage = 144.5 * 365 = 52,742.5
    // Annual demand reduction = 200 * 15 * 12 = 36,000
    // Total = 88,742.5
    expect(result.annualRevenue).toBeCloseTo(88742.5, 1)
  })

  it('returns correct number of yearly data entries', () => {
    const result = calculateROI(baseInputs)
    expect(result.yearlyData).toHaveLength(10)
    expect(result.yearlyData[0].year).toBe(1)
    expect(result.yearlyData[9].year).toBe(10)
  })

  it('applies degradation to yearly revenue', () => {
    const result = calculateROI(baseInputs)
    // Year 1: annualRevenue * (1 - 0.02 * 1) = 88742.5 * 0.98 = 86967.65
    expect(result.yearlyData[0].revenue).toBeCloseTo(86967.65, 0)
    // Year 5: annualRevenue * (1 - 0.02 * 5) = 88742.5 * 0.90 = 79868.25
    expect(result.yearlyData[4].revenue).toBeCloseTo(79868.25, 0)
  })

  it('computes simple payback', () => {
    const result = calculateROI(baseInputs)
    // SimplePayback = 500000 / 88742.5 = 5.635...
    expect(result.simplePayback).toBeCloseTo(5.635, 1)
  })

  it('cumulative starts negative and grows', () => {
    const result = calculateROI(baseInputs)
    // Year 1 cumulative = -500000 + 86967.65 = -413032.35
    expect(result.yearlyData[0].cumulative).toBeLessThan(0)
    // Later years should be positive (payback ~ 5.6 years)
    expect(result.yearlyData[9].cumulative).toBeGreaterThan(0)
  })
})
