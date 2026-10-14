// Barrel for the portable-system assembly.
// It takes nothing and re-exports the base contract plus the assembly the
// packager leg, sync, and config consume. Deep imports stay valid; this file
// is the subsystem address.

export type { BaseAssemblyInput, BaseSystem, ExtendsCarrier, FragmentNode, SystemStreams } from './types.ts'
export { hasUpstreamContainerRoot } from './container-root.ts'
export { mergeStreams, type MergedSheets, type StreamUpstream } from './streams.ts'
export {
  createPortableFragmentBundle,
  fragmentNodesOf,
  linearizeFragmentNodes,
  portableFragmentOf,
  publishedFragmentNodes,
} from './fragments.ts'
export {
  publishedJsxElements,
  resolveJsxElements,
  type JsxElementsArtifact,
  type PublishedJsxElements,
} from './jsx.ts'
export { ExtendSystemError, extendSystem, type ExtendSystemOverrides } from './extend.ts'
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
  type DescribedSystem,
} from './sources.ts'
