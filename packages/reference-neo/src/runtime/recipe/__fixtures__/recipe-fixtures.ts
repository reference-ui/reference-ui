// Shared recipe fixtures for the recipe() suites: one table set with its derivation inputs, the config authored over
// it, and the class strings it resolves to. The suites register these tables themselves; this module only defines them.
import type { RecipeRuntimeTable } from '@reference-ui/rust/contracts'
import type { RecipeConfig } from '../recipe.ts'

export const STEM = 'test__button'

// New-contract table: derivation inputs only, no pre-composed maps.
export const TABLE: RecipeRuntimeTable = {
  variantMap: {
    tone: ['accent', 'muted'],
    size: ['sm', 'lg'],
  },
  defaultVariants: { tone: 1, size: 0 },
  compoundVariants: [{ predicates: { tone: ['accent'], size: ['lg'] } }],
  responsiveBreakpoints: ['md', 'lg'],
}

export const MUTED_SM = `${STEM}__base ${STEM}_t_muted ${STEM}_s_sm`
export const ACCENT_SM = `${STEM}__base ${STEM}_t_accent ${STEM}_s_sm`
export const ACCENT_LG = `${STEM}__base ${STEM}_t_accent ${STEM}_s_lg ${STEM}_c_accent_lg`

export const CONFIG: RecipeConfig = {
  className: 'button',
  base: { display: 'inline-flex' },
  variants: {
    tone: { accent: { color: 'brand' }, muted: { color: 'paper' } },
    size: { sm: { p: 'sm' }, lg: { p: 'lg' } },
  },
  defaultVariants: { tone: 'muted', size: 'sm' },
  compoundVariants: [{ tone: 'accent', size: 'lg', css: { backgroundColor: 'ink' } }],
}
