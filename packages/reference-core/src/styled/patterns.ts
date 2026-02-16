/** Global CSS for patterns. */

import { globalCss } from './api'

// --- Global CSS: rhythm tokens -----------------------------------------------

const rhythmTokens = {
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
  },
}

// --- Global CSS: body defaults ------------------------------------------------

const bodyDefaults = {
  body: {
    fontFamily: 'sans',
    letterSpacing: '-0.01em',
    fontSize: 'body',
  },
}

// --- Global CSS: density variants ---------------------------------------------

const densityVariants = {
  '[data-density="compact"]': { '--r-density': '0.75' },
  '[data-density="comfortable"]': { '--r-density': '1' },
  '[data-density="spacious"]': { '--r-density': '1.25' },
}

// --- Global CSS export -------------------------------------------------------

export const patternsGlobalCss = {
  ...rhythmTokens,
  ...bodyDefaults,
  ...densityVariants,
}

globalCss(patternsGlobalCss)
