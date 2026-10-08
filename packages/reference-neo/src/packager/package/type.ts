// Package definition for Neo generated packages.
// It takes nothing and emits the declarative shape one generated package is described with.
// The legs execute the description; sync never hand-writes a manifest.
// Narrowed from the legacy port on purpose: copies are file-from-outDir only, because the react styles.css is Neo's sole asset.

export interface PackageCopySource {
  kind: 'file'
  from: 'outDir'
  src: string
  dest: string
}

export interface PackageDefinition {
  name: string
  version: string
  description: string
  /** Entry point for bundling (if bundle: true) */
  entry?: string
  /** Whether to bundle with esbuild (false = just copy files) */
  bundle?: boolean
  /** Main entry point for package.json (defaults to './index.js') */
  main?: string
  /** Types entry point for package.json (defaults to './index.d.ts') */
  types?: string
  exports: Record<string, unknown>
  /** Extra generated files to copy into the package output. */
  copyFrom?: PackageCopySource[]
  /** Optional post-build steps to run before linking (e.g. token replacement). */
  postprocess?: readonly string[]
}
