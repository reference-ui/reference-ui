/**
 * Wire-code vocabulary for diagnostics: the template namespace, the registered namespace table, and code validation.
 * Takes unknown input at the boundary and returns a valid `NS-SEV-NAME` code, or throws `DiagnosticParseError` with the reason.
 * Registration is advisory: a well-shaped code from an unlisted namespace still parses, so consumers keep reading newer codes.
 * The error class lives here so the location and diagnostic modules share one failure type without importing the barrel.
 */

/** Wire code text (`NS-SEV-NAME`); validated by `parseCode`, not by the type. */
export type DiagnosticCode = string

/** Namespace owned by the template itself; mirrors `TEMPLATE_NAMESPACE` in Rust. */
export const TEMPLATE_NAMESPACE = 'RS'

/**
 * Machine-readable copy of the REGISTRY.md namespace table; mirrors `REGISTERED_NAMESPACES`.
 * Advisory only: parsing stays shape-open so consumers keep reading newer codes.
 */
export const REGISTERED_NAMESPACES: readonly string[] = [
  'RS',
  'ATM',
  'ATL',
  'TST',
  'STT',
  'TGN',
  'CAN',
  'BSS',
  'MGP',
]

const CODE_PATTERN = /^([A-Z][A-Z0-9]{1,3})-([WE])-([A-Z0-9]+(?:-[A-Z0-9]+)*)$/
const MAX_CODE_LENGTH = 64

/** A payload that failed template validation, carrying the reason. */
export class DiagnosticParseError extends Error {
  override name = 'DiagnosticParseError'
}

/** Parse and validate a wire code; anything off-shape throws with the reason. */
export function parseCode(input: unknown): DiagnosticCode {
  if (typeof input !== 'string')
    throw new DiagnosticParseError('diagnostic code must be a string')
  if (input.length > MAX_CODE_LENGTH) {
    throw new DiagnosticParseError('diagnostic code exceeds 64 characters')
  }
  if (input.split('-')[1] === 'I') {
    throw new DiagnosticParseError(
      'severity tag `I` is reserved; the template carries warnings and errors only'
    )
  }
  if (!CODE_PATTERN.test(input)) {
    throw new DiagnosticParseError(`invalid diagnostic code: ${input}`)
  }
  return input
}

/** Namespace segment of a validated code, e.g. `ATM`. */
export function codeNamespace(code: DiagnosticCode): string {
  return code.split('-')[0]!
}

/** Severity tag a code was minted with: `W` or `E`. */
export function codeSeverityTag(code: DiagnosticCode): 'W' | 'E' {
  return code.split('-')[1] === 'E' ? 'E' : 'W'
}

/** Advisory check against the registry table; unregistered but well-shaped codes still parse. */
export function isRegisteredNamespace(code: DiagnosticCode): boolean {
  return REGISTERED_NAMESPACES.includes(codeNamespace(code))
}
