// Native request assembly: the one builder for the frozen compile request.
// It takes the spec, the resolved roster, the primitive names, the roots,
// and the scope, and emits the six-key request every compile call shares.
// One home, so the SYNC-04 pin never drifts across call sites again.

import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import type { LogChannel } from '../config/types.ts'
import type { ScopedCompileRequest } from './contract.ts'

export function uniqueSorted(names: readonly string[]): string[] {
  return [...new Set(names)].sort()
}

/**
 * The request parts the builder joins. `primitiveNames` arrives as a plain
 * param: callers read it from the E1 element vocabulary, and the builder
 * takes it rather than importing the shelf itself.
 */
export interface CompileRequestInput {
  spec: EvaluatedSystemSpec
  requested: string[]
  primitiveNames: readonly string[]
  sourceRoot: string
  declarationRoot: string
  include: string[]
  logs?: LogChannel[]
}

export function buildCompileRequest(input: CompileRequestInput): ScopedCompileRequest {
  return {
    schemaVersion: 2,
    spec: input.spec,
    jsxHosts: uniqueSorted([...input.requested, ...input.primitiveNames]),
    sourceRoot: input.sourceRoot,
    declarationRoot: input.declarationRoot,
    include: input.include,
    logs: input.logs,
  }
}
