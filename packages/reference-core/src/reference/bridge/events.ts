import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

export type ReferenceEvents = {
  /** Emitted when the reference worker is ready to receive triggers. */
  'reference:ready': Record<string, never>
  /** Virtual worker requests reference-browser files into `.reference-ui/virtual` (Panda scan). */
  'run:reference:copy-browser': { virtualDir: string }
  /** Reference browser slice copied into virtual; virtual copy-all may continue. */
  'reference:browser:virtual-ready': Record<string, never>
  /** Copy failed (e.g. missing source path). */
  'reference:browser:virtual-failed': { message: string }
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
