import { PdfDocument, PdfSection, PdfTable, PdfKeyValue, PdfWarning } from '../../components/pdf/PdfReportShell'
import { Text } from '@react-pdf/renderer'
import { SQRT3 } from '../../lib/constants'
import { BESS_FLEET } from '../../lib/equipmentRecommendations'
import type { HybridWizardInputs, HybridWizardResults } from './scenario.formulas'
import { buildHybridProjectPlan } from './hybridProjectPlan'
import { buildHybridOneLineDiagram, flattenDiagramRows } from './oneLineDiagram'
import { reviewHybridBenchmark } from './hybridBenchmark'

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
  const benchmarkReview = reviewHybridBenchmark(inputs, results)
  const selectedBess = BESS_FLEET.find((unit) => unit.kw === inputs.bessUnitSize)
  const bessOptionComparison = BESS_FLEET.map((unit) => {
    const continuousKw = unit.continuousKw ?? unit.kw
    const units = Math.max(1, Math.ceil(inputs.baseLoadKw / continuousKw))
    return {
      label: unit.label,
      continuousKw,
      units,
      installedKw: units * continuousKw,
      selected: unit.kw === inputs.bessUnitSize,
    }
  })
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
        <PdfKeyValue label="BESS Unit Continuous Rating" value={`${fi(results.bessUnitContinuousKw)} kW`} />
        <PdfKeyValue label="BESS Unit Usable Energy" value={`${fi(results.bessUnitUsableKwh)} kWh`} />
        <PdfKeyValue label="Altitude" value={`${fi(inputs.altitude)} ft ASL`} />
        <PdfKeyValue label="Ambient Temperature" value={`${inputs.ambientTemp} °F`} />
      </PdfSection>

      {/* System Configuration */}
      <PdfSection title="System Configuration">
        <PdfTable
          headers={['Parameter', 'Value']}
          rows={[
            ['BESS Units', `${results.bessUnits} x ${fi(results.bessUnitContinuousKw)} kW continuous (${results.bessRequiredUnits} duty + ${results.bessStandbyUnits} standby)`],
            ['Continuous-load BESS minimum', `${results.bessUnitsForContinuousLoad} unit(s)`],
            ['Recharge input per BESS', `${fv(results.bessUnitChargeKw)} kW (${results.bessChargeBasis === 'published' ? 'published' : 'planning assumption - verify'})`],
            ['Generator Units', `${results.genUnits} x ${results.genUnitSizeKw} kW (${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby)`],
            ['Protected Customer Peak', `${fi(results.protectedPeakLoadKw)} kW`],
            ['Firm Generator Capacity', `${fi(results.generatorFirmCapacityKw)} kW`],
            ['Energy in 80%-to-30% Dispatch Band', `${fi(results.bessEnergyKwh)} kWh`],
            ['Generator Capacity', `${fi(results.genCapacityKw)} kW`],
            [`Peak Amps/Phase (3Φ ${inputs.siteVoltage}V)`, `${fi(results.peakAmpsPerPhase)} A${results.parallelRunsNeeded ? ' — PARALLEL RUNS NEEDED' : ''}`],
            [`Base Amps/Phase (3Φ ${inputs.siteVoltage}V)`, `${fi(results.baseAmpsPerPhase)} A`],
          ]}
        />
        <PdfWarning>
          {`${fi(inputs.baseLoadKw)} kW continuous load / ${fv(results.bessUnitContinuousKw)} kW continuous per BESS = ${results.bessUnitsForContinuousLoad} unit(s). The ${fi(inputs.peakLoadKw)} kW customer peak starts/parallels the generator plant; generator and BESS nameplates are not added together as project demand.${selectedBess?.peakKw ? ` ${selectedBess.peakKw} kW is time-limited.` : ''}${selectedBess?.fieldNote ? ` Field note: ${selectedBess.fieldNote}` : ''}`}
        </PdfWarning>
        <PdfWarning>A BESS has no operator-usable red zone. Continuous power governs this estimate; motor starting, protection, transformers, and load-bank methods remain later vendor/engineering verification.</PdfWarning>
        {results.motorAssignments.length > 0 && <PdfWarning>Motor-start entries are informational handoff notes only. They do not change this continuous-power planning quantity; final starting and protection methods require vendor/engineering verification.</PdfWarning>}
        {results.parallelRunsNeeded && (
          <PdfWarning>
            {`${fi(results.peakAmpsPerPhase)}A per phase — ${Math.ceil(Math.round(results.peakAmpsPerPhase) / 400)} legs per phase required (generator power cable rated 400A per leg).`}
          </PdfWarning>
        )}
      </PdfSection>

      <PdfSection title="BESS Option Comparison — Continuous Output Basis">
        <PdfTable
          headers={['Model', 'Continuous / Unit', 'Units for Base Load', 'Installed Continuous', 'Quote Status']}
          rows={bessOptionComparison.map((option) => [
            option.label,
            `${fv(option.continuousKw)} kW`,
            `${option.units}`,
            `${fi(option.installedKw)} kW`,
            option.selected ? 'Selected inventory basis' : 'Evaluated alternative',
          ])}
        />
        <PdfWarning>All five EMaaS Pro dropdown models were compared using continuous output. The selected row controls the quote and must match the supplying rental house; time-limited peak labels are not used to reduce unit count.</PdfWarning>
      </PdfSection>

      <PdfSection title="Benchmark Architecture Review">
        <PdfKeyValue label="Load Basis" value={benchmarkReview.loadBasisLabel} />
        <PdfKeyValue label="Architecture Status" value={benchmarkReview.architectureLabel} />
        <PdfKeyValue label="Firm Capacity After One Generator Unavailable" value={`${fi(benchmarkReview.firmCapacityAfterOneUnavailableKw)} kW`} />
        <PdfKeyValue label="Headroom Above Protected Peak" value={`${benchmarkReview.protectedLoadHeadroomKw >= 0 ? '+' : '-'}${fi(Math.abs(benchmarkReview.protectedLoadHeadroomKw))} kW`} />
        <PdfTable
          headers={['Required Benchmark Check', 'Report Basis']}
          rows={benchmarkReview.checks.map((check, index) => [`${index + 1}`, check])}
        />
        {benchmarkReview.warnings.map((warning) => <PdfWarning key={warning}>{`RED FLAG: ${warning}`}</PdfWarning>)}
      </PdfSection>

      <PdfSection title="24/7 Hybrid Operating Sequence">
        <PdfTable
          headers={['Metric', 'Value']}
          rows={[
            ['Installed BESS', `${fi(results.coverage.bessInstalledKw)} kW continuous / ${fi(results.coverage.bessInstalledKwh)} kWh usable capacity`],
            ['80%-to-30% Dispatch Energy', `${fi(results.coverage.bessUsableKwh)} kWh`],
            ['Generator Online Capacity', `${fi(results.coverage.generatorOnlineKw)} kW`],
            ['Generator Recharge Reserve', `${fi(results.coverage.generatorRechargeReserveKw)} kW`],
            ['Modeled Recharge Power', `${fi(results.rechargePowerKw)} kW`],
            ['Average Customer Load', `${fi(results.averageLoadKw)} kW`],
            ['Battery-Only Runtime / Cycle', `${fv(results.batteryRuntimeHoursPerCycle)} hours`],
            ['Generator Runtime / Cycle', `${fv(results.generatorRuntimeHoursPerCycle)} hours`],
            ['Generator Runtime / Day', `${fv(results.generatorRuntimeHoursPerDay)} hours`],
            ['Modeled Cycles / Day', fv(results.cyclesPerDay)],
            ['Estimated 30%-to-80% Recharge Window', results.coverage.estimatedRechargeHours === null ? 'No recharge reserve' : `${fv(results.coverage.estimatedRechargeHours)} hours`],
          ]}
        />
        <PdfTable
          headers={['Scenario', 'Status', 'Coverage Logic', 'Requirement']}
          rows={results.coverage.scenarios.filter((scenario) => inputs.redundancy !== 'n' || !scenario.label.includes('fallback')).map((scenario) => [
            scenario.label,
            coverageStatusLabel[scenario.status],
            `${scenario.dispatch} ${scenario.coverage}`,
            scenario.requirement,
          ])}
        />
        <PdfWarning>
          Battery-only operation burns no fuel. The modeled EMS starts the generator at 30% SOC, carries the customer load while fast-charging the BESS, signals shutdown at 80% SOC, and returns the load to BESS. Verify manufacturer continuous charge/discharge limits, ATS or paralleling controls, fuel logistics, service access, inverter sync, and remote monitoring before final design.
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
        <PdfWarning>The planning report shows the reviewed equipment path only. Editable Mermaid source remains inside EMaaS Pro for engineering handoff and is intentionally excluded from exported reports.</PdfWarning>
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

      {/* Optional motor notes */}
      {results.motorAssignments.length > 0 && (
        <PdfSection title="Motor / Compressor Notes">
          <PdfTable
            headers={['HP', 'Start Method', 'Estimated LRA (A)', 'Assignment', 'Boundary']}
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
            [`${inputs.projectDurationDays}-Day Fuel`, `${fi(results.allGenFuelProject)} gal`, `${fi(results.hybridFuelTotal)} gal`, difference(results.totalFuelReductionGal, 'gal')],
            [`${inputs.projectDurationDays}-Day Known-Rate Cost (Fuel Only)`, fc(results.allGenCostProject), fc(results.hybridCostProject), `${fc(Math.abs(results.costDifferenceProject))} ${results.costDifferenceProject >= 0 ? 'lower' : 'higher'}`],
            ['Project Fuel Reduction / Increase', '-', `${fi(Math.abs(results.totalFuelReductionGal))} gal ${results.totalFuelReductionGal >= 0 ? 'reduction' : 'increase'}`, `${fc(Math.abs(results.totalFuelCostDifferenceDollars))} ${results.totalFuelCostDifferenceDollars >= 0 ? 'lower' : 'higher'}`],
            ['CO2 Difference', '--', `${fi(Math.abs(results.co2AvoidedLbs))} lbs`, results.co2AvoidedLbs >= 0 ? 'lower' : 'higher'],
          ]}
        />
      </PdfSection>

      {/* Power Zone Breakdown */}
      {zones && zones.length > 0 && (
        <PdfSection title="Power Zone Breakdown">
          <PdfTable
            headers={['Zone Name', 'kW', `${inputs.loadPhase === 'single' ? 'Branch Amps' : 'Amps/Phase'} (${inputs.loadVoltage ?? inputs.siteVoltage}V)`, inputs.loadPhase === 'single' ? 'Parallel Runs' : 'Legs/Phase']}
            rows={zones.map((z) => {
              const branchVoltage = inputs.loadVoltage ?? inputs.siteVoltage
              const ampsPerPhase = (z.kw * 1000) / ((inputs.loadPhase === 'single' ? 1 : SQRT3) * branchVoltage * (inputs.powerFactor ?? 0.8))
              const legs = Math.ceil(Math.round(ampsPerPhase) / 400)
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
        {inputs.redundancy !== 'n' && (
          <PdfWarning>
            N+1/2N redundancy requires Automatic Transfer Switch(es) — include in your equipment order.
          </PdfWarning>
        )}
        {inputs.loadPhase === 'single' && (
          <PdfWarning>
            The ten 240 V single-phase trailer feeders are shown as equal planning allocations because individual trailer nameplates were not provided. Balance the feeders across the three-phase source and verify each branch rating, transformer secondary, neutral, and overcurrent protection before release.
          </PdfWarning>
        )}
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
