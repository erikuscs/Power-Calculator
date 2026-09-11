import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { InputField } from '../../components/ui/InputField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultGrid, ResultItem } from '../../components/ui/ResultDisplay'
import { SelectField } from '../../components/ui/SelectField'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { useCalculator } from '../../hooks/useCalculator'
import { usePersistedState } from '../../hooks/usePersistedState'
import { fmt } from '../../lib/formatters'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { Button } from '../../components/ui/Button'
import { addPlanningRequirement } from '../estimate/estimateDraft'
import {
  calculateHeating,
  describeHeating,
  HEATING_EXPOSURE_OPTIONS,
  type HeatingExposure,
  type HeatingInputs,
  type HeatingSource,
  type PropaneHeaterType,
} from './heating.formulas'

const ROUTE_KEY = '/hvac/heating'

const PURPOSE_OPTIONS = [
  { value: 'occupied', label: 'Maintain an occupied-space temperature' },
  { value: 'freeze', label: 'Freeze protection' },
  { value: 'curing', label: 'Curing or drying' },
  { value: 'work_area', label: 'Warm an enclosed work area' },
]

export default function HeatingPage() {
  const navigate = useNavigate()
  const [clientName, setClientName] = usePersistedState(ROUTE_KEY, 'clientName', '')
  const [projectName, setProjectName] = usePersistedState(ROUTE_KEY, 'projectName', '')
  const [purpose, setPurpose] = usePersistedState(ROUTE_KEY, 'purpose', 'work_area')
  const [requestedSolution, setRequestedSolution] = usePersistedState(ROUTE_KEY, 'requestedSolution', '')
  const [width, setWidth] = usePersistedState(ROUTE_KEY, 'width', '40')
  const [height, setHeight] = usePersistedState(ROUTE_KEY, 'height', '10')
  const [depth, setDepth] = usePersistedState(ROUTE_KEY, 'depth', '50')
  const [outdoorTemp, setOutdoorTemp] = usePersistedState(ROUTE_KEY, 'outdoorTemp', '30')
  const [targetTemp, setTargetTemp] = usePersistedState(ROUTE_KEY, 'targetTemp', '70')
  const [exposure, setExposure] = usePersistedState<HeatingExposure>(ROUTE_KEY, 'exposure', 'some_openings')
  const [runtimeHours, setRuntimeHours] = usePersistedState(ROUTE_KEY, 'runtimeHours', '8')
  const [source, setSource] = usePersistedState<HeatingSource>(ROUTE_KEY, 'source', 'propane')
  const [unitOutputBtu, setUnitOutputBtu] = usePersistedState(ROUTE_KEY, 'unitOutputBtu', '150000')
  const [propaneHeaterType, setPropaneHeaterType] = usePersistedState<PropaneHeaterType>(ROUTE_KEY, 'propaneHeaterType', 'indirect')
  const [propaneEfficiency, setPropaneEfficiency] = usePersistedState(ROUTE_KEY, 'propaneEfficiency', '80')
  const [electricPowerSource, setElectricPowerSource] = usePersistedState<'utility' | 'generator'>(ROUTE_KEY, 'electricPowerSource', 'generator')
  const [auxiliaryPowerSource, setAuxiliaryPowerSource] = usePersistedState<'none' | 'utility' | 'generator'>(ROUTE_KEY, 'auxiliaryPowerSource', 'generator')
  const [auxiliaryVoltage, setAuxiliaryVoltage] = usePersistedState(ROUTE_KEY, 'auxiliaryVoltage', '120')
  const [auxiliaryCircuitAmps, setAuxiliaryCircuitAmps] = usePersistedState(ROUTE_KEY, 'auxiliaryCircuitAmps', '15')

  const inputs: HeatingInputs = {
    widthFt: parseFloat(width) || 0,
    heightFt: parseFloat(height) || 0,
    depthFt: parseFloat(depth) || 0,
    outdoorTempF: parseFloat(outdoorTemp),
    targetTempF: parseFloat(targetTemp),
    exposure,
    source,
    unitOutputBtu: parseFloat(unitOutputBtu) || 0,
    runtimeHours: parseFloat(runtimeHours) || 0,
    propaneHeaterType,
    propaneEfficiency: (parseFloat(propaneEfficiency) || 0) / 100,
    electricPowerSource,
    auxiliaryPowerSource,
    auxiliaryVoltage: parseFloat(auxiliaryVoltage) || 0,
    auxiliaryCircuitAmps: parseFloat(auxiliaryCircuitAmps) || 0,
  }

  const calculate = useCallback((value: HeatingInputs) => calculateHeating(value), [])
  const results = useCalculator(inputs, calculate)
  const generatorRequired = source === 'electric'
    ? electricPowerSource === 'generator'
    : auxiliaryPowerSource === 'generator'

  const customerQuestions = [
    'Confirm the coldest expected outdoor temperature, target temperature, operating hours, and enclosure dimensions.',
    exposure !== 'sealed'
      ? 'Confirm how often doors, material openings, or temporary panels will remain open.'
      : 'Confirm the enclosure will remain sealed during the heating period.',
    source === 'propane'
      ? 'Confirm direct- versus indirect-fired suitability, ventilation, heater efficiency, propane delivery, and tank vaporization capacity.'
      : 'Confirm the selected heater is electric resistance equipment and verify its voltage, phase, running current, and branch-circuit requirements.',
    generatorRequired
      ? 'Verify the selected equipment nameplate and starting current before releasing a generator or distribution package.'
      : 'Verify the available site electrical service can support all heater auxiliary or resistance loads.',
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Temporary Heating Plan"
          subtitle="Start with the customer outcome, then connect heating capacity to propane or electrical supply"
        />

        <ReportContextFields
          clientName={clientName}
          projectName={projectName}
          onClientNameChange={setClientName}
          onProjectNameChange={setProjectName}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Heating Outcome" value={purpose} onChange={setPurpose} options={PURPOSE_OPTIONS} required />
          <InputField
            label="Customer-Requested Solution"
            type="text"
            value={requestedSolution}
            onChange={setRequestedSolution}
            placeholder="Optional — e.g., what was used before"
            tooltip="Records the request without treating it as the calculated requirement"
          />
          <InputField label="Width" unit="ft" value={width} onChange={setWidth} min={0} required />
          <InputField label="Height" unit="ft" value={height} onChange={setHeight} min={0} required />
          <InputField label="Depth" unit="ft" value={depth} onChange={setDepth} min={0} required />
          <SelectField
            label="Enclosure Exposure"
            value={exposure}
            onChange={(value) => setExposure(value as HeatingExposure)}
            options={Object.entries(HEATING_EXPOSURE_OPTIONS).map(([value, option]) => ({ value, label: option.label }))}
            required
          />
          <InputField label="Outdoor Design Temperature" unit="°F" value={outdoorTemp} onChange={setOutdoorTemp} required />
          <InputField label="Target Temperature" unit="°F" value={targetTemp} onChange={setTargetTemp} required />
          <InputField label="Planned Runtime" unit="hours" value={runtimeHours} onChange={setRuntimeHours} min={0} required />
        </div>
      </Card>

      <Card>
        <CardHeader title="Heating Source and Equipment" subtitle="Only relevant power or fuel questions appear" />
        <RadioGroup
          label="Heat Source"
          value={source}
          onChange={(value) => setSource(value as HeatingSource)}
          options={[
            { value: 'propane', label: 'Propane Heater' },
            { value: 'electric', label: 'Electric Heater' },
          ]}
        />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Selected Unit Output"
            unit="BTU/hr per heater"
            value={unitOutputBtu}
            onChange={setUnitOutputBtu}
            min={0}
            required
            tooltip="Use the published heating output, not burner input"
          />

          {source === 'electric' ? (
            <SelectField
              label="Electrical Supply"
              value={electricPowerSource}
              onChange={(value) => setElectricPowerSource(value as 'utility' | 'generator')}
              options={[
                { value: 'generator', label: 'Generator power' },
                { value: 'utility', label: 'Existing utility power' },
              ]}
              required
            />
          ) : (
            <>
              <SelectField
                label="Propane Heater Type"
                value={propaneHeaterType}
                onChange={(value) => {
                  const nextType = value as PropaneHeaterType
                  setPropaneHeaterType(nextType)
                  setPropaneEfficiency(nextType === 'direct' ? '100' : '80')
                }}
                options={[
                  { value: 'indirect', label: 'Indirect-fired — separated combustion' },
                  { value: 'direct', label: 'Direct-fired — combustion air enters space' },
                ]}
                required
              />
              <InputField
                label="Rated Thermal Efficiency"
                unit="%"
                value={propaneEfficiency}
                onChange={setPropaneEfficiency}
                min={1}
                max={100}
                required
                tooltip="Use the selected heater specification; the default is only a planning assumption"
              />
              <SelectField
                label="Blower / Control Power"
                value={auxiliaryPowerSource}
                onChange={(value) => setAuxiliaryPowerSource(value as 'none' | 'utility' | 'generator')}
                options={[
                  { value: 'generator', label: 'Generator power' },
                  { value: 'utility', label: 'Existing utility power' },
                  { value: 'none', label: 'No auxiliary power required' },
                ]}
                required
              />
              {auxiliaryPowerSource === 'generator' && (
                <>
                  <InputField label="Auxiliary Voltage" unit="V per heater" value={auxiliaryVoltage} onChange={setAuxiliaryVoltage} min={0} required />
                  <InputField
                    label="Auxiliary Circuit Rating"
                    unit="A per heater"
                    value={auxiliaryCircuitAmps}
                    onChange={setAuxiliaryCircuitAmps}
                    min={0}
                    required
                    tooltip="Use the published heater circuit requirement; motor starting current still requires confirmation"
                  />
                </>
              )}
            </>
          )}
        </div>
      </Card>

      {!results && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          Enter positive dimensions and equipment output, with a target temperature above the outdoor design temperature.
        </div>
      )}

      {results && (
        <Card>
          <CardHeader title="Heating Planning Result" subtitle="Capacity, equipment, fuel, and power remain visible as separate decisions" />
          <ResultGrid>
            <ResultItem label="Facility Volume" value={fmt(results.volumeCuFt, 0)} unit="cu ft" />
            <ResultItem label="Temperature Rise" value={fmt(results.deltaT, 0)} unit="°F" />
            <ResultItem label="Required Heat" value={fmt(results.requiredHeatingBtu, 0)} unit="BTU/hr" beforeMargin={`${fmt(results.baseHeatingBtu, 0)} BTU/hr sealed-space baseline`} />
            <ResultItem label="Planning Capacity" value={fmt(results.planningHeatingBtu, 0)} unit="BTU/hr" highlight />
            <ResultItem label="Equipment Quantity" value={results.unitCount} unit={results.unitCount === 1 ? 'heater' : 'heaters'} highlight />
            <ResultItem label="Installed Output" value={fmt(results.installedOutputBtu, 0)} unit="BTU/hr" />
            {source === 'propane' ? (
              <>
                <ResultItem label="Propane at Full Fire" value={fmt(results.propaneGallonsPerHour, 2)} unit="gal/hr" highlight />
                <ResultItem label="Runtime Fuel Allowance" value={fmt(results.totalPropaneGallons, 1)} unit="gallons" />
                {auxiliaryPowerSource === 'generator' && (
                  <ResultItem label="Auxiliary Generator Allowance" value={fmt(results.generatorPlanningKva, 1)} unit="kVA" highlight />
                )}
              </>
            ) : (
              <>
                <ResultItem label="Electric Heater Demand" value={fmt(results.electricHeaterKw, 1)} unit="kW" highlight />
                {electricPowerSource === 'generator' && (
                  <>
                    <ResultItem label="Generator Planning Load" value={fmt(results.generatorPlanningKw, 1)} unit="kW" highlight />
                    <ResultItem label="Generator Planning Rating" value={fmt(results.generatorPlanningKva, 1)} unit="kVA" />
                  </>
                )}
              </>
            )}
          </ResultGrid>

          <FormulaBreakdown steps={describeHeating(inputs, results)} />

          <div className="mt-5 rounded-lg border border-sg-600/40 bg-sg-900/60 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-text">
              <CheckCircle2 size={17} className="text-accent-400" /> Questions to confirm before equipment release
            </div>
            <ul className="mt-3 space-y-2 pl-5 text-sm leading-relaxed text-text-muted list-disc">
              {customerQuestions.map((question) => <li key={question}>{question}</li>)}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const added = addPlanningRequirement({
                  source: 'heating',
                  title: 'Temporary Heating Requirement',
                  summary: `${results.unitCount} × ${Number(unitOutputBtu).toLocaleString()} BTU/hr ${source} heater${results.unitCount === 1 ? '' : 's'}`,
                  details: [
                    { label: 'Planning capacity', value: `${fmt(results.planningHeatingBtu, 0)} BTU/hr` },
                    { label: 'Installed output', value: `${fmt(results.installedOutputBtu, 0)} BTU/hr` },
                    ...(source === 'propane'
                      ? [
                          { label: 'Propane allowance', value: `${fmt(results.propaneGallonsPerHour, 2)} gal/hr; ${fmt(results.totalPropaneGallons, 1)} gallons` },
                          ...(auxiliaryPowerSource === 'generator' ? [{ label: 'Auxiliary generator', value: `${fmt(results.generatorPlanningKva, 1)} kVA` }] : []),
                        ]
                      : [{ label: 'Electrical demand', value: `${fmt(results.electricHeaterKw, 1)} kW` }]),
                  ],
                  assumptions: customerQuestions,
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
                    title="Temporary Heating Planning Report"
                    clientName={clientName}
                    projectName={projectName}
                    inputs={[
                      { label: 'Heating Outcome', value: PURPOSE_OPTIONS.find((option) => option.value === purpose)?.label ?? purpose },
                      ...(requestedSolution ? [{ label: 'Customer-Requested Solution', value: requestedSolution }] : []),
                      { label: 'Facility Dimensions', value: `${width} × ${height} × ${depth} ft (W × H × D)` },
                      { label: 'Outdoor / Target Temperature', value: `${outdoorTemp} °F / ${targetTemp} °F` },
                      { label: 'Enclosure Exposure', value: HEATING_EXPOSURE_OPTIONS[exposure].label },
                      { label: 'Heat Source', value: source === 'propane' ? 'Propane' : 'Electric resistance' },
                      { label: 'Selected Unit Output', value: `${unitOutputBtu} BTU/hr` },
                      { label: 'Planned Runtime', value: `${runtimeHours} hours` },
                      ...(source === 'propane'
                        ? [
                            { label: 'Propane Heater Type', value: propaneHeaterType === 'indirect' ? 'Indirect-fired' : 'Direct-fired' },
                            { label: 'Rated Thermal Efficiency', value: `${propaneEfficiency}%` },
                            { label: 'Blower / Control Power', value: auxiliaryPowerSource === 'generator' ? 'Generator power' : auxiliaryPowerSource === 'utility' ? 'Existing utility power' : 'No auxiliary power required' },
                            ...(auxiliaryPowerSource === 'generator'
                              ? [
                                  { label: 'Auxiliary Voltage', value: `${auxiliaryVoltage} V per heater` },
                                  { label: 'Auxiliary Circuit Rating', value: `${auxiliaryCircuitAmps} A per heater` },
                                ]
                              : []),
                          ]
                        : [{ label: 'Electrical Supply', value: electricPowerSource === 'generator' ? 'Generator power' : 'Existing utility power' }]),
                    ]}
                    results={[
                      { label: 'Required Heat', value: fmt(results.requiredHeatingBtu, 0), unit: 'BTU/hr' },
                      { label: 'Planning Capacity', value: fmt(results.planningHeatingBtu, 0), unit: 'BTU/hr' },
                      { label: 'Equipment Quantity', value: String(results.unitCount), unit: results.unitCount === 1 ? 'heater' : 'heaters' },
                      ...(source === 'propane'
                        ? [
                            { label: 'Propane at Full Fire', value: fmt(results.propaneGallonsPerHour, 2), unit: 'gal/hr' },
                            { label: 'Runtime Fuel Allowance', value: fmt(results.totalPropaneGallons, 1), unit: 'gallons' },
                            ...(auxiliaryPowerSource === 'generator'
                              ? [{ label: 'Auxiliary Generator Allowance', value: fmt(results.generatorPlanningKva, 1), unit: 'kVA' }]
                              : []),
                          ]
                        : [
                            { label: 'Electric Heater Demand', value: fmt(results.electricHeaterKw, 1), unit: 'kW' },
                            ...(electricPowerSource === 'generator'
                              ? [
                                  { label: 'Generator Planning Load', value: fmt(results.generatorPlanningKw, 1), unit: 'kW' },
                                  { label: 'Generator Planning Rating', value: fmt(results.generatorPlanningKva, 1), unit: 'kVA' },
                                ]
                              : []),
                          ]),
                    ]}
                    formulaSteps={describeHeating(inputs, results).map((step) => ({ label: step.label, result: step.result }))}
                    warnings={customerQuestions}
                  />
                )
              }}
              filename="temporary-heating-plan.pdf"
            />
          </div>
        </Card>
      )}
    </div>
  )
}
