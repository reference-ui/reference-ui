// Import domain modules to register tokens and utilities
import './theme/colors'
import './theme/spacing'
import './theme/radii'
import './rhythm'
import './font'


// Import primitives
import '../primitives/recipes'

// Import static CSS configuration
import './css.global'
import './css.static'

// Export utilities
export { getRhythm } from './rhythm'

// Export theme tokens for external use
export { colors } from './theme/colors'
