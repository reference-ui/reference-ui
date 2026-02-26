/**
 * Token test configurations.
 * Minimal and complex token configs for ui.config.ts fixtures.
 */

import type { MinimalTokenConfig } from './types.js'

/** MVP: One token - brand color red */
export const minimalTokens: MinimalTokenConfig = {
  colors: {
    brand: { value: '#ff0000' },
  },
}
