// Unit pins for the §3.12 one-line sync shape. They take the output
// helpers and assert the verbatim plain line, the color spans with their
// enable rules, and the folder-size walk over temp dirs. The CLI cases
// prove the line end to end; these pins hold the exact bytes.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatSyncLine, outDirSizeBytes, printSyncLine } from './output.ts'

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
