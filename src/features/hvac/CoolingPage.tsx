import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { useCalculator } from '../../hooks/useCalculator'
import { usePersistedState } from '../../hooks/usePersistedState'
import { calculateCooling, describeCooling, type CoolingInputs } from './hvac.formulas'
import { STRUCTURE_COOLING_MULTIPLIERS, OCCUPANT_ACTIVITY_LEVELS } from '../../lib/constants'
import { fmt } from '../../lib/formatters'
import { AlertTriangle } from 'lucide-react'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { Button } from '../../components/ui/Button'
import { addPlanningRequirement } from '../estimate/estimateDraft'

const ROUTE_KEY = '/hvac/cooling'

export default function CoolingPage() {
  const navigate = useNavigate()
  const [clientName, setClientName] = usePersistedState(ROUTE_KEY, 'clientName', '')
  const [projectName, setProjectName] = usePersistedState(ROUTE_KEY, 'projectName', '')
  const [loadKw, setLoadKw] = usePersistedState(ROUTE_KEY, 'loadKw', '100')
  const [sqFt, setSqFt] = usePersistedState(ROUTE_KEY, 'sqFt', '2000')
  const [facilitySizeMode, setFacilitySizeMode] = usePersistedState(ROUTE_KEY, 'facilitySizeMode', 'area')
  const [facilityWidth, setFacilityWidth] = usePersistedState(ROUTE_KEY, 'facilityWidth', '40')
  const [facilityHeight, setFacilityHeight] = usePersistedState(ROUTE_KEY, 'facilityHeight', '10')
  const [facilityDepth, setFacilityDepth] = usePersistedState(ROUTE_KEY, 'facilityDepth', '50')
  const [ambientTemp, setAmbientTemp] = usePersistedState(ROUTE_KEY, 'ambientTemp', '95')
  const [targetTemp, setTargetTemp] = usePersistedState(ROUTE_KEY, 'targetTemp', '72')
  const [occupants, setOccupants] = usePersistedState(ROUTE_KEY, 'occupants', '0')
  const [activityLevel, setActivityLevel] = usePersistedState(ROUTE_KEY, 'activityLevel', 'seated')
  const [structureType, setStructureType] = usePersistedState(ROUTE_KEY, 'structureType', 'container')
  const [rh, setRh] = usePersistedState(ROUTE_KEY, 'rh', '')

  const mult = STRUCTURE_COOLING_MULTIPLIERS[structureType]?.multiplier ?? 1.0
  const btuPerPerson = OCCUPANT_ACTIVITY_LEVELS[activityLevel]?.btuPerPerson ?? 450
  const parsedRh = Number(rh)
  const rhValue = Number.isFinite(parsedRh) ? parsedRh : 0
  const rhError = rh.trim() && (!Number.isFinite(parsedRh) || parsedRh < 0 || parsedRh > 100)
    ? 'Relative humidity must be between 0% and 100%.'
    : undefined
  const widthFt = Math.max(0, parseFloat(facilityWidth) || 0)
  const heightFt = Math.max(0, parseFloat(facilityHeight) || 0)
  const depthFt = Math.max(0, parseFloat(facilityDepth) || 0)
  const facilityVolumeCuFt = widthFt * heightFt * depthFt
  const facilityFootprintSqFt = widthFt * depthFt
  const calculatedSqFt = facilitySizeMode === 'dimensions'
    ? facilityFootprintSqFt
    : Math.max(0, parseFloat(sqFt) || 0)

  const inputs: CoolingInputs = {
    loadKw: parseFloat(loadKw) || 0,
    sqFt: calculatedSqFt,
    ambientTemp: parseFloat(ambientTemp) || 95,
    targetTemp: parseFloat(targetTemp) || 72,
    occupants: parseInt(occupants) || 0,
    occupantBtuPerPerson: btuPerPerson,
    structureType,
    structureMultiplier: mult,
    relativeHumidity: rhValue > 0 ? rhValue : undefined,
  }

  const calculate = useCallback((inp: CoolingInputs) => calculateCooling(inp), [])
  const results = useCalculator(inputs, calculate)

  const structureOptions = Object.entries(STRUCTURE_COOLING_MULTIPLIERS).map(([value, { label, multiplier }]) => ({
    value,
    label: `${label} (${multiplier}x)`,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader title="Cooling Load Calculator" subtitle="Equipment heat + envelope gains + occupant heat → cooling tonnage" />

        <ReportContextFields
          clientName={clientName}
          projectName={projectName}
          onClientNameChange={setClientName}
          onProjectNameChange={setProjectName}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Equipment Load" unit="kW" value={loadKw} onChange={setLoadKw} required tooltip="Total electrical load generating heat" />
          <div className="sm:col-span-2">
            <RadioGroup
              label="Facility Size Input"
              value={facilitySizeMode}
              onChange={setFacilitySizeMode}
              options={[
                { value: 'area', label: 'Floor Area (sq ft)' },
                { value: 'dimensions', label: 'Dimensions (cu ft)' },
              ]}
            />
          </div>
          {facilitySizeMode === 'area' ? (
            <InputField label="Facility Size" unit="sq ft" value={sqFt} onChange={setSqFt} tooltip="Floor area — used for envelope heat gain" />
          ) : (
            <div className="sm:col-span-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField label="Width" unit="ft" value={facilityWidth} onChange={setFacilityWidth} min={0} />
                <InputField label="Height" unit="ft" value={facilityHeight} onChange={setFacilityHeight} min={0} />
                <InputField label="Depth" unit="ft" value={facilityDepth} onChange={setFacilityDepth} min={0} />
              </div>
              <div className="rounded-lg border border-sg-600/40 bg-sg-900/60 px-3.5 py-3 text-sm text-text-muted" aria-live="polite">
                <span className="font-semibold text-text">{fmt(facilityVolumeCuFt, 0)} cu ft</span>
                {' '}facility volume ({fmt(widthFt, 1)} × {fmt(heightFt, 1)} × {fmt(depthFt, 1)} ft)
                <span className="mt-1 block text-xs text-text-dim">
                  {fmt(facilityFootprintSqFt, 0)} sq ft footprint is used for the envelope heat-gain estimate.
                </span>
              </div>
            </div>
          )}
          <InputField label="Ambient Temperature" unit="°F" value={ambientTemp} onChange={setAmbientTemp} required />
          <InputField
            label="Target Temperature"
            unit="°F"
            value={targetTemp}
            onChange={setTargetTemp}
            required
            warning={Number(targetTemp) >= Number(ambientTemp) ? 'Target is at or above ambient. Envelope cooling gain is zero; confirm these temperatures before using the result.' : undefined}
          />
          <SelectField label="Structure Type" value={structureType} onChange={setStructureType} options={structureOptions} required tooltip="Multipliers from deployed-structure field observations — canvas runs hottest, hard-sided holds best" />
          <InputField label="Occupants" value={occupants} onChange={setOccupants} required tooltip="Number of people in the space" />
          <SelectField
            label="Occupant Activity"
            value={activityLevel}
            onChange={setActivityLevel}
            options={Object.entries(OCCUPANT_ACTIVITY_LEVELS).map(([value, { label, btuPerPerson: btu }]) => ({
              value,
              label: `${label} (${btu} BTU/person)`,
            }))}
            tooltip="Standing crowds emit far more heat than seated guests — the classic tent-cooling underestimate. Dancing nearly doubles it."
          />
          <InputField
            label="Relative Humidity"
            unit="% RH"
            value={rh}
            onChange={setRh}
            placeholder="Optional"
            min={0}
            max={100}
            error={rhError}
            tooltip="Leave blank for standard conditions. Above 60% RH, latent load is added automatically."
            warning={rhValue > 55 ? 'High-humidity conditions — latent load rises steeply above 60% RH. This model simplifies full psychrometrics; verify cooling with an engineer before ordering equipment.' : undefined}
          />
        </div>

        {parseInt(occupants) === 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            <AlertTriangle size={16} />
            Did you account for occupants? Each person adds ~450 BTU/hr total heat.
          </div>
        )}
      </Card>

      {results && !rhError && (
        <Card>
          <CardHeader title="Results" />
          <ResultGrid>
            <ResultItem label="Equipment Heat" value={fmt(results.equipmentBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Envelope Heat Gain" value={fmt(results.envelopeBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Occupant Heat" value={fmt(results.occupantBtu, 0)} unit="BTU/hr" />
            {results.latentBtu > 0 && <ResultItem label="Latent Load (Humidity)" value={fmt(results.latentBtu, 0)} unit="BTU/hr" />}
            <ResultItem label="Total Heat Gain" value={fmt(results.totalBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Cooling Tonnage" value={fmt(results.tons, 1)} unit="tons" beforeMargin={`${fmt(results.tons, 1)} tons`} />
            <ResultItem label="Recommended (with 15% margin)" value={fmt(results.tonsWithMargin, 1)} unit="tons" highlight />
          </ResultGrid>
          <FormulaBreakdown steps={describeCooling(inputs, results)} />

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const added = addPlanningRequirement({
                  source: 'cooling',
                  title: 'Cooling Load Requirement',
                  summary: `${fmt(results.tonsWithMargin, 1)} tons recommended with margin`,
                  details: [
                    { label: 'Required capacity', value: `${fmt(results.tonsWithMargin, 1)} tons` },
                    { label: 'Total heat gain', value: `${fmt(results.totalBtu, 0)} BTU/hr` },
                    { label: 'Facility basis', value: facilitySizeMode === 'dimensions' ? `${fmt(facilityVolumeCuFt, 0)} cu ft` : `${sqFt} sq ft` },
                  ],
                  assumptions: ['Cooling equipment model and electrical demand remain to be selected and verified.'],
                }, { clientName, projectName })
                if (!added) {
                  window.alert('The current estimate belongs to another client or project. Open Build Estimate and start a new estimate before importing this result.')
                  return
                }
                navigate('/estimate')
              }}
            >
              Add to Estimate
            </Button>
            <PdfExportButton
              createDocument={async () => {
                const { GenericCalculatorPdf } = await import('../../components/pdf/GenericCalculatorPdf')
                return (
                  <GenericCalculatorPdf
                    title="Cooling Load Report"
                    clientName={clientName}
                    projectName={projectName}
                    inputs={[
                    { label: 'Equipment Load', value: `${loadKw} kW` },
                    ...(facilitySizeMode === 'dimensions'
                      ? [
                          { label: 'Facility Dimensions', value: `${facilityWidth} × ${facilityHeight} × ${facilityDepth} ft (W × H × D)` },
                          { label: 'Facility Volume', value: `${fmt(facilityVolumeCuFt, 0)} cu ft` },
                          { label: 'Facility Footprint', value: `${fmt(facilityFootprintSqFt, 0)} sq ft` },
                        ]
                      : [{ label: 'Facility Size', value: `${sqFt} sq ft` }]),
                    { label: 'Ambient Temperature', value: `${ambientTemp} °F` },
                    { label: 'Target Temperature', value: `${targetTemp} °F` },
                    { label: 'Structure Type', value: `${STRUCTURE_COOLING_MULTIPLIERS[structureType]?.label ?? structureType} (${mult}x)` },
                    { label: 'Occupants', value: occupants },
                    { label: 'Occupant Activity', value: `${OCCUPANT_ACTIVITY_LEVELS[activityLevel]?.label ?? activityLevel} (${btuPerPerson} BTU/person)` },
                    { label: 'Relative Humidity', value: rh.trim() ? `${rhValue}% RH` : 'Not entered — standard conditions assumed' },
                  ]}
                  results={[
                    { label: 'Equipment Heat', value: fmt(results.equipmentBtu, 0), unit: 'BTU/hr' },
                    { label: 'Envelope Heat Gain', value: fmt(results.envelopeBtu, 0), unit: 'BTU/hr' },
                    { label: 'Occupant Heat', value: fmt(results.occupantBtu, 0), unit: 'BTU/hr' },
                    ...(results.latentBtu > 0 ? [{ label: 'Latent Load (Humidity)', value: fmt(results.latentBtu, 0), unit: 'BTU/hr' }] : []),
                    { label: 'Total Heat Gain', value: fmt(results.totalBtu, 0), unit: 'BTU/hr' },
                    { label: 'Cooling Tonnage (before margin)', value: fmt(results.tons, 1), unit: 'tons' },
                    { label: 'Recommended (with 15% margin)', value: fmt(results.tonsWithMargin, 1), unit: 'tons' },
                  ]}
                  formulaSteps={describeCooling(inputs, results).map((s) => ({ label: s.label, result: s.result }))}
                  warnings={parseInt(occupants) === 0 ? ['Occupant heat not included — each person adds ~450 BTU/hr.'] : undefined}
                  />
                )
              }}
              filename="cooling-load-report.pdf"
            />
          </div>
        </Card>
      )}
    </div>
  )
}
