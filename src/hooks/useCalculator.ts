import { useMemo } from 'react'

export function useCalculator<TInputs, TResults>(
  inputs: TInputs,
  calculate: (inputs: TInputs) => TResults | null,
): TResults | null {
  return useMemo(() => {
    try {
      return calculate(inputs)
    } catch {
      return null
    }
  }, [inputs, calculate])
}
