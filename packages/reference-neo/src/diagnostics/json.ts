// Neo JSON diagnostics: the machine-readable rendering for agents.
// It takes reported diagnostics and emits the canonical wire batch: one JSON
// array on one line, typed rows in template field order, legacy carries
// passed through verbatim. No dedupe, no channel tags, no color — folding
// and tagging are human presentation, while agents count and filter the raw
// rows themselves. Bytes are pinned by the contract tests: JSON is wire.
import { isTypedDiagnostic, toCanonicalRecord } from './transport.ts'
import type { NeoDiagnostic } from './types.ts'

function toJsonRow(entry: NeoDiagnostic): unknown {
  if (!isTypedDiagnostic(entry)) return entry
  return toCanonicalRecord(entry)
}

/**
 * Format reported diagnostics as the canonical JSON batch: one array, one
 * line, no trailing newline (the caller prints it). Typed rows emit the
 * schema fields in template order; legacy carries (info telemetry, codeless
 * stragglers) ride verbatim in producer key order until they earn codes.
 * Input order is preserved — channels concatenate caller-side as
 * userspace, compiler, ref.
 */
export function formatJsonDiagnostics(entries: readonly NeoDiagnostic[]): string {
  return JSON.stringify(entries.map(toJsonRow))
}
