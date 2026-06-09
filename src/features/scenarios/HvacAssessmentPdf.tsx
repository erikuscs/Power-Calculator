import { Text } from '@react-pdf/renderer'
import { PdfDocument, PdfSection, PdfKeyValue, PdfWarning } from '../../components/pdf/PdfReportShell'
import type {
  CoolingInputs,
  CoolingResults,
  ChillerInputs,
  ChillerResults,
  AirsideTonnageInputs,
  AirsideTonnageResults,
} from '../hvac/hvac.formulas'

export interface HvacAssessmentPdfDocProps {
  coolingInputs: CoolingInputs
  coolingResults: CoolingResults | null
  chillerInputs: ChillerInputs
  chillerResults: ChillerResults | null
  airsideInputs: AirsideTonnageInputs
  airsideResults: AirsideTonnageResults | null
  clientName?: string
  projectName?: string
}

export function HvacAssessmentPdfDoc({
  coolingInputs,
  coolingResults,
  chillerInputs,
  chillerResults,
  airsideInputs,
  airsideResults,
  clientName,
  projectName,
}: HvacAssessmentPdfDocProps) {
  const fv = (v: number, d = 1) =>
    v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fi = (v: number) => Math.round(v).toLocaleString('en-US')

  return (
    <PdfDocument title="HVAC Load Assessment Report" clientName={clientName} projectName={projectName}>
      {/* Building Parameters */}
      <PdfSection title="Building Parameters">
        <PdfKeyValue label="Equipment Load" value={`${fv(coolingInputs.loadKw)} kW`} />
        <PdfKeyValue label="Facility Size" value={`${fi(coolingInputs.sqFt)} sq ft`} />
        <PdfKeyValue label="Ambient Temperature" value={`${fv(coolingInputs.ambientTemp)}°F`} />
        <PdfKeyValue label="Target Temperature" value={`${fv(coolingInputs.targetTemp)}°F`} />
        <PdfKeyValue label="Occupants" value={`${coolingInputs.occupants}`} />
        <PdfKeyValue label="Structure Type" value={`${coolingInputs.structureType} (${coolingInputs.structureMultiplier}x)`} />
      </PdfSection>

      {/* Cooling Load Analysis */}
      {coolingResults && (
        <PdfSection title="Cooling Load Analysis">
          <PdfKeyValue label="Equipment Heat" value={`${fi(coolingResults.equipmentBtu)} BTU/hr`} />
          <PdfKeyValue label="Envelope Heat" value={`${fi(coolingResults.envelopeBtu)} BTU/hr`} />
          <PdfKeyValue label="Occupant Heat" value={`${fi(coolingResults.occupantBtu)} BTU/hr`} />
          <PdfKeyValue label="Total Heat Gain" value={`${fi(coolingResults.totalBtu)} BTU/hr`} />
          <PdfKeyValue label="Tonnage" value={`${fv(coolingResults.tons)} tons`} />
          <PdfKeyValue label="Tonnage (with 15% margin)" value={`${fv(coolingResults.tonsWithMargin)} tons`} />
        </PdfSection>
      )}

      {/* Chiller Sizing */}
      {chillerResults && (
        <PdfSection title="Chiller Sizing">
          <PdfKeyValue label="Entering Water Temp" value={`${fv(chillerInputs.enteringTemp)}°F`} />
          <PdfKeyValue label="Leaving Water Temp" value={`${fv(chillerInputs.leavingTemp)}°F`} />
          <PdfKeyValue label="Flow Rate" value={`${fv(chillerInputs.gpm)} GPM`} />
          <PdfKeyValue label="Delta T" value={`${fv(chillerResults.deltaT)}°F`} />
          <PdfKeyValue label="Cooling Capacity" value={`${fi(chillerResults.btuPerHour)} BTU/hr`} />
          <PdfKeyValue label="Tonnage" value={`${fv(chillerResults.tons)} tons`} />
        </PdfSection>
      )}

      {/* Airside Analysis */}
      {airsideResults && (
        <PdfSection title="Airside Analysis">
          <PdfKeyValue label="CFM" value={`${fi(airsideInputs.cfm)}`} />
          <PdfKeyValue label="Inlet Dry/Wet Bulb" value={`${fv(airsideInputs.inletDryBulb)}°F / ${fv(airsideInputs.inletWetBulb)}°F`} />
          <PdfKeyValue label="Outlet Dry/Wet Bulb" value={`${fv(airsideInputs.outletDryBulb)}°F / ${fv(airsideInputs.outletWetBulb)}°F`} />
          <PdfKeyValue label="Total Cooling" value={`${fi(airsideResults.totalCoolingBtu)} BTU/hr`} />
          <PdfKeyValue label="Tonnage" value={`${fv(airsideResults.tonnage)} tons`} />
          <PdfKeyValue label="Sensible Cooling" value={`${fi(airsideResults.sensibleCoolingBtu)} BTU/hr`} />
          <PdfKeyValue label="Latent Cooling" value={`${fi(airsideResults.latentCoolingBtu)} BTU/hr`} />
        </PdfSection>
      )}

      {/* Cross-reference warning if multiple methods available */}
      {coolingResults && (chillerResults || airsideResults) && (
        <PdfSection title="Tonnage Cross-Reference">
          <PdfKeyValue label="Cooling Load Method" value={`${fv(coolingResults.tonsWithMargin)} tons (with margin)`} />
          {chillerResults && (
            <PdfKeyValue label="Chiller Method" value={`${fv(chillerResults.tons)} tons`} />
          )}
          {airsideResults && (
            <PdfKeyValue label="Airside Method" value={`${fv(airsideResults.tonnage)} tons`} />
          )}
          <PdfWarning>
            If tonnage values differ significantly between methods, investigate discrepancies before final equipment selection.
          </PdfWarning>
        </PdfSection>
      )}

      {/* Disclaimer */}
      <PdfSection title="Disclaimer">
        <Text style={{ fontSize: 8, color: '#9ca3af' }}>
          These calculations are estimates for reference only. Actual HVAC performance depends on site conditions, equipment specifications, and environmental factors. Final sizing must be verified by a licensed professional engineer. Sustainable Gaps is not responsible for equipment failures, safety incidents, or cost overruns resulting from the use of these calculations without professional engineering review.
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
