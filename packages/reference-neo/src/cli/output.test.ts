// Unit pins for the boot block, the §3.12 resync line, the fold rule,
// and the warning presentation. They take the output helpers and assert
// the verbatim plain shapes, the color spans with their enable rules,
// the warning dedupe and counts, and the sheet-size read over temp dirs.
// The CLI cases prove the shapes end to end; these pins hold the bytes.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NativeDiagnostic } from '../native/contract.ts'
import {
  cssSizeBytes,
  dedupeDiagnostics,
  foldedWarningCount,
  formatBootBlock,
  formatSyncLine,
  formatVerboseWarningLine,
  formatWarningSummary,
  printBootBlock,
  printSyncLine,
  refVersion,
} from './output.ts'

const PLAIN_LINE = '⎔ ref sync ⫶ 100 ms ⫶ 1.0 MB'
const COLORED_LINE =
  '\x1b[36m⎔\x1b[0m \x1b[1mref sync\x1b[0m \x1b[2m⫶\x1b[0m \x1b[32m100 ms\x1b[0m \x1b[2m⫶\x1b[0m \x1b[32m1.0 MB\x1b[0m'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('formatSyncLine', () => {
  it('prints the verbatim §3.12 shape when piped', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '')
    expect(formatSyncLine(100, 1024 * 1024)).toBe(PLAIN_LINE)
  })

  it('sizes small folders in bytes and kilobytes', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatSyncLine(7, 512)).toBe('⎔ ref sync ⫶ 7 ms ⫶ 512 B')
    expect(formatSyncLine(7, 1536)).toBe('⎔ ref sync ⫶ 7 ms ⫶ 1.5 KB')
  })

  it('colors glyph, command, and stats with faint separators on FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatSyncLine(100, 1024 * 1024)).toBe(COLORED_LINE)
  })

  it('lets NO_COLOR win over FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatSyncLine(100, 1024 * 1024)).toBe(PLAIN_LINE)
  })
})

describe('formatSyncLine warnings', () => {
  it('appends the warning segment after a separator when warnings rode along', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatSyncLine(100, 1024 * 1024, 3)).toBe('⎔ ref sync ⫶ 100 ms ⫶ 1.0 MB ⫶ ⚠ 3 warnings [--verbose]')
    expect(formatSyncLine(100, 1024 * 1024, 1)).toBe('⎔ ref sync ⫶ 100 ms ⫶ 1.0 MB ⫶ ⚠ 1 warning [--verbose]')
  })

  it('prints the bare shape for zero warnings', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatSyncLine(100, 1024 * 1024, 0)).toBe(PLAIN_LINE)
    expect(formatSyncLine(100, 1024 * 1024)).toBe(PLAIN_LINE)
  })

  it('paints the folded glyph yellow with faint separators on FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatSyncLine(100, 1024 * 1024, 3)).toBe(
      '\x1b[36m⎔\x1b[0m \x1b[1mref sync\x1b[0m \x1b[2m⫶\x1b[0m \x1b[32m100 ms\x1b[0m \x1b[2m⫶\x1b[0m \x1b[32m1.0 MB\x1b[0m \x1b[2m⫶\x1b[0m \x1b[33m⚠\x1b[0m 3 warnings [--verbose]'
    )
  })
})

describe('foldedWarningCount', () => {
  it('carries the total by default and zero under verbose', () => {
    expect(foldedWarningCount(3, false)).toBe(3)
    expect(foldedWarningCount(3, true)).toBe(0)
    expect(foldedWarningCount(0, false)).toBe(0)
    expect(foldedWarningCount(-2, false)).toBe(0)
  })
})

describe('cssSizeBytes', () => {
  it('reads the published sheet and returns zero for a missing dir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ref-output-'))
    try {
      mkdirSync(join(dir, 'styled'), { recursive: true })
      writeFileSync(join(dir, 'system.mjs'), 'x'.repeat(100))
      writeFileSync(join(dir, 'styled', 'styles.css'), 'y'.repeat(50))
      expect(cssSizeBytes(dir)).toBe(50)
      expect(cssSizeBytes(join(dir, 'absent'))).toBe(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('refVersion', () => {
  it('resolves the Neo package version', () => {
    expect(refVersion()).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe('formatBootBlock', () => {
  it('prints the verbatim plain block with warnings and watch rows', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '')
    expect(formatBootBlock({ version: '1.0.0', elapsedMs: 104, cssBytes: 1024 * 1024, warnings: 3, watch: true })).toBe(
      '\n  REF  v1.0.0  ready in 104 ms\n\n  → CSS:       1.0 MB\n  → Warnings:  3 [--verbose]\n  → Watch:     on'
    )
  })

  it('omits the warnings row at zero and the watch row for one-shots', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatBootBlock({ version: '1.0.0', elapsedMs: 7, cssBytes: 512 })).toBe(
      '\n  REF  v1.0.0  ready in 7 ms\n\n  → CSS:       512 B'
    )
  })

  it('paints the brand blue, ready-in dim with a bold time, CSS green, and the count yellow on FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatBootBlock({ version: '1.0.0', elapsedMs: 104, cssBytes: 1024 * 1024, warnings: 3 })).toBe(
      '\n  \x1b[1m\x1b[94mREF \x1b[0m v1.0.0  \x1b[2mready in\x1b[0m \x1b[1m104\x1b[0m\x1b[2m ms\x1b[0m\n\n  \x1b[94m→\x1b[0m CSS:       \x1b[32m1.0 MB\x1b[0m\n  \x1b[94m→\x1b[0m Warnings:  \x1b[33m3\x1b[0m [--verbose]'
    )
  })

  it('lets NO_COLOR win over FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatBootBlock({ version: '1.0.0', elapsedMs: 104, cssBytes: 1024 * 1024, warnings: 3 })).toBe(
      '\n  REF  v1.0.0  ready in 104 ms\n\n  → CSS:       1.0 MB\n  → Warnings:  3 [--verbose]'
    )
  })
})

describe('printBootBlock', () => {
  it('emits the measured block through a single console.log', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '')
    const dir = mkdtempSync(join(tmpdir(), 'ref-output-'))
    try {
      mkdirSync(join(dir, 'styled'), { recursive: true })
      writeFileSync(join(dir, 'styled', 'styles.css'), 'x'.repeat(2048))
      const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
      printBootBlock({ elapsedMs: 42, outDir: dir, warnings: 2 })
      expect(logged).toHaveBeenCalledTimes(1)
      expect(logged).toHaveBeenCalledWith(
        `\n  REF  v${refVersion()}  ready in 42 ms\n\n  → CSS:       2.0 KB\n  → Warnings:  2 [--verbose]`
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('printSyncLine', () => {
  it('emits the measured line through a single console.log', () => {
    vi.stubEnv('NO_COLOR', '1')
    const dir = mkdtempSync(join(tmpdir(), 'ref-output-'))
    try {
      mkdirSync(join(dir, 'styled'), { recursive: true })
      writeFileSync(join(dir, 'styled', 'styles.css'), 'x'.repeat(2048))
      const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
      printSyncLine(42, dir)
      expect(logged).toHaveBeenCalledTimes(1)
      expect(logged).toHaveBeenCalledWith('⎔ ref sync ⫶ 42 ms ⫶ 2.0 KB')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('carries folded warnings on the measured line', () => {
    vi.stubEnv('NO_COLOR', '1')
    const dir = mkdtempSync(join(tmpdir(), 'ref-output-'))
    try {
      mkdirSync(join(dir, 'styled'), { recursive: true })
      writeFileSync(join(dir, 'styled', 'styles.css'), 'x'.repeat(2048))
      const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
      printSyncLine(42, dir, 3)
      expect(logged).toHaveBeenCalledTimes(1)
      expect(logged).toHaveBeenCalledWith('⎔ ref sync ⫶ 42 ms ⫶ 2.0 KB ⫶ ⚠ 3 warnings [--verbose]')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('formatWarningSummary', () => {
  it('pins the singular and plural plain shapes with the bracketed pointer', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '')
    expect(formatWarningSummary(1)).toBe('⚠ 1 warning [--verbose]')
    expect(formatWarningSummary(16)).toBe('⚠ 16 warnings [--verbose]')
  })

  it('uses U+26A0 with no emoji variation selector', () => {
    vi.stubEnv('NO_COLOR', '1')
    const line = formatWarningSummary(2)
    expect(line.codePointAt(0)).toBe(0x26a0)
    expect(line).not.toMatch(/\uFE0E|\uFE0F/)
  })

  it('paints only the glyph yellow on FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatWarningSummary(3)).toBe('\x1b[33m⚠\x1b[0m 3 warnings [--verbose]')
  })

  it('lets NO_COLOR win over FORCE_COLOR', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatWarningSummary(3)).toBe('⚠ 3 warnings [--verbose]')
  })
})

function warning(overrides: Partial<NativeDiagnostic> = {}): NativeDiagnostic {
  return {
    severity: 'warning',
    code: 'ATM-W-INVALID-CSS-VALUE',
    message: '`display: true` is not valid CSS',
    file: 'theme/warn.ts',
    line: 3,
    column: 33,
    ...overrides,
  }
}

describe('dedupeDiagnostics', () => {
  it('collapses exact repeats into counted groups in first-seen order', () => {
    const first = warning()
    const second = warning({ code: 'ATM-W-UNKNOWN-COLOR', message: 'no such color', line: 5, column: 31 })
    const groups = dedupeDiagnostics([first, second, warning(), warning(), second])
    expect(groups).toHaveLength(2)
    expect(groups[0]?.count).toBe(3)
    expect(groups[0]?.entry).toBe(first)
    expect(groups[1]?.count).toBe(2)
    expect(groups[1]?.entry).toBe(second)
  })

  it('keeps distinct locations, messages, and severities on their own lines', () => {
    const groups = dedupeDiagnostics([
      warning(),
      warning({ line: 4 }),
      warning({ message: 'another message' }),
      warning({ severity: 'info', code: 'ATM-I-DEAD-BRANCH' }),
    ])
    expect(groups.map(group => group.count)).toEqual([1, 1, 1, 1])
  })

  it('folds only identical spans and keeps distinct rendering channels apart', () => {
    const groups = dedupeDiagnostics([
      warning({ span: { start: 10, end: 14 } }),
      warning({ span: { start: 10, end: 14 } }),
      warning({ span: { start: 20, end: 24 } }),
      warning({ span: { start: 10, end: 14 }, help: ['other guidance'] }),
    ])
    expect(groups.map(group => group.count)).toEqual([2, 1, 1])
  })

  it('dedupes nothing out of an empty list', () => {
    expect(dedupeDiagnostics([])).toEqual([])
  })
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
