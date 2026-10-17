// Shared warning fixture for the output suites: one NativeDiagnostic with a default location, overridable field by
// field. Each call builds a fresh diagnostic, so no test shares mutable state.
import type { NativeDiagnostic } from '../../native/contract.ts'

export function warning(overrides: Partial<NativeDiagnostic> = {}): NativeDiagnostic {
  return {
    severity: 'warning',
    code: 'ATM-W-INVALID-CSS-VALUE',
    message: '`display: true` is not valid CSS',
    file: 'theme/warn.ts',
    line: 3,
    column: 33,
    ...overrides,
  }
}
