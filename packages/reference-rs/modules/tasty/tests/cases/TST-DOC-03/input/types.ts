/** Interface comment. */
export interface Window {
  /** The month. */
  month?: string // YYYY-MM
  /** Called when the month changes. */
  onMonthChange?: () => void
  year?: number // YYYY
  bare?: boolean
  // standalone note
  note?: string
}

export type WindowLiteral = {
  /** The month. */
  month?: string // YYYY-MM
  /** Called when the month changes. */
  onMonthChange?: () => void
  year?: number /* YYYY */
  bare?: boolean
}
