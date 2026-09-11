import { StyleSheet, Text, View } from '@react-pdf/renderer'
import { PdfDocument, PdfKeyValue, PdfSection, PdfTable, PdfWarning } from '../../components/pdf/PdfReportShell'
import type { FieldVerificationReview } from './fieldRiskReview'
import type { TempPowerPlanningInputs, TempPowerPlanningResults } from './scenario.formulas'
import {
  panelSizingExplanation,
  rentalPeriodLabel,
  runtimeScheduleLabel,
  sizingTradeoffs,
} from './tempPowerPresentation'
import { verifyTempPowerPlanningBrief } from './tempPowerVerification'

export interface TempPowerPdfDocProps {
  inputs: TempPowerPlanningInputs
  results: TempPowerPlanningResults
  riskReview?: FieldVerificationReview
  clientName?: string
  projectName?: string
  isWorkedExample?: boolean
}

const styles = StyleSheet.create({
  draftBanner: {
    borderWidth: 1,
    borderColor: '#c89a3c',
    backgroundColor: '#44300a',
    borderRadius: 5,
    padding: 9,
    marginBottom: 12,
  },
  draftTitle: {
    color: '#e8c66a',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  draftBody: {
    color: '#d1d5db',
    fontSize: 8,
    lineHeight: 1.4,
    marginTop: 4,
  },
  conclusion: {
    borderWidth: 1,
    borderColor: '#3f6f8f',
    backgroundColor: '#172936',
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
  },
  conclusionTitle: {
    color: '#8ec5e8',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 4,
  },
  body: {
    color: '#d1d5db',
    fontSize: 8.5,
    lineHeight: 1.45,
  },
  note: {
    color: '#9ca3af',
    fontSize: 7.5,
    lineHeight: 1.4,
    marginTop: 5,
  },
})

export function TempPowerPdfDoc({
  inputs,
  results,
  riskReview,
  clientName,
  projectName,
  isWorkedExample = false,
}: TempPowerPdfDocProps) {
  const fv = (value: number, digits = 1) => value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  const fi = (value: number) => Math.round(value).toLocaleString('en-US')
  const includeCooling = inputs.includeCooling !== false
  const siteVoltage = inputs.siteVoltage ?? 480
  const loadVoltage = inputs.loadVoltage ?? siteVoltage
  const openChecks = riskReview?.rfis.length ?? 0
  const scheduleLabel = runtimeScheduleLabel(inputs.runtimeSchedule)
  const rentalTerm = rentalPeriodLabel(
    inputs.rentalPeriod ?? 'daily',
    inputs.rentalPeriodCount ?? Math.max(1, results.rentalDays),
  )
  const continuityIntent = inputs.continuityTarget === 'n_plus_1'
    ? 'Generator redundancy'
    : 'Support the entered load'
  const voltageIntent = siteVoltage === loadVoltage
    ? `${loadVoltage} V source / ${loadVoltage} V load`
    : `${siteVoltage} V source to ${loadVoltage} V load; transformer review required`
  const facilityRows = inputs.mode === 'basecamp'
    ? inputs.facilities.map((facility) => [
        `${facility.label} x ${facility.quantity}`,
        `${fv(facility.quantity * facility.kwPerUnit)} kW`,
        facility.loadBasisType === 'published-service'
          ? `Manufacturer context${facility.sourceLabel ? ` - ${facility.sourceLabel}` : ''}; load entered separately`
          : facility.loadBasisType === 'planning-estimate'
            ? `Editable planning estimate${facility.sourceLabel ? ` - ${facility.sourceLabel}` : ''}`
            : 'Worked example or user-entered value',
      ])
    : []
  const calculationVerification = verifyTempPowerPlanningBrief(inputs, results)

  return (
    <PdfDocument
      title="EMaaS Temporary Power Planning Brief - Draft"
      clientName={clientName}
      projectName={projectName}
    >
      <PdfSection title="Temporary Power Planning Brief">
        <View style={styles.draftBanner}>
          <Text style={styles.draftTitle}>{isWorkedExample ? 'Worked Example - Draft' : 'Draft - Not an Equipment Release'}</Text>
          <Text style={styles.draftBody}>
            This brief organizes the entered demand and operating requirements. It does not select equipment, confirm outage coverage, or replace project-specific technical review.
          </Text>
        </View>

        <View style={styles.conclusion}>
          <Text style={styles.conclusionTitle}>Planning conclusion</Text>
          <Text style={styles.body}>
            The current inputs document {fv(results.totalWithCoolingKw)} kW of entered planning load across {fi(results.operatingHours)} scheduled coverage hours. Actual runtime and load behavior remain subject to field confirmation. Equipment quantity, power-source setup, transformer need, controls, protection, cabling, and placement remain pending verification.
          </Text>
        </View>

        <PdfTable
          headers={['Planning Item', 'Current Basis', 'What It Means']}
          rows={[
            ['Connected equipment', `${fv(results.totalLoadKw)} kW`, 'Demand entered for facilities and equipment'],
            ...(includeCooling
              ? [['Cooling equipment', `${fv(results.coolingKw)} electrical kW`, 'Entered equipment demand; thermal tons are not converted into electrical load']]
              : []),
            ['Entered planning load', `${fv(results.totalWithCoolingKw)} kW`, includeCooling ? 'Connected equipment plus entered cooling demand' : 'Same as connected load; cooling is not included'],
            ['Field allowance', 'Pending field verification', 'Open field items remain visible for review'],
            ['Voltage need', voltageIntent, 'Final transformer and distribution needs remain subject to review'],
            ['Continuity intent', continuityIntent, inputs.continuityTarget === 'n_plus_1'
              ? 'A spare generator alone does not protect the controls and distribution between the source and the load'
              : 'No spare source has been assumed'],
            ['Rental / schedule', `${rentalTerm} / ${fi(results.operatingHours)} scheduled hr`, `${scheduleLabel}; actual runtime must be confirmed`],
            ['Verification status', `${openChecks} open item${openChecks === 1 ? '' : 's'}`, 'Resolve before selecting equipment'],
            ['Calculation check', calculationVerification.passed ? 'Passed' : 'Needs attention', `${calculationVerification.passedCount} of ${calculationVerification.checkedCount} internal arithmetic checks agree; this is not technical approval`],
          ]}
        />
      </PdfSection>

      <PdfSection title="Customer Conversation Guide">
        <Text style={styles.body}>
          Use this brief to confirm the need before discussing a fleet package. The useful result is a shared understanding of demand, operating schedule, voltage, continuity, and the information still missing.
        </Text>
        <PdfTable
          headers={['Step', 'Explain', 'Confirm']}
          rows={[
            ['1. Demand', `${fv(results.totalWithCoolingKw)} kW has been entered as the current planning load.`, 'Which nameplates, schedules, or site conditions could change it?'],
            ['2. Runtime', `${fi(results.operatingHours)} scheduled hours are covered across ${rentalTerm.toLowerCase()}.`, 'Will the equipment run continuously, by shift, or only during selected periods?'],
            ['3. Voltage', voltageIntent, 'What voltage and phase are available, and what voltage do the loads require?'],
            ['4. Continuity', continuityIntent, 'Which loads must continue through maintenance or a source outage?'],
            ['5. Next review', `${openChecks} item${openChecks === 1 ? '' : 's'} remain open.`, 'Who can verify the remaining field and electrical information?'],
          ]}
        />
      </PdfSection>

      <View break wrap={false}>
        <PdfSection title="Why the Breaker Panel Does Not Set Source Size">
          <Text style={styles.body}>{panelSizingExplanation}</Text>
          <PdfWarning>{sizingTradeoffs.oversized}</PdfWarning>
          <PdfWarning>{sizingTradeoffs.undersized}</PdfWarning>
        </PdfSection>
      </View>

      <View>
        {facilityRows.length > 0 && (
          <PdfSection title="Facility Load Schedule">
            <PdfTable
              headers={['Facility', 'Entered Load', 'Basis']}
              rows={[
                ...facilityRows,
                ['Total connected equipment', `${fv(results.totalLoadKw)} kW`, 'Sum of the listed facility rows'],
              ]}
            />
          </PdfSection>
        )}

        {riskReview && (
          <PdfSection title="Field Verification">
            <PdfTable
              headers={['Field Condition', 'Current Status', 'Why It Matters']}
              rows={riskReview.items.map((item) => [item.label, item.status, item.impact])}
            />
          </PdfSection>
        )}

        {riskReview && riskReview.rfis.length > 0 && (
          <PdfSection title="Open Questions">
            <PdfTable
              headers={['Questions to Confirm']}
              rows={riskReview.rfis.map((rfi) => [rfi])}
            />
          </PdfSection>
        )}
      </View>

      <View break>
        <PdfSection title="Project Inputs and Operating Assumptions">
          <PdfKeyValue label="Sizing Mode" value={inputs.mode === 'single' ? 'Single Load' : 'Base Camp / Multi-Facility'} />
          <PdfKeyValue label="Temporary Cooling" value={includeCooling ? `${fv(results.coolingKw)} electrical kW entered` : 'Not included'} />
          <PdfKeyValue label="Rental Term" value={`${rentalTerm} (${fi(results.rentalDays)} calendar days)`} />
          <PdfKeyValue label="Operating Schedule" value={`${scheduleLabel} (${fi(results.dailyRuntimeHours)} hours/day)`} />
          <PdfKeyValue label="Scheduled Coverage" value={`${fi(results.operatingHours)} hours; actual runtime not yet verified`} />
          <PdfKeyValue label="Source / Load Voltage" value={`${siteVoltage} V / ${loadVoltage} V`} />
          <PdfKeyValue label="Continuity Intent" value={continuityIntent} />
          <PdfKeyValue label="Equipment Package" value="Pending project-specific verification" />
        </PdfSection>

        <PdfSection title="Before Equipment Selection">
          <PdfWarning>Confirm delivered equipment nameplates, duty cycle, motor and compressor starting behavior, voltage, phase, and cable distance.</PdfWarning>
          <PdfWarning>Define which loads must remain supported during maintenance or a source outage. A spare source alone does not protect every control and distribution component.</PdfWarning>
          <PdfWarning>Review transformer needs, controls, protection, conductors, grounding and bonding, available fault current, selective coordination, access, and placement.</PdfWarning>
        </PdfSection>

        <PdfSection title="What This Brief Does Not Decide">
          <Text style={styles.body}>
            This draft does not provide an equipment count, transformer bank, technical one-line, fuel total, or release schedule because those decisions require the remaining project-specific information.
          </Text>
          <Text style={styles.note}>
            After the open information is verified, a qualified reviewer can use this brief to begin project-specific equipment and electrical decisions.
          </Text>
        </PdfSection>
      </View>
    </PdfDocument>
  )
}
