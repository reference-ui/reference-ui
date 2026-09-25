/**
 * Target triple mapping definitions for supported native architectures.
 * Provides lookup functions between host runtime platform keys and Rust triples.
 * Maps platforms to corresponding distribution package names under @reference-ui/rust.
 */
export const TARGET_TRIPLES = {
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
  'linux-x64-gnu': 'x86_64-unknown-linux-gnu',
  'win32-x64-msvc': 'x86_64-pc-windows-msvc',
} as const

export type ReferenceNativeTarget = keyof typeof TARGET_TRIPLES

export const SUPPORTED_REFERENCE_NATIVE_TARGETS = Object.keys(
  TARGET_TRIPLES
) as ReferenceNativeTarget[]

export function getReferenceNativePackageName(
  triple: ReferenceNativeTarget
): `@reference-ui/rust-${ReferenceNativeTarget}` {
  return `@reference-ui/rust-${triple}`
}

export function getReferenceNativeTriple(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
): ReferenceNativeTarget | null {
  if (platform === 'darwin' && arch === 'x64') return 'darwin-x64'
  if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64'
  if (platform === 'linux' && arch === 'x64') return 'linux-x64-gnu'
  if (platform === 'win32' && arch === 'x64') return 'win32-x64-msvc'
  return null
}

export function getRustTarget(
  triple: ReferenceNativeTarget
): (typeof TARGET_TRIPLES)[ReferenceNativeTarget] {
  return TARGET_TRIPLES[triple]
}
