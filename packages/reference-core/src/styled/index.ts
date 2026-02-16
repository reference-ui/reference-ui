// Import domain modules to register tokens and utilities
import './theme/colors'
import './theme/spacing'
import './theme/radii'
import './rhythm'
import './font/fonts'
import './props/patterns'

// Import primitives
import '../primitives/recipes'

// Export utilities
export { getRhythm } from './rhythm'

// Export theme tokens for external use
export { colors } from './theme/colors'

// Import staticCss to keep existing configuration
import { staticCss } from './api'

staticCss({
  css: [
    {
      properties: {
        backgroundColor: ['*'],
        color: ['*'],
        borderColor: ['*'],
        padding: ['*'],
        paddingLeft: ['*'],
        paddingRight: ['*'],
        paddingTop: ['*'],
        paddingBottom: ['*'],
        margin: ['*'],
        gap: ['*'],
        borderRadius: ['*'],
        borderWidth: ['*'],
        font: ['*'],
      },
    },
  ],
  recipes: {
    fontStyle: ['*'],
  },
})
