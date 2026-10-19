// Native request assembly: the one builder for the frozen compile request.
// It takes the spec, the own roster, the primitive names, the roots, the
// scope and what the upstreams publish, and emits the frozen request every
// compile call shares, plus upstream keys only when they say something.
// One home, so the CORE-SYNC-04 pin never drifts across call sites again.

import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import type { LogChannel } from '../config/types.ts'
import type { ScopedCompileRequest } from './contract.ts'

export function uniqueSorted(names: readonly string[]): string[] {
  return [...new Set(names)].sort()
}

/**
 * The request parts the builder joins. `primitiveNames` arrives as a plain
 * param: callers read it from the element vocabulary, and the builder
 * takes it rather than importing the shelf itself.
 */
export interface CompileRequestInput {
  spec: EvaluatedSystemSpec
  /** The app's own configured names (the roster's `local` bucket), never an upstream's. */
  requested: string[]
  primitiveNames: readonly string[]
  sourceRoot: string
  declarationRoot: string
  include: string[]
  logs?: LogChannel[]
  /**
   * Upstream container root verdict: set only when an extends/layers
   * system roots one, so the key drops from the serialized request
   * otherwise and the CORE-SYNC-04 pin stays byte-identical.
   */
  upstreamContainerRoot?: boolean
  /**
   * Upstream system names (extends then layers, self excluded) for external
   * want qualification. Set only when non-empty so the key drops from the
   * serialized request otherwise and the CORE-SYNC-04 pin stays byte-identical.
   */
  upstreamSystems?: string[]
  /**
   * The upstream systems whose tokens the vocabulary carries (the extends
   * closure): the engine's token layer also claims their stamps. Set only
   * when non-empty, so the CORE-SYNC-04 pin stays byte-identical.
   */
  extendedSystems?: string[]
  /**
   * The names each extended upstream publishes, by system name. They stay
   * out of `jsxHosts`: an upstream's component is never an own host. Set
   * only when one names a component, so the CORE-SYNC-04 pin stays byte-identical.
   */
  upstreamHosts?: Record<string, string[]>
}

// A copy of the map without the systems that name nothing, or undefined when none names a component.
function upstreamHostsField(
  hosts: Record<string, string[]> | undefined
): Record<string, string[]> | undefined {
  const entries = Object.entries(hosts ?? {}).filter(([, names]) => names.length > 0)
  return entries.length > 0
    ? Object.fromEntries(entries.map(([system, names]) => [system, [...names]]))
    : undefined
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
    upstreamContainerRoot: input.upstreamContainerRoot || undefined,
    // Arrays are truthy: `|| undefined` would keep the key present-empty and
    // break the CORE-SYNC-04 byte-diff, so length-gate instead.
    upstreamSystems: input.upstreamSystems?.length ? [...input.upstreamSystems] : undefined,
    extendedSystems: input.extendedSystems?.length ? [...input.extendedSystems] : undefined,
    upstreamHosts: upstreamHostsField(input.upstreamHosts),
  }
}
