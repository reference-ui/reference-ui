import { afterEach, describe, expect, it, vi } from 'vitest'

async function importInitModule() {
  vi.resetModules()

  const runWorker = vi.fn()

  vi.doMock('../lib/thread-pool', () => ({
    workers: {
      runWorker,
    },
  }))

  const mod = await import('./init')
  return { ...mod, runWorker }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/thread-pool')
  vi.restoreAllMocks()
})

describe('packager/init', () => {
  it('defaults packager installs to dev mode', async () => {
    const { initPackager, runWorker } = await importInitModule()

    initPackager({
      cwd: '/workspace/app',
      config: {},
      options: {},
    } as never)

    expect(runWorker).toHaveBeenCalledWith('packager', {
      cwd: '/workspace/app',
      installMode: 'dev',
      watchMode: undefined,
      skipTypescript: undefined,
    })
  })

  it('uses build install mode when sync --build is requested', async () => {
    const { initPackager, runWorker } = await importInitModule()

    initPackager({
      cwd: '/workspace/app',
      config: {},
      options: { build: true, watch: true },
    } as never)

    expect(runWorker).toHaveBeenCalledWith('packager', {
      cwd: '/workspace/app',
      installMode: 'build',
      watchMode: true,
      skipTypescript: undefined,
    })
  })
})