import type { Config } from '@pandacss/dev'

/**
 * Base CSS variables for rhythm spacing. Required for rhythm utilities to work.
 * Merged via extendGlobalCss in the generated panda.config.
 */
export const rhythmGlobalCss: NonNullable<Config['globalCss']> = {
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
  },
}
