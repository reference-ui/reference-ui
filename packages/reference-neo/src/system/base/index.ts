// Barrel for the portable-system assembly.
// It takes nothing and re-exports the base contract plus the assembly the
// packager leg, sync, and config consume. Deep imports stay valid; this file
// is the subsystem address.

export type { BaseAssemblyInput, BaseSystem, ExtendsCarrier } from './types.ts'
export { createPortableFragmentBundle } from './fragments.ts'
export { resolveJsxElements, type JsxElementsArtifact } from './jsx.ts'
export {
  invalidBaseSystem,
  validateBaseSystemEntries,
  validateBaseSystems,
} from './validate.ts'
export { assembleBaseSystem } from './assemble.ts'
export {
  baseSystemInterfaceSource,
  baseSystemMjsSource,
  baseSystemTypesSource,
  systemEntrySource,
  systemTypesSource,
} from './sources.ts'
