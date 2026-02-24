/**
 * Public API for @reference-ui/system
 *
 * These are renamed exports of the internal API functions,
 * designed to be used in user code for extending the design system at build-time.
 */

import {
  extendTokens,
  extendRecipe,
  extendSlotRecipe,
  extendKeyframes,
  extendFont,
  extendGlobalCss,
} from '../internal/index.js'

/**
 * Define design tokens (colors, spacing, typography, etc.)
 *
 * @example
 * ```ts
 * import { tokens } from '@reference-ui/system'
 *
 * tokens({
 *   colors: {
 *     brand: { value: '#0066cc' }
 *   }
 * })
 * ```
 */
export const tokens = extendTokens

/**
 * Define a recipe (component variant system)
 *
 * @example
 * ```ts
 * import { recipe } from '@reference-ui/system'
 *
 * recipe({
 *   className: 'button',
 *   variants: {
 *     size: {
 *       sm: { px: '3', py: '1' },
 *       lg: { px: '6', py: '3' }
 *     }
 *   }
 * })
 * ```
 */
export const recipe = extendRecipe

/**
 * Define a slot recipe (multi-part component variant system)
 *
 * @example
 * ```ts
 * import { slotRecipe } from '@reference-ui/system'
 *
 * slotRecipe({
 *   className: 'card',
 *   slots: ['root', 'header', 'body'],
 *   variants: {
 *     size: {
 *       sm: { root: { p: '2' } },
 *       lg: { root: { p: '6' } }
 *     }
 *   }
 * })
 * ```
 */
export const slotRecipe = extendSlotRecipe

/**
 * Define keyframe animations
 *
 * @example
 * ```ts
 * import { keyframes } from '@reference-ui/system'
 *
 * keyframes({
 *   fadeIn: {
 *     '0%': { opacity: '0' },
 *     '100%': { opacity: '1' }
 *   }
 * })
 * ```
 */
export const keyframes = extendKeyframes

/**
 * Define custom font tokens
 *
 * @example
 * ```ts
 * import { font } from '@reference-ui/system'
 *
 * font({
 *   heading: { value: 'Inter, sans-serif' }
 * })
 * ```
 */
export const font = extendFont

/**
 * Define global CSS styles
 *
 * @example
 * ```ts
 * import { globalCss } from '@reference-ui/system'
 *
 * globalCss({
 *   'html, body': {
 *     margin: 0,
 *     padding: 0
 *   }
 * })
 * ```
 */
export const globalCss = extendGlobalCss
