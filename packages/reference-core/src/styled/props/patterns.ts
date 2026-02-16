/** Global CSS for pattern extensions (density, etc.) */

import { globalCss } from '../api'

globalCss({
  '[data-density="compact"]': { '--r-density': '0.75' },
  '[data-density="comfortable"]': { '--r-density': '1' },
  '[data-density="spacious"]': { '--r-density': '1.25' },
})
