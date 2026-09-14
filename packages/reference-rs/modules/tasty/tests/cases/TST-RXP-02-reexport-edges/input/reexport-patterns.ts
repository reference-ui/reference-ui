/**
 * Re-export pattern definitions.
 */

// Type-only re-export
export type { ReexportTypeOnly } from './type-only-source'

// Mixed re-export with inline type keyword
export { type ReexportMixedType, ReexportMixedValue } from './mixed-source'

// Star-as re-export
export * as ReexportStarAs from './star-source'

// Default as named re-export
export { default as ReexportDefaultAsNamed } from './default-source'

// Deep barrel re-export simulation
export { BarrelDeepItem as BarrelDeep } from './sub/barrel-deep'

// Circular re-export
export { CircularItem as CircularReexport } from './circular-a'

// Ambient module declaration
declare module 'ambient-module' {
  export interface AmbientModule {
    ambient: string
  }
}

// Type alias for ambient module usage
export type AmbientModule = import('ambient-module').AmbientModule

// Import the mixed exports for re-export
import type { ReexportMixedType } from './mixed-source'
import { ReexportMixedValue } from './mixed-source'

// Export mixed type and value for testing
export interface ReexportMixed {
  type: ReexportMixedType
  value: ReexportMixedValue
}
