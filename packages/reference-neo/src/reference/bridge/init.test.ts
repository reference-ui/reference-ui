// Reference tasty phase scheduler suite: it takes the mocked runner plus the
// mocked session cache and emits the S5 pins — scheduling never blocks,
// cold start pays once per source dir, cached builds skip, failures retry.
// The background loop here is real setImmediate, drained, never faked.

import { afterEach, describe, expect, it, vi } from 'vitest'

async function importInitModule(options?: {
  cachedBuild?: unknown
  runImpl?: () => Promise<unknown>
}) {
  vi.resetModules()

  const onRunBuild = vi.fn(async () => {
    if (options?.runImpl) {
      return options.runImpl()
    }
    return { status: 'complete' }
  })
  const getReferenceTastyBuild = vi.fn(() => options?.cachedBuild)

  vi.doMock('./run.ts', () => ({
    onRunBuild,
  }))
  vi.doMock('./tasty-build.ts', () => ({
    getReferenceTastyBuild,
  }))

  const mod = await import('./init.ts')
  return { ...mod, onRunBuild, getReferenceTastyBuild }
}

function drainBackgroundLoop(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(() => {
      setImmediate(() => {
        setImmediate(resolve)
      })
    })
  })
}

function testPayload(sourceDir: string) {
  return {
    sourceDir,
    config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./run.ts')
  vi.doUnmock('./tasty-build.ts')
  vi.restoreAllMocks()
})

describe('reference/bridge/init', () => {
  it('returns before the build starts and runs it on the background loop', async () => {
    const { initReference, onRunBuild } = await importInitModule()

    initReference(testPayload('/workspace/scheduler-once'))
    expect(onRunBuild).not.toHaveBeenCalled()

    await drainBackgroundLoop()
    expect(onRunBuild).toHaveBeenCalledTimes(1)
    expect(onRunBuild).toHaveBeenCalledWith(
      expect.objectContaining({ sourceDir: '/workspace/scheduler-once' }),
      {}
    )
  })

  it('schedules once while a build is pending', async () => {
    const { initReference, onRunBuild } = await importInitModule()
    const payload = testPayload('/workspace/scheduler-pending')

    initReference(payload)
    initReference(payload)
    initReference(payload)
    await drainBackgroundLoop()

    expect(onRunBuild).toHaveBeenCalledTimes(1)
  })

  it('skips scheduling when the session already holds the build', async () => {
    const { initReference, onRunBuild } = await importInitModule({
      cachedBuild: { manifestPath: '/workspace/cached/manifest.js' },
    })

    initReference(testPayload('/workspace/scheduler-cached'))
    await drainBackgroundLoop()

    expect(onRunBuild).not.toHaveBeenCalled()
  })

  it('passes the build payload through to the runner', async () => {
    const { initReference, onRunBuild } = await importInitModule()

    initReference(testPayload('/workspace/scheduler-passthrough'), {
      name: 'ButtonProps',
    })
    await drainBackgroundLoop()

    expect(onRunBuild).toHaveBeenCalledWith(
      expect.objectContaining({ sourceDir: '/workspace/scheduler-passthrough' }),
      { name: 'ButtonProps' }
    )
  })

  it('retries on a later sync after the scheduled build fails', async () => {
    const { initReference, onRunBuild } = await importInitModule({
      runImpl: async () => {
        throw new Error('background exploded')
      },
    })
    const payload = testPayload('/workspace/scheduler-retry')

    initReference(payload)
    await drainBackgroundLoop()
    initReference(payload)
    await drainBackgroundLoop()

    expect(onRunBuild).toHaveBeenCalledTimes(2)
  })
})
