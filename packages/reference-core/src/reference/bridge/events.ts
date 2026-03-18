import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

export type ReferenceEvents = {
  /** Emitted when the reference worker is ready to receive triggers. */
  'reference:ready': Record<string, never>
  /** Run a full reference build from the virtual filesystem. */
  'run:reference:build': { name?: string }
  /** Emitted when a reference build completes. */
  'reference:complete': {
    name?: string
    symbolId?: string
    source: 'virtual'
    manifestPath: string
    outputDir: string
    warningCount: number
    diagnosticCount: number
    diagnostics: readonly TastyBuildDiagnostic[]
  }
  /** Emitted when a reference build fails. */
  'reference:failed': { message: string; name?: string }
}
