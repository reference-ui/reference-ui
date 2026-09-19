/**
 * Self-`&` inside functional pseudos (ATM-COND-25, SPEC-V2-70). Every
 * unquoted `&` substitutes — including inside `:not()`, `:has()`, and
 * `:is()` argument lists — at one nesting level. Selectors mirror v2
 * `nested_selector_parity.rs:169/:224/:301/:312/:334/:356/:411/:422`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const ARMS: Array<[when: string, color: string, pattern: RegExp]> = [
  [
    '&:not(&.no)',
    'red.500',
    /\.(\S+?):not\(\.\1\.no\) \{ color: var\(--colors-red-500\); \}/,
  ],
  [
    '&:has(&, :not(&))',
    'blue.500',
    /\.(\S+?):has\(\.\1, :not\(\.\1\)\) \{ color: var\(--colors-blue-500\); \}/,
  ],
  [
    '&.b :not(& + &)',
    'green.500',
    /\.(\S+?)\.b :not\(\.\1 \+ \.\1\) \{ color: var\(--colors-green-500\); \}/,
  ],
  [
    '&.b:not(& + &)',
    'amber.500',
    /\.(\S+?)\.b:not\(\.\1 \+ \.\1\) \{ color: var\(--colors-amber-500\); \}/,
  ],
  [
    '&.b :is(&)',
    'violet.500',
    /\.(\S+?)\.b :is\(\.\1\) \{ color: var\(--colors-violet-500\); \}/,
  ],
  [
    '&.b:is(&)',
    'cyan.500',
    /\.(\S+?)\.b:is\(\.\1\) \{ color: var\(--colors-cyan-500\); \}/,
  ],
  [
    '&:is(.bar, &.baz)',
    'pink.500',
    /\.(\S+?):is\(\.bar, \.\1\.baz\) \{ color: var\(--colors-pink-500\); \}/,
  ],
  [
    '&:not(&)',
    'orange.500',
    /\.(\S+?):not\(\.\1\) \{ color: var\(--colors-orange-500\); \}/,
  ],
]

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-25',
  verify(result) {
    const sheet = result.stylesheet
    for (const [when, color, pattern] of ARMS) {
      expect(hasWant(result, 'color', color, [when])).toBe(true)
      expect(sheet).toMatch(pattern)
    }
    // No `&` survives substitution in a utility selector.
    expect(sheet).not.toContain(':not(&)')
    expect(sheet).not.toContain('&.no)')
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(ARMS.length)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
