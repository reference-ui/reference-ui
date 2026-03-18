import type { Config } from '@pandacss/dev'
import { REFERENCE_BROWSER_SELECTOR } from '../constants'
import { referenceThemeVarDefaults } from './vars'

export const referenceBrowserGlobalCss: NonNullable<Config['globalCss']> = {
  [REFERENCE_BROWSER_SELECTOR]: referenceThemeVarDefaults,
}
