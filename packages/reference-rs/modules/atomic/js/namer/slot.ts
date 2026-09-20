/**
 * Slot procedure P8: the cascade slot for a property and condition chain.
 * Mirrors `runtime/builder.rs::derive_slot`: the canonical prop, prefixed by
 * every raw `when` entry with one `_` stripped and joined by `:`, suffixed
 * `@bp` for responsive members. Pins golden `14-deriveSlot`. The `when`
 * entries ride verbatim — no `base` skip, no lowering — exactly as the
 * builder passes them.
 */
import type { NamerTables } from '../../../../contracts/types.js'
import { canonicalProp } from './value.js'

/** P8 golden: derive one cascade slot from prop, raw whens, and breakpoint. */
export function deriveSlot(
  input: { prop: string; when: string[]; bp: string | null },
  tables: NamerTables
): string {
  return deriveSlotParts(canonicalProp(input.prop, tables), input.when, input.bp ?? undefined)
}

/** Slot from an already-canonical prop, shared with the composed pipeline. */
export function deriveSlotParts(
  canon: string,
  when: string[],
  bp: string | undefined
): string {
  const parts = when.map(entry => (entry.startsWith('_') ? entry.slice(1) : entry))
  const base = parts.length === 0 ? canon : parts.join(':') + ':' + canon
  return bp === undefined ? base : base + '@' + bp
}
