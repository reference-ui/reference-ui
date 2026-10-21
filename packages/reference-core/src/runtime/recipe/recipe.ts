// Native recipe runtime over compiled recipe tables.
// It takes authored recipe configs and emits closed-class resolver functions.
// Selections compose base plus variant and compound classes from the
// registered tables while the lowering wrapper keeps r sugar on the same
// container-query shape the compiler extracted. Per-axis responsive objects
// compose base the same way and append one derived per-breakpoint class each
// (ATM-RECIPE-07). Tables ship derivation inputs only: key stem, map-key
// axes, index defaults, unexpanded predicates.
// A config with `slots` resolves as one plain recipe per slot projection (slots.ts).

import type { RecipeRuntimeTable } from '@reference-ui/rust/contracts'
import type { SystemStyleObject } from '../css/css.ts'
import { isProductionBuild } from '../env.ts'
import { lowerResponsiveStyles } from '../css/lowerResponsiveStyles.ts'
import {
  composeClasses,
  lookupCombination,
  resolveResponsiveClasses,
  resolveSelection,
  splitResponsiveProps,
  tableDefaults,
} from './classes.ts'
import { isSlottedConfig, slottedRecipe } from './slots.ts'
import type {
  RecipeCompoundConfig,
  RecipeConfig,
  RecipeProps,
  RecipeRuntimeFn,
  SlottedRecipeConfig,
  SlottedRecipeRuntimeFn,
} from './types.ts'
import { variantHelpers } from './variants.ts'

export type {
  PlainRecipeProps,
  RecipeCompoundConfig,
  RecipeConfig,
  RecipePropValue,
  RecipeProps,
  RecipeRuntimeFn,
  RecipeSlotStyles,
  ResponsiveRecipeValue,
  SlottedRecipeCompoundConfig,
  SlottedRecipeConfig,
  SlottedRecipeRuntimeFn,
} from './types.ts'

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

/** Qualified keys already reported as having no compiled table; repeats stay silent. */
const warnedMissingTables = new Set<string>()

function hasLiteralClassName(value: unknown): boolean {
  return typeof value === 'string' && value !== ''
}

/**
 * Name the fix for a missing table. Without a literal className the runtime
 * has no key to look up, so the message asks for one; with a className the
 * message names the qualified key and points at a re-sync.
 */
function missingTableMessage(key: string, className: unknown): string {
  if (!hasLiteralClassName(className)) {
    return (
      '[reference-ui] recipe(): needs a literal `className` (string) in its config so the ' +
      'runtime can find its compiled table. This call has none, so it resolves to nothing.'
    )
  }
  return (
    `[reference-ui] recipe(): no compiled table found for \`${key}\`; re-run \`ref sync\` ` +
    'to emit it. Until then this recipe resolves to nothing.'
  )
}

/**
 * Dev-only diagnostic for a lookup that misses. The silent empty string hides
 * an unsynced or misnamed recipe, so warn once per qualified key and stay
 * quiet in production builds (the same guard css() uses).
 */
function warnMissingTable(key: string, className: unknown): void {
  if (isProductionBuild() || warnedMissingTables.has(key)) return
  warnedMissingTables.add(key)
  console.warn(missingTableMessage(key, className))
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
 * class per breakpoint, and unknown recipes resolve to nothing (dev warns once
 * per key).
 */
function plainRecipe(config: RecipeConfig): RecipeRuntimeFn {
  const lowered = lowerRecipeDefinition(config)
  const runtimeFn = ((props: RecipeProps = {}) => {
    if (!active) {
      throw new Error('recipe() called before registerRecipeData: sync the project first')
    }
    const key = qualifiedName(active.system, lowered.className)
    const table: RecipeRuntimeTable | undefined = active.tables[key]
    if (!table) {
      warnMissingTable(key, lowered.className)
      return ''
    }
    const stem = table.qualifiedName ?? key
    const { plain, responsive } = splitResponsiveProps(props)
    const selection = resolveSelection(tableDefaults(table), plain)
    const baseClasses =
      lookupCombination(table, selection) ?? composeClasses(table, selection, stem)
    const extra = resolveResponsiveClasses(table, responsive, stem, active.responsiveBreakpoints)
    return [baseClasses, ...extra].filter(part => part !== '').join(' ')
  }) as RecipeRuntimeFn
  runtimeFn.raw = (props: RecipeProps = {}) => {
    const { plain } = splitResponsiveProps(props)
    return mergeRawStyles(lowered, resolveSelection(lowered.defaultVariants ?? {}, plain))
  }
  return Object.assign(runtimeFn, variantHelpers(lowered.variants))
}

/**
 * Build a resolver for one authored recipe. A config with `slots` resolves as one plain
 * recipe per slot (`${className}__${slot}` tables) and returns one class string per slot;
 * any other config resolves as `plainRecipe` describes.
 */
export function recipe<const C extends SlottedRecipeConfig>(
  config: C
): SlottedRecipeRuntimeFn<C['slots'][number]>
export function recipe(config: RecipeConfig): RecipeRuntimeFn
export function recipe(
  config: RecipeConfig | SlottedRecipeConfig
): RecipeRuntimeFn | SlottedRecipeRuntimeFn {
  return isSlottedConfig(config) ? slottedRecipe(config, plainRecipe) : plainRecipe(config)
}
