import { describe, expect, it } from 'vitest'
import { pdf, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { TempPowerPdfDoc } from './TempPowerPdf'
import { HybridEnergyPdfDoc } from './HybridEnergyPdf'
import { BessProjectPdfDoc } from './BessProjectPdf'
import { HvacAssessmentPdfDoc } from './HvacAssessmentPdf'
import { calculateTempPower, calculateHybridWizard, type TempPowerInputs, type HybridWizardInputs } from './scenario.formulas'
import { calculateSizing, calculateROI } from '../bess/bess.formulas'
import { calculateAirsideTonnage, calculateChiller, calculateCooling } from '../hvac/hvac.formulas'

async function expectPdfRenders(document: ReactElement<DocumentProps>, label: string) {
  const blob = await pdf(document).toBlob()

  expect(blob.type, label).toBe('application/pdf')
  expect(blob.size, label).toBeGreaterThan(1000)
}

describe('EMaaS report generation smoke tests', () => {
  it('renders the temporary power report with client, project, service, and noise exposure fields', async () => {
    const inputs: TempPowerInputs = {
      mode: 'single',
      loadKw: 4500,
      sqFt: 10000,
      ambientTemp: 90,
      targetTemp: 72,
      durationHours: 24 * 32,
      altitude: 0,
      powerFactor: 0.8,
      serviceIntervalDays: 10,
      technicianCoverage: '24_7',
      containmentRequired: true,
      noiseFinePerDay: 500,
      facilities: [],
    }

    await expectPdfRenders(
      <TempPowerPdfDoc
        inputs={inputs}
        results={calculateTempPower(inputs)}
        clientName="Data Center Campus"
        projectName="Commissioning Block A"
      />,
      'Temporary power PDF',
    )
  })

  it('renders the hybrid energy report for commissioning-scale loads', async () => {
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

    await expectPdfRenders(
      <HybridEnergyPdfDoc
        inputs={inputs}
        results={calculateHybridWizard(inputs)}
        clientName="Data Center Campus"
        projectName="Commissioning Block A"
        zones={[{ id: 'zone-a', name: 'Block A', kw: 4500 }]}
      />,
      'Hybrid energy PDF',
    )
  })

  it('renders the BESS economics report with EMaaS context', async () => {
    const sizingInputs = {
      loadKW: 500,
      hours: 4,
      dodPercent: 80,
      unitCapacity: 500,
      lossesPercent: 5,
    }
    const sizingResults = calculateSizing(sizingInputs)
    const roiInputs = {
      systemCost: 500000,
      capacity: sizingResults.totalEnergy,
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

    await expectPdfRenders(
      <BessProjectPdfDoc
        sizingInputs={sizingInputs}
        sizingResults={sizingResults}
        roiInputs={roiInputs}
        roiResults={calculateROI(roiInputs)}
        clientName="Data Center Campus"
        projectName="Energy Storage Evaluation"
      />,
      'BESS project PDF',
    )
  })

  it('renders the cooling assessment report with airside and chiller checks', async () => {
    const coolingInputs = {
      loadKw: 750,
      sqFt: 15000,
      ambientTemp: 95,
      targetTemp: 72,
      occupants: 20,
      structureType: 'container',
      structureMultiplier: 1,
    }
    const chillerInputs = {
      enteringTemp: 95,
      leavingTemp: 72,
      gpm: 600,
      specificHeat: 1,
      specificGravity: 1,
    }
    const airsideInputs = {
      cfm: 30000,
      inletDryBulb: 95,
      inletWetBulb: 78,
      outletDryBulb: 55,
      outletWetBulb: 52,
    }

    await expectPdfRenders(
      <HvacAssessmentPdfDoc
        coolingInputs={coolingInputs}
        coolingResults={calculateCooling(coolingInputs)}
        chillerInputs={chillerInputs}
        chillerResults={calculateChiller(chillerInputs)}
        airsideInputs={airsideInputs}
        airsideResults={calculateAirsideTonnage(airsideInputs)}
        clientName="Data Center Campus"
        projectName="Critical Cooling Review"
      />,
      'HVAC assessment PDF',
    )
  })
})
