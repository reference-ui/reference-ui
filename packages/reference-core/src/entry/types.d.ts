export type {
  RawTastyManifest as TastyManifest,
  RawTastySymbolIndexEntry as TastySymbolIndexEntry,
  RawTastySymbolKind as TastySymbolKind,
} from '@reference-ui/rust/tasty'

declare const manifest: import('@reference-ui/rust/tasty').RawTastyManifest

export { manifest }
export default manifest
