declare module '@reference-ui/types/runtime' {
  import type { RawTastyManifest } from '@reference-ui/rust/tasty'

  export const manifest: RawTastyManifest
  export const manifestUrl: string

  export function importTastyArtifact(specifier: string): Promise<unknown>
}
