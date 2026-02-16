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

