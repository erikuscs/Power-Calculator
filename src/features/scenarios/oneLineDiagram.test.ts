import { describe, expect, it } from 'vitest'
import { buildHybridOneLineDiagram, buildTempPowerOneLineDiagram, flattenDiagramRows } from './oneLineDiagram'
import { calculateHybridWizard, calculateTempPower, type HybridWizardInputs, type TempPowerInputs } from './scenario.formulas'
import { buildHybrid2000AmpExample } from './hybrid2000AmpExample'

describe('one-line diagram builders', () => {
  it('keeps the generator-only one-line free of unselected cooling and battery equipment', () => {
    const inputs: TempPowerInputs = {
      mode: 'single',
      loadKw: 200,
      sqFt: 2000,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 240,
      rentalPeriod: 'monthly',
      rentalPeriodCount: 1,
      runtimeSchedule: 'shift_8',
      includeCooling: false,
      altitude: 0,
      siteVoltage: 480,
      powerFactor: 0.8,
      facilities: [],
    }
    const diagram = buildTempPowerOneLineDiagram(inputs, calculateTempPower(inputs))

    expect(diagram.mermaid).toContain('Generator Plant')
    expect(diagram.mermaid).not.toContain('BESS')
    expect(diagram.mermaid).not.toContain('Cooling')
    expect(diagram.edges.some((edge) => edge.to === 'COOLING')).toBe(false)
  })

  it('builds a temporary housing style one-line with distribution, loads, service cadence, and Mermaid source', () => {
    const inputs: TempPowerInputs = {
      mode: 'basecamp',
      loadKw: 0,
      sqFt: 0,
      ambientTemp: 95,
      targetTemp: 72,
      durationHours: 24 * 32,
      altitude: 0,
      powerFactor: 0.8,
      serviceIntervalDays: 10,
      technicianCoverage: '24_7',
      containmentRequired: true,
      noiseFinePerDay: 500,
      facilities: [
        { id: 'rv', type: 'rv', label: 'RV Pedestals', quantity: 60, kwPerUnit: 4, structureType: 'container', structureMultiplier: 1 },
        { id: 'shower', type: 'shower', label: 'Shower Trailer', quantity: 2, kwPerUnit: 58, structureType: 'container', structureMultiplier: 1 },
        { id: 'bath', type: 'bath', label: 'Bathroom Trailer', quantity: 4, kwPerUnit: 14, structureType: 'container', structureMultiplier: 1 },
      ],
    }
    const diagram = buildTempPowerOneLineDiagram(inputs, calculateTempPower(inputs))

    expect(diagram.title).toBe('Temporary Power One-Line Diagram')
    expect(diagram.mermaid).toContain('flowchart LR')
    expect(diagram.mermaid).toContain('Generator Plant')
    expect(diagram.mermaid).toContain('Branch Panels')
    expect(diagram.mermaid).toContain('Base Camp Loads')
    expect(flattenDiagramRows(diagram).some((row) => row.includes('Service'))).toBe(true)
  })

  it('builds a hybrid commissioning diagram with generator, BESS, controls, and zones', () => {
    const inputs: HybridWizardInputs = {
      peakLoadKw: 4500,
      baseLoadKw: 50,
      loadSource: 'measured',
      bessUnitSize: 250,
      peakHoursPerDay: 12,
      projectDurationDays: 5,
      redundancy: 'n1',
      siteVoltage: 480,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 4.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-01-01',
      endDate: '2026-01-06',
      motors: [{ id: 'm1', hp: 200, startMethod: 'dol', fla: 248 }],
    }
    const diagram = buildHybridOneLineDiagram(
      inputs,
      calculateHybridWizard(inputs),
      [{ id: 'block-a', name: 'Commissioning Block A', kw: 4500 }],
    )

    expect(diagram.title).toBe('Hybrid Energy One-Line Diagram')
    expect(diagram.mermaid).toContain('BESS Plant')
    expect(diagram.mermaid).toContain('DEIF Energy Controller')
    expect(diagram.mermaid).toContain('52G source protection')
    expect(diagram.mermaid).toContain('Customer Service Main')
    expect(diagram.mermaid).toContain('Commissioning Block A')
    expect(diagram.mermaid).toContain('Motor / Compressor Loads')
    expect(flattenDiagramRows(diagram).length).toBeGreaterThan(7)
  })

  it('retains the separate 480-to-480 N+1 acceptance case without a transformer', () => {
    const serviceKw = (2000 * 480 * Math.sqrt(3) * 0.8) / 1000
    const inputs: HybridWizardInputs = {
      peakLoadKw: serviceKw,
      baseLoadKw: serviceKw,
      loadSource: 'panel',
      bessUnitSize: 250,
      peakHoursPerDay: 24,
      projectDurationDays: 28,
      redundancy: 'n1',
      siteVoltage: 480,
      loadVoltage: 480,
      powerFactor: 0.8,
      altitude: 0,
      ambientTemp: 85,
      fuelCostPerGallon: 8.5,
      bessRentalPerDay: 350,
      genRentalPerDay: 500,
      startDate: '2026-09-25',
      endDate: '2026-10-23',
      motors: [],
    }
    const diagram = buildHybridOneLineDiagram(inputs, calculateHybridWizard(inputs))

    expect(diagram.mermaid).toContain('Generator Breaker')
    expect(diagram.mermaid).toContain('BESS Breaker')
    expect(diagram.mermaid).toContain('DEIF Energy Controller')
    expect(diagram.mermaid).toContain('Customer Service Main')
    expect(diagram.mermaid).not.toContain('Step-Down Transformer')
    expect(diagram.edges.some((edge) => edge.from === 'SWGR' && edge.to === 'PANEL')).toBe(true)
  })

  it('shows all ten 240 V single-phase trailer branches for the 2,000 A hybrid case', () => {
    const { diagram } = buildHybrid2000AmpExample()

    expect(diagram.mermaid).toContain('Balanced 240V single-phase feeder distribution')
    expect(diagram.mermaid).toContain('2 x 250 kW continuous')
    expect(diagram.mermaid).toContain('3 x 500 kW')
    expect(diagram.mermaid).toContain('3 duty + 0 standby')
    expect(diagram.mermaid).toContain('2 duty + 0 standby')
    expect(diagram.mermaid).toContain('Generator Breaker')
    expect(diagram.mermaid).toContain('BESS Breaker')
    expect(diagram.mermaid).toContain('DEIF Energy Controller')
    expect(diagram.mermaid).toContain('480V Switchgear')
    expect(diagram.mermaid).toContain('Customer Service Main')
    expect(diagram.mermaid).toContain('Step-Down Transformer')
    expect(diagram.mermaid).toContain('Load nameplate required')
    expect(diagram.mermaid).toContain('240V 1-phase connection point · field verify')
    expect(diagram.mermaid).not.toMatch(/A branch at 240V 1-phase/)
    expect(diagram.mermaid).toContain('Job Site Trailer 10')
    expect(diagram.mermaid).not.toContain('240V, 3-phase')
    expect(diagram.edges.filter((edge) => edge.from === 'PANEL')).toHaveLength(10)
  })
})
