// Reference build report suite: it takes tasty scanner and manifest
// diagnostics and pins the counted report plus the codeless native mapping
// run.ts hands the unified reporter. Pure tally and pure translation, so the
// structured data and the presented shape hold together with no seams.

import { describe, expect, it } from 'vitest'
import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'
import { createReferenceBuildReport, tastyDiagnosticToNative } from './build-report.ts'

const SCANNER: TastyBuildDiagnostic = {
  level: 'warning',
  source: 'scanner',
  fileId: '/workspace/src/broken.ts',
  message: 'parse reported an error',
}

const MANIFEST: TastyBuildDiagnostic = {
  level: 'warning',
  source: 'manifest',
  message: 'Duplicate symbol name "Shared" matched 2 entries.',
}

describe('createReferenceBuildReport', () => {
  it('counts warnings and diagnostics without touching the entries', () => {
    const report = createReferenceBuildReport({
      warnings: ['first', 'second'],
      diagnostics: [SCANNER, MANIFEST],
    })

    expect(report.warningCount).toBe(2)
    expect(report.diagnosticCount).toBe(2)
    expect(report.diagnostics).toEqual([SCANNER, MANIFEST])
  })
})

describe('tastyDiagnosticToNative', () => {
  it('maps manifest engine strings to codeless locationless warnings', () => {
    expect(tastyDiagnosticToNative(MANIFEST)).toEqual({
      severity: 'warning',
      message: 'Duplicate symbol name "Shared" matched 2 entries.',
    })
  })

  it('carries the scanner file id as the file without inventing line or code', () => {
    expect(tastyDiagnosticToNative(SCANNER)).toEqual({
      severity: 'warning',
      message: 'parse reported an error',
      file: '/workspace/src/broken.ts',
    })
  })
})
