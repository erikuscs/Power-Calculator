import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import { PdfDocument, PdfKeyValue, PdfSection, PdfTable, PdfWarning } from '../../components/pdf/PdfReportShell'
import type { TempPowerInputs, TempPowerResults } from './scenario.formulas'
import type { FieldRiskReview } from './fieldRiskReview'
import { recommendEquipment } from '../../lib/equipmentRecommendations'
import generatorSiteLayout3d from '../../assets/emaas-generator-site-layout-3d-pdf.jpg?inline'
import generatorCoolingSiteLayout3d from '../../assets/emaas-generator-cooling-site-layout-3d-pdf.jpg?inline'
import { TempPowerOneLinePdf } from './TempPowerOneLinePdf'
import {
  buildTempPowerPlainLanguageReason,
  compactEquipmentLabel,
  panelSizingExplanation,
  rentalPeriodLabel,
  runtimeScheduleLabel,
  sizingTradeoffs,
} from './tempPowerPresentation'

export interface TempPowerPdfDocProps {
  inputs: TempPowerInputs
  results: TempPowerResults
  riskReview?: FieldRiskReview
  clientName?: string
  projectName?: string
}

const styles = StyleSheet.create({
  confidence: {
    borderWidth: 1,
    borderColor: '#c89a3c',
    backgroundColor: '#44300a',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  confidenceTitle: {
    color: '#e8c66a',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  confidenceBody: {
    color: '#d1d5db',
    fontSize: 8,
    marginTop: 3,
  },
  packageLabel: {
    color: '#9ca3af',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  packageTitle: {
    color: '#f1f5f9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 17,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  packageMeta: {
    color: '#9ca3af',
    fontSize: 8,
    marginBottom: 10,
  },
  reasonBox: {
    borderWidth: 1,
    borderColor: '#6d5524',
    backgroundColor: '#242315',
    borderRadius: 5,
    padding: 9,
    marginBottom: 10,
  },
  reasonLabel: {
    color: '#e8c66a',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  body: {
    color: '#d1d5db',
    fontSize: 8.5,
    lineHeight: 1.45,
  },
  visual: {
    width: '100%',
    height: 292,
    objectFit: 'cover',
    borderRadius: 4,
  },
  caption: {
    color: '#9ca3af',
    fontSize: 7,
    lineHeight: 1.35,
    marginTop: 5,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#1f2535',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  optionTitle: {
    color: '#f1f5f9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 2,
  },
  optionMeta: {
    color: '#9ca3af',
    fontSize: 7.5,
    lineHeight: 1.35,
  },
})

export function TempPowerPdfDoc({ inputs, results, riskReview, clientName, projectName }: TempPowerPdfDocProps) {
  const fv = (v: number, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fi = (v: number) => Math.round(v).toLocaleString('en-US')
  const fc = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const siteVoltage = inputs.siteVoltage ?? 480
  const technicianCoverage =
    inputs.technicianCoverage === '24_7'
      ? '24/7 field technician'
      : inputs.technicianCoverage === 'none'
        ? 'None / customer managed'
        : 'Business hours'
  const equipmentRecommendation = recommendEquipment({
    peakKw: results.totalWithCoolingKw,
    baseKw: results.totalWithCoolingKw * 0.6,
    runtimeHours: results.dailyRuntimeHours,
    projectDurationHours: results.operatingHours,
    peakHoursPerDay: results.dailyRuntimeHours,
    powerFactor: inputs.powerFactor,
    siteVoltage: inputs.siteVoltage,
  })!

  const recommendation = { ...equipmentRecommendation, preferred: 'generator' as const }
  const preferred = recommendation.generator
  const includeCooling = inputs.includeCooling !== false
  const reason = buildTempPowerPlainLanguageReason(recommendation, includeCooling)
  const planningLoad = riskReview?.adjustedPlanningKw ?? results.totalWithCoolingKw
  const openChecks = riskReview?.rfis.length ?? 0
  const scheduleLabel = runtimeScheduleLabel(inputs.runtimeSchedule)
  const rentalTerm = rentalPeriodLabel(inputs.rentalPeriod ?? 'daily', inputs.rentalPeriodCount ?? Math.max(1, results.rentalDays))
  const siteLayout3d = includeCooling ? generatorCoolingSiteLayout3d : generatorSiteLayout3d
  const primaryRfis = riskReview?.rfis.slice(0, 4) ?? []
  const remainingRfis = riskReview?.rfis.slice(4) ?? []

  return (
    <PdfDocument title="EMaaS Recommended Energy Plan" clientName={clientName} projectName={projectName}>
      <PdfSection title="Recommended Energy Plan">
        <View style={styles.confidence}>
          <Text style={styles.confidenceTitle}>
            {riskReview ? `${riskReview.confidenceBand} confidence - ${riskReview.confidenceScore}/100` : 'Preliminary planning confidence'}
          </Text>
          <Text style={styles.confidenceBody}>
            {openChecks > 0
              ? `${openChecks} field checks remain open and can affect contingency or final equipment selection.`
              : 'Core field assumptions are confirmed. Final engineering checks still apply.'}
          </Text>
        </View>

        <Text style={styles.packageLabel}>Recommended Package</Text>
        <Text style={styles.packageTitle}>{compactEquipmentLabel(preferred.units)}</Text>
        <Text style={styles.packageMeta}>
          Standalone generator{includeCooling ? ' + temporary cooling add-on' : ' - power-only scope'} using rental-fleet planning classes
        </Text>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Why this solution fits</Text>
          <Text style={styles.body}>{reason}</Text>
        </View>

        <PdfTable
          headers={['Decision Item', 'Recommended Value', 'Planning Context']}
          rows={[
            ['Planning Load', `${fv(planningLoad)} kW`, `${fv(results.totalWithCoolingKw)} kW before field contingency`],
            ['Generator', `${fi(results.generatorKw)} kW / ${fi(results.generatorKva)} kVA`, 'Includes generator sizing margin'],
            ['Distribution', `${siteVoltage} V / ${fi(results.ampsPerPhase)} A per phase`, `${Math.max(1, Math.ceil(results.ampsPerPhase / 400))} cable leg(s) per phase`],
            ...(includeCooling ? [['Cooling Add-on', `${fv(results.coolingTons)} tons / ${fv(results.coolingKw)} kW`, 'Included only because temporary cooling was selected']] : []),
            ['Rental / Runtime', `${rentalTerm} / ${fi(results.operatingHours)} operating hours`, `${scheduleLabel}; ${fi(results.serviceEvents)} PM events`],
            ['Planning Footprint', `~${fi(preferred.footprintSqFt)} sq ft`, 'Before cable, fuel, and service clearances'],
          ]}
        />
      </PdfSection>

      <PdfSection title="Why the Breaker Panel Does Not Set Source Size">
        <Text style={styles.body}>{panelSizingExplanation}</Text>
        <PdfWarning>{sizingTradeoffs.oversized}</PdfWarning>
        <PdfWarning>{sizingTradeoffs.undersized}</PdfWarning>
      </PdfSection>

      <View break>
        <PdfSection title="3D Planning Mockup">
          <Image src={siteLayout3d} style={styles.visual} />
          <Text style={styles.caption}>
            {includeCooling ? 'Generator-led power with the selected temporary-cooling add-on.' : 'Generator-only power scope; cooling and battery equipment are not included.'} Conceptual placement only. Final clearances, access, cable routes, grounding, containment, fire protection, and maintenance zones require site verification.
          </Text>
        </PdfSection>
      </View>

      <View break>
        <PdfSection title="Electrical One-Line Drawing">
          <TempPowerOneLinePdf inputs={inputs} results={results} />
          <Text style={styles.caption}>
            Uses conventional one-line symbols and ANSI/IEEE-style device tags for planning review. This is not a stamped construction drawing.
          </Text>
        </PdfSection>
      </View>

      <PdfSection title="Calculation Detail">
        <PdfTable
          headers={['Calculation Group', 'Metric', 'Value']}
          rows={[
            ['Load', 'Connected equipment load', `${fv(results.totalLoadKw)} kW`],
            ...(includeCooling ? [['Cooling Add-on', 'Cooling electrical load', `${fv(results.coolingKw)} kW`]] : []),
            ['Load', 'Calculated operating load', `${fv(results.totalWithCoolingKw)} kW`],
            ['Load', 'Field risk contingency', `${fv(riskReview?.contingencyKw ?? 0)} kW`],
            ['Source and Distribution', 'Generator load factor', `${fv(results.loadFactor * 100)}%`],
            ['Source and Distribution', 'Power factor', `${inputs.powerFactor}`],
            ['Fuel and Runtime', 'Fuel rate', `${fv(results.fuelGallonsPerHour)} gal/hr`],
            ['Fuel and Runtime', 'Total fuel plan', `${fi(results.totalFuelGallons)} gal`],
            ['Fuel and Runtime', 'Rental duration', `${fi(results.rentalDays)} days`],
            ['Fuel and Runtime', 'Operating time', `${fi(results.operatingHours)} hours`],
            ['Fuel and Runtime', 'BSFC', `${fv(results.bsfcGalPerKwh, 3)} gal/kWh`],
            ['Service and Risk', 'Noise fine exposure', fc(results.noiseFineExposure)],
          ]}
        />
        {results.parallelRunsNeeded && (
          <PdfWarning>{`${fi(results.ampsPerPhase)} A per phase requires approximately ${Math.ceil(results.ampsPerPhase / 400)} cable legs per phase when using 400 A planning capacity per leg.`}</PdfWarning>
        )}
        {results.altitudeDerating > 1 && (
          <PdfWarning>{`Altitude derating adds approximately ${fv((results.altitudeDerating - 1) * 100)}% to modeled fuel consumption at ${fi(inputs.altitude)} ft.`}</PdfWarning>
        )}
      </PdfSection>

      {inputs.mode === 'basecamp' && results.facilityBreakdown.length > 0 && (
        <PdfSection title="Facility Load Schedule">
          <PdfTable
            headers={['Facility', 'Load']}
            rows={[
              ...results.facilityBreakdown.map((facility) => [facility.label, `${fv(facility.kw)} kW`]),
              ['Total Equipment Load', `${fv(results.totalLoadKw)} kW`],
            ]}
          />
        </PdfSection>
      )}

      <View break>
        <PdfSection title="Why This Generator Package Leads">
          <Text style={styles.body}>
            The standalone generator is selected from calculated demand, starting-load allowance, operating schedule, voltage, footprint, and field contingency. Cooling is treated as a separate downstream load and is included only when requested. Fleet classes are planning anchors, not final engineering selections.
          </Text>
          <View wrap={false} style={[styles.optionCard, { borderColor: '#c89a3c' }]}>
            <Text style={styles.optionTitle}>Standalone Generator - Recommended</Text>
            <Text style={styles.optionMeta}>{preferred.units}</Text>
            <Text style={styles.optionMeta}>{preferred.notes.join(' ')}</Text>
          </View>
        </PdfSection>
      </View>

      <PdfSection title="Selected Scope">
        <PdfKeyValue label="Primary Source" value="Standalone generator" />
        <PdfKeyValue label="Temporary Cooling" value={includeCooling ? `${fv(results.coolingTons)} tons included as an add-on` : 'Not included'} />
        <PdfKeyValue label="Battery / Hybrid Equipment" value="Not included in this temporary-power package" />
        <Text style={styles.caption}>Use the Hybrid EMaaS Strategy workflow when battery support, quiet operation, peak shaving, or generator cycling is part of the client requirement.</Text>
      </PdfSection>

      {riskReview && (
        <PdfSection title="Field Verification and Open Questions">
          <PdfTable
            headers={['Field Condition', 'Status', 'Sizing Effect']}
            rows={riskReview.items.map((item) => [item.label, item.status, item.impact])}
          />
          {primaryRfis.map((rfi) => <PdfWarning key={rfi}>{rfi}</PdfWarning>)}
        </PdfSection>
      )}

      {remainingRfis.length > 0 && (
        <View break>
          <PdfSection title="Remaining Field Questions">
            {remainingRfis.map((rfi) => <PdfWarning key={rfi}>{rfi}</PdfWarning>)}
          </PdfSection>
        </View>
      )}

      <PdfSection title="Project Inputs and Operating Assumptions">
        <PdfKeyValue label="Sizing Mode" value={inputs.mode === 'single' ? 'Single Load' : 'Base Camp / Multi-Facility'} />
        <PdfKeyValue label="Solution Scope" value={includeCooling ? 'Standalone generator + temporary cooling' : 'Standalone generator only'} />
        <PdfKeyValue label="Ambient / Target" value={includeCooling ? `${inputs.ambientTemp} F / ${inputs.targetTemp} F` : `${inputs.ambientTemp} F / cooling not included`} />
        <PdfKeyValue label="Rental Term" value={`${rentalTerm} (${fi(results.rentalDays)} calendar days)`} />
        <PdfKeyValue label="Operating Schedule" value={`${scheduleLabel} (${fi(results.dailyRuntimeHours)} hours/day)`} />
        <PdfKeyValue label="Calculated Runtime" value={`${fi(results.operatingHours)} operating hours`} />
        <PdfKeyValue label="Altitude" value={`${fi(inputs.altitude)} ft ASL`} />
        <PdfKeyValue label="Site Voltage / Power Factor" value={`${siteVoltage} V / ${inputs.powerFactor}`} />
        <PdfKeyValue label="PM Service Interval" value={`${fv(inputs.serviceIntervalDays ?? 10, 0)} days`} />
        <PdfKeyValue label="Technician Coverage" value={technicianCoverage} />
        <PdfKeyValue label="Containment" value={inputs.containmentRequired === false ? 'No - confirm site spec' : 'Yes - 110% contained'} />
      </PdfSection>

      <PdfSection title="Before Release">
        <PdfWarning>Verify voltage drop, OCPD ratings, conductor sizing, grounding and bonding, available fault current, protection settings, and selective coordination.</PdfWarning>
        <PdfWarning>{`Confirm step-down transformer placement for ${siteVoltage} V to 120/208 V distribution and validate final cable distances.`}</PdfWarning>
        <PdfWarning>Redundancy and transfer requirements must be reflected in the ATS, switchgear, controls, and equipment order.</PdfWarning>
      </PdfSection>

    </PdfDocument>
  )
}
