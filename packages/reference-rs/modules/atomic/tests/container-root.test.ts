/**
 * Container-root warning stations for the upstream coverage signal (Addendum B).
 * A rootless spec with container-query atoms warns ATM-W-MISSING-CONTAINER-ROOT;
 * the same compile with `upstreamContainerRoot` stays silent while still
 * emitting its `@container` rules.
 */
import { describe, expect, it } from 'vitest'
import { compile } from '../js/index.js'
import type { Diagnostic, EvaluatedSystemSpec } from '../js/types.js'
import evaluatedSystemSpecJson from '../../../contracts/fixtures/evaluated-system-spec.json'

const specSystem = evaluatedSystemSpecJson as EvaluatedSystemSpec

const PROBE = `
import { Div } from '@reference-ui/react'
export const Comp = () => <Div mt={['1r', '2r', '4r']} />
`

function hasContainerWarning(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some(diag => diag.code === 'ATM-W-MISSING-CONTAINER-ROOT')
}

describe('container-root upstream coverage', () => {
  it('warns when container atoms have no local or upstream root', async () => {
    const result = await compile({
      logs: ['proof'],
      baseSystem: specSystem,
      files: [{ path: 'test.tsx', content: PROBE }],
    })
    expect(result.stylesheet).toContain('@container')
    expect(hasContainerWarning(result.diagnostics)).toBe(true)
  })

  it('stays silent when an upstream contributes the container root', async () => {
    const result = await compile({
      logs: ['proof'],
      baseSystem: specSystem,
      upstreamContainerRoot: true,
      files: [{ path: 'test.tsx', content: PROBE }],
    })
    expect(result.stylesheet).toContain('@container')
    expect(hasContainerWarning(result.diagnostics)).toBe(false)
  })
})
