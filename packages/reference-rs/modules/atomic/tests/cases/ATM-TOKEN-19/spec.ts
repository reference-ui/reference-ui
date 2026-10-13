/**
 * Tone happy path and role map on the lib fixture. One css() call pins every
 * role: backgrounds, fills and accent colours draw the surface amount, while
 * borders, outlines, text, strokes and shadows draw the line amount. Each
 * declaration is exact, the tone custom properties it names are defined in
 * the tokens layer, and the compile raises no diagnostic.
 */
import { expect } from 'vitest'
import { layerBody, type AtomicCaseSpec } from '../../harness/helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-TOKEN-19',
  verify(result) {
    const sheet = result.stylesheet
    const count = (needle: string) => sheet.split(needle).length - 1
    expect(sheet).toContain('background: color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent);')
    expect(sheet).toContain('accent-color: color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent);')
    expect(sheet).toContain('fill: color-mix(in srgb, var(--colors-blue-500) var(--tones-ghost-surface), transparent);')
    expect(sheet).toContain('color: color-mix(in srgb, var(--colors-blue-500) var(--tones-strong-line), transparent);')
    expect(sheet).toContain('outline-color: color-mix(in srgb, var(--colors-blue-500) var(--tones-firm-line), transparent);')
    expect(sheet).toContain('stroke: color-mix(in srgb, var(--colors-blue-500) var(--tones-ghost-line), transparent);')
    expect(sheet).toContain('-webkit-text-fill-color: color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent);')
    expect(sheet).toContain('box-shadow: 0 0 0 3px color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent);')
    // borderColor and the braced `border` longhand both draw the line amount.
    expect(count('border-color: color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent);')).toBe(2)
    expect(sheet).toContain('border-width: 1px;')
    expect(sheet).toContain('border-style: solid;')
    const tokens = layerBody(sheet, 'tokens')
    expect(tokens).toContain('--tones-medium-surface: 10%;')
    expect(tokens).toContain('--tones-medium-line: 34%;')
    expect(tokens).toContain('--tones-ghost-surface: 4%;')
    expect(tokens).toContain('--tones-strong-line: 58%;')
    expect(result.diagnostics).toEqual([])
  },
}

export default spec
