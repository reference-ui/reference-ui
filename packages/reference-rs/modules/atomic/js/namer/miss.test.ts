/**
 * Dev miss probe pins over a stubbed sheet: comma-bearing utilities such as
 * `repeat(3, 1fr)` and digit-led classes (`.\30 1-app__...`, whose hex
 * escape ends in a space) must match their escaped selectors, not warn.
 * The stub fakes only the CSSOM surface miss.ts touches (styleSheets,
 * cssRules, selectorText, layer names), so no DOM library is needed; the
 * document-ready gate stays `complete` so candidates check immediately.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reportMissCandidates } from './miss.js'

/** Minimal rule-list shape: length plus indexed item access. */
function ruleList<T>(rules: T[]): { length: number; item: (index: number) => T | null } {
  return { length: rules.length, item: (index: number) => rules[index] ?? null }
}

/** A style rule carrying one selector. */
function styleRule(selectorText: string): { selectorText: string } {
  return { selectorText }
}

/** A `@layer name` block wrapping child rules. */
class CSSLayerBlockRule {
  cssRules: unknown

  constructor(
    public name: string,
    children: unknown[]
  ) {
    this.cssRules = ruleList(children)
  }
}

/**
 * One sheet holding the given top-level rules. The probe caches its class
 * set per sheet list, so each test passes its own href to rescan.
 */
function stubSheet(rules: unknown[], href: string | null = null): void {
  const sheet = { href, cssRules: ruleList(rules) }
  vi.stubGlobal('document', { readyState: 'complete', styleSheets: ruleList([sheet]) })
}

/** Let queued microtask checks run. */
async function flushChecks(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(resolve))
}

describe('reportMissCandidates', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('matches comma-bearing utilities to their escaped selectors', async () => {
    stubSheet([
      new CSSLayerBlockRule('reference-ui', [
        new CSSLayerBlockRule('utilities', [
          styleRule(String.raw`.reference-ui__grid-cols_repeat\(3\,_1fr\)`),
          styleRule(
            String.raw`.reference-ui__hover\:bg_color-mix\(in_oklch\,_currentColor_14\%\,_transparent\):is(:hover, [data-hover])`
          ),
          styleRule('.plain, .also-plain'),
        ]),
      ]),
    ])
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportMissCandidates([
      { className: 'reference-ui__grid-cols_repeat(3,_1fr)', message: 'miss-repeat' },
      {
        className: 'reference-ui__hover:bg_color-mix(in_oklch,_currentColor_14%,_transparent)',
        message: 'miss-mix',
      },
      { className: 'plain', message: 'miss-plain' },
      { className: 'also-plain', message: 'miss-also' },
      { className: 'absent', message: 'miss-absent' },
    ])
    await flushChecks()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith('miss-absent')
  })

  it('matches digit-led classes through their spaced hex escapes', async () => {
    // Chromium's selectorText spelling for a system named `01-dashboard`.
    stubSheet(
      [
        new CSSLayerBlockRule('utilities', [
          styleRule(String.raw`.\30 1-dashboard__p_7\.25r`),
          styleRule(
            String.raw`.\30 1-dashboard__hover\:c_red:is(:hover, [data-hover]) .\31 x`
          ),
        ]),
      ],
      '/digit-led.css'
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportMissCandidates([
      { className: '01-dashboard__p_7.25r', message: 'miss-padding' },
      { className: '01-dashboard__hover:c_red', message: 'miss-hover' },
      { className: '1x', message: 'miss-descendant' },
      { className: '0', message: 'miss-truncated' },
    ])
    await flushChecks()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith('miss-truncated')
  })
})
