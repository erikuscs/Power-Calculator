export const SQRT3 = Math.sqrt(3)

export const BESS_UNIT_SIZES = [36, 50, 150, 300, 500, 600] as const
export type BessUnitSize = (typeof BESS_UNIT_SIZES)[number]

export const DIESEL_BSFC: Record<number, number> = {
  25: 0.105,
  50: 0.085,
  75: 0.072,
  100: 0.068,
}

export const NATURAL_GAS_CFH_PER_KW = 10.58

export const LAMP_EFFICACY: Record<string, number> = {
  LED: 90,
  CFL: 55,
  Fluorescent: 60,
  Halogen: 20,
  Incandescent: 15,
}

export const STRUCTURE_COOLING_MULTIPLIERS: Record<string, { multiplier: number; label: string }> = {
  canvas: { multiplier: 1.8, label: 'Canvas tent' },
  vinyl: { multiplier: 1.5, label: 'Vinyl/PVC tent' },
  rigid_plastic: { multiplier: 1.3, label: 'Rigid plastic panels' },
  container: { multiplier: 1.0, label: 'Hard-sided container' },
  sprung: { multiplier: 1.4, label: 'Sprung/fabric structure' },
}

export const FACILITY_PRESETS: Record<string, { label: string; defaultKw: number; unit: string; notes: string }> = {
  kitchen: { label: 'Commercial Kitchen', defaultKw: 50, unit: 'per 100 pax', notes: 'Scales per 100 people served' },
  dining: { label: 'Dining Hall', defaultKw: 15, unit: 'per 100 pax', notes: 'HVAC + lighting' },
  berthing: { label: 'Berthing', defaultKw: 40, unit: 'per 50 cots', notes: 'Cooling-dominated in summer' },
  restroom: { label: 'Restroom Trailer', defaultKw: 15, unit: 'per 50 pax', notes: 'Water heaters, pumps, exhaust' },
  shower: { label: 'Shower Trailer (8-head)', defaultKw: 20, unit: 'per unit', notes: 'Water heating is the big draw' },
  command: { label: 'Command Center', defaultKw: 30, unit: 'per 10 workstations', notes: 'IT + HVAC for server heat' },
  medical: { label: 'Medical Station', defaultKw: 25, unit: 'per unit', notes: 'Climate-critical, UPS recommended' },
  laundry: { label: 'Laundry Trailer', defaultKw: 35, unit: 'per unit', notes: 'Washers + dryers' },
  light_tower: { label: 'Light Tower', defaultKw: 1.5, unit: 'per pole', notes: 'LED flood' },
  fuel_pump: { label: 'Fuel Transfer Pump', defaultKw: 5, unit: 'per unit', notes: '' },
}

export const SAFETY_MARGINS = {
  generator: 1.25,
  ups: 1.25,
  chiller: 1.175,
  bess: 1.2,
  cooling_emergency: 1.15,
} as const

export const MOTOR_INRUSH_MULTIPLIERS = {
  dol: { min: 6, max: 8, label: 'Direct On Line (DOL)' },
  soft_start: { min: 2, max: 4, label: 'Soft Starter' },
  vfd: { min: 1.0, max: 1.5, label: 'Variable Frequency Drive (VFD)' },
} as const
