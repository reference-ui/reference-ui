/**
 * Compound and multi-`&` shapes (ATM-COND-26, SPEC-V2-71). `&&`, `&&&`,
 * `&.b&`, `&&+&`, `&+&`, `&.b &`, and the three-`&` bar/baz/qux chain
 * each substitute every `&` textually at one level. Selectors mirror v2
 * `nested_selector_parity.rs:235/:257/:268/:323/:345/:367/:400`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const ARMS: Array<[when: string, color: string, pattern: RegExp]> = [
  ['&&+&', 'red.500', /\.(\S+?)\.\1\+\.\1 \{ color: var\(--colors-red-500\); \}/],
  ['&&', 'blue.500', /\.(\S+?)\.\1 \{ color: var\(--colors-blue-500\); \}/],
  ['&&&', 'green.500', /\.(\S+?)\.\1\.\1 \{ color: var\(--colors-green-500\); \}/],
  ['&.b &', 'amber.500', /\.(\S+?)\.b \.\1 \{ color: var\(--colors-amber-500\); \}/],
  ['&.b&', 'violet.500', /\.(\S+?)\.b\.\1 \{ color: var\(--colors-violet-500\); \}/],
  ['&+&', 'cyan.500', /\.(\S+?)\+\.\1 \{ color: var\(--colors-cyan-500\); \}/],
  [
    '& .bar & .baz & .qux',
    'pink.500',
    /\.(\S+?) \.bar \.\1 \.baz \.\1 \.qux \{ color: var\(--colors-pink-500\); \}/,
  ],
]

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-26',
  verify(result) {
    const sheet = result.stylesheet
    for (const [when, color, pattern] of ARMS) {
      expect(hasWant(result, 'color', color, [when])).toBe(true)
      expect(sheet).toMatch(pattern)
    }
    expect(Object.keys(result.css?.classes ?? {})).toHaveLength(ARMS.length)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
