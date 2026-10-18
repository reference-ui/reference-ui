// Slot-based merge evaluation over constructed declarations plus the
// canonical serializer the miss diagnostic formats values with. It takes
// named {slot, className} pairs and emits the merged class string:
// important beats plain, duplicates print once, and later same-family
// declarations evict earlier responsive members.
import type { RuntimeDeclaration } from '@reference-ui/rust/contracts'

/** One constructed declaration plus the importance of the query that named it. */
export interface ScoredDeclaration {
  decl: RuntimeDeclaration
  important: boolean
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
  const pairs = keys.map(
    k => JSON.stringify(k) + ':' + serializeCanonicalJson(obj[k])
  )
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
 * Split a cascade slot into its merge family and responsive breakpoint.
 * Mirrors the engine `splitSlot` exactly: the `@bp` suffix is the text
 * after the LAST '@' only when that '@' sits after the last ':', because
 * `r`-condition parts such as `@container (min-width: 300px):p` carry a
 * leading '@' of their own.
 */
export function splitSlot(slot: string): { family: string; breakpoint: string | null } {
  const at = slot.lastIndexOf('@')
  const colon = slot.lastIndexOf(':')
  if (at > colon) {
    return { family: slot.slice(0, at), breakpoint: slot.slice(at + 1) }
  }
  return { family: slot, breakpoint: null }
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
 * Merge runtime declarations by cascade slot using last-wins semantics.
 * Returns the final space-delimited class string for the owner.
 * Mirrors the engine merge exactly: a later declaration evicts earlier
 * same-family losers with overlapping breakpoint coverage — a bare slot
 * (no `@bp`, covers every breakpoint) evicts the whole family, while a
 * `@bp` member evicts the bare slot and same-`@bp` members only, leaving
 * other breakpoints untouched. Re-setting an identical slot keeps its
 * first-seen position; evicted slots re-enter at the end.
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

/**
 * Evict earlier same-family losers a later declaration displaces, mirroring
 * the engine merge. An important loser survives a plain evictor; equal
 * importance evicts last-wins. The identical slot is left for the set rule
 * below so re-setting it keeps its first-seen position.
 */
function evictFamilyLosers(
  slots: Map<string, ScoredDeclaration>,
  current: ScoredDeclaration
): void {
  const winner = splitSlot(current.decl.slot)
  for (const key of Array.from(slots.keys())) {
    if (key === current.decl.slot) {
      continue
    }
    const loser = slots.get(key)
    if (!loser || !evictedBy(splitSlot(key), winner)) {
      continue
    }
    if (loser.important && !current.important) {
      continue
    }
    slots.delete(key)
  }
}

/**
 * Tell whether a plain declaration adds no paint over surviving important
 * family: an important bare slot covers every breakpoint, an important
 * member covers its own breakpoint only, so a plain bare slot beside an
 * important member still paints the member's gaps and is kept.
 */
function isCoveredByImportant(
  slots: Map<string, ScoredDeclaration>,
  current: ScoredDeclaration
): boolean {
  if (current.important) {
    return false
  }
  const covered = splitSlot(current.decl.slot)
  for (const scored of slots.values()) {
    if (!scored.important) {
      continue
    }
    const shield = splitSlot(scored.decl.slot)
    if (shield.family !== covered.family) {
      continue
    }
    if (shield.breakpoint === null || shield.breakpoint === covered.breakpoint) {
      return true
    }
  }
  return false
}

/**
 * Merge constructed declarations in author order. Each cascade slot
 * keeps one class: an important declaration beats a plain one regardless of
 * order, equal importance collapses last-wins, and a class shared across
 * slots prints once. A later declaration also evicts earlier same-family
 * losers with overlapping breakpoint coverage (a later bare alias evicts
 * an earlier responsive expansion and vice versa), mirroring the engine
 * merge; important losers survive plain evictors. Slots keep first-seen
 * order, so base, container, and theme classes follow the author's order
 * deterministically.
 */
export function mergeStylePlans(scored: ScoredDeclaration[]): string {
  const slots = new Map<string, ScoredDeclaration>()
  for (const current of scored) {
    evictFamilyLosers(slots, current)
    if (isCoveredByImportant(slots, current)) {
      continue
    }
    const prev = slots.get(current.decl.slot)
    if (!prev || current.important || !prev.important) {
      slots.set(current.decl.slot, current)
    }
  }
  const seen = new Set<string>()
  const classes: string[] = []
  for (const scored of slots.values()) {
    if (seen.has(scored.decl.className)) {
      continue
    }
    seen.add(scored.decl.className)
    classes.push(scored.decl.className)
  }
  return classes.join(' ')
}
