export const TARGET_TRIPLES = {
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
  'linux-x64-gnu': 'x86_64-unknown-linux-gnu',
  'win32-x64-msvc': 'x86_64-pc-windows-msvc',
} as const

export type VirtualNativeTarget = keyof typeof TARGET_TRIPLES

export const SUPPORTED_VIRTUAL_NATIVE_TARGETS = Object.keys(TARGET_TRIPLES) as VirtualNativeTarget[]

export function getVirtualNativePackageName(triple: VirtualNativeTarget): `@reference-ui/rust-${VirtualNativeTarget}` {
  return `@reference-ui/rust-${triple}`
}

export function getVirtualNativeTriple(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
): VirtualNativeTarget | null {
  if (platform === 'darwin' && arch === 'x64') return 'darwin-x64'
  if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64'
  if (platform === 'linux' && arch === 'x64') return 'linux-x64-gnu'
  if (platform === 'win32' && arch === 'x64') return 'win32-x64-msvc'
  return null
}

export function getRustTarget(triple: VirtualNativeTarget): (typeof TARGET_TRIPLES)[VirtualNativeTarget] {
  return TARGET_TRIPLES[triple]
}
