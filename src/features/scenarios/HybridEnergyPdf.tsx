import { PdfDocument, PdfSection, PdfTable, PdfKeyValue, PdfWarning } from '../../components/pdf/PdfReportShell'
import { Text } from '@react-pdf/renderer'
import type { HybridWizardInputs, HybridWizardResults } from './scenario.formulas'

export interface HybridEnergyPdfDocProps {
  inputs: HybridWizardInputs
  results: HybridWizardResults
  clientName?: string
  projectName?: string
}

export function HybridEnergyPdfDoc({ inputs, results, clientName, projectName }: HybridEnergyPdfDocProps) {
  const fi = (v: number) => Math.round(v).toLocaleString('en-US')
  const fc = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const redundancyLabel = inputs.redundancy === '2n' ? '2N (Full Redundancy)' : inputs.redundancy === 'n1' ? 'N+1' : 'N (No Redundancy)'

  return (
    <PdfDocument title="Hybrid Energy Management Report" clientName={clientName} projectName={projectName}>
      {/* Project Overview */}
      <PdfSection title="Project Overview">
        {clientName && <PdfKeyValue label="Client" value={clientName} />}
        <PdfKeyValue label="Project Dates" value={`${inputs.startDate || 'N/A'} to ${inputs.endDate || 'N/A'} (${inputs.projectDurationDays} days)`} />
        <PdfKeyValue label="Peak Load" value={`${fi(inputs.peakLoadKw)} kW`} />
        <PdfKeyValue label="Base Load" value={`${fi(inputs.baseLoadKw)} kW`} />
        <PdfKeyValue label="Redundancy Level" value={redundancyLabel} />
        <PdfKeyValue label="Site Voltage" value={`${inputs.siteVoltage} V`} />
        <PdfKeyValue label="BESS Unit Size" value={`${inputs.bessUnitSize} kW`} />
        <PdfKeyValue label="Altitude" value={`${fi(inputs.altitude)} ft ASL`} />
        <PdfKeyValue label="Ambient Temperature" value={`${inputs.ambientTemp} °F`} />
      </PdfSection>

      {/* System Configuration */}
      <PdfSection title="System Configuration">
        <PdfTable
          headers={['Parameter', 'Value']}
          rows={[
            ['BESS Units', `${results.bessUnits} x ${inputs.bessUnitSize} kW`],
            ['Generator Units', `${results.genUnits} x ${results.genUnitSizeKw} kW`],
            ['Total System Capacity', `${fi(results.totalCapacityKw)} kW`],
            ['Redundancy Factor', `${results.redundancyFactor}x`],
            ['BESS Energy Needed', `${fi(results.bessEnergyKwh)} kWh`],
            ['Generator Capacity', `${fi(results.genCapacityKw)} kW`],
          ]}
        />
      </PdfSection>

      {/* Motor Inrush Analysis */}
      {results.motorAssignments.length > 0 && (
        <PdfSection title="Motor Inrush Analysis">
          <PdfTable
            headers={['HP', 'Start Method', 'LRA (A)', 'Assignment', 'Reason']}
            rows={results.motorAssignments.map((ma) => [
              `${ma.hp}`,
              ma.method.toUpperCase(),
              fi(ma.lra),
              ma.assignment === 'bess' ? 'BESS' : 'Generator',
              ma.reason,
            ])}
          />
        </PdfSection>
      )}

      {/* Financial Comparison */}
      <PdfSection title="Financial Comparison">
        <PdfTable
          headers={['Metric', 'All Generator', 'Hybrid', 'Savings']}
          rows={[
            ['Daily Fuel', `${fi(results.allGenFuelPerDay)} gal`, `${fi(results.hybridFuelPerDay)} gal`, `${fi(results.dailyFuelReduction)} gal/day`],
            ['30-Day Fuel', `${fi(results.allGenFuel30Day)} gal`, `${fi(results.hybridFuelPerDay * 30)} gal`, `${fi(results.dailyFuelReduction * 30)} gal`],
            ['30-Day Total Cost', fc(results.allGenCost30Day), fc(results.hybridCost30Day), fc(results.costSavings30Day)],
            ['Project Fuel Savings', '--', `${fi(results.totalFuelSavingsGal)} gal`, fc(results.totalFuelSavingsDollars)],
          ]}
        />
      </PdfSection>

      {/* Fuel Projection — first 30 days */}
      <PdfSection title="Fuel Projection (First 30 Days)">
        <Text style={{ fontSize: 8, color: '#9ca3af', marginBottom: 4 }}>
          Daily fuel consumption comparison and cumulative savings over the project.
        </Text>
        <PdfTable
          headers={['Day', 'Date', 'All-Gen (gal)', 'Hybrid (gal)', 'Cumulative Savings (gal)']}
          rows={results.dailyFuelData.slice(0, 30).map((d) => [
            `${d.day}`,
            d.date,
            fi(d.allGenGal),
            fi(d.hybridGal),
            fi(d.cumulativeSavingsGal),
          ])}
        />
      </PdfSection>

      {/* Distribution Notes */}
      <PdfSection title="Distribution Notes">
        <PdfWarning>
          {`Your site needs step-down transformers for ${inputs.siteVoltage}V to 240V to 120V distribution. Confirm with your electrician.`}
        </PdfWarning>
        <PdfWarning>
          N+1/2N redundancy requires Automatic Transfer Switch(es) — include in your equipment order.
        </PdfWarning>
        <PdfWarning>
          Cable sizing depends on distance. Voltage drop over long runs may require upsizing wire gauge — consult NEC tables.
        </PdfWarning>
      </PdfSection>

      {/* Disclaimer */}
      <PdfSection title="Disclaimer">
        <Text style={{ fontSize: 8, color: '#9ca3af' }}>
          These are estimates for reference only. Final system design must be verified by a licensed professional engineer. Sustainable Gaps is not responsible for equipment failures, safety incidents, or cost overruns resulting from the use of these calculations without professional engineering review.
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
