/**
 * Package definition for Reference UI
 */

export type PackageCopySource =
  | {
      kind: 'file'
      from: 'cli' | 'outDir'
      src: string
      dest: string
    }
  | {
      kind: 'dir'
      from: 'cli' | 'outDir'
      src: string
      dest?: string
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
  /** Extra generated or source files/directories to copy into the package output. */
  copyFrom?: PackageCopySource[]
  /** Optional post-build steps to run before linking (e.g. token replacement). */
  postprocess?: readonly string[]
}
