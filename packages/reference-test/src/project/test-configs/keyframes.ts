/**
 * Keyframe test configurations.
 * Stub for future expansion - MVP uses tokens only.
 */

import type { KeyframeConfig } from './types.js'

export const minimalKeyframes: KeyframeConfig = {
  keyframes: {
    fadeIn: {
      value: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    },
  },
}
