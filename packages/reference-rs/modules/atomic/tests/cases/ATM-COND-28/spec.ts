/**
 * Pseudo-element placements and combinator stacks (ATM-COND-28,
 * SPEC-V2-73). Descendant / compound / ancestor `::before` spellings
 * print textually at one level; `&`-first stacks distribute down the
 * chain (`&:last-child` + `& :is()`, the `.b/.c/.d` tower, and the
 * `> .row > .cell` tower). Selectors mirror v2
 * `nested_selector_parity.rs:444/:488/:499/:510/:543/:554/:565`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-28',
  verify(result) {
    const sheet = result.stylesheet
    expect(hasWant(result, 'color', 'red.500', ['& ::after'])).toBe(true)
    expect(sheet).toMatch(/\.(\S+?) ::after \{ color: var\(--colors-red-500\); \}/)
    expect(hasWant(result, 'color', 'blue.500', ['::before&'])).toBe(true)
    expect(sheet).toMatch(/::before\.(\S+?) \{ color: var\(--colors-blue-500\); \}/)
    expect(hasWant(result, 'color', 'green.500', [':before&'])).toBe(true)
    expect(sheet).toMatch(/(?<!:):before\.(\S+?) \{ color: var\(--colors-green-500\); \}/)
    expect(hasWant(result, 'color', 'amber.500', ['::before &'])).toBe(true)
    expect(sheet).toMatch(/::before \.(\S+?) \{ color: var\(--colors-amber-500\); \}/)
    expect(hasWant(result, 'display', 'none', ['&:last-child', '& :is(.a, .b)'])).toBe(
      true
    )
    expect(sheet).toMatch(/\.(\S+?):last-child :is\(\.a, \.b\) \{ display: none; \}/)
    expect(hasWant(result, 'color', 'violet.500', ['& .b', '& .c', '& .d'])).toBe(true)
    expect(sheet).toMatch(/\.(\S+?) \.b \.c \.d \{ color: var\(--colors-violet-500\); \}/)
    expect(hasWant(result, 'color', 'cyan.500', ['& > .row', '& > .cell'])).toBe(true)
    expect(sheet).toMatch(
      /\.(\S+?) > \.row > \.cell \{ color: var\(--colors-cyan-500\); \}/
    )
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(7)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
