/**
 * Tag / class / BEM compounds, ancestors, tails, and bare `&`
 * (ATM-COND-27, SPEC-V2-72). Textual substitution covers the
 * whole one-level grammar — including absurd-but-total spellings like
 * `&html` and `&(:focus)` — plus the three-level `.c &` tail. Bare `&`
 * is a distinct key with a class-only selector (v2 mints `[\&]` too).
 * Selectors mirror v2 `nested_selector_parity.rs:48/:59/:103/:279/:290/`
 * `:378/:532/:587/:598/:609/:620/:631`.
 */
import { expect } from 'vitest'
import { hasWant, type AtomicCaseSpec } from '../../helpers.js'

const ARMS: Array<[when: string, color: string, pattern: RegExp]> = [
  ['&_elem', 'red.500', /\.(\S+?)_elem \{ color: var\(--colors-red-500\); \}/],
  [
    'body &:hover b',
    'blue.500',
    /body \.(\S+?):hover b \{ color: var\(--colors-blue-500\); \}/,
  ],
  ['&html', 'amber.500', /\.(\S+?)html \{ color: var\(--colors-amber-500\); \}/],
  ['html&', 'violet.500', /html\.(\S+?) \{ color: var\(--colors-violet-500\); \}/],
  ['&h1, &h2', 'cyan.500', /\.(\S+?)h1, \.\1h2 \{ color: var\(--colors-cyan-500\); \}/],
  ['&(:focus)', 'pink.500', /\.(\S+?)\(:focus\) \{ color: var\(--colors-pink-500\); \}/],
  [
    '&+.baz, &.qux',
    'orange.500',
    /\.(\S+?)\+\.baz, \.\1\.qux \{ color: var\(--colors-orange-500\); \}/,
  ],
  ['&>.bar', 'lime.500', /\.(\S+?)>\.bar \{ color: var\(--colors-lime-500\); \}/],
  ['body&', 'teal.500', /body\.(\S+?) \{ color: var\(--colors-teal-500\); \}/],
  ['.foo&', 'indigo.500', /\.foo\.(\S+?) \{ color: var\(--colors-indigo-500\); \}/],
]

const spec: AtomicCaseSpec = {
  id: 'ATM-COND-27',
  verify(result) {
    const sheet = result.stylesheet
    for (const [when, color, pattern] of ARMS) {
      expect(hasWant(result, 'color', color, [when])).toBe(true)
      expect(sheet).toMatch(pattern)
    }
    // Three-level tail: `.c &` over `& .b` over `&:hover`.
    expect(hasWant(result, 'color', 'green.500', ['&:hover', '& .b', '.c &'])).toBe(true)
    expect(sheet).toMatch(
      /\.c \.(\S+?):hover \.b \{ color: var\(--colors-green-500\); \}/
    )
    // Bare `&` is a distinct key (class carries `[&]`), not the identity:
    // same value as the plain control, two bare selectors, two classes.
    expect(hasWant(result, 'color', 'purple.500', ['&'])).toBe(true)
    expect(hasWant(result, 'color', 'purple.500', [])).toBe(true)
    const purple = [
      ...sheet.matchAll(/\.(\S+?) \{ color: var\(--colors-purple-500\); \}/g),
    ]
    expect(purple).toHaveLength(2)
    expect(purple[0]?.[1]).not.toBe(purple[1]?.[1])
    const classes = result.css?.classes ?? {}
    expect(classes['&:color:purple.500']).toContain('[&]')
    expect(classes['color:purple.500']).not.toContain('[&]')
    expect(Object.keys(classes)).toHaveLength(ARMS.length + 3)
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
