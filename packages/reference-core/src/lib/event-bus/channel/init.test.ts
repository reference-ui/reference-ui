import { afterEach, describe, expect, it, vi } from 'vitest'
import { BroadcastChannel } from 'node:worker_threads'

const CHANNEL_NAME = 'reference-ui:events'

async function importInitModule(debug: boolean, enableMessageLogging = true) {
  vi.resetModules()
  vi.doMock('../config', () => ({
    isEventBusMessageLoggingEnabled: () => debug && enableMessageLogging,
  }))

  const debugSpy = vi.fn()
  vi.doMock('../../log', () => ({
    log: { debug: debugSpy },
  }))

  const initModule = await import('./init')
  const channelModule = await import('./channel')

  return {
    initEventBus: initModule.initEventBus,
    broadcastChannel: channelModule.broadcastChannel,
    debugSpy,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.doUnmock('../config')
  vi.doUnmock('../../log')
})

describe('initEventBus', () => {
  it('logs bus events when debug mode is enabled', async () => {
    const { initEventBus, broadcastChannel, debugSpy } = await importInitModule(true)
    const peer = new BroadcastChannel(CHANNEL_NAME)

    initEventBus()
    peer.postMessage({
      type: 'bus:event',
      event: 'test:init',
      payload: { ok: true },
    })

    await vi.waitFor(() => {
      expect(debugSpy).toHaveBeenCalledTimes(1)
    })

    expect(debugSpy.mock.calls[0]).toHaveLength(2)
    expect(debugSpy.mock.calls[0]?.[0]).toBe('bus')
    expect(String(debugSpy.mock.calls[0]?.[1])).toContain('test:init')
    expect(String(debugSpy.mock.calls[0]?.[1])).toContain('ok')

    peer.close()
    broadcastChannel.close()
  })

  it('does not register duplicate debug listeners across repeated init calls', async () => {
    const { initEventBus, broadcastChannel, debugSpy } = await importInitModule(true)
    const peer = new BroadcastChannel(CHANNEL_NAME)

    initEventBus()
    initEventBus()

    peer.postMessage({
      type: 'bus:event',
      event: 'test:init:once',
      payload: {},
    })

    await vi.waitFor(() => {
      expect(debugSpy).toHaveBeenCalledTimes(1)
    })

    peer.close()
    broadcastChannel.close()
  })

  it('does nothing when debug mode is disabled', async () => {
    const { initEventBus, broadcastChannel, debugSpy } = await importInitModule(false)
    const peer = new BroadcastChannel(CHANNEL_NAME)

    initEventBus()
    peer.postMessage({
      type: 'bus:event',
      event: 'test:init:disabled',
      payload: {},
    })

    await new Promise((resolve) => setTimeout(resolve, 25))

    expect(debugSpy).not.toHaveBeenCalled()

    peer.close()
    broadcastChannel.close()
  })

  it('does nothing when local bus message logging is disabled', async () => {
    const { initEventBus, broadcastChannel, debugSpy } = await importInitModule(true, false)
    const peer = new BroadcastChannel(CHANNEL_NAME)

    initEventBus()
    peer.postMessage({
      type: 'bus:event',
      event: 'test:init:messages-disabled',
      payload: {},
    })

    await new Promise((resolve) => setTimeout(resolve, 25))

    expect(debugSpy).not.toHaveBeenCalled()

    peer.close()
    broadcastChannel.close()
  })
})
