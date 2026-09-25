/**
 * Contract interfaces and options for Reference UI declaration generation.
 * Defines the input request shape accepting an EvaluatedSystemSpec and strict array.
 * Re-exports the shared EvaluatedSystemSpec contract used across Rust and Core.
 * Ensures consistent typings for synchronous and asynchronous emit entrypoints.
 */
import type { Diagnostic as TypegenDiagnostic } from '../../diagnostics/js/index.js'
import type { EvaluatedSystemSpec } from '../../../contracts/types.js'

export type { EvaluatedSystemSpec }
export type { TypegenDiagnostic }

export interface EmitDtsOptions {
  baseSystem: EvaluatedSystemSpec
  strict?: string[]
}

export type TypegenDiagnosticCode =
  | 'TGN-W-UNKNOWN-TOKEN-CATEGORY'
  | 'TGN-W-INVALID-RECIPE-NAME'
  | 'TGN-W-EMPTY-RECIPE'
  | 'TGN-W-INVALID-COMPOUND-VARIANT'
  | 'TGN-W-UNKNOWN-STRICT-CATEGORY'
  | 'TGN-W-ABSENT-STRICT-CATEGORY'
  | 'TGN-W-EMPTY-FONT-FAMILY'
  | 'TGN-E-INVALID-BASE-SYSTEM'
  | 'TGN-W-DUPLICATE-RECIPE-STEM'

export interface TypegenDetailedEmit {
  dts: string
  diagnostics: TypegenDiagnostic[]
}

export type PropValueDomain = 'color' | 'spacing' | 'radius' | 'container' | 'rhythm' | 'open'

export interface PrimitivesVocabulary {
  props: string[]
  domains: Record<string, PropValueDomain>
  conditions: string[]
  aliases: Record<string, string>
  dialect: string[]
}
