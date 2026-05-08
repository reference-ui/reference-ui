/**
 * Extract a flat name → pixel-width string lookup table from collected
 * `tokens()` fragments. Only the `breakpoints` category is read; the value
 * for each entry must be a string in the form `"<n>px"` (or a plain numeric
 * string, which is passed through). Other unit suffixes (em/rem/etc.) are
 * rejected with a build-time error since container queries require px.
 *
 * The resulting table is consumed by `createRExtension(breakpoints)` to
 * resolve named breakpoint keys in the `r` prop at config build time.
 */

export interface TokenLikeValue {
  value?: unknown
  [k: string]: unknown
}

export interface BreakpointTokenFragment {
  breakpoints?: Record<string, TokenLikeValue | string | number>
  [k: string]: unknown
}

const PX_RE = /^\s*(-?\d+(?:\.\d+)?)\s*px\s*$/i
const NUMERIC_RE = /^\s*(-?\d+(?:\.\d+)?)\s*$/

function normalizeWidth(name: string, raw: unknown): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw)
  }
  if (typeof raw !== 'string') {
    throw new Error(
      `[reference-ui] tokens({ breakpoints: { ${name}: ... } }) must be a string ` +
        `in the form "<n>px" (got ${typeof raw}).`
    )
  }
  const px = raw.match(PX_RE)
  if (px) return px[1]!
  const num = raw.match(NUMERIC_RE)
  if (num) return num[1]!
  throw new Error(
    `[reference-ui] Breakpoint "${name}" must be expressed in px (got "${raw}"). ` +
      `Container queries require pixel widths.`
  )
}

export function extractBreakpointTable(
  fragments: ReadonlyArray<BreakpointTokenFragment | undefined | null>
): Record<string, string> {
  const table: Record<string, string> = {}
  for (const fragment of fragments) {
    if (!fragment || typeof fragment !== 'object') continue
    const breakpoints = (fragment as BreakpointTokenFragment).breakpoints
    if (!breakpoints || typeof breakpoints !== 'object') continue
    for (const [name, entry] of Object.entries(breakpoints)) {
      if (entry && typeof entry === 'object' && 'value' in entry) {
        table[name] = normalizeWidth(name, (entry as TokenLikeValue).value)
      } else {
        table[name] = normalizeWidth(name, entry as unknown)
      }
    }
  }
  return table
}
