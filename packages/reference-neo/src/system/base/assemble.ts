// Published-system assembly root for the portable base system.
// It takes the narrow assembly input and emits the BaseSystem the extends
// chain consumes. The packager leg projects the input from the publish shape
// at the call, so this module never sees packager types.

import type { BaseAssemblyInput, BaseSystem } from './types.ts'

export function assembleBaseSystem(input: BaseAssemblyInput): BaseSystem {
  return {
    name: input.name,
    fragment: input.fragment,
    css: input.css,
    jsxElements: input.jsxElements,
  }
}
