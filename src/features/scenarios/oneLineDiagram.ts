import type {
  HybridWizardInputs,
  HybridWizardResults,
  TempPowerInputs,
  TempPowerResults,
} from './scenario.formulas'

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
    lines.push(`  ${edge.from} -->${label} ${edge.to}`)
  }
  lines.push('  classDef source fill:#1a1f2e,stroke:#c89a3c,color:#f1f5f9')
  lines.push('  classDef storage fill:#102333,stroke:#38bdf8,color:#f1f5f9')
  lines.push('  classDef control fill:#141a25,stroke:#d4ad52,color:#f1f5f9')
  lines.push('  classDef distribution fill:#101827,stroke:#94a3b8,color:#f1f5f9')
  lines.push('  classDef load fill:#241719,stroke:#e07460,color:#f1f5f9')
  lines.push('  classDef service fill:#151515,stroke:#6b7280,color:#f1f5f9')
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

export function buildTempPowerOneLineDiagram(inputs: TempPowerInputs, results: TempPowerResults): OneLineDiagram {
  const generatorUnits = Math.max(1, Math.ceil(results.generatorKw / 500))
  const legsPerPhase = Math.max(1, Math.ceil(results.ampsPerPhase / 400))
  const hybridRecommended = Boolean(results.hybrid?.recommended)

  const loadNodes: OneLineNode[] = inputs.mode === 'basecamp'
    ? [
        {
          id: 'LOAD_BASECAMP',
          label: 'Base Camp Loads',
          detail: `${fi(results.totalLoadKw)} kW equipment`,
          meta: results.facilityBreakdown.slice(0, 3).map((f) => f.label).join(', ') || 'facility schedule',
          tone: 'load',
        },
        {
          id: 'COOLING',
          label: 'Cooling Plant',
          detail: `${fv(results.coolingTons)} tons`,
          meta: `${fi(results.coolingKw)} kW cooling load`,
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
        {
          id: 'COOLING',
          label: 'Cooling Plant',
          detail: `${fv(results.coolingTons)} tons`,
          meta: `${fi(results.coolingKw)} kW cooling load`,
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
          detail: `${generatorUnits} x planning unit`,
          meta: `${fi(results.generatorKva)} kVA / ${fi(results.generatorKw)} kW`,
          tone: 'source',
        },
        ...(hybridRecommended && results.hybrid
          ? [{
              id: 'BESS',
              label: 'BESS Peak Support',
              detail: `${results.hybrid.hybrid.bessUnits} x ${results.hybrid.hybrid.bessUnitSize} kW`,
              meta: 'peak shaving / generator load control',
              tone: 'storage' as const,
            }]
          : []),
      ],
    },
    {
      label: 'Control',
      nodes: [
        {
          id: 'ATS',
          label: 'ATS / EMaaS Controller',
          detail: hybridRecommended ? 'hybrid dispatch + transfer logic' : 'generator dispatch + transfer logic',
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
          label: '480V Switchgear',
          detail: `${fi(results.ampsPerPhase)} A/phase`,
          meta: results.parallelRunsNeeded ? `${legsPerPhase} cable legs per phase` : 'single cable set check',
          tone: 'distribution',
        },
        {
          id: 'XFMR',
          label: 'Step-Down Transformers',
          detail: '480V to 120/208V',
          meta: inputs.containmentRequired === false ? 'confirm containment spec' : '110% contained equipment',
          tone: 'distribution',
        },
        {
          id: 'PANELS',
          label: 'Branch Panels',
          detail: inputs.mode === 'basecamp' ? 'RV / trailers / concessions' : 'equipment + cooling feeders',
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
    { from: 'GEN', to: 'ATS', label: '480V 3-phase' },
    ...(hybridRecommended ? [{ from: 'BESS', to: 'ATS', label: 'DC/AC inverter' }] : []),
    { from: 'ATS', to: 'SWGR', label: 'protected feeder' },
    { from: 'SWGR', to: 'XFMR', label: 'distribution' },
    { from: 'XFMR', to: 'PANELS', label: '120/208V' },
    { from: 'PANELS', to: loadNodes[0].id, label: 'branch circuits' },
    { from: 'PANELS', to: 'COOLING', label: 'cooling feeders' },
    { from: 'GEN', to: 'SERVICE', label: 'fuel / PM' },
  ]

  return finishDiagram({
    title: 'Temporary Power One-Line Diagram',
    caption: 'Planning-grade topology for source, transfer, distribution, load branches, and EMaaS service assumptions.',
    stages,
    edges,
    assumptions: [
      'Final conductor sizing, grounding, fault current, protection, and selective coordination require engineering review.',
      'Workshop-style logic: groups can compare source strategy, distribution topology, service cadence, and load grouping.',
      inputs.mode === 'basecamp'
        ? 'Base-camp view emphasizes final distribution to trailers, concessions, RV support, and cooling loads.'
        : 'Single-load view emphasizes the main equipment load plus temporary cooling support.',
    ],
  })
}

export function buildHybridOneLineDiagram(
  inputs: HybridWizardInputs,
  results: HybridWizardResults,
  zones: { id: string; name: string; kw: number }[] = [],
): OneLineDiagram {
  const zoneNodes: OneLineNode[] = zones.length > 0
    ? zones.slice(0, 4).map((zone, index) => ({
        id: `ZONE_${index + 1}`,
        label: zone.name || `Zone ${index + 1}`,
        detail: `${fi(zone.kw)} kW`,
        meta: `${fi((zone.kw * 1000) / (Math.sqrt(3) * 480 * 0.8))} A/phase at 480V`,
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
          meta: `${fi(results.genCapacityKw)} kW base capacity`,
          tone: 'source',
        },
        {
          id: 'BESS',
          label: 'BESS Plant',
          detail: `${results.bessUnits} x ${inputs.bessUnitSize} kW`,
          meta: `${fi(results.bessEnergyKwh)} kWh peak window`,
          tone: 'storage',
        },
      ],
    },
    {
      label: 'Control',
      nodes: [
        {
          id: 'EMS',
          label: 'EMaaS Controller',
          detail: 'SOC reserve / recharge / peak dispatch',
          meta: inputs.redundancy === '2n' ? '2N topology' : inputs.redundancy === 'n1' ? 'N+1 topology' : 'N topology',
          tone: 'control',
        },
        {
          id: 'ATS',
          label: 'ATS / Parallel Gear',
          detail: `${fi(results.peakAmpsPerPhase)} A/phase`,
          meta: results.parallelRunsNeeded ? `${Math.ceil(results.peakAmpsPerPhase / 400)} cable legs per phase` : 'single cable set check',
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
          detail: `${fi(results.totalCapacityKw)} kW system capacity`,
          meta: 'main protected bus',
          tone: 'distribution',
        },
        {
          id: 'XFMR',
          label: 'Transformer / Panels',
          detail: inputs.siteVoltage === 480 ? '480V to branch distribution' : `${inputs.siteVoltage}V to 480V/120-208V`,
          meta: 'site distribution interface',
          tone: 'distribution',
        },
      ],
    },
    {
      label: 'Loads',
      nodes: zoneNodes,
    },
  ]

  const edges: OneLineEdge[] = [
    { from: 'GEN', to: 'EMS', label: 'base load' },
    { from: 'BESS', to: 'EMS', label: 'peak load' },
    { from: 'EMS', to: 'ATS', label: 'dispatch logic' },
    { from: 'ATS', to: 'SWGR', label: `${inputs.siteVoltage}V 3-phase` },
    { from: 'SWGR', to: 'XFMR', label: 'protected feeders' },
    ...zoneNodes.map((node) => ({ from: 'XFMR', to: node.id, label: 'branch feeder' })),
  ]

  if (results.motorAssignments.length > 0) {
    stages[3].nodes.push({
      id: 'MOTORS',
      label: 'Motor / Compressor Loads',
      detail: `${results.motorAssignments.length} inrush checks`,
      meta: `${results.motorAssignments.filter((m) => m.assignment === 'generator').length} generator-assigned`,
      tone: 'load',
    })
    edges.push({ from: 'XFMR', to: 'MOTORS', label: 'inrush-managed feeder' })
  }

  return finishDiagram({
    title: 'Hybrid Energy One-Line Diagram',
    caption: 'Planning-grade topology for generator, BESS, dispatch control, switchgear, and load-zone handoff.',
    stages,
    edges,
    assumptions: [
      'Final one-line drawings require licensed engineering review, protection settings, grounding plan, and site-specific disconnect locations.',
      'Workshop-style logic: groups can compare whether they separate peak support, base generation, transfer equipment, and load-zone boundaries.',
      zones.length > 0
        ? 'Zone nodes reflect the optional power-zone schedule entered in the workflow.'
        : 'Critical-load bus is shown when no power zones are entered.',
    ],
  })
}
