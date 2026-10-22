// Slotted recipe resolution: a config with `slots` resolves as one plain recipe per slot.
// It takes a slotted config plus the plain resolver builder and emits a fn that returns one class string,
// or one raw style object, per slot. Each slot projects to a plain config named `${className}__${slot}`
// that holds only that slot's base, variant cells and compounds, the same lowering the compiler applies,
// so every slot finds its own compiled table. The builder is passed in, so this module never imports recipe.ts.

import type { SystemStyleObject } from '../css/css.ts'
import type {
  RecipeCompoundConfig,
  RecipeConfig,
  RecipeProps,
  RecipeRuntimeFn,
  RecipeSlotStyles,
  SlottedRecipeCompoundConfig,
  SlottedRecipeConfig,
  SlottedRecipeRuntimeFn,
} from './types.ts'
import { variantHelpers } from './variants.ts'

/** Port of the compiler's slot_class_name: one slot's recipe name, `${className}__${slot}`. */
export function slotClassName(className: string, slot: string): string {
  return `${className}__${slot}`
}

/** True when an authored config lists slots. */
export function isSlottedConfig(
  config: RecipeConfig | SlottedRecipeConfig
): config is SlottedRecipeConfig {
  return 'slots' in config && Array.isArray(config.slots)
}

/**
 * Project one slot out of a slotted config: its base, the variant cells that name it (axes with
 * none drop out), every default, and the compounds whose css names it. A config with no literal
 * className keeps that gap, so the plain resolver warns about the name rather than a table.
 */
export function projectSlot(config: SlottedRecipeConfig, slot: string): RecipeConfig {
  const named = typeof config.className === 'string' && config.className !== ''
  const projected: RecipeConfig = {
    className: named ? slotClassName(config.className, slot) : config.className,
  }
  const base = ownSlotStyles(config.base, slot)
  if (base !== undefined) projected.base = base
  if (config.variants !== undefined) projected.variants = projectVariants(config.variants, slot)
  if (config.defaultVariants !== undefined) projected.defaultVariants = config.defaultVariants
  if (config.compoundVariants !== undefined) {
    projected.compoundVariants = projectCompounds(config.compoundVariants, slot)
  }
  return projected
}

/**
 * One slot's entry in an authored styles map. Only an own key names a slot, so a slot called
 * `constructor` reads nothing from Object.prototype, and an absent map names no slot.
 */
function ownSlotStyles(
  styles: RecipeSlotStyles | undefined,
  slot: string
): SystemStyleObject | undefined {
  return styles && Object.hasOwn(styles, slot) ? styles[slot] : undefined
}

function projectVariants(
  variants: Record<string, Record<string, RecipeSlotStyles>>,
  slot: string
): Record<string, Record<string, SystemStyleObject>> {
  // Null-prototype records: an authored `__proto__` name must become a key, not set a prototype.
  const projected: Record<string, Record<string, SystemStyleObject>> = Object.create(null)
  for (const [axis, options] of Object.entries(variants)) {
    const cells: Record<string, SystemStyleObject> = Object.create(null)
    for (const [value, styles] of Object.entries(options)) {
      const cell = ownSlotStyles(styles, slot)
      if (cell !== undefined) cells[value] = cell
    }
    if (Object.keys(cells).length > 0) projected[axis] = cells
  }
  return projected
}

function projectCompounds(
  compounds: readonly SlottedRecipeCompoundConfig[],
  slot: string
): RecipeCompoundConfig[] {
  const projected: RecipeCompoundConfig[] = []
  for (const { css, ...predicates } of compounds) {
    const cell = ownSlotStyles(css, slot)
    if (cell !== undefined) projected.push({ ...predicates, css: cell })
  }
  return projected
}

/** Build the slotted fn: each slot resolves through its own plain resolver; metadata covers every axis. */
export function slottedRecipe(
  config: SlottedRecipeConfig,
  plain: (config: RecipeConfig) => RecipeRuntimeFn
): SlottedRecipeRuntimeFn {
  const parts = config.slots.map(slot => [slot, plain(projectSlot(config, slot))] as const)
  const runtimeFn = ((props: RecipeProps = {}) =>
    Object.fromEntries(parts.map(([slot, part]) => [slot, part(props)]))) as SlottedRecipeRuntimeFn
  runtimeFn.raw = (props: RecipeProps = {}) =>
    Object.fromEntries(parts.map(([slot, part]) => [slot, part.raw(props)]))
  return Object.assign(runtimeFn, variantHelpers(config.variants))
}
