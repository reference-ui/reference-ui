import type { Config } from '@pandacss/dev'

/**
 * Base CSS variables for rhythm spacing. Required for rhythm utilities to work.
 * Merged via extendGlobalCss in the generated panda.config.
 */
export const rhythmGlobalCss: NonNullable<Config['globalCss']> = {
  ':root': {
    '--spacing-root': '0.25rem',
  },
}
