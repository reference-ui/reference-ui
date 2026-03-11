import { afterEach, describe, expect, it, vi } from 'vitest'

async function importCoreDist(coreDir: string) {
  vi.resetModules()
  vi.doMock('./core-package-dir', () => ({
    resolveCorePackageDir: () => coreDir,
  }))

  return import('./core-dist')
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./core-package-dir')
})

describe('resolveCoreDistPath', () => {
  it('resolves worker paths under dist/cli', async () => {
    const { resolveCoreDistPath } = await importCoreDist('/Users/reference-ui/packages/reference-core')

    expect(resolveCoreDistPath('watch/worker.mjs')).toBe(
      '/Users/reference-ui/packages/reference-core/dist/cli/watch/worker.mjs'
    )
  })
})
