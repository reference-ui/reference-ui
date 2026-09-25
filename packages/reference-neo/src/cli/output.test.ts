// Unit pins for the §3.12 one-line sync shape and the warning presentation.
// They take the output helpers and assert the verbatim plain lines, the
// color spans with their enable rules, the warning dedupe and counts, and
// the folder-size walk over temp dirs. The CLI cases prove the shapes end
// to end; these pins hold the exact bytes.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NativeDiagnostic } from '../native/contract.ts'
import {
  dedupeDiagnostics,
  formatSyncLine,
  formatVerboseWarningLine,
  formatWarningSummary,
  outDirSizeBytes,
  printSyncLine,
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

describe('outDirSizeBytes', () => {
  it('sums nested files and returns zero for a missing dir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ref-output-'))
    try {
      mkdirSync(join(dir, 'nested'), { recursive: true })
      writeFileSync(join(dir, 'a.mjs'), 'x'.repeat(100))
      writeFileSync(join(dir, 'nested', 'b.css'), 'y'.repeat(50))
      expect(outDirSizeBytes(dir)).toBe(150)
      expect(outDirSizeBytes(join(dir, 'absent'))).toBe(0)
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
      writeFileSync(join(dir, 'a.mjs'), 'x'.repeat(2048))
      const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
      printSyncLine(42, dir)
      expect(logged).toHaveBeenCalledTimes(1)
      expect(logged).toHaveBeenCalledWith('⎔ ref sync ⫶ 42 ms ⫶ 2.0 KB')
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

  it('dedupes nothing out of an empty list', () => {
    expect(dedupeDiagnostics([])).toEqual([])
  })
})

describe('formatVerboseWarningLine', () => {
  it('prints location, code, message, and the fix hint on one line', () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('FORCE_COLOR', '')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 }, false)).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('collapses repeats with a ×N count and never prints the same warning twice', () => {
    vi.stubEnv('NO_COLOR', '1')
    const [group] = dedupeDiagnostics([warning(), warning(), warning()])
    expect(group?.count).toBe(3)
    expect(formatVerboseWarningLine(group!, false)).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS ×3 — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('omits the hint for unknown codes and info telemetry', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(
      formatVerboseWarningLine({ entry: warning({ code: 'ATM-W-FROM-THE-FUTURE' }), count: 1 }, false)
    ).toBe('  theme/warn.ts:3:33 ATM-W-FROM-THE-FUTURE: `display: true` is not valid CSS')
    expect(
      formatVerboseWarningLine(
        { entry: warning({ severity: 'info', code: 'ATM-I-DEAD-BRANCH', message: 'dead branch' }), count: 1 },
        true
      )
    ).toBe('  [compiler] theme/warn.ts:3:33 ATM-I-DEAD-BRANCH: dead branch')
  })

  it('tags compiler entries and degrades gracefully without a location', () => {
    vi.stubEnv('NO_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 }, true)).toBe(
      '  [compiler] theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
    expect(
      formatVerboseWarningLine({ entry: warning({ file: undefined, line: undefined, column: undefined }), count: 1 }, false)
    ).toBe('  ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts')
    expect(formatVerboseWarningLine({ entry: warning({ line: undefined, column: undefined }), count: 1 }, false)).toBe(
      '  theme/warn.ts ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })

  it('paints the code yellow on FORCE_COLOR and stays plain under NO_COLOR', () => {
    vi.stubEnv('NO_COLOR', '')
    vi.stubEnv('FORCE_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 }, false)).toBe(
      '  theme/warn.ts:3:33 \x1b[33mATM-W-INVALID-CSS-VALUE\x1b[0m: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
    vi.stubEnv('NO_COLOR', '1')
    expect(formatVerboseWarningLine({ entry: warning(), count: 1 }, false)).toBe(
      '  theme/warn.ts:3:33 ATM-W-INVALID-CSS-VALUE: `display: true` is not valid CSS — use a CSS keyword, token, or value the prop accepts'
    )
  })
})
