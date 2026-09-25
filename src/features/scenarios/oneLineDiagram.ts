import type {
  HybridWizardInputs,
  HybridWizardResults,
  TempPowerInputs,
  TempPowerResults,
} from './scenario.formulas'
import type { TempPowerArchitecturePlan } from '../../lib/tempPowerArchitecture'

export type OneLineNodeTone = 'source' | 'storage' | 'control' | 'distribution' | 'load' | 'service'

export interface OneLineNode {
  id: string
  label: string
  detail: string
  meta?: string
  tone: OneLineNodeTone
}

export interface OneLineStage {
  label: string
  nodes: OneLineNode[]
}

export interface OneLineEdge {
  from: string
  to: string
  label?: string
  kind?: 'power' | 'control' | 'service'
}

export interface OneLineDiagram {
  title: string
  caption: string
  stages: OneLineStage[]
  edges: OneLineEdge[]
  assumptions: string[]
  mermaid: string
}

function fi(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

function fv(value: number, digits = 1) {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function nodeLabel(node: OneLineNode) {
  return [node.label, node.detail, node.meta].filter(Boolean).join('<br/>')
}

function mermaidSafe(value: string) {
  return value.replace(/"/g, "'")
}

function buildMermaid(stages: OneLineStage[], edges: OneLineEdge[]) {
  const lines = ['flowchart LR']
  for (const stage of stages) {
    lines.push(`  subgraph ${stage.label.replace(/[^A-Za-z0-9]/g, '')}["${mermaidSafe(stage.label)}"]`)
    for (const node of stage.nodes) {
      lines.push(`    ${node.id}["${mermaidSafe(nodeLabel(node))}"]`)
    }
    lines.push('  end')
  }
  for (const edge of edges) {
    const label = edge.label ? `|${mermaidSafe(edge.label)}|` : ''
    const connector = edge.kind === 'control' || edge.kind === 'service'
      ? edge.label ? `-. ${mermaidSafe(edge.label)} .->` : '-.->'
      : `-->${label}`
    lines.push(`  ${edge.from} ${connector} ${edge.to}`)
  }
  lines.push('  classDef source fill:#141D26,stroke:#C27A2C,color:#F9FAFB')
  lines.push('  classDef storage fill:#1E2A38,stroke:#ABE1FA,color:#F9FAFB')
  lines.push('  classDef control fill:#1C2732,stroke:#CCD2E9,color:#F9FAFB')
  lines.push('  classDef distribution fill:#1E2A38,stroke:#C5C6C7,color:#F9FAFB')
  lines.push('  classDef load fill:#141D26,stroke:#D88A34,color:#F9FAFB')
  lines.push('  classDef service fill:#0E151C,stroke:#5B6673,color:#F9FAFB')
  for (const stage of stages) {
    for (const node of stage.nodes) {
      lines.push(`  class ${node.id} ${node.tone}`)
    }
  }
  return lines.join('\n')
}

function finishDiagram(diagram: Omit<OneLineDiagram, 'mermaid'>): OneLineDiagram {
  return {
    ...diagram,
    mermaid: buildMermaid(diagram.stages, diagram.edges),
  }
}

export function flattenDiagramRows(diagram: OneLineDiagram) {
  return diagram.stages.flatMap((stage) =>
    stage.nodes.map((node) => [
      stage.label,
      node.label,
      [node.detail, node.meta].filter(Boolean).join(' | '),
    ]),
  )
}

interface TempPowerSourceSizing {
  generatorKw: number
  generatorKva: number
  ampsPerPhase: number
}

export function buildTempPowerOneLineDiagram(
  inputs: TempPowerInputs,
  results: TempPowerResults,
  sourceSizing: TempPowerSourceSizing = results,
  architecture?: TempPowerArchitecturePlan,
): OneLineDiagram {
  const generatorUnits = architecture?.selected.unitCount ?? Math.max(1, Math.ceil(sourceSizing.generatorKw / 500))
  const legsPerPhase = Math.max(1, Math.ceil(sourceSizing.ampsPerPhase / 400))
  const includeCooling = inputs.includeCooling !== false
  const sourceVoltage = inputs.siteVoltage ?? 480
  const loadVoltage = inputs.loadVoltage ?? sourceVoltage
  const transformerRequired = architecture?.transformer.required ?? sourceVoltage !== loadVoltage
  const sourceControlLabel = generatorUnits > 1 ? 'Paralleling Controls' : 'Generator Controller'

  const primaryLoadNodes: OneLineNode[] = inputs.mode === 'basecamp'
    ? [
        {
          id: 'LOAD_BASECAMP',
          label: 'Base Camp Loads',
          detail: `${fi(results.totalLoadKw)} kW equipment`,
          meta: results.facilityBreakdown.slice(0, 3).map((f) => f.label).join(', ') || 'facility schedule',
          tone: 'load',
        },
      ]
    : [
        {
          id: 'LOAD_EQUIP',
          label: 'Equipment Load',
          detail: `${fi(results.totalLoadKw)} kW real power`,
          meta: `${fi(inputs.sqFt)} sq ft planning area`,
          tone: 'load',
        },
      ]

  const loadNodes: OneLineNode[] = [
    ...primaryLoadNodes,
    ...(includeCooling
      ? [{
          id: 'COOLING',
          label: 'Cooling Plant',
          detail: `${fv(results.coolingTons)} tons`,
          meta: `${fi(results.coolingKw)} kW cooling load`,
          tone: 'load' as const,
        }]
      : []),
  ]

  const stages: OneLineStage[] = [
    {
      label: 'Source',
      nodes: [
        {
          id: 'GEN',
          label: 'Generator Plant',
          detail: architecture?.selected.label ?? `${generatorUnits} x planning unit`,
          meta: architecture
            ? `${fi(architecture.selected.totalCapacityKw)} kW installed / ${fi(architecture.selected.firmCapacityKw)} kW firm`
            : `${fi(sourceSizing.generatorKva)} kVA / ${fi(sourceSizing.generatorKw)} kW`,
          tone: 'source',
        },
      ],
    },
    {
      label: 'Control',
      nodes: [
        {
          id: 'SOURCE_CTRL',
          label: sourceControlLabel,
          detail: generatorUnits > 1 ? 'synchronization + load sharing' : 'start + protection logic',
          meta: inputs.technicianCoverage === '24_7' ? '24/7 tech coverage' : 'remote monitoring ready',
          tone: 'control',
        },
      ],
    },
    {
      label: 'Distribution',
      nodes: [
        {
          id: 'SWGR',
          label: `${sourceVoltage}V Switchgear`,
          detail: `${fi(sourceSizing.ampsPerPhase)} A/phase`,
          meta: sourceSizing.ampsPerPhase > 400 ? `${legsPerPhase} cable legs per phase` : 'single cable set check',
          tone: 'distribution',
        },
        ...(transformerRequired
          ? [{
              id: 'XFMR',
              label: architecture && architecture.transformer.unitCount > 1 ? 'Step-Down Transformer Bank' : 'Step-Down Transformer',
              detail: architecture
                ? `${architecture.transformer.unitCount} x ${fi(architecture.transformer.unitKva)} kVA`
                : `${sourceVoltage}V to ${loadVoltage}V`,
              meta: `${sourceVoltage}V to ${loadVoltage}V`,
              tone: 'distribution' as const,
            }]
          : []),
        {
          id: 'PANELS',
          label: 'Branch Panels',
          detail: inputs.mode === 'basecamp'
            ? `RV / trailers / concessions${includeCooling ? ' + cooling' : ''}`
            : includeCooling ? 'equipment + cooling feeders' : 'equipment feeders',
          meta: 'final distribution shown',
          tone: 'distribution',
        },
      ],
    },
    {
      label: 'Loads',
      nodes: loadNodes,
    },
    {
      label: 'Service',
      nodes: [
        {
          id: 'SERVICE',
          label: 'EMaaS Service Cadence',
          detail: `${fi(results.serviceEvents)} PM events`,
          meta: `${fi(results.totalFuelGallons)} gal fuel plan`,
          tone: 'service',
        },
      ],
    },
  ]

  const edges: OneLineEdge[] = [
    { from: 'GEN', to: 'SOURCE_CTRL', label: `${sourceVoltage}V 3-phase` },
    { from: 'SOURCE_CTRL', to: 'SWGR', label: 'protected source bus' },
    ...(transformerRequired
      ? [
          { from: 'SWGR', to: 'XFMR', label: `${sourceVoltage}V` },
          { from: 'XFMR', to: 'PANELS', label: `${loadVoltage}V` },
        ] as OneLineEdge[]
      : [{ from: 'SWGR', to: 'PANELS', label: `${loadVoltage}V` }]),
    { from: 'PANELS', to: primaryLoadNodes[0].id, label: 'branch circuits' },
    ...(includeCooling ? [{ from: 'PANELS', to: 'COOLING', label: 'cooling feeder' }] : []),
    { from: 'GEN', to: 'SERVICE', label: 'fuel / PM', kind: 'service' },
  ]

  return finishDiagram({
    title: 'Temporary Power One-Line Diagram',
    caption: 'Conceptual planning topology for generation, controls, voltage transformation, distribution, load branches, and EMaaS service assumptions.',
    stages,
    edges,
    assumptions: [
      'Final conductor sizing, grounding, fault current, protection, and selective coordination require engineering review.',
      `${architecture?.selected.label ?? 'Generator source'} with${includeCooling ? '' : 'out'} the optional temporary-cooling branch.`,
      transformerRequired
        ? `${sourceVoltage}V generation is stepped down to ${loadVoltage}V for the downstream loads.`
        : `Source and load voltage are both ${loadVoltage}V, so no transformer is shown.`,
      inputs.mode === 'basecamp'
        ? `Base-camp view emphasizes final distribution to trailers, concessions, and RV support${includeCooling ? ', plus the selected cooling load' : ''}.`
        : `Single-load view emphasizes the main equipment load${includeCooling ? ' plus the selected cooling equipment demand' : ''}.`,
    ],
  })
}

export function buildHybridOneLineDiagram(
  inputs: HybridWizardInputs,
  results: HybridWizardResults,
  zones: { id: string; name: string; kw: number }[] = [],
): OneLineDiagram {
  const powerFactor = Math.max(0.1, Math.min(1, inputs.powerFactor ?? 0.8))
  const loadVoltage = inputs.loadVoltage ?? inputs.siteVoltage
  const loadPhase = inputs.loadPhase ?? 'three'
  const routeSections = Math.max(1, Math.ceil((inputs.longestCableRouteFt ?? 100) / 50))
  const neutralConductors = inputs.neutralPlan === 'not_carried' ? 4 : inputs.neutralPlan === 'required' ? 5 : null
  const zoneNodes: OneLineNode[] = zones.length > 0
    ? zones.map((zone, index) => ({
        id: `ZONE_${index + 1}`,
        label: zone.name || `Zone ${index + 1}`,
        detail: `${fi(zone.kw)} kW`,
        meta: loadPhase === 'single'
          ? `${fi((zone.kw * 1000) / (loadVoltage * powerFactor))} A branch at ${loadVoltage}V 1-phase`
          : `${fi((zone.kw * 1000) / (Math.sqrt(3) * loadVoltage * powerFactor))} A/phase at ${loadVoltage}V`,
        tone: 'load' as const,
      }))
    : [
        {
          id: 'LOADBUS',
          label: 'Critical Load Bus',
          detail: `${fi(inputs.peakLoadKw)} kW peak`,
          meta: `${fi(inputs.baseLoadKw)} kW base`,
          tone: 'load',
        },
      ]

  const stages: OneLineStage[] = [
    {
      label: 'Source',
      nodes: [
        {
          id: 'GEN',
          label: 'Generator Plant',
          detail: `${results.genUnits} x ${results.genUnitSizeKw} kW`,
          meta: `${fi(results.generatorFirmCapacityKw)} kW firm · ${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby`,
          tone: 'source',
        },
        {
          id: 'BESS',
          label: 'BESS Plant',
          detail: `${results.bessUnits} x ${results.bessUnitContinuousKw} kW continuous`,
          meta: `${results.bessRequiredUnits} duty + ${results.bessStandbyUnits} standby · ${fi(results.bessFirmCapacityKw)} kW firm`,
          tone: 'storage',
        },
      ],
    },
    {
      label: 'Protection',
      nodes: [
        {
          id: 'GEN_CB',
          label: 'Generator Breaker',
          detail: '52G source protection',
          meta: 'rating and settings by engineer',
          tone: 'distribution',
        },
        {
          id: 'BESS_CB',
          label: 'BESS Breaker',
          detail: '52B PCS protection',
          meta: 'bidirectional duty · verify',
          tone: 'distribution',
        },
      ],
    },
    {
      label: 'Control',
      nodes: [
        {
          id: 'EMS',
          label: 'DEIF Energy Controller',
          detail: 'SOC threshold / remote start / staged recharge',
          meta: inputs.redundancy === '2n' ? '2N topology' : inputs.redundancy === 'n1' ? 'N+1 topology' : 'N topology',
          tone: 'control',
        },
        {
          id: 'ATS',
          label: 'Paralleling Gear',
          detail: `${fi(results.peakAmpsPerPhase)} A/phase`,
          meta: `${Math.ceil(Math.round(results.peakAmpsPerPhase) / 400)} legs/phase · ${routeSections} x 50 ft · ${neutralConductors ?? '4-5'} conductors/set`,
          tone: 'control',
        },
      ],
    },
    {
      label: 'Distribution',
      nodes: [
        {
          id: 'SWGR',
          label: `${inputs.siteVoltage}V Switchgear`,
          detail: `${fi(results.peakAmpsPerPhase)} A protected bus`,
          meta: `${fi(inputs.peakLoadKw)} kW customer-load basis`,
          tone: 'distribution',
        },
      ],
    },
    ...(inputs.siteVoltage !== loadVoltage
      ? [{
          label: 'Transformation',
          nodes: [{
            id: 'XFMR',
            label: 'Step-Down Transformer',
            detail: `${inputs.siteVoltage}V to ${loadVoltage}V`,
            meta: 'grounding and protection require engineering',
            tone: 'distribution' as const,
          }],
        }]
      : []),
    {
      label: 'Service',
      nodes: [{
        id: 'PANEL',
        label: 'Customer Service Main',
        detail: loadPhase === 'single'
          ? `Balanced ${loadVoltage}V single-phase feeder distribution`
          : `${fi((inputs.peakLoadKw * 1000) / (Math.sqrt(3) * loadVoltage * powerFactor))} A/phase at ${loadVoltage}V, 3-phase`,
        meta: loadPhase === 'single'
          ? `${fi((inputs.peakLoadKw * 1000) / (Math.sqrt(3) * loadVoltage * powerFactor))} A/phase equivalent · branch nameplates verify`
          : 'protected load handoff',
        tone: 'distribution',
      }],
    },
    {
      label: 'Loads',
      nodes: zoneNodes,
    },
  ]

  const edges: OneLineEdge[] = [
    { from: 'GEN', to: 'GEN_CB', label: 'generator feeder' },
    { from: 'BESS', to: 'BESS_CB', label: 'PCS AC output' },
    { from: 'GEN_CB', to: 'ATS', label: 'protected source' },
    { from: 'BESS_CB', to: 'ATS', label: 'bidirectional source' },
    { from: 'EMS', to: 'GEN', label: 'remote start', kind: 'control' },
    { from: 'EMS', to: 'BESS', label: 'SOC telemetry', kind: 'control' },
    { from: 'EMS', to: 'ATS', label: 'dispatch control', kind: 'control' },
    { from: 'ATS', to: 'SWGR', label: `${inputs.siteVoltage}V 3-phase` },
    ...(inputs.siteVoltage !== loadVoltage
      ? [
          { from: 'SWGR', to: 'XFMR', label: `${routeSections} x 50 ft protected feeders` },
          { from: 'XFMR', to: 'PANEL', label: loadPhase === 'single' ? `${loadVoltage}V balanced 1-phase feeders` : `${loadVoltage}V secondary` },
        ] as OneLineEdge[]
      : [{ from: 'SWGR', to: 'PANEL', label: `${routeSections} x 50 ft protected feeders` }]),
    ...zoneNodes.map((node) => ({ from: 'PANEL', to: node.id, label: 'branch feeder' })),
  ]

  if (results.motorAssignments.length > 0) {
    stages[stages.length - 1].nodes.push({
      id: 'MOTORS',
      label: 'Motor / Compressor Loads',
      detail: `${results.motorAssignments.length} motor note(s)`,
      meta: 'Starting and protection remain vendor/engineering verification',
      tone: 'load',
    })
    edges.push({ from: 'PANEL', to: 'MOTORS', label: 'motor feeder - verify' })
  }

  return finishDiagram({
    title: 'Hybrid Energy One-Line Diagram',
    caption: 'Planning topology (estimates) for generator, BESS, dispatch control, switchgear, and load-zone handoff.',
    stages,
    edges,
    assumptions: [
      'Final one-line drawings require licensed engineering review, protection settings, grounding plan, and site-specific disconnect locations.',
      'Workshop-style logic: groups can compare whether they separate peak support, base generation, transfer equipment, and load-zone boundaries.',
      zones.length > 0
        ? 'Zone nodes reflect the optional power-zone schedule entered in the workflow.'
        : 'Critical-load bus is shown when no power zones are entered.',
      loadPhase === 'single'
        ? 'Single-phase branch loads must be balanced across the three-phase source; final feeder ratings require the trailer nameplates.'
        : 'Downstream loads are represented as three-phase distribution.',
    ],
  })
}
