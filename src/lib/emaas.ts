import {
  Activity,
  BatteryCharging,
  BellRing,
  ClipboardCheck,
  FileBarChart,
  Fuel,
  Gauge,
  Network,
  ShieldCheck,
  Snowflake,
  type LucideIcon,
} from 'lucide-react'

export interface EmaasOutcomeMetric {
  label: string
  value: string
  context: string
  icon: LucideIcon
  tone: 'gold' | 'blue' | 'coral' | 'slate'
}

export interface EmaasOperatingVariable {
  label: string
  detail: string
  icon: LucideIcon
}

export const EMAAS_POSITIONING =
  'Mission-critical energy operations console for turning load profiles, site constraints, power assets, cooling demand, fuel exposure, and reporting cadence into a branch-ready plan.'

export const EMAAS_OUTCOME_METRICS: EmaasOutcomeMetric[] = [
  {
    label: 'Available Power',
    value: 'kW / kVA',
    context: 'capacity, phase, redundancy, transformer, and parallel-run exposure',
    icon: Gauge,
    tone: 'gold',
  },
  {
    label: 'Stored Energy',
    value: 'kWh',
    context: 'usable reserve, discharge window, SOC planning, and runtime',
    icon: BatteryCharging,
    tone: 'blue',
  },
  {
    label: 'Fuel Exposure',
    value: 'gal / day',
    context: 'load-factor BSFC, derates, duty cycle, service cadence, and hybrid savings',
    icon: Fuel,
    tone: 'coral',
  },
  {
    label: 'Cooling Load',
    value: 'tons / CFM',
    context: 'equipment heat, envelope gain, latent load, airside checks, and chiller sizing',
    icon: Snowflake,
    tone: 'slate',
  },
]

export const EMAAS_OPERATING_VARIABLES: EmaasOperatingVariable[] = [
  {
    label: 'Load Profile',
    detail: 'Peak, base, duty cycle, phase, voltage, power factor, and measured-versus-panel source quality.',
    icon: Activity,
  },
  {
    label: 'Asset Mix',
    detail: 'Generators, BESS, distribution, transformers, cooling, fuel, redundancy, and site handoff scope.',
    icon: Network,
  },
  {
    label: 'Control Sequence',
    detail: 'SOC reserve, recharge windows, peak shaving, quiet-hours dispatch, transfer tolerance, and inrush behavior.',
    icon: ShieldCheck,
  },
  {
    label: 'Monitoring + Alerts',
    detail: 'Runtime, load, fuel, SOC, exception alerts, service windows, and executive reporting cadence.',
    icon: BellRing,
  },
  {
    label: 'Service Cadence',
    detail: 'PM interval, technician coverage, containment posture, grounding assumptions, and escalation triggers.',
    icon: ClipboardCheck,
  },
  {
    label: 'Report Package',
    detail: 'Client, project phase, formulas, assumptions, risk notes, and engineering validation status.',
    icon: FileBarChart,
  },
]

export const EMAAS_FIELD_MODES = [
  'Data center construction',
  'Commissioning blocks',
  'Temporary worker campus',
  'Critical facility cooling',
  'Utility-delay bridge power',
  'Event and opening support',
] as const
