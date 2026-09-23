import { describe, expect, it, vi, afterEach } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../constants'

const PROJECT_CWD = '/Users/reference-ui/project'
const CUSTOM_OUT_DIR = '.custom-out'

async function importPathHelpers(outDir: string) {
  vi.resetModules()
  vi.doMock('../../config/store', () => ({
    getOutDir: () => outDir,
  }))

  const { getOutDirPath } = await import('./out-dir')
  const { getVirtualDirPath } = await import('./virtual-dir')

  return { getOutDirPath, getVirtualDirPath }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../config/store')
})

describe('out-dir path helpers', () => {
  it('resolves the configured outDir relative to cwd', async () => {
    const { getOutDirPath } = await importPathHelpers(DEFAULT_OUT_DIR)

    expect(getOutDirPath(PROJECT_CWD)).toBe(`${PROJECT_CWD}/${DEFAULT_OUT_DIR}`)
  })

  it('supports a custom outDir', async () => {
    const { getOutDirPath, getVirtualDirPath } = await importPathHelpers(CUSTOM_OUT_DIR)

    expect(getOutDirPath(PROJECT_CWD)).toBe(`${PROJECT_CWD}/${CUSTOM_OUT_DIR}`)
    expect(getVirtualDirPath(PROJECT_CWD)).toBe(`${PROJECT_CWD}/${CUSTOM_OUT_DIR}/virtual`)
  })
})
