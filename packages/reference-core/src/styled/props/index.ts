/**
 * System props for primitives.
 * 
 * Each prop file is fully self-contained:
 * - Type definition for the prop
 * - Panda pattern definition with transform
 * 
 * Import this file to register all prop patterns with Panda.
 */

export { type FontProp } from './font.js'
export { type ResponsiveBreakpoints } from './r.js'
export { type ContainerProp } from './container.js'

// Import to register patterns
import './font.js'
import './r.js'
import './container.js'
