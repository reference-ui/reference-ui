/**
 * Function names the eval scanner looks for.
 * Any file containing a call to one of these is included in the fragment collection.
 * Eval does not know what they do — it only finds and runs the files.
 */
export const REGISTERED_FUNCTIONS = [
  // Internal extend API
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
  'recipe',
  'slotRecipe',
  'keyframes',
  'font',
  'globalCss',
] as const

export type RegisteredFunction = (typeof REGISTERED_FUNCTIONS)[number]
