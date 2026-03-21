import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

export type ReferenceEvents = {
  /** Emitted when the reference worker is ready to receive triggers. */
  'reference:ready': Record<string, never>
  /** Sync requests copying the reference component into `.reference-ui/virtual` for Panda scan. */
  'run:reference:component:copy': { virtualDir: string }
  /** Reference component copied into virtual; downstream virtual work may continue. */
  'reference:component:copied': Record<string, never>
  /** Reference component copy failed (e.g. missing source path). */
  'reference:component:copy-failed': { message: string }
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
