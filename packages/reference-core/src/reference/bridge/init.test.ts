// Reference tasty phase scheduler suite: it takes the mocked runner plus the
// mocked session cache and emits the pins — scheduling never blocks,
// cold start pays once per source dir, cached builds skip, failures retry.
// A result drains exactly once, whether pending or settled at the drain; a
// rejected build is reported once as an error when it settles.
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

describe('reference/bridge/init drain', () => {
  it('drains a failure that settled before the drain once, then nothing', async () => {
    const { initReference, flushReferenceBuild, isReferenceBuildPending } = await importInitModule({
      runImpl: async () => {
        throw new Error('background exploded')
      },
    })
    const sourceDir = '/workspace/scheduler-settled'

    initReference(testPayload(sourceDir))
    await drainBackgroundLoop()

    expect(isReferenceBuildPending(sourceDir)).toBe(false)
    await expect(flushReferenceBuild(sourceDir)).resolves.toEqual({
      status: 'failed',
      message: 'background exploded',
    })
    await expect(flushReferenceBuild(sourceDir)).resolves.toBeUndefined()
  })

  it('reports a rejected build once as an error and drains it once', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { initReference, flushReferenceBuild } = await importInitModule({
      runImpl: async () => {
        throw new Error('background exploded')
      },
    })
    const sourceDir = '/workspace/scheduler-reported'

    initReference(testPayload(sourceDir))
    await expect(flushReferenceBuild(sourceDir)).resolves.toEqual({ status: 'failed', message: 'background exploded' })
    await expect(flushReferenceBuild(sourceDir)).resolves.toBeUndefined()

    expect(error).toHaveBeenCalledTimes(1)
    expect(String(error.mock.calls[0]?.[0])).toContain('reference tasty build failed: background exploded')
  })

  it('drains the retry result after a settled failure', async () => {
    let calls = 0
    const { initReference, flushReferenceBuild } = await importInitModule({
      runImpl: async () => {
        calls += 1
        if (calls === 1) throw new Error('first build exploded')
        return { status: 'complete' }
      },
    })
    const payload = testPayload('/workspace/scheduler-settled-retry')

    initReference(payload)
    await drainBackgroundLoop()
    initReference(payload)
    await drainBackgroundLoop()

    await expect(flushReferenceBuild(payload.sourceDir)).resolves.toEqual({ status: 'complete' })
    await expect(flushReferenceBuild(payload.sourceDir)).resolves.toBeUndefined()
  })

  it('drains a build still pending at the drain once, then nothing', async () => {
    const { initReference, flushReferenceBuild } = await importInitModule()
    const sourceDir = '/workspace/scheduler-pending-drain'

    initReference(testPayload(sourceDir))
    await expect(flushReferenceBuild(sourceDir)).resolves.toEqual({ status: 'complete' })
    await expect(flushReferenceBuild(sourceDir)).resolves.toBeUndefined()
  })
})
