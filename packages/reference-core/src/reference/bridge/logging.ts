// Reference bridge logging: one diagnostic line per failed tasty build.
// It takes the thrown error and emits the reporter's `[ref]` line with the TST code and the message, and no raw error or stack.
// The line goes to stderr like every other failure, through the verbose-list formatter the other ref diagnostics use. Success is
// silent, and only failures stay here.

import { formatVerboseWarningLine } from '../../diagnostics/format.ts'
import type { CoreDiagnostic } from '../../diagnostics/types.ts'

// A coded engine failure leads with its code, as `TST-E-SCAN-FAILED: message`.
const CODED_FAILURE = /^([A-Z]+-[A-Z]-[A-Z0-9-]+): ([\s\S]*)$/

export function logReferenceError(error: unknown): void {
  console.error(formatReferenceFailure(error))
}

/** The one diagnostic line for a failed build, in the verbose ref format; a multi-line message collapses onto one line. */
export function formatReferenceFailure(error: unknown): string {
  const text = (error instanceof Error ? error.message : String(error)).replace(/\s*\n\s*/g, ' ').trim()
  return formatVerboseWarningLine({ entry: failureEntry(text), count: 1 }, 'ref')
}

function failureEntry(text: string): CoreDiagnostic {
  const match = CODED_FAILURE.exec(text)
  if (match === null || match[1] === undefined) {
    return { severity: 'error', message: `reference tasty build failed: ${text}` }
  }
  return { severity: 'error', code: match[1], message: `reference tasty build failed: ${match[2] ?? ''}` }
}
