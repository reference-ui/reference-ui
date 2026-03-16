import type { RawTastyManifest } from '@reference-ui/rust/tasty'

export declare const manifest: RawTastyManifest
export declare const manifestUrl: string

export declare function importTastyArtifact(specifier: string): Promise<unknown>
