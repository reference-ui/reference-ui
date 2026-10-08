/**
 * Contract tests for the diagnostics frame renderer: headers, arrows, gutters, carets, and caps.
 * Mirrors the Rust render vectors input-for-input so both sides of napi stay byte-identical.
 * Asserts structure with contains, never golden-pins pretty output: style stays free to improve
 * while determinism (same input, same bytes) pins through double-render equality.
 */
import { describe, expect, it } from 'vitest'

import {
  MAX_FRAMES,
  createError,
  createLabel,
  createSpan,
  createWarning,
  renderBatch,
  renderFrame,
  type Diagnostic,
} from './index'

const SOURCE = 'import { css } from "./css";\n\nconst style = css({ colr: "red" });\n'

function spanFor(needle: string): { start: number; end: number } {
  const start = SOURCE.indexOf(needle)
  return createSpan(start, start + needle.length)
}

function warning(): Diagnostic {
  return createWarning('RS-W-EXAMPLE-TOKEN', 'unknown token path `colors.nope`')
}

function framed(): Diagnostic {
  return {
    ...warning(),
    file: 'app/Card.tsx',
    span: spanFor('colr'),
    labels: [{ span: spanFor('colr'), message: 'no such token path' }],
    help: ['point the path at an existing token'],
  }
}

describe('frames', () => {
  it('shows the header, arrow, gutter, carets, label, and help', () => {
    const frame = renderFrame(framed(), SOURCE)
    expect(frame).toContain('warning[RS-W-EXAMPLE-TOKEN]: unknown token path')
    expect(frame).toContain('--> app/Card.tsx:3:21')
    expect(frame).toContain('3 | const style = css({ colr: "red" });')
    expect(frame).toContain('^^^^ no such token path')
    expect(frame).toContain('= help: point the path at an existing token')
  })

  it('renders byte-identical bytes per input', () => {
    expect(renderFrame(framed(), SOURCE)).toBe(renderFrame(framed(), SOURCE))
  })

  it('reports undefined when no frame is honest', () => {
    expect(renderFrame(warning(), SOURCE)).toBeUndefined()
    expect(renderFrame({ ...warning(), file: 'a.tsx', line: 1, column: 2 }, SOURCE)).toBeUndefined()
    const pastEnd = { ...warning(), file: 'a.tsx', span: createSpan(9000, 9005) }
    expect(renderFrame(pastEnd, SOURCE)).toBeUndefined()
    const split = { ...warning(), file: 'a.tsx', span: createSpan(1, 2) }
    expect(renderFrame(split, 'héllo')).toBeUndefined()
  })

  it('renders points as a single caret', () => {
    const offset = SOURCE.indexOf('colr')
    const frame = renderFrame(
      { ...warning(), file: 'a.tsx', span: createSpan(offset, offset) },
      SOURCE
    )
    expect(frame).toContain('--> a.tsx:3:21')
    const carets = frame!.split('\n').find(line => line.includes('^'))!
    expect(carets.split('').filter(char => char === '^')).toHaveLength(1)
  })

  it('underlines every line a multiline span touches', () => {
    const end = SOURCE.indexOf('colr') + 4
    const frame = renderFrame({ ...warning(), file: 'a.tsx', span: createSpan(0, end) }, SOURCE)
    expect(frame).toContain('1 | import')
    expect(frame).toContain('2 | ')
    expect(frame).toContain('3 | const')
    expect(frame!.match(/-->/g)).toHaveLength(1)
  })

  it('opens its own arrow for labels on other lines', () => {
    const frame = renderFrame(
      {
        ...warning(),
        file: 'a.tsx',
        span: spanFor('colr'),
        labels: [createLabel(spanFor('import'), 'starts here')],
      },
      SOURCE
    )
    expect(frame!.match(/-->/g)).toHaveLength(2)
    expect(frame).toContain('starts here')
  })

  it('leads error frames with error', () => {
    const frame = renderFrame(
      {
        ...createError('RS-E-EXAMPLE-BOOM', 'refused: two recipes claim `btn`'),
        file: 'a.tsx',
        span: spanFor('colr'),
      },
      SOURCE
    )
    expect(frame).toContain('error[RS-E-EXAMPLE-BOOM]: refused')
  })
})

describe('batches', () => {
  const batch: Diagnostic[] = ['colr', 'css', 'red'].map(needle => ({
    ...warning(),
    file: 'a.tsx',
    span: spanFor(needle),
  }))

  it('caps frames and keeps the rest one-liners', () => {
    const sourceFor = (): string => SOURCE
    const capped = renderBatch(batch, sourceFor, 1)
    expect(capped.match(/-->/g)).toHaveLength(1)
    expect(capped).toContain('RS-W-EXAMPLE-TOKEN unknown token path')
    expect(renderBatch(batch, sourceFor, 0)).not.toContain('-->')
    expect(renderBatch(batch, sourceFor, MAX_FRAMES).match(/-->/g)).toHaveLength(3)
  })

  it('falls back to one-liners when the source is missing', () => {
    const out = renderBatch(batch, () => undefined, MAX_FRAMES)
    expect(out).not.toContain('-->')
    expect(out).toContain('a.tsx RS-W-EXAMPLE-TOKEN unknown token path')
    expect(renderBatch([], () => undefined, MAX_FRAMES)).toBe('')
  })
})
