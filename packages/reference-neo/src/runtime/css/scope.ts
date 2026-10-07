// Family scoping for the runtime css() pass: a bare keyword weight names the
// active sibling family, matching the static resolver's scope.rs. The pass takes
// the whole per-call NamerRequest array after collection and rewrites bare
// keyword weight strings to `family.keyword` when exactly one family seeds the
// scope. It emits nothing; object-valued (responsive) queries, numerics, and
// explicit `family.weight` values pass through untouched. One call, one family
// scope: args merge at runtime exactly as the static css() oracle scopes them.

import type { NamerRequest } from '@reference-ui/rust/namer'

/** The six bare names that carry family-relative meaning; gates the rewrite. */
const WEIGHT_KEYWORDS = new Set(['thin', 'light', 'normal', 'semibold', 'bold', 'black'])

/** Family key shape: non-empty, alphanumerics plus `-`/`_`; stacks never seed. */
const FAMILY_KEY = /^[\p{L}\p{N}_-]+$/u

/** True for a value that can name a family (`sans`), not a stack or empty. */
export function isFamilyKey(value: string): boolean {
  return FAMILY_KEY.test(value)
}

/** True for the props that select a family: the macro and its token twin. */
function isFamilyProp(prop: string): boolean {
  return prop === 'font' || prop === 'fontFamily'
}

/**
 * Rewrite `thin` + `sans` to `sans.thin`; undefined when the family cannot
 * seed, the value already carries a `.`, or the name is not one of the six.
 */
export function scopeWeightName(value: string, family: string): string | undefined {
  if (!isFamilyKey(family) || value.includes('.')) return undefined
  if (!WEIGHT_KEYWORDS.has(value)) return undefined
  return `${family}.${value}`
}

/**
 * Scope every bare keyword weight in one css() call's queries against its
 * family. Same-`when` family wins, the base scope covers nested conditions,
 * and two different families in a scope decline to guess.
 */
export function applyFamilyScope(queries: NamerRequest[]): void {
  for (const query of queries) {
    if (query.prop !== 'weight' || typeof query.value !== 'string') continue
    const family = scopeFamily(queries, query.when)
    if (family === undefined) continue
    const scoped = scopeWeightName(query.value, family)
    if (scoped !== undefined) query.value = scoped
  }
}

/** The one family naming a `when` scope, falling back to base for nested whens. */
function scopeFamily(queries: NamerRequest[], when: string[]): string | undefined {
  const sameScope = singleFamily(queries, when)
  if (sameScope !== undefined || when.length === 0) return sameScope
  return singleFamily(queries, [])
}

/** The one family named under a `when` stack, or undefined when zero or two do. */
function singleFamily(queries: NamerRequest[], when: string[]): string | undefined {
  let found: string | undefined
  for (const query of queries) {
    if (!sameWhen(query.when, when)) continue
    if (!isFamilyProp(query.prop) || typeof query.value !== 'string') continue
    if (!isFamilyKey(query.value)) continue
    if (found === undefined) {
      found = query.value
    } else if (found !== query.value) {
      return undefined
    }
  }
  return found
}

/** True when two `when` stacks are the same length and pairwise equal. */
function sameWhen(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false
  }
  return true
}
