import { BroadcastChannel } from 'node:worker_threads'
import { afterEach, describe, expect, it, vi } from 'vitest'

const CHANNEL_NAME = 'reference-ui:events'

async function importLogModule(options?: {
  debug?: boolean
  isMainThread?: boolean
  threadId?: number
}) {
  vi.resetModules()

  vi.doMock('../../config/store', () => ({
    getConfig: () => ({ debug: options?.debug ?? false }),
  }))
  vi.doMock('node:worker_threads', async () => {
    const actual =
      await vi.importActual<typeof import('node:worker_threads')>('node:worker_threads')
    return {
      ...actual,
      isMainThread: options?.isMainThread ?? true,
      threadId: options?.threadId ?? 0,
    }
  })

  const mod = await import('./index')
  return { ...mod }
}

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.doUnmock('../../config/store')
  vi.doUnmock('node:worker_threads')
})

describe('lib/log', () => {
  it('logs directly on the main thread', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { log } = await importLogModule({ isMainThread: true })

    log.info('hello', { ok: true })

    expect(consoleLog).toHaveBeenCalledWith('hello', { ok: true })
  })

  it('forwards worker logs through the event bus', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { log, closeLogRelay } = await importLogModule({
      debug: true,
      isMainThread: false,
      threadId: 7,
    })
    const peer = new BroadcastChannel(CHANNEL_NAME)

    const messagePromise = new Promise<MessageEvent>(resolve => {
      peer.addEventListener('message', resolve as EventListener, { once: true })
    })

    log.debug('watch', 'changed', { path: 'src/button.tsx' })

    const message = await messagePromise
    const data = message.data as {
      type: string
      event: string
      payload: {
        level: string
        module?: string
        source: string
        threadId: number
        args: unknown[]
      }
    }

    expect(consoleLog).not.toHaveBeenCalled()
    expect(data).toMatchObject({
      type: 'bus:event',
      event: 'log:entry',
      payload: {
        level: 'debug',
        module: 'watch',
        source: 'worker',
        threadId: 7,
      },
    })
    expect(data.payload.args).toEqual([
      'changed',
      expect.stringContaining('src/button.tsx'),
    ])

    peer.close()
    closeLogRelay()
  })

  it('does not forward worker debug logs when debug mode is disabled', async () => {
    const { log, closeLogRelay } = await importLogModule({
      debug: false,
      isMainThread: false,
      threadId: 5,
    })
    const peer = new BroadcastChannel(CHANNEL_NAME)
    const messageSpy = vi.fn()

    peer.addEventListener('message', messageSpy as EventListener)

    log.debug('watch', 'quiet')

    await new Promise(resolve => setTimeout(resolve, 25))

    expect(messageSpy).not.toHaveBeenCalled()

    peer.close()
    closeLogRelay()
  })

  it('registers the relay once and writes forwarded worker logs locally', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { initLogRelay, closeLogRelay } = await importLogModule({ isMainThread: true })
    const peer = new BroadcastChannel(CHANNEL_NAME)

    initLogRelay()
    initLogRelay()

    peer.postMessage({
      type: 'bus:event',
      event: 'log:entry',
      payload: {
        level: 'error',
        args: ['worker exploded'],
        source: 'worker',
        threadId: 3,
      },
    })

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledTimes(1)
    })

    expect(consoleError).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('[worker:3]'),
      expect.any(String)
    )

    peer.close()
    closeLogRelay()
  })

  it('closeLogRelay is safe before initialization', async () => {
    const { closeLogRelay } = await importLogModule({ isMainThread: true })

    expect(() => closeLogRelay()).not.toThrow()
  })
})
