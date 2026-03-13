import { afterEach, describe, expect, it, vi } from 'vitest'
import { BroadcastChannel } from 'node:worker_threads'

const CHANNEL_NAME = 'reference-ui:events'

async function importInitModule(debug: boolean) {
  vi.resetModules()
  vi.doMock('../config', () => ({
    config: { debug },
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
      expect(debugSpy).toHaveBeenCalledWith('bus', 'test:init', { ok: true })
    })

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
})
