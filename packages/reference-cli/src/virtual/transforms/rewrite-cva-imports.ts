import { getVirtualNative } from '../native/loader'

/**
 * Rewrite cva/recipe imports from @reference-ui/react to styled-system path.
 * Replaces recipe( with cva(. Uses Rust/NAPI native implementation (Oxc parser).
 */
export function rewriteCvaImports(sourceCode: string, relativePath: string): string {
  const native = getVirtualNative()
  if (!native) {
    throw new Error(
      'Virtual native addon not available. Run `pnpm run build:native` in @reference-ui/cli. ' +
        'Supported platforms: darwin x64/arm64, linux x64, win32 x64.'
    )
  }
  return native.rewriteCvaImports(sourceCode, relativePath)
}
