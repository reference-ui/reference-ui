/**
 * Contract interfaces and options for Reference UI declaration generation.
 * Defines the input request shape accepting an EvaluatedSystemSpec and strict array.
 * Re-exports the shared EvaluatedSystemSpec contract used across Rust and Core.
 * Ensures consistent typings for synchronous and asynchronous emit entrypoints.
 */
import type { EvaluatedSystemSpec } from '../../../contracts/types.js'

export type { EvaluatedSystemSpec }

export interface EmitDtsOptions {
  baseSystem: EvaluatedSystemSpec
  strict?: string[]
}

export type PropValueDomain = 'color' | 'spacing' | 'radius' | 'container' | 'rhythm' | 'open'

export interface PrimitivesVocabulary {
  props: string[]
  domains: Record<string, PropValueDomain>
  conditions: string[]
  aliases: Record<string, string>
  dialect: string[]
}
