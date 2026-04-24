import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../constants'

const PROJECT_CWD = '/Users/reference-ui/project'
const CUSTOM_OUT_DIR = '.custom-out'

async function importTmpPathHelpers(outDir: string) {
  vi.resetModules()
  vi.doMock('../../config/store', () => ({
    getOutDir: () => outDir,
  }))

  const { getOutDirPath } = await import('./out-dir')
  const { getOutDirTmpPath, getProjectTmpDirPath } = await import('./tmp-dir')

  return { getOutDirPath, getOutDirTmpPath, getProjectTmpDirPath }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../config/store')
})

describe('tmp-dir path helpers', () => {
  it('resolves the hidden project temp dir under the default outDir name', async () => {
    const { getProjectTmpDirPath } = await importTmpPathHelpers(DEFAULT_OUT_DIR)

    expect(getProjectTmpDirPath(PROJECT_CWD)).toBe(`${PROJECT_CWD}/${DEFAULT_OUT_DIR}/tmp`)
  })

  it('resolves the temp dir nested under the configured outDir', async () => {
    const { getOutDirPath, getOutDirTmpPath } = await importTmpPathHelpers(CUSTOM_OUT_DIR)
    const outDirPath = getOutDirPath(PROJECT_CWD)

    expect(getOutDirTmpPath(outDirPath)).toBe(`${PROJECT_CWD}/${CUSTOM_OUT_DIR}/tmp`)
  })
})