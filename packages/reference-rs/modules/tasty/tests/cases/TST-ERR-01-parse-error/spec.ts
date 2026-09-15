/**
 * Station specification for TST-ERR-01-parse-error.
 * Verifies that syntax errors in input files surface as diagnostics without halting emission.
 * Proves primary SPEC ID anchor TST-ERR-01.
 */
import { expect } from 'vitest'
import type { StationSpec } from '../../../testing/index.js'
import type { TastyCaseResult } from '../../helpers.js'

const spec: StationSpec<TastyCaseResult> = {
  id: 'TST-ERR-01',
  verify({ api, emitted }) {
    const hasDiagnostic = (emitted.diagnostics ?? []).some(
      (d) => d.message.includes('parse reported')
    )
    const hasWarning = api.getWarnings().some(
      (w) => w.includes('parse reported')
    )
    expect(hasDiagnostic || hasWarning).toBe(true)
  },
}

export default spec
