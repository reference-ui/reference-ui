// Class-name derivation for the recipe runtime: it takes one compiled recipe table plus a selection and emits the
// class string parts. Names follow the compiler's variant, compound and responsive classes, so the runtime and the
// compiled CSS agree. Every function is pure over its arguments; registration state stays in recipe.ts.

import type { RecipeRuntimeTable } from '@reference-ui/rust/contracts'
import type { PlainRecipeProps, RecipeProps, ResponsiveRecipeValue } from './types.ts'

export function resolveSelection(
  defaults: Record<string, string>,
  props: PlainRecipeProps
): Record<string, string> {
  const selection: Record<string, string> = { ...defaults }
  for (const [axis, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue
    selection[axis] = String(value)
  }
  return selection
}

/** Resolve a table's defaults to value names: indices dereference the axis list, strings pass through. */
export function tableDefaults(table: RecipeRuntimeTable): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const [axis, def] of Object.entries(table.defaultVariants)) {
    const value = typeof def === 'number' ? table.variantMap[axis]?.[def] : def
    if (value !== undefined) defaults[axis] = value
  }
  return defaults
}

/** Axis order: legacy tables ship it, new tables derive it from the variant map keys. */
function tableAxes(table: RecipeRuntimeTable): string[] {
  return table.variantKeys ?? Object.keys(table.variantMap)
}

function isResponsiveValue(value: unknown): value is ResponsiveRecipeValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function splitResponsiveProps(props: RecipeProps): {
  plain: PlainRecipeProps
  responsive: Record<string, Record<string, string>>
} {
  const plain: PlainRecipeProps = {}
  const responsive: Record<string, Record<string, string>> = {}
  for (const [axis, value] of Object.entries(props)) {
    if (!isResponsiveValue(value)) {
      plain[axis] = value
      continue
    }
    const entries: Record<string, string> = {}
    for (const [breakpoint, wanted] of Object.entries(value)) {
      if (wanted === undefined || wanted === null) continue
      entries[breakpoint] = String(wanted)
    }
    responsive[axis] = entries
    if (entries['base'] !== undefined) plain[axis] = entries['base']
  }
  return { plain, responsive }
}

/** Port of the compiler's variant_class: `${stem}_${axis[0]}_${value}`. */
function variantClass(stem: string, axis: string, value: string): string {
  const first = axis === '' ? 'v' : String.fromCodePoint(axis.codePointAt(0) as number)
  return `${stem}_${first}_${value}`
}

/** Port of the compiler's compound_class: `${stem}_c_${segments}` (a lone `["true"]` collapses to the axis key). */
function compoundClass(stem: string, predicates: Record<string, string[]>): string {
  const segments: string[] = []
  for (const [axis, values] of Object.entries(predicates)) {
    if (values.length === 1 && values[0] === 'true') segments.push(axis)
    else segments.push(values.join('_'))
  }
  return segments.length === 0 ? `${stem}_c` : `${stem}_c_${segments.join('_')}`
}

/** Port of the compiler's compound_matches: every axis selection must be an allowed value. */
function matchesPredicateLists(
  predicates: Record<string, string[]>,
  selection: Record<string, string>
): boolean {
  return Object.entries(predicates).every(([axis, allowed]) => {
    const value = selection[axis]
    return value !== undefined && allowed.includes(value)
  })
}

/** Per-axis inputs for one responsive class derivation. */
interface ResponsiveDerivation {
  stem: string
  axis: string
  values: string[] | undefined
  allowed: Set<string>
  legacy: Record<string, Record<string, string>> | undefined
}

function deriveResponsiveClass(
  ctx: ResponsiveDerivation,
  breakpoint: string,
  value: string
): string | undefined {
  const known = ctx.values !== undefined && ctx.values.includes(value)
  const derived =
    known && ctx.allowed.has(breakpoint) ? variantClass(ctx.stem, ctx.axis, value) : undefined
  if (derived !== undefined) return `${breakpoint}:${derived}`
  return ctx.legacy?.[breakpoint]?.[value]
}

// One derived class per non-base breakpoint. The table's own breakpoint list wins; the
// hoisted list registration carries backs tables that predate their own.
export function resolveResponsiveClasses(
  table: RecipeRuntimeTable,
  responsive: Record<string, Record<string, string>>,
  stem: string,
  hoistedBreakpoints: string[] | undefined
): string[] {
  const allowed = new Set(table.responsiveBreakpoints ?? hoistedBreakpoints ?? [])
  const legacy = table.responsiveVariantMap ?? {}
  const classes: string[] = []
  for (const [axis, entries] of Object.entries(responsive)) {
    const ctx: ResponsiveDerivation = {
      stem,
      axis,
      values: table.variantMap[axis],
      allowed,
      legacy: legacy[axis],
    }
    for (const [breakpoint, value] of Object.entries(entries)) {
      if (breakpoint === 'base') continue
      const className = deriveResponsiveClass(ctx, breakpoint, value)
      if (className !== undefined) classes.push(className)
    }
  }
  return classes
}

export function lookupCombination(
  table: RecipeRuntimeTable,
  selection: Record<string, string>
): string | undefined {
  const values: string[] = []
  for (const axis of tableAxes(table)) {
    const value = selection[axis]
    if (value === undefined) return undefined
    values.push(value)
  }
  if (values.length === 0) return table.combinations?.['']
  const key = values.length === 1 ? String(values[0]) : values.join('|')
  return table.combinations?.[key]
}

function matchesPredicates(
  predicates: Record<string, string> | undefined,
  selection: Record<string, string>
): boolean {
  if (predicates === undefined) return false
  return Object.entries(predicates).every(([axis, wanted]) => selection[axis] === wanted)
}

/** Resolve one compound record to its class: derived from predicates (new) or shipped (legacy). */
function compoundClassForSelection(
  compound: RecipeRuntimeTable['compoundVariants'][number],
  selection: Record<string, string>,
  stem: string
): string | undefined {
  if (compound.predicates !== undefined) {
    return matchesPredicateLists(compound.predicates, selection)
      ? compoundClass(stem, compound.predicates)
      : undefined
  }
  if (compound.className !== undefined && matchesPredicates(compound.selection, selection)) {
    return compound.className
  }
  return undefined
}

export function composeClasses(
  table: RecipeRuntimeTable,
  selection: Record<string, string>,
  stem: string
): string {
  const classes = [`${stem}__base`]
  for (const axis of tableAxes(table)) {
    const value = selection[axis]
    if (value === undefined) continue
    if (!table.variantMap[axis]?.includes(value)) continue
    classes.push(variantClass(stem, axis, value))
  }
  for (const compound of table.compoundVariants) {
    const className = compoundClassForSelection(compound, selection, stem)
    if (className !== undefined) classes.push(className)
  }
  return classes.join(' ')
}
