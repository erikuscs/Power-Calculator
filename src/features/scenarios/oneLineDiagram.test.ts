import { describe, expect, it } from 'vitest'
import { buildHybridOneLineDiagram, buildTempPowerOneLineDiagram, flattenDiagramRows } from './oneLineDiagram'
import { calculateHybridWizard, calculateTempPower, type HybridWizardInputs, type TempPowerInputs } from './scenario.formulas'

describe('one-line diagram builders', () => {
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
      bessUnitSize: 600,
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
    expect(diagram.mermaid).toContain('EMaaS Controller')
    expect(diagram.mermaid).toContain('Commissioning Block A')
    expect(diagram.mermaid).toContain('Motor / Compressor Loads')
    expect(flattenDiagramRows(diagram).length).toBeGreaterThan(7)
  })
})
