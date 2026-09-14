/**
 * Root host entrypoint for the Reference UI native binary addon.
 * Exposes the dynamic loader, native dispatch helpers, and platform diagnostics.
 * Re-exports VirtualRS AST transformation helpers for backwards compatibility with the package root.
 */
export { requireNative, callNativeJson } from './native'
export type { VirtualNativeBinding } from './loader'
export {
  getVirtualNative,
  getVirtualNativeCandidates,
  getVirtualNativeDiagnostics,
  getVirtualNativeTriple,
  loadVirtualNative,
  resolveReferenceRsPackageDir,
  resolveVirtualNativeBinaryPath,
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
} from './loader'

export {
  applyResponsiveStyles,
  replaceFunctionName,
  rewriteCssImports,
  rewriteCvaImports,
} from '../../virtualrs/js/runtime'
