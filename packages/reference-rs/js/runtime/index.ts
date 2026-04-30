import { getVirtualNative, getVirtualNativeUnavailableMessage } from './loader'
import type { VirtualNativeBinding } from './loader'

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

function requireVirtualNative(feature: string): VirtualNativeBinding {
  const native = getVirtualNative()
  if (!native) {
    throw new Error(getVirtualNativeUnavailableMessage(feature))
  }

  return native
}

export function rewriteCssImports(sourceCode: string, relativePath: string): string {
  const native = requireVirtualNative('rewrite CSS imports')

  return native.rewriteCssImports(sourceCode, relativePath)
}

export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
  const native = requireVirtualNative('rewrite CVA imports')

  return native.rewriteCvaImports(sourceCode, relativePath)
}

export function replaceFunctionName(
  sourceCode: string,
  relativePath: string,
  fromName: string,
  toName: string,
  importFrom?: string,
): string {
  const native = requireVirtualNative('replace function names')

  return native.replaceFunctionName(sourceCode, relativePath, fromName, toName, importFrom)
}

export function applyResponsiveStyles(sourceCode: string, relativePath: string): string {
  const native = requireVirtualNative('apply responsive styles')

  return native.applyResponsiveStyles(sourceCode, relativePath)
}

export function scanAndEmitModules(rootDir: string, include: string[]): string {
  const native = requireVirtualNative('scan and emit modules')

  return native.scanAndEmitModules(rootDir, include)
}

export function analyzeAtlas(rootDir: string, configJson?: string): string {
  const native = requireVirtualNative('analyze Atlas data')

  return native.analyzeAtlas(rootDir, configJson)
}

export function analyzeStyletrace(rootDir: string, syncRootHint?: string): string {
  const native = requireVirtualNative('analyze Styletrace data')

  return native.analyzeStyletrace(rootDir, syncRootHint)
}
