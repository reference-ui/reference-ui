/**
 * System props for primitives.
 * 
 * Each prop file is fully self-contained:
 * - Type definition for the prop (value type)
 * - Prop definition interface (key + value type)
 * - Panda pattern definition with transform
 * 
 * Import this file to register all prop patterns with Panda.
 */

import type { FontPropDefinition } from './font'
import type { ResponsivePropDefinition } from './r'
import type { ContainerPropDefinition } from './container'

export { type FontProp, type FontPropDefinition } from './font'
export { type ResponsiveBreakpoints, type ResponsivePropDefinition } from './r'
export { type ContainerProp, type ContainerPropDefinition } from './container'

// Combined system props interface
export interface SystemProps 
  extends FontPropDefinition, 
          ResponsivePropDefinition, 
          ContainerPropDefinition {}

// Import to register patterns
// import './font'
// import './r'
// import './container'

