export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

export function validatePositive(value: number, label: string): ValidationResult {
  if (value <= 0) return { valid: false, error: `${label} must be greater than zero` }
  return { valid: true }
}

export function validateRange(value: number, min: number, max: number, label: string): ValidationResult {
  if (value < min || value > max) {
    return { valid: false, error: `${label} must be between ${min} and ${max}` }
  }
  return { valid: true }
}

export function validatePowerFactor(pf: number): ValidationResult {
  if (pf <= 0 || pf > 1) return { valid: false, error: 'Power factor must be between 0.01 and 1.0' }
  if (pf < 0.5) return { valid: true, warning: 'Power factor below 0.5 is unusually low — verify your value' }
  return { valid: true }
}

export function validateVoltage(v: number): ValidationResult {
  if (v <= 0) return { valid: false, error: 'Voltage must be greater than zero' }
  if (v > 13800) return { valid: true, warning: 'Voltage above 13,800V — verify this is correct for your application' }
  return { valid: true }
}
