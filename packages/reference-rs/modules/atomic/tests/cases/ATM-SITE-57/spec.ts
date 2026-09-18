/**
 * Parse-failure isolation station (ATM-SITE-57). One unparsable file under
 * include yields exactly one located trace warning naming the file while
 * siblings still trace and configured hosts still gate; the compile itself
 * does not fail.
 */
import path from 'node:path'
import { expect } from 'vitest'
import { compile } from '../../../js/index.js'
import {
  getCaseInputDir,
  hasWant,
  LIB_SYSTEM_SPEC,
  type AtomicCaseSpec,
} from '../../helpers.js'

const CASE = 'ATM-SITE-57'

const spec: AtomicCaseSpec = {
  id: CASE,
  async verify(result) {
    const warnings = result.diagnostics.filter(d => d.severity === 'warning')
    const traceWarnings = warnings.filter(w => w.message.includes('StyleTrace'))
    expect(traceWarnings).toHaveLength(1)
    expect(traceWarnings[0]!.message).toContain('Broken.tsx')
    expect(traceWarnings[0]!.file).toMatch(/input\/src\/Broken\.tsx$/)
    // The second warning is extraction's rest-spread note for Card.
    expect(warnings).toHaveLength(2)
    expect(result.tracedJsxHosts ?? []).toEqual(['Card'])
    expect(hasWant(result, 'mt', '4r')).toBe(true)
    expect(hasWant(result, 'mt', '2r')).toBe(false)

    const sourceRoot = path.resolve(getCaseInputDir(CASE))
    const hosted = await compile({
      schemaVersion: 1,
      spec: LIB_SYSTEM_SPEC,
      jsxHosts: ['ConfiguredHost'],
      sourceRoot,
      declarationRoot: sourceRoot,
    })
    expect(
      hosted.diagnostics.filter(d => d.severity === 'error')
    ).toEqual(result.diagnostics.filter(d => d.severity === 'error'))
    expect(hasWant(hosted, 'mt', '2r')).toBe(true)
  },
}

export default spec
