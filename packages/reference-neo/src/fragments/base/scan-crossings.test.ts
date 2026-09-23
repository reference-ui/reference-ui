// Native-scan crossing census (F1 COUNT prong, extra X2): steady-state sync
// crosses the seam exactly twice (scan plus compile) with release only on the
// error path. It takes a mocked native module plus a temp project and counts
// the calls sync makes on the happy path and when compile throws.

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const { scanMock, compileMock, releaseMock } = vi.hoisted(() => ({
  scanMock: vi.fn(),
  compileMock: vi.fn(),
  releaseMock: vi.fn(),
}))

vi.mock('@reference-ui/rust/atomic', () => ({
  scan: scanMock,
  compile: compileMock,
  releaseScan: releaseMock,
}))

function writeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'f1-crossings-'))
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(
    join(dir, 'ui.config.ts'),
    [
      "import { defineConfig } from '@reference-ui/neo'",
      '',
      'export default defineConfig({',
      "  name: 'crossings',",
      "  include: ['theme/**/*.ts'],",
      '})',
      '',
    ].join('\n')
  )
  writeFileSync(join(dir, 'theme', 'tokens.ts'), "import '@reference-ui/neo'\n")
  return dir
}

let seenRequest: Record<string, unknown> = {}

function armHappy(): void {
  seenRequest = {}
  scanMock.mockResolvedValue({ hits: [], retainedCount: 1, retentionToken: 41 })
  // Snapshot at call time: sync clears the token on the same object after.
  compileMock.mockImplementation(async (request: Record<string, unknown>) => {
    seenRequest = { ...request }
    return {
      stylesheet: '/* sheet */',
      portableStylesheet: '/* sheet */',
      runtime: { schemaVersion: 2, namer: {}, recipes: {}, stylePropNames: [] },
      diagnostics: [],
      tracedJsxHosts: [],
    }
  })
  releaseMock.mockResolvedValue({ released: false })
}

describe('seam crossing census', () => {
  it('(X2a) steady-state sync crosses exactly twice, release never runs', async () => {
    scanMock.mockReset()
    compileMock.mockReset()
    releaseMock.mockReset()
    armHappy()
    const { sync } = await import('../../sync/index.ts')
    const dir = writeProject()
    try {
      await sync(dir)
    } finally {
      const { rmSync } = await import('node:fs')
      rmSync(dir, { recursive: true, force: true })
    }
    expect(scanMock).toHaveBeenCalledTimes(1)
    expect(compileMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).not.toHaveBeenCalled()
    // The compile carries the token, never the bytes.
    expect(seenRequest['retentionToken']).toBe(41)
    expect('files' in seenRequest).toBe(false)
  })

  it('(X2b) compile failure releases the live retention exactly once', async () => {
    scanMock.mockReset()
    compileMock.mockReset()
    releaseMock.mockReset()
    scanMock.mockResolvedValue({ hits: [], retainedCount: 1, retentionToken: 42 })
    compileMock.mockRejectedValue(new Error('boom'))
    releaseMock.mockResolvedValue({ released: true })
    const { sync } = await import('../../sync/index.ts')
    const dir = writeProject()
    try {
      await expect(sync(dir)).rejects.toThrow('boom')
    } finally {
      const { rmSync } = await import('node:fs')
      rmSync(dir, { recursive: true, force: true })
    }
    expect(scanMock).toHaveBeenCalledTimes(1)
    expect(compileMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledTimes(1)
    expect(releaseMock).toHaveBeenCalledWith({ retentionToken: 42 })
  })
})
