import { PdfDocument, PdfSection, PdfTable, PdfKeyValue, PdfWarning } from '../../components/pdf/PdfReportShell'
import { Text } from '@react-pdf/renderer'
import { SQRT3 } from '../../lib/constants'
import type { HybridWizardInputs, HybridWizardResults } from './scenario.formulas'
import { buildHybridProjectPlan } from './hybridProjectPlan'
import { buildHybridOneLineDiagram, flattenDiagramRows } from './oneLineDiagram'

export interface HybridEnergyPdfDocProps {
  inputs: HybridWizardInputs
  results: HybridWizardResults
  clientName?: string
  projectName?: string
  zones?: {id: string, name: string, kw: number}[]
}

export function HybridEnergyPdfDoc({ inputs, results, clientName, projectName, zones }: HybridEnergyPdfDocProps) {
  const fi = (v: number) => Math.round(v).toLocaleString('en-US')
  const fc = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const fr = (v: number, unit: string) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: unit === 'gallon' ? 2 : 0, maximumFractionDigits: unit === 'gallon' ? 2 : 0 })
  const fv = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  const redundancyLabel = inputs.redundancy === '2n'
    ? '2N (Full Redundancy)'
    : inputs.redundancy === 'n1'
      ? 'N+1'
      : inputs.redundancy === 'field_verify'
        ? 'Field verify (N+1 planning basis)'
        : 'N (No Redundancy)'
  const coverageStatusLabel = {
    '24_7_ready': 'Modeled 24/7 capacity',
    conditional: 'Conditional',
    not_feasible: 'Not feasible',
  } as const
  const diagram = buildHybridOneLineDiagram(inputs, results, zones ?? [])
  const projectPlan = buildHybridProjectPlan(inputs, results, zones ?? [])
  const difference = (value: number, unit = '') => `${fi(Math.abs(value))}${unit ? ` ${unit}` : ''} ${value >= 0 ? 'lower' : 'higher'}`

  return (
    <PdfDocument title="EMaaS Hybrid Energy Report" clientName={clientName} projectName={projectName}>
      {/* Project Overview */}
      <PdfSection title="Project Overview">
        {clientName && <PdfKeyValue label="Client" value={clientName} />}
        <PdfKeyValue label="Project Dates" value={`${inputs.startDate || 'N/A'} to ${inputs.endDate || 'N/A'} (${inputs.projectDurationDays} days)`} />
        <PdfKeyValue label="Operating Basis" value={`24/7 continuous service (${inputs.projectDurationDays * 24} scheduled hours)`} />
        <PdfKeyValue label="Diesel Fuel Assumption" value={`$${inputs.fuelCostPerGallon.toFixed(2)}/gal`} />
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
            ['Generator Units', `${results.genUnits} x ${results.genUnitSizeKw} kW (${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby)`],
            ['Total System Capacity', `${fi(results.totalCapacityKw)} kW`],
            ['Firm Generator Capacity', `${fi(results.generatorFirmCapacityKw)} kW`],
            ['BESS Energy Needed', `${fi(results.bessEnergyKwh)} kWh`],
            ['Generator Capacity', `${fi(results.genCapacityKw)} kW`],
            [`Peak Amps/Phase (3Φ ${inputs.siteVoltage}V)`, `${fi(results.peakAmpsPerPhase)} A${results.parallelRunsNeeded ? ' — PARALLEL RUNS NEEDED' : ''}`],
            [`Base Amps/Phase (3Φ ${inputs.siteVoltage}V)`, `${fi(results.baseAmpsPerPhase)} A`],
          ]}
        />
        {results.parallelRunsNeeded && (
          <PdfWarning>
            {`${fi(results.peakAmpsPerPhase)}A per phase — ${Math.ceil(results.peakAmpsPerPhase / 400)} legs per phase required (generator power cable rated 400A per leg).`}
          </PdfWarning>
        )}
      </PdfSection>

      <PdfSection title="24/7 Hybrid Coverage Scenarios">
        <PdfTable
          headers={['Metric', 'Value']}
          rows={[
            ['Installed BESS', `${fi(results.coverage.bessInstalledKw)} kW / ${fi(results.coverage.bessInstalledKwh)} kWh`],
            ['Usable BESS Energy', `${fi(results.coverage.bessUsableKwh)} kWh`],
            ['Generator Online Capacity', `${fi(results.coverage.generatorOnlineKw)} kW`],
            ['Generator Recharge Reserve', `${fi(results.coverage.generatorRechargeReserveKw)} kW`],
            ['Base Battery Runtime', `${fv(results.coverage.baseBatteryHours)} hours`],
            ['Estimated Full Recharge Window', results.coverage.estimatedRechargeHours === null ? 'No recharge reserve' : `${fv(results.coverage.estimatedRechargeHours)} hours`],
          ]}
        />
        <PdfTable
          headers={['Scenario', 'Status', 'Coverage Logic', 'Requirement']}
          rows={results.coverage.scenarios.map((scenario) => [
            scenario.label,
            coverageStatusLabel[scenario.status],
            `${scenario.dispatch} ${scenario.coverage}`,
            scenario.requirement,
          ])}
        />
        <PdfWarning>
          24/7 coverage assumes fuel logistics, service access, ATS or parallel gear, verified charge windows, SOC start thresholds, inverter sync, and remote monitoring. Final design requires field verification.
        </PdfWarning>
      </PdfSection>

      <PdfSection title="Reconciled Equipment Package">
        <PdfTable
          headers={['ID', 'Equipment', 'Rating', 'Estimated Dimensions']}
          rows={projectPlan.equipment.map((item) => [item.id, item.label, item.detail, `${item.lengthFt} x ${item.widthFt} x ${item.heightFt} ft`])}
        />
        <PdfWarning>
          {`Conceptual ${projectPlan.siteLengthFt} x ${projectPlan.siteWidthFt} ft site envelope: ${projectPlan.layoutFits ? 'package fits the entered envelope' : 'package has an envelope conflict'}. Verify delivered dimensions, clearances, access, fire separation, soil bearing, and cable paths.`}
        </PdfWarning>
      </PdfSection>

      <PdfSection title="One-Line Diagram">
        <Text style={{ fontSize: 8, color: '#C5C6C7', marginBottom: 6 }}>
          {diagram.caption}
        </Text>
        <PdfTable
          headers={['Stage', 'Element', 'Detail']}
          rows={flattenDiagramRows(diagram)}
        />
        <Text style={{ fontSize: 7, color: '#5B6673', marginTop: 6, fontFamily: 'Courier' }}>
          {diagram.mermaid}
        </Text>
      </PdfSection>

      <PdfSection title="Source and Branch Cable Schedule">
        <PdfTable
          headers={['Circuit', 'Load', 'A/Phase', 'Runs/Phase', '50-ft Pieces']}
          rows={projectPlan.cableSchedule.map((row) => [
            `${row.id} - ${row.circuit}`,
            `${fi(row.loadKw)} kW at ${row.voltage} V`,
            fi(row.ampsPerPhase),
            `${row.runsPerPhase}`,
            row.pieces === null ? `${row.pieceRange?.[0]}-${row.pieceRange?.[1]}` : `${row.pieces}`,
          ])}
        />
        <PdfWarning>{projectPlan.neutralExplanation}</PdfWarning>
      </PdfSection>

      <PdfSection title="Budgetary Estimate Basis">
        <PdfTable
          headers={['Item', 'Qty', 'Periods', 'Rate', 'Extended', 'Confirmation']}
          rows={projectPlan.quoteItems.map((item) => [
            `${item.description} (${item.modelSku})`,
            fv(item.quantity),
            fv(item.periods),
            item.rate > 0 ? `${fr(item.rate, item.rateUnit)}/${item.rateUnit}` : 'TBD',
            item.total > 0 ? fc(item.total) : 'TBD',
            item.confirmation === 'entered_rate' ? 'Entered rate' : 'Vendor required',
          ])}
        />
        <PdfKeyValue label="Known-rate subtotal" value={fc(projectPlan.budgetaryTotal)} />
        <PdfWarning>Equipment periods are prorated for this planning comparison. Confirm provider minimums, overtime, partial-cycle billing, delivery, labor, taxes, availability, cable ampacity, protection, and final model/SKU. Zero-rate lines are unresolved vendor scope, not free equipment.</PdfWarning>
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
              'Review required',
              ma.reason,
            ])}
          />
        </PdfSection>
      )}

      {/* Financial Comparison */}
      <PdfSection title="Financial Comparison">
        <PdfTable
          headers={['Metric', 'All Generator', 'Hybrid', 'Difference vs All-Gen']}
          rows={[
            ['Daily Fuel', `${fi(results.allGenFuelPerDay)} gal`, `${fi(results.hybridFuelPerDay)} gal`, difference(results.dailyFuelReduction, 'gal/day')],
            [`${inputs.projectDurationDays}-Day Fuel`, `${fi(results.allGenFuelProject)} gal`, `${fi(results.hybridFuelTotal)} gal`, difference(results.totalFuelSavingsGal, 'gal')],
            [`${inputs.projectDurationDays}-Day Total Cost`, fc(results.allGenCostProject), fc(results.hybridCostProject), `${fc(Math.abs(results.costDifferenceProject))} ${results.costDifferenceProject >= 0 ? 'lower' : 'higher'}`],
            ['Project Fuel Difference', '-', `${fi(Math.abs(results.totalFuelSavingsGal))} gal`, `${fc(Math.abs(results.totalFuelSavingsDollars))} ${results.totalFuelSavingsDollars >= 0 ? 'lower' : 'higher'}`],
            ['CO2 Difference', '--', `${fi(Math.abs(results.co2AvoidedLbs))} lbs`, results.co2AvoidedLbs >= 0 ? 'lower' : 'higher'],
          ]}
        />
      </PdfSection>

      {/* Fuel projection for the entered project window */}
      <PdfSection title={`Fuel Projection (${inputs.projectDurationDays} Days)`}>
        <Text style={{ fontSize: 8, color: '#C5C6C7', marginBottom: 4 }}>
          Daily fuel consumption comparison and cumulative all-generator minus hybrid difference over the project. Negative values mean the hybrid case uses more fuel after recharge losses.
        </Text>
        <PdfTable
          headers={['Day', 'Date', 'All-Gen (gal)', 'Hybrid (gal)', 'All-Gen Minus Hybrid (gal)']}
          rows={results.dailyFuelData.map((d) => [
            `${d.day}`,
            d.date,
            fi(d.allGenGal),
            fi(d.hybridGal),
            fi(d.cumulativeSavingsGal),
          ])}
        />
      </PdfSection>

      {/* Power Zone Breakdown */}
      {zones && zones.length > 0 && (
        <PdfSection title="Power Zone Breakdown">
          <PdfTable
            headers={['Zone Name', 'kW', `Amps/Phase (${inputs.loadVoltage ?? inputs.siteVoltage}V)`, 'Legs/Phase']}
            rows={zones.map((z) => {
              const branchVoltage = inputs.loadVoltage ?? inputs.siteVoltage
              const ampsPerPhase = (z.kw * 1000) / (SQRT3 * branchVoltage * (inputs.powerFactor ?? 0.8))
              const legs = Math.ceil(ampsPerPhase / 400)
              return [z.name, fi(z.kw), fi(ampsPerPhase), `${legs}`]
            })}
          />
        </PdfSection>
      )}

      {/* Distribution Notes */}
      <PdfSection title="Distribution Notes">
        <PdfWarning>
          {inputs.siteVoltage === (inputs.loadVoltage ?? inputs.siteVoltage)
            ? `Source and load voltage are both ${inputs.siteVoltage} V; no step-down transformer is shown in this planning package.`
            : `The planning package includes transformation from ${inputs.siteVoltage} V to ${inputs.loadVoltage ?? inputs.siteVoltage} V. Confirm the delivered transformer, grounding, and protection with the engineer and vendor.`}
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
        <Text style={{ fontSize: 8, color: '#C5C6C7' }}>
          These are estimates for reference only. Final system design must be verified by a licensed professional engineer. Sustainable Gaps is not responsible for equipment failures, safety incidents, or cost overruns resulting from the use of these calculations without professional engineering review.
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
