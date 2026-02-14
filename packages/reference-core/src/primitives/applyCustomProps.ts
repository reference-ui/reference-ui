import { splitProps } from '../system/helpers.js'
import { cx } from '../system/css/index.js'
import { box } from '../system/patterns/box.js'

/** Custom props extracted and transformed before passing to styled primitives. */
const CUSTOM_PROPS = ['r', 'container', 'font'] as const

/**
 * Apply custom props (r, container, font) via box pattern. When the tag has a
 * matching recipe, applies that recipe's static className (user css prop still
 * overrides).
 */
export function applyCustomProps(
  props: object,
  recipeClassName?: string
): object {
  const [boxProps, rest] = splitProps(props, [...CUSTOM_PROPS])
  const { className, ...restProps } = rest as Record<string, unknown>
  return {
    ...(box.raw(boxProps as Parameters<typeof box.raw>[0]) as object),
    ...restProps,
    className: cx(recipeClassName, className as string | undefined),
  }
}
