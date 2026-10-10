/**
 * Accessible-name text plumbing shared by the stepper name gate and the
 * Input's unnamed diagnosis: stepperNameText stringifies any authored
 * value, and stepperNameIds splits a labelledby value into target ids.
 */
export function stepperNameText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

export function stepperNameIds(labelledbyText: string): string[] {
  const trimmed = labelledbyText.trim()
  return trimmed === '' ? [] : trimmed.split(/\s+/)
}
