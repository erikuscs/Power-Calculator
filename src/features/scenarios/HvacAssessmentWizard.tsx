import { useState, useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { Button } from '../../components/ui/Button'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { HvacAssessmentPdfDoc } from './HvacAssessmentPdf'
import { useCalculator } from '../../hooks/useCalculator'
import {
  calculateCooling,
  describeCooling,
  calculateChiller,
  describeChiller,
  calculateAirsideTonnage,
  describeAirsideTonnage,
  type CoolingInputs,
  type ChillerInputs,
  type AirsideTonnageInputs,
} from '../hvac/hvac.formulas'
import { STRUCTURE_COOLING_MULTIPLIERS } from '../../lib/constants'
import { fmt, fmtInt } from '../../lib/formatters'

export default function HvacAssessmentWizard() {
  const [step, setStep] = useState(1)
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')

  // Step 1 — Building Parameters
  const [equipmentLoad, setEquipmentLoad] = useState('200')
  const [facilitySize, setFacilitySize] = useState('5000')
  const [ambientTemp, setAmbientTemp] = useState('95')
  const [targetTemp, setTargetTemp] = useState('72')
  const [occupants, setOccupants] = useState('20')
  const [structureType, setStructureType] = useState('container')

  // Step 2 — Chiller Parameters
  const [enteringWaterTemp, setEnteringWaterTemp] = useState('')
  const [leavingWaterTemp, setLeavingWaterTemp] = useState('')
  const [flowRate, setFlowRate] = useState('100')
  const [specificHeat, setSpecificHeat] = useState('1')
  const [specificGravity, setSpecificGravity] = useState('1')

  // Step 3 — Airside Conditions
  const [cfm, setCfm] = useState('')
  const [inletDryBulb, setInletDryBulb] = useState('95')
  const [inletWetBulb, setInletWetBulb] = useState('78')
  const [outletDryBulb, setOutletDryBulb] = useState('55')
  const [outletWetBulb, setOutletWetBulb] = useState('52')

  const structureMultiplier =
    STRUCTURE_COOLING_MULTIPLIERS[structureType]?.multiplier ?? 1.0

  const structureOptions = Object.entries(STRUCTURE_COOLING_MULTIPLIERS).map(
    ([value, { label, multiplier }]) => ({
      value,
      label: `${label} (${multiplier}x)`,
    }),
  )

  // Cooling calc
  const coolingInputs: CoolingInputs = {
    loadKw: parseFloat(equipmentLoad) || 0,
    sqFt: parseFloat(facilitySize) || 0,
    ambientTemp: parseFloat(ambientTemp) || 95,
    targetTemp: parseFloat(targetTemp) || 72,
    occupants: parseFloat(occupants) || 0,
    structureType,
    structureMultiplier,
  }

  const coolingCalc = useCallback(
    (inp: CoolingInputs) => calculateCooling(inp),
    [],
  )
  const coolingResults = useCalculator(coolingInputs, coolingCalc)

  // Auto-populate chiller temps from cooling calc when entering step 2
  const handleGoToStep2 = () => {
    if (!enteringWaterTemp && coolingResults) {
      setEnteringWaterTemp(String(parseFloat(ambientTemp) || 95))
    }
    if (!leavingWaterTemp) {
      setLeavingWaterTemp(String(parseFloat(targetTemp) || 72))
    }
    setStep(2)
  }

  // Chiller calc
  const chillerInputs: ChillerInputs = {
    enteringTemp: parseFloat(enteringWaterTemp) || 0,
    leavingTemp: parseFloat(leavingWaterTemp) || 0,
    gpm: parseFloat(flowRate) || 0,
    specificHeat: parseFloat(specificHeat) || 1,
    specificGravity: parseFloat(specificGravity) || 1,
  }

  const chillerCalc = useCallback(
    (inp: ChillerInputs) => calculateChiller(inp),
    [],
  )
  const chillerResults = useCalculator(chillerInputs, chillerCalc)

  // Airside calc
  const airsideInputs: AirsideTonnageInputs = {
    cfm: parseFloat(cfm) || 0,
    inletDryBulb: parseFloat(inletDryBulb) || 0,
    inletWetBulb: parseFloat(inletWetBulb) || 0,
    outletDryBulb: parseFloat(outletDryBulb) || 0,
    outletWetBulb: parseFloat(outletWetBulb) || 0,
  }

  const airsideCalc = useCallback(
    (inp: AirsideTonnageInputs) => calculateAirsideTonnage(inp),
    [],
  )
  const airsideResults = useCalculator(airsideInputs, airsideCalc)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (s <= step) setStep(s)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              step === s
                ? 'bg-accent-500 text-sg-900'
                : s < step
                  ? 'bg-sg-600 text-text cursor-pointer'
                  : 'bg-sg-800 text-text-dim'
            }`}
          >
            Step {s}
            <span className="text-xs font-normal">
              {s === 1
                ? '— Building'
                : s === 2
                  ? '— Chiller'
                  : s === 3
                    ? '— Airside'
                    : '— Results'}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title="Report Context" subtitle="Shown on the exported EMaaS cooling package" />
        <ReportContextFields
          clientName={clientName}
          projectName={projectName}
          onClientNameChange={setClientName}
          onProjectNameChange={setProjectName}
        />
      </Card>

      {/* Step 1 — Building Parameters */}
      {step === 1 && (
        <Card>
          <CardHeader
            title="Building Parameters"
            subtitle="Define the room and environmental conditions"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Equipment Load"
              unit="kW"
              value={equipmentLoad}
              onChange={setEquipmentLoad}
              required
              tooltip="Total electrical equipment heat load"
            />
            <InputField
              label="Facility Size"
              unit="sq ft"
              value={facilitySize}
              onChange={setFacilitySize}
              tooltip="Floor area for envelope heat gain"
            />
            <InputField
              label="Ambient Temperature"
              unit="°F"
              value={ambientTemp}
              onChange={setAmbientTemp}
              required
            />
            <InputField
              label="Target Temperature"
              unit="°F"
              value={targetTemp}
              onChange={setTargetTemp}
              required
            />
            <InputField
              label="Occupants"
              value={occupants}
              onChange={setOccupants}
              tooltip="Each person adds ~450 BTU/hr"
            />
            <SelectField
              label="Structure Type"
              value={structureType}
              onChange={setStructureType}
              options={structureOptions}
              required
            />
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleGoToStep2} disabled={!coolingResults}>
              Next: Chiller Parameters
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 — Chiller Parameters */}
      {step === 2 && (
        <Card>
          <CardHeader
            title="Chiller Parameters"
            subtitle="Water-side chiller sizing inputs"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Entering Water Temp"
              unit="°F"
              value={enteringWaterTemp}
              onChange={setEnteringWaterTemp}
              required
              tooltip="Water temperature entering the chiller"
            />
            <InputField
              label="Leaving Water Temp"
              unit="°F"
              value={leavingWaterTemp}
              onChange={setLeavingWaterTemp}
              required
              tooltip="Water temperature leaving the chiller"
            />
            <InputField
              label="Flow Rate"
              unit="GPM"
              value={flowRate}
              onChange={setFlowRate}
              required
            />
            <InputField
              label="Specific Heat"
              value={specificHeat}
              onChange={setSpecificHeat}
              step="0.01"
              tooltip="Water = 1.0"
            />
            <InputField
              label="Specific Gravity"
              value={specificGravity}
              onChange={setSpecificGravity}
              step="0.01"
              tooltip="Water = 1.0"
            />
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Next: Airside Conditions
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3 — Airside Conditions (optional) */}
      {step === 3 && (
        <Card>
          <CardHeader
            title="Airside Conditions (Optional)"
            subtitle="Psychrometric inputs for airside tonnage calculation"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="CFM"
              value={cfm}
              onChange={setCfm}
              tooltip="Leave blank to skip airside calculation"
            />
            <div />
            <InputField
              label="Inlet Dry Bulb"
              unit="°F"
              value={inletDryBulb}
              onChange={setInletDryBulb}
            />
            <InputField
              label="Inlet Wet Bulb"
              unit="°F"
              value={inletWetBulb}
              onChange={setInletWetBulb}
            />
            <InputField
              label="Outlet Dry Bulb"
              unit="°F"
              value={outletDryBulb}
              onChange={setOutletDryBulb}
            />
            <InputField
              label="Outlet Wet Bulb"
              unit="°F"
              value={outletWetBulb}
              onChange={setOutletWetBulb}
            />
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={() => setStep(4)}>
              View Results
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4 — Results */}
      {step === 4 && (
        <>
          {/* Cooling Results */}
          {coolingResults && (
            <Card>
              <CardHeader
                title="Cooling Load Analysis"
                subtitle="Equipment, envelope, and occupant heat gains"
              />
              <ResultGrid>
                <ResultItem
                  label="Equipment Heat"
                  value={fmtInt(coolingResults.equipmentBtu)}
                  unit="BTU/hr"
                />
                <ResultItem
                  label="Envelope Heat"
                  value={fmtInt(coolingResults.envelopeBtu)}
                  unit="BTU/hr"
                />
                <ResultItem
                  label="Occupant Heat"
                  value={fmtInt(coolingResults.occupantBtu)}
                  unit="BTU/hr"
                />
                <ResultItem
                  label="Total Heat Gain"
                  value={fmtInt(coolingResults.totalBtu)}
                  unit="BTU/hr"
                  highlight
                />
                <ResultItem
                  label="Tonnage"
                  value={fmt(coolingResults.tons)}
                  unit="tons"
                />
                <ResultItem
                  label="Tonnage (with 15% margin)"
                  value={fmt(coolingResults.tonsWithMargin)}
                  unit="tons"
                  highlight
                  beforeMargin={`${fmt(coolingResults.tons)} tons`}
                />
              </ResultGrid>
              <FormulaBreakdown
                steps={describeCooling(coolingInputs, coolingResults)}
                title="Cooling Load Formulas"
              />
            </Card>
          )}

          {/* Chiller Results */}
          {chillerResults && (
            <Card>
              <CardHeader
                title="Chiller Sizing"
                subtitle="Water-side chiller capacity"
              />
              <ResultGrid>
                <ResultItem
                  label="Delta T"
                  value={fmt(chillerResults.deltaT)}
                  unit="°F"
                />
                <ResultItem
                  label="Cooling Capacity"
                  value={fmtInt(chillerResults.btuPerHour)}
                  unit="BTU/hr"
                  highlight
                />
                <ResultItem
                  label="Tonnage"
                  value={fmt(chillerResults.tons)}
                  unit="tons"
                  highlight
                />
              </ResultGrid>
              <FormulaBreakdown
                steps={describeChiller(chillerInputs, chillerResults)}
                title="Chiller Formulas"
              />
            </Card>
          )}

          {/* Airside Results */}
          {airsideResults && (
            <Card>
              <CardHeader
                title="Airside Analysis"
                subtitle="Psychrometric cooling assessment"
              />
              <ResultGrid>
                <ResultItem
                  label="Total Cooling"
                  value={fmtInt(airsideResults.totalCoolingBtu)}
                  unit="BTU/hr"
                  highlight
                />
                <ResultItem
                  label="Tonnage"
                  value={fmt(airsideResults.tonnage)}
                  unit="tons"
                  highlight
                />
                <ResultItem
                  label="Sensible Cooling"
                  value={fmtInt(airsideResults.sensibleCoolingBtu)}
                  unit="BTU/hr"
                />
                <ResultItem
                  label="Latent Cooling"
                  value={fmtInt(airsideResults.latentCoolingBtu)}
                  unit="BTU/hr"
                />
              </ResultGrid>
              <FormulaBreakdown
                steps={describeAirsideTonnage(airsideInputs, airsideResults)}
                title="Airside Formulas"
              />
            </Card>
          )}

          {/* Tonnage Comparison */}
          {coolingResults && (chillerResults || airsideResults) && (
            <Card>
              <CardHeader
                title="Tonnage Comparison"
                subtitle="Cross-reference cooling estimates from different methods"
              />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sg-600">
                      <th className="text-left py-2 text-text-muted font-medium">
                        Method
                      </th>
                      <th className="text-right py-2 text-text-muted font-medium">
                        Tonnage
                      </th>
                      <th className="text-right py-2 text-text-muted font-medium">
                        BTU/hr
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-text">
                    <tr className="border-b border-sg-700">
                      <td className="py-2">
                        Cooling Load (with margin)
                      </td>
                      <td className="text-right text-accent-300 font-medium">
                        {fmt(coolingResults.tonsWithMargin)} tons
                      </td>
                      <td className="text-right">
                        {fmtInt(coolingResults.totalBtu)}
                      </td>
                    </tr>
                    {chillerResults && (
                      <tr className="border-b border-sg-700">
                        <td className="py-2">Chiller (water-side)</td>
                        <td className="text-right text-accent-300 font-medium">
                          {fmt(chillerResults.tons)} tons
                        </td>
                        <td className="text-right">
                          {fmtInt(chillerResults.btuPerHour)}
                        </td>
                      </tr>
                    )}
                    {airsideResults && (
                      <tr className="border-b border-sg-700">
                        <td className="py-2">Airside (psychrometric)</td>
                        <td className="text-right text-accent-300 font-medium">
                          {fmt(airsideResults.tonnage)} tons
                        </td>
                        <td className="text-right">
                          {fmtInt(airsideResults.totalCoolingBtu)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* PDF Export */}
          <div className="flex justify-center py-4">
            <PdfExportButton
              document={
                <HvacAssessmentPdfDoc
                  coolingInputs={coolingInputs}
                  coolingResults={coolingResults}
                  chillerInputs={chillerInputs}
                  chillerResults={chillerResults}
                  airsideInputs={airsideInputs}
                  airsideResults={airsideResults}
                  clientName={clientName}
                  projectName={projectName}
                />
              }
              filename="emaas-hvac-assessment-report.pdf"
            />
          </div>

          {/* Back button */}
          <div className="flex justify-start">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Back to Airside Conditions
            </Button>
          </div>

          <div className="text-center text-xs text-text-dim py-2">
            These are estimates for reference only. Final sizing must be
            verified by a licensed professional engineer.
          </div>
        </>
      )}
    </div>
  )
}
