// Published-system assembly root for the portable base system.
// It takes the narrow assembly input and emits the BaseSystem the extends
// chain consumes. The owned prop map rides along only when it names a prop,
// so a system without owned data prints the bytes it always did. The packager
// leg projects the input from the publish shape at the call, so this module
// never sees packager types.

import type { BaseAssemblyInput, BaseSystem } from './types.ts'

export function assembleBaseSystem(input: BaseAssemblyInput): BaseSystem {
  return {
    name: input.name,
    fragment: input.fragment,
    fragments: input.fragments,
    streams: input.streams,
    jsxElements: input.jsxElements,
    jsxOwned: input.jsxOwned && Object.keys(input.jsxOwned).length > 0 ? input.jsxOwned : undefined,
  }
}
