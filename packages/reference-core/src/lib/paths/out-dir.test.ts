// Unit tests for the Neo out-dir path helper over mocked config stores.
// They take default and custom out dirs and assert the resolved paths.
// This file is a Neo-owned copy of the core path tests trimmed of virtual.

import { describe, expect, it, vi, afterEach } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../constants.ts'

const PROJECT_CWD = '/Users/reference-ui/project'
const CUSTOM_OUT_DIR = '.custom-out'

async function importPathHelpers(outDir: string) {
  vi.resetModules()
  vi.doMock('../../config/store.ts', () => ({
    getOutDir: () => outDir,
  }))

  const { getOutDirPath } = await import('./out-dir.ts')

  return { getOutDirPath }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../config/store.ts')
})

describe('out-dir path helpers', () => {
  it('resolves the configured outDir relative to cwd', async () => {
    const { getOutDirPath } = await importPathHelpers(DEFAULT_OUT_DIR)

    expect(getOutDirPath(PROJECT_CWD)).toBe(`${PROJECT_CWD}/${DEFAULT_OUT_DIR}`)
  })

  it('supports a custom outDir', async () => {
    const { getOutDirPath } = await importPathHelpers(CUSTOM_OUT_DIR)

    expect(getOutDirPath(PROJECT_CWD)).toBe(`${PROJECT_CWD}/${CUSTOM_OUT_DIR}`)
  })
})
