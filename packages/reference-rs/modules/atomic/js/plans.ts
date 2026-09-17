/**
 * Runtime style plan indexing and slot-based merge evaluation for native Reference UI.
 * Provides deterministic canonical serialization of lookup keys matching the Rust core.
 * Indexes NativeRuntimeArtifact style plans by five-tuple lookup keys: (system, when, prop, value, important).
 * Resolves authored style declarations and evaluates last-wins cascades across aliases, shorthands, and conditions.
 */
import type { NativeRuntimeArtifact, RuntimeDeclaration } from './types.js'

export interface StylePlanQuery {
  system: string
  when?: string[]
  prop: string
  value: unknown
  important?: boolean
}

function serializeScalar(val: unknown): string | null {
  if (val === null) return 'null'
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'null'
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'string') return JSON.stringify(val)
  return null
}

function serializeObject(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const pairs = keys.map(k => JSON.stringify(k) + ':' + serializeCanonicalJson(obj[k]))
  return '{' + pairs.join(',') + '}'
}

/**
 * Deterministic JSON serializer that recursively sorts object keys lexicographically.
 * Matches serde_json serialization of Rust canonical_json_value exactly.
 */
export function serializeCanonicalJson(val: unknown): string {
  const scalar = serializeScalar(val)
  if (scalar !== null) return scalar
  if (Array.isArray(val)) {
    return '[' + val.map(serializeCanonicalJson).join(',') + ']'
  }
  if (typeof val === 'object') {
    return serializeObject(val as Record<string, unknown>)
  }
  return 'null'
}

/**
 * Serialize an authored style lookup target into a deterministic lookup key string.
 * Emits the five-tuple `[system, when, prop, canonicalValue, important]` as compact JSON.
 */
export function serializeLookupKey(
  system: string,
  when: string[],
  prop: string,
  value: unknown,
  important: boolean = false
): string {
  const parts = [
    JSON.stringify(system),
    '[' + when.map(w => JSON.stringify(w)).join(',') + ']',
    JSON.stringify(prop),
    serializeCanonicalJson(value),
    important ? 'true' : 'false',
  ]
  return '[' + parts.join(',') + ']'
}

/**
 * Build a lookup index mapping serialized five-tuple keys to resolved runtime declarations.
 */
export function createStylePlanIndex(
  artifact: NativeRuntimeArtifact
): Map<string, RuntimeDeclaration[]> {
  const index = new Map<string, RuntimeDeclaration[]>()
  for (const plan of artifact.stylePlans) {
    const key = serializeLookupKey(
      plan.system,
      plan.when,
      plan.prop,
      plan.value,
      plan.important
    )
    index.set(key, plan.declarations)
  }
  return index
}

/**
 * Resolve runtime declarations for a list of style plan queries using the indexed plans.
 * Missing plans are omitted; no runtime fallback or hashing is performed.
 */
export function resolveStyleDeclarations(
  index: Map<string, RuntimeDeclaration[]>,
  queries: StylePlanQuery[]
): RuntimeDeclaration[] {
  const decls: RuntimeDeclaration[] = []
  for (const query of queries) {
    const key = serializeLookupKey(
      query.system,
      query.when ?? [],
      query.prop,
      query.value,
      query.important ?? false
    )
    const matched = index.get(key)
    if (matched) {
      decls.push(...matched)
    }
  }
  return decls
}

/**
 * Split a cascade slot into its merge family and responsive breakpoint.
 * Engine slots read `[cond ':']* canonical ['@' bp]` (`derive_slot`): the
 * `@bp` suffix marks one responsive-expansion member (array index or
 * per-prop object key). The suffix is the text after the LAST '@' only when
 * that '@' sits after the last ':', because `r`-condition parts such as
 * `@container (min-width: 300px):p` carry a leading '@' of their own.
 */
export function splitSlot(slot: string): { family: string; breakpoint: string | null } {
  const at = slot.lastIndexOf('@')
  const colon = slot.lastIndexOf(':')
  if (at > colon) {
    return { family: slot.slice(0, at), breakpoint: slot.slice(at + 1) }
  }
  return { family: slot, breakpoint: null }
}

/**
 * Merge runtime declarations by cascade slot using last-wins semantics.
 * Returns the final space-delimited class string for the owner.
 * A later declaration evicts earlier same-family losers with overlapping
 * breakpoint coverage: a bare slot (no `@bp`, covers every breakpoint)
 * evicts the whole family, while a `@bp` member evicts the bare slot and
 * same-`@bp` members only, leaving other breakpoints untouched. Re-setting
 * an identical slot keeps its first-seen position; evicted slots re-enter
 * at the end.
 */
export function mergeDeclarations(declarations: RuntimeDeclaration[]): string {
  const slots = new Map<string, string>()
  for (const decl of declarations) {
    const current = splitSlot(decl.slot)
    for (const key of Array.from(slots.keys())) {
      if (key !== decl.slot && evictedBy(splitSlot(key), current)) {
        slots.delete(key)
      }
    }
    slots.set(decl.slot, decl.className)
  }
  return Array.from(slots.values()).join(' ')
}

function evictedBy(
  prev: { family: string; breakpoint: string | null },
  current: { family: string; breakpoint: string | null }
): boolean {
  if (prev.family !== current.family) return false
  return (
    current.breakpoint === null ||
    prev.breakpoint === null ||
    prev.breakpoint === current.breakpoint
  )
}

/**
 * Resolve and merge style plan queries in author order using last-wins cascade semantics.
 */
export function mergeStylePlans(
  index: Map<string, RuntimeDeclaration[]>,
  queries: StylePlanQuery[]
): string {
  const declarations = resolveStyleDeclarations(index, queries)
  return mergeDeclarations(declarations)
}
