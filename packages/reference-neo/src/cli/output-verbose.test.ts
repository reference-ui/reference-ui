// Unit pins for the verbose warning line: the location, code, message, and fix hint on one row, the repeat count,
// the engine help that outranks the static hint, and the paint rules. It takes one warning entry plus its count and
// asserts the verbatim row. The dedupe and summary pins stay in output.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { dedupeDiagnostics, formatVerboseWarningLine } from './output.ts'
import { warning } from './__fixtures__/output-fixtures.ts'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('formatVerboseWarningLine', () => {
  it('prints location, code, message, and the fix hint on one line', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 })).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('collapses repeats with a ×N count and never prints the same warning twice', () => {
    vi.stubEnv('NO_COLOR', '1')
    const [group] = dedupeDiagnostics([warning(), warning(), warning()])
    expect(group?.count).toBe(3)
    expect(formatVerboseWarningLine(group!)).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS ×3 — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('omits the hint for unknown codes and info telemetry', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(
      formatVerboseWarningLine({ entry: warning({ code: 'ATM-W-FROM-THE-FUTURE' }), count: 1 })
    ).toBe('  theme/warn.ts:3:33 ATM-W-FROM-THE-FUTURE: `display: true` is not valid CSS')
    expect(
      formatVerboseWarningLine(
        { entry: warning({ severity: 'info', code: 'ATM-I-DEAD-BRANCH', message: 'dead branch' }), count: 1 },
        'compiler'
      )
    ).toBe('  [compiler] theme/warn.ts:3:33 ATM-I-DEAD-BRANCH: dead branch')
  })

  it('tags compiler entries and degrades gracefully without a location', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 }, 'compiler')).toBe(
      '  [compiler] theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
    expect(
      formatVerboseWarningLine({ entry: warning({ file: undefined, line: undefined, column: undefined }), count: 1 })
    ).toBe('  ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts')
    expect(formatVerboseWarningLine({ entry: warning({ line: undefined, column: undefined }), count: 1 })).toBe(
      '  theme/warn.ts ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })
})

describe('formatVerboseWarningLine engine help', () => {
  it('prefers engine help over the static hint when both are present', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(
      formatVerboseWarningLine({ entry: warning({ help: ["remove the empty value on 'display'"] }), count: 1 })
    ).toBe(
      "  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — remove the empty value on 'display'"
    )
  })

  it("joins multi-line engine help with '; ' on the one verbose row", () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(
      formatVerboseWarningLine({
        entry: warning({ help: ["did you mean 'float'?", "remove 'fooBar' or check its spelling"] }),
        count: 1,
      })
    ).toBe(
      "  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — did you mean 'float'?; remove 'fooBar' or check its spelling"
    )
  })

  it('prints exactly one tail, never engine help plus the static hint', () => {
    vi.stubEnv('NO_COLOR', '1')
    const line = formatVerboseWarningLine({ entry: warning({ help: ['instance fix'] }), count: 1 })
    expect(line).toContain('— instance fix')
    expect(line).not.toContain('use a CSS keyword, token, or value the prop accepts')
    expect(line.split('—')).toHaveLength(2)
  })

  it('renders engine help on codeless legacy items with no static fallback', () => {
    vi.stubEnv('NO_COLOR', '1')
    const legacy = warning({
      code: undefined,
      file: undefined,
      line: undefined,
      column: undefined,
      message: 'a straggler with guidance',
      help: ['name the props type instead'],
    })
    expect(formatVerboseWarningLine({ entry: legacy, count: 1 }, 'ref')).toBe(
      '  [ref] a straggler with guidance — name the props type instead'
    )
  })

  it('ignores blank engine help lines and falls back to the static hint', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning({ help: ['   '] }), count: 1 })).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('paints the code yellow on FORCE_COLOR and stays plain under NO_COLOR', () => {
    vi.stubEnv('NO_COLOR', '')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 })).toBe(
      '  theme/warn.ts:3:33 \x1b[33mATM-W-INVALID-CSS-VALUE\x1b[0m: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
    vi.stubEnv('NO_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 })).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })
})

describe('formatVerboseWarningLine ref channel', () => {
  it('prints coded ref entries with code and fix hint', () => {
    vi.stubEnv('NO_COLOR', '1')
    const manifest = warning({
      code: 'TST-W-DUPLICATE-SYMBOL-NAME',
      file: undefined,
      line: undefined,
      column: undefined,
      message: 'Duplicate symbol name `Shared` matched 2 entries. Use symbol id or scoped lookup to disambiguate.',
    })
    expect(formatVerboseWarningLine({ entry: manifest, count: 1 }, 'ref')).toBe(
      '  [ref] TST-W-DUPLICATE-SYMBOL-NAME: Duplicate symbol name `Shared` matched 2 entries. Use symbol id or scoped lookup to disambiguate. — use the symbol id or a scoped lookup to disambiguate'
    )
  })

  it('keeps the file-only location on ref scanner entries without inventing a line', () => {
    vi.stubEnv('NO_COLOR', '1')
    const scanner = warning({
      code: 'TST-W-PARSE-ERROR',
      file: 'src/broken.ts',
      line: undefined,
      column: undefined,
      message: 'parse reported an error',
    })
    expect(formatVerboseWarningLine({ entry: scanner, count: 1 }, 'ref')).toBe(
      '  [ref] src/broken.ts TST-W-PARSE-ERROR: parse reported an error — fix the syntax error so the file parses cleanly'
    )
  })

  it('keeps codes on coded lines whatever the channel', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 }, 'ref')).toBe(
      '  [ref] theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('collapses identical ref entries with ×N so counts reconcile', () => {
    vi.stubEnv('NO_COLOR', '1')
    const manifest = warning({
      code: 'TST-W-DUPLICATE-SYMBOL-NAME',
      file: undefined,
      line: undefined,
      column: undefined,
      message: 'Duplicate symbol name `Shared` matched 2 entries.',
    })
    const [group] = dedupeDiagnostics([manifest, { ...manifest }, { ...manifest }])
    expect(group?.count).toBe(3)
    expect(formatVerboseWarningLine(group!, 'ref')).toBe(
      '  [ref] TST-W-DUPLICATE-SYMBOL-NAME: Duplicate symbol name `Shared` matched 2 entries. ×3 — use the symbol id or a scoped lookup to disambiguate'
    )
  })

  it('prints legacy codeless items as tag plus message with no hint', () => {
    vi.stubEnv('NO_COLOR', '1')
    const legacy = warning({
      code: undefined,
      file: undefined,
      line: undefined,
      column: undefined,
      message: 'a straggler without a code',
    })
    expect(formatVerboseWarningLine({ entry: legacy, count: 1 }, 'ref')).toBe(
      '  [ref] a straggler without a code'
    )
  })
})
