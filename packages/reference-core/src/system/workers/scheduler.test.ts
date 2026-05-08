import { describe, expect, it, vi } from 'vitest'

import { createPandaRunScheduler } from './scheduler'

function createDeferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void

  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('system/workers/scheduler', () => {
  it('coalesces repeated css triggers into one rerun', async () => {
    const firstRun = createDeferred()
    const secondRun = createDeferred()
    const runners = {
      codegen: vi.fn(async () => {}),
      css: vi.fn()
        .mockImplementationOnce(() => firstRun.promise)
        .mockImplementationOnce(() => secondRun.promise),
    }
    const scheduleRun = createPandaRunScheduler({ runners })

    scheduleRun('css')
    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(1)
    })

    scheduleRun('css')
    scheduleRun('css')

    firstRun.resolve()
    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(2)
    })

    secondRun.resolve()
  })

  it('lets codegen supersede queued css work', async () => {
    const cssRun = createDeferred()
    const codegenRun = createDeferred()
    const runners = {
      codegen: vi.fn().mockImplementationOnce(() => codegenRun.promise),
      css: vi.fn().mockImplementationOnce(() => cssRun.promise),
    }
    const scheduleRun = createPandaRunScheduler({ runners })

    scheduleRun('css')
    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(1)
    })

    scheduleRun('css')
    scheduleRun('codegen')
    scheduleRun('css')

    cssRun.resolve()
    await vi.waitFor(() => {
      expect(runners.codegen).toHaveBeenCalledTimes(1)
    })
    expect(runners.css).toHaveBeenCalledTimes(1)

    codegenRun.resolve()
  })

  it('continues draining queued work after a failure', async () => {
    const runners = {
      codegen: vi.fn().mockResolvedValueOnce(undefined),
      css: vi.fn().mockRejectedValueOnce(new Error('css exploded')),
    }
    const scheduleRun = createPandaRunScheduler({ runners })

    scheduleRun('css')
    scheduleRun('codegen')

    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(1)
      expect(runners.codegen).toHaveBeenCalledTimes(1)
    })
  })

  it('accepts new work again after the queue drains', async () => {
    const firstCssRun = createDeferred()
    const secondCssRun = createDeferred()
    const runners = {
      codegen: vi.fn(async () => {}),
      css: vi.fn()
        .mockImplementationOnce(() => firstCssRun.promise)
        .mockImplementationOnce(() => secondCssRun.promise),
    }
    const scheduleRun = createPandaRunScheduler({ runners })

    scheduleRun('css')
    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(1)
    })

    firstCssRun.resolve()
    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(1)
    })

    scheduleRun('css')
    await vi.waitFor(() => {
      expect(runners.css).toHaveBeenCalledTimes(2)
    })

    secondCssRun.resolve()
  })
})
