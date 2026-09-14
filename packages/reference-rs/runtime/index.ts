/**
 * Runtime dispatch functions and dynamic loader interface for the native Reference UI binary addon.
 * Resolves platform-specific `.node` binaries, verifies architecture compatibility, and exposes guarded native operations.
 * Provides fail-safe error handling when native capabilities are unavailable or incompatible with the host environment.
 */
import { requireNative } from './native'

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

export function rewriteCssImports(sourceCode: string, relativePath: string): string {
  const native = requireNative('rewrite CSS imports')

  return native.rewriteCssImports(sourceCode, relativePath)
}

export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
  const native = requireNative('rewrite CVA imports')

  return native.rewriteCvaImports(sourceCode, relativePath)
}

export function replaceFunctionName(
  sourceCode: string,
  relativePath: string,
  fromName: string,
  toName: string,
  importFrom?: string,
): string {
  const native = requireNative('replace function names')

  return native.replaceFunctionName(sourceCode, relativePath, fromName, toName, importFrom)
}

export function applyResponsiveStyles(
  sourceCode: string,
  relativePath: string,
  breakpoints?: Record<string, string>,
): string {
  const native = requireNative('apply responsive styles')

  const breakpointsJson =
    breakpoints && Object.keys(breakpoints).length > 0
      ? JSON.stringify(breakpoints)
      : undefined

  return native.applyResponsiveStyles(sourceCode, relativePath, breakpointsJson)
}

export function scanAndEmitModules(rootDir: string, include: string[]): string {
  const native = requireNative('scan and emit modules')

  return native.scanAndEmitModules(rootDir, include)
}

export function analyzeAtlas(rootDir: string, configJson?: string): string {
  const native = requireNative('analyze Atlas data')

  return native.analyzeAtlas(rootDir, configJson)
}

export function analyzeStyletrace(rootDir: string, syncRootHint?: string): string {
  const native = requireNative('analyze Styletrace data')

  return native.analyzeStyletrace(rootDir, syncRootHint)
}

export function compileSystem(requestJson: string): string {
  const native = requireNative('compile system')

  return native.compileSystem(requestJson)
}
