// Native recipe runtime over compiled recipe tables.
// It takes authored recipe configs and emits closed-class resolver functions.
// Selections compose base plus variant and compound classes from the
// registered tables while the lowering wrapper keeps r sugar on the same
// container-query shape the compiler extracted. Per-axis responsive objects
// compose base the same way and append one derived per-breakpoint class each
// (ATM-RECIPE-07).

import type { RecipeRuntimeTable } from '@reference-ui/rust/contracts'
import type { SystemStyleObject } from '../css/css.ts'
import { lowerResponsiveStyles } from '../css/lowerResponsiveStyles.ts'

/** One variant axis value an author may pass: strings, or booleans for true/false options. */
export type RecipePropValue = string | boolean | number

/** Responsive selection for one axis: breakpoint to wanted value (`base` paints below every query). */
export type ResponsiveRecipeValue = Record<string, RecipePropValue | undefined | null>

/** Author selection: axis to wanted value, with skips dropped at resolution. */
export type RecipeProps = Record<
  string,
  RecipePropValue | ResponsiveRecipeValue | undefined | null
>

/** Author selection with responsive objects already reduced to their base values. */
export type PlainRecipeProps = Record<string, RecipePropValue | undefined | null>

/** One compound rule: axis predicates plus the styles applied when all match. */
export interface RecipeCompoundConfig {
  css: SystemStyleObject
  [axis: string]: unknown
}

/** Authored recipe: the className extraction keys on plus base, variants, and compounds. */
export interface RecipeConfig {
  className: string
  base?: SystemStyleObject
  variants?: Record<string, Record<string, SystemStyleObject>>
  defaultVariants?: Record<string, string>
  compoundVariants?: RecipeCompoundConfig[]
}

/** Resolved recipe function: classes for a selection plus variant metadata. */
export interface RecipeRuntimeFn {
  (props?: RecipeProps): string
  raw(props?: RecipeProps): SystemStyleObject
  variantKeys: string[]
  variantMap: Record<string, string[]>
  splitVariantProps(props: RecipeProps): [RecipeProps, RecipeProps]
}

interface ActiveRecipes {
  system: string
  tables: Record<string, RecipeRuntimeTable>
  responsiveBreakpoints?: string[]
}

let active: ActiveRecipes | undefined

/**
 * Register the compiled recipe tables recipe() resolves against. Sync calls
 * this once per generated bundle; later registrations replace earlier ones
 * (single-system runtime for now). The optional hoisted breakpoint list
 * backs tables that no longer carry their own (table-level wins).
 */
export function registerRecipeData(
  system: string,
  tables: Record<string, RecipeRuntimeTable>,
  responsiveBreakpoints?: string[]
): void {
  active = { system, tables, responsiveBreakpoints }
}

function qualifiedName(system: string, className: string): string {
  return system === '' ? className : `${system}__${className}`
}

function lowerRecipeDefinition(config: RecipeConfig): RecipeConfig {
  const lowered: RecipeConfig = { ...config }
  if (config.base !== undefined) {
    lowered.base = lowerResponsiveStyles(config.base)
  }
  if (config.variants !== undefined) {
    lowered.variants = Object.fromEntries(
      Object.entries(config.variants).map(([axis, options]) => [
        axis,
        Object.fromEntries(
          Object.entries(options).map(([value, styles]) => [
            value,
            lowerResponsiveStyles(styles),
          ])
        ),
      ])
    )
  }
  if (config.compoundVariants !== undefined) {
    lowered.compoundVariants = config.compoundVariants.map(entry => ({
      ...entry,
      css: lowerResponsiveStyles(entry.css),
    }))
  }
  return lowered
}

function resolveSelection(
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

function isResponsiveValue(value: unknown): value is ResponsiveRecipeValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function splitResponsiveProps(props: RecipeProps): {
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

function resolveResponsiveClasses(
  table: RecipeRuntimeTable,
  responsive: Record<string, Record<string, string>>
): string[] {
  const allowed = new Set(table.responsiveBreakpoints ?? active?.responsiveBreakpoints ?? [])
  const legacy = table.responsiveVariantMap ?? {}
  const classes: string[] = []
  for (const [axis, entries] of Object.entries(responsive)) {
    const ctx: ResponsiveDerivation = {
      stem: table.qualifiedName,
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

function lookupCombination(
  table: RecipeRuntimeTable,
  selection: Record<string, string>
): string | undefined {
  const values: string[] = []
  for (const axis of table.variantKeys) {
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

function composeClasses(
  table: RecipeRuntimeTable,
  selection: Record<string, string>
): string {
  const stem = table.qualifiedName
  const classes = [`${stem}__base`]
  for (const axis of table.variantKeys) {
    const value = selection[axis]
    if (value === undefined) continue
    if (!table.variantMap[axis]?.includes(value)) continue
    classes.push(variantClass(stem, axis, value))
  }
  for (const compound of table.compoundVariants) {
    if (compound.className !== undefined && matchesPredicates(compound.selection, selection)) {
      classes.push(compound.className)
    }
  }
  return classes.join(' ')
}

function matchesCompoundConfig(
  compound: RecipeCompoundConfig,
  selection: Record<string, string>
): boolean {
  return Object.entries(compound).every(([axis, wanted]) => {
    if (axis === 'css') return true
    const value = selection[axis]
    if (Array.isArray(wanted)) return wanted.includes(value)
    if (typeof wanted === 'boolean' || typeof wanted === 'number') {
      return value === String(wanted)
    }
    return value === wanted
  })
}

function mergeRawStyles(
  config: RecipeConfig,
  selection: Record<string, string>
): SystemStyleObject {
  const merged: SystemStyleObject = { ...(config.base ?? {}) }
  const variants = config.variants ?? {}
  for (const [axis, value] of Object.entries(selection)) {
    Object.assign(merged, variants[axis]?.[value])
  }
  for (const compound of config.compoundVariants ?? []) {
    if (matchesCompoundConfig(compound, selection)) Object.assign(merged, compound.css)
  }
  return merged
}

/**
 * Build a resolver for one extracted recipe. Lowers r sugar across the
 * definition (same wrapper the compiler extracted through), then resolves
 * each call against the registered table: defaults fill gaps, base plus
 * variant and compound classes compose for the selection (a legacy shipped
 * combinations map still wins on hit), responsive objects append one derived
 * class per breakpoint, and unknown recipes resolve to nothing.
 */
export function recipe(config: RecipeConfig): RecipeRuntimeFn {
  const lowered = lowerRecipeDefinition(config)
  const axes = Object.keys(lowered.variants ?? {})
  const runtimeFn = ((props: RecipeProps = {}) => {
    if (!active) {
      throw new Error('recipe() called before registerRecipeData: sync the project first')
    }
    const table: RecipeRuntimeTable | undefined =
      active.tables[qualifiedName(active.system, lowered.className)]
    if (!table) return ''
    const { plain, responsive } = splitResponsiveProps(props)
    const selection = resolveSelection(table.defaultVariants, plain)
    const baseClasses = lookupCombination(table, selection) ?? composeClasses(table, selection)
    const extra = resolveResponsiveClasses(table, responsive)
    return [baseClasses, ...extra].filter(part => part !== '').join(' ')
  }) as RecipeRuntimeFn
  runtimeFn.raw = (props: RecipeProps = {}) => {
    const { plain } = splitResponsiveProps(props)
    return mergeRawStyles(lowered, resolveSelection(lowered.defaultVariants ?? {}, plain))
  }
  runtimeFn.variantKeys = axes
  runtimeFn.variantMap = Object.fromEntries(
    Object.entries(lowered.variants ?? {}).map(([axis, options]) => [axis, Object.keys(options)])
  )
  runtimeFn.splitVariantProps = (props: RecipeProps): [RecipeProps, RecipeProps] => {
    const selection: RecipeProps = {}
    const rest: RecipeProps = {}
    for (const [key, value] of Object.entries(props)) {
      if (axes.includes(key)) selection[key] = value
      else rest[key] = value
    }
    return [selection, rest]
  }
  return runtimeFn
}
