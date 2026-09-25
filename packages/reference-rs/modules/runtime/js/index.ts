/**
 * Root host entrypoint for the Reference UI native binary addon.
 * Exposes the dynamic loader, native dispatch helpers, and platform diagnostics.
 */
export { requireNative, callNativeJson } from './native'
export type { ReferenceNativeBinding } from './loader'
export {
  getReferenceNative,
  getReferenceNativeCandidates,
  getReferenceNativeDiagnostics,
  getReferenceNativeTriple,
  loadReferenceNative,
  resolveReferenceRsPackageDir,
  resolveReferenceNativeBinaryPath,
  SUPPORTED_REFERENCE_NATIVE_TARGETS,
} from './loader'
