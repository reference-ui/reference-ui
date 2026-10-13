// Reference warnings as the one-line text MCP tool output carries.
// It takes one typed manifest diagnostic and emits `file:line:col CODE subject`
// through the rust diagnostics one-liner (`renderOneLine`), so the wording has one owner.

import { renderOneLine } from '@reference-ui/rust/diagnostics'
import type { RawTastyDiagnostic } from '@reference-ui/rust/tasty'

export function formatReferenceWarning(warning: RawTastyDiagnostic): string {
  return renderOneLine(warning)
}
