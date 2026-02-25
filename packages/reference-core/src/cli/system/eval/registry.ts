/**
 * Registry of function names that eval scans for and evaluates.
 * Eval does not know what these functions do; it only finds files that call them
 * and runs those files to collect the results.
 *
 * Includes both internal API names (extend*) and public API names (tokens, recipe, etc.)
 */
export const REGISTERED_FUNCTIONS = [
  // Internal API
  'extendPandaConfig',
  'extendTokens',
  'extendRecipe',
  'extendSlotRecipe',
  'extendUtilities',
  'extendGlobalCss',
  'extendStaticCss',
  'extendGlobalFontface',
  'extendFont',
  'extendKeyframes',
  'extendPattern',
  // Public API (@reference-ui/system)
  'tokens',
  'keyframes',
  'font',
  'globalCss',
] as const

export type RegisteredFunction = (typeof REGISTERED_FUNCTIONS)[number]

export function isRegistered(name: string): name is RegisteredFunction {
  return (REGISTERED_FUNCTIONS as readonly string[]).includes(name)
}
