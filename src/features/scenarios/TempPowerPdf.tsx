import { PdfDocument, PdfSection, PdfTable, PdfKeyValue, PdfWarning } from '../../components/pdf/PdfReportShell'
import { Text } from '@react-pdf/renderer'
import type { TempPowerInputs, TempPowerResults } from './scenario.formulas'

export interface TempPowerPdfDocProps {
  inputs: TempPowerInputs
  results: TempPowerResults
  clientName?: string
  projectName?: string
}

export function TempPowerPdfDoc({ inputs, results, clientName, projectName }: TempPowerPdfDocProps) {
  const fv = (v: number, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fi = (v: number) => Math.round(v).toLocaleString('en-US')

  return (
    <PdfDocument title="Temporary Power & Cooling Report" clientName={clientName} projectName={projectName}>
      {/* Project Overview */}
      <PdfSection title="Project Overview">
        <PdfKeyValue label="Sizing Mode" value={inputs.mode === 'single' ? 'Single Load' : 'Base Camp / Multi-Facility'} />
        <PdfKeyValue label="Ambient Temperature" value={`${inputs.ambientTemp} °F`} />
        <PdfKeyValue label="Target Temperature" value={`${inputs.targetTemp} °F`} />
        <PdfKeyValue label="Duration" value={`${fi(inputs.durationHours)} hours (${fv(inputs.durationHours / 24, 0)} days)`} />
        <PdfKeyValue label="Altitude" value={`${fi(inputs.altitude)} ft ASL`} />
        <PdfKeyValue label="Power Factor" value={`${inputs.powerFactor}`} />
      </PdfSection>

      {/* Facility Breakdown */}
      {inputs.mode === 'basecamp' && results.facilityBreakdown.length > 0 && (
        <PdfSection title="Facility Breakdown">
          <PdfTable
            headers={['Facility', 'Load (kW)']}
            rows={[
              ...results.facilityBreakdown.map((f) => [f.label, `${fv(f.kw)} kW`]),
              ['Total Equipment Load', `${fv(results.totalLoadKw)} kW`],
            ]}
          />
        </PdfSection>
      )}

      {/* Equipment Sizing */}
      <PdfSection title="Equipment Sizing">
        <PdfTable
          headers={['Equipment', 'Size', 'Unit', 'Safety Margin Applied']}
          rows={[
            ['Generator Size', fi(results.generatorKva), 'kVA', 'Yes (1.25x)'],
            ['Generator Size', fi(results.generatorKw), 'kW', 'Yes (1.25x)'],
            ['Amps per Phase (3Φ 480V)', fi(results.ampsPerPhase), 'A', results.parallelRunsNeeded ? 'PARALLEL RUNS NEEDED' : '—'],
            ['Cooling Tonnage', fv(results.coolingTons), 'tons', 'Yes (1.15x)'],
            ['Fuel Rate', fv(results.fuelGallonsPerHour), 'gal/hr', 'No'],
            ['Total Fuel', fi(results.totalFuelGallons), 'gallons', 'Yes (1.10x contingency)'],
          ]}
        />
        {results.parallelRunsNeeded && (
          <PdfWarning>
            {`${fi(results.ampsPerPhase)}A per phase — ${Math.ceil(results.ampsPerPhase / 400)} legs per phase required (generator power cable rated 400A per leg).`}
          </PdfWarning>
        )}
        {results.altitudeDerating > 1 && (
          <PdfWarning>
            {`Altitude derating applied: ${fv((results.altitudeDerating - 1) * 100)}% increase in fuel consumption at ${fi(inputs.altitude)} ft`}
          </PdfWarning>
        )}
      </PdfSection>

      {/* Hybrid Recommendation */}
      {results.hybrid && (
        <PdfSection title="Hybrid Recommendation">
          <Text style={{ fontSize: 9, color: '#9ca3af', marginBottom: 6 }}>
            {results.hybrid.reason}
          </Text>
          <PdfTable
            headers={['Metric', 'All Generator', 'Hybrid (Gen + BESS)']}
            rows={[
              ['Generator Units', `${results.hybrid.allGen.genUnits}`, `${results.hybrid.hybrid.genUnits}`],
              ['BESS Units', '0', `${results.hybrid.hybrid.bessUnits} x ${results.hybrid.hybrid.bessUnitSize} kW`],
              ['Daily Fuel', `${fi(results.hybrid.allGen.fuelPerDay)} gal`, `${fi(results.hybrid.hybrid.fuelPerDay)} gal`],
              ['30-Day Fuel', `${fi(results.hybrid.allGen.fuel30Day)} gal`, `${fi(results.hybrid.hybrid.fuel30Day)} gal`],
              ['Fuel Savings', '--', `${fv(results.hybrid.hybrid.fuelSavingsPercent, 0)}%`],
              ['CO2 Avoided', '--', `${fi(results.co2AvoidedLbs)} lbs (${fv(results.co2AvoidedTons)} tons)`],
            ]}
          />
        </PdfSection>
      )}

      {/* Electrical Distribution Notes */}
      <PdfSection title="Electrical Distribution Notes">
        <PdfWarning>
          Your site needs step-down transformers for 480V to 240V to 120V distribution. Confirm with your electrician.
        </PdfWarning>
        <PdfWarning>
          Redundancy requires Automatic Transfer Switch(es) — include in your equipment order.
        </PdfWarning>
        <PdfWarning>
          Cable sizing depends on distance. Voltage drop over long runs may require upsizing wire gauge — consult NEC tables.
        </PdfWarning>
      </PdfSection>

      {/* Disclaimer */}
      <PdfSection title="Disclaimer">
        <Text style={{ fontSize: 8, color: '#9ca3af' }}>
          These are emergency estimates for reference only. Final sizing must be verified by a licensed professional engineer. Sustainable Gaps is not responsible for equipment failures, safety incidents, or cost overruns resulting from the use of these calculations without professional engineering review.
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
