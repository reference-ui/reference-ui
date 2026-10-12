/**
 * Unknown tone diagnostics on the lib fixture. A bare unknown tone warns with
 * a did-you-mean and paints its value raw. Inside braces an unknown tone is
 * an error naming the tone, and the declaration it sits in is dropped: the
 * border colour longhand is absent, its width and style still emit (as in
 * ATM-TOKEN-12), and the valid sibling still emits.
 */
import { expect } from 'vitest'
import { type AtomicCaseSpec } from '../../helpers.js'
import type { Diagnostic } from '../../../js/types.js'

// The compiler's help lines ride the native diagnostic but are not on the TS type.
type WithHelp = Diagnostic & { help?: string[] }

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-21',
  verify(result) {
    const sheet = result.stylesheet
    expect(sheet).toContain('background: blue.500/mediun;')
    const bare = result.diagnostics.find(d => d.line === 4) as WithHelp | undefined
    expect(bare).toMatchObject({
      severity: 'warning',
      code: 'ATM-W-UNKNOWN-TONE',
      message: 'unknown tone `mediun` in `blue.500/mediun`',
      column: 7,
    })
    expect(bare?.file).toMatch(/input\/src\/App\.tsx$/)
    expect((bare?.help ?? []).join('\n')).toContain('did you mean `medium`?')

    const braced = result.diagnostics.find(d => d.line === 8)
    expect(braced?.severity, 'braced unknown tone must be an error').toBe('error')
    expect(braced).toMatchObject({
      code: 'ATM-E-UNKNOWN-TOKEN',
      message: 'unknown tone `mediun` in `{colors.blue.500/mediun}` (did you mean `medium`?)',
      column: 11,
    })
    expect(braced?.file).toMatch(/input\/src\/App\.tsx$/)
    expect(sheet).not.toContain('1px solid')
    expect(sheet).not.toContain('{colors.blue.500/mediun}')
    expect(sheet).toContain('border-width: 1px;')
    expect(sheet).toContain('border-style: solid;')
    expect(sheet).toContain('color: var(--colors-blue-500);')
    expect(result.diagnostics).toHaveLength(2)
  },
}

export default spec
