import { getVirtualNative } from './loader'

export type { VirtualNativeBinding } from './loader'
export {
  getVirtualNative,
  getVirtualNativeCandidates,
  getVirtualNativeTriple,
  loadVirtualNative,
  resolveReferenceRsPackageDir,
  resolveVirtualNativeBinaryPath,
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
} from './loader'

export function rewriteCssImports(sourceCode: string, relativePath: string): string {
  const native = getVirtualNative()
  if (!native) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm --filter @reference-ui/rust run build` first. ' +
        'Supported platforms: darwin x64/arm64, linux x64, win32 x64.'
    )
  }

  return native.rewriteCssImports(sourceCode, relativePath)
}

export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
  const native = getVirtualNative()
  if (!native) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm --filter @reference-ui/rust run build` first. ' +
        'Supported platforms: darwin x64/arm64, linux x64, win32 x64.'
    )
  }

  return native.rewriteCvaImports(sourceCode, relativePath)
}

export function scanAndEmitBundle(rootDir: string, include: string[]): string {
  const native = getVirtualNative()
  if (!native) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm --filter @reference-ui/rust run build` first. ' +
        'Supported platforms: darwin x64/arm64, linux x64, win32 x64.'
    )
  }

  return native.scanAndEmitBundle(rootDir, include)
}
