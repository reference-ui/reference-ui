import { afterEach, describe, expect, it, vi } from 'vitest'
import { BroadcastChannel } from 'node:worker_threads'
import { broadcastChannel, channelListeners } from './channel'
import { emit } from './emit'
import { off } from './off'
import { on, once } from './on'
import { onceAll } from './onceAll'

const CHANNEL_NAME = 'reference-ui:events'
const OFF_ONE_EVENT = 'test:off-one'
const OFF_ALL_EVENT = 'test:off-all'
const ALL_EVENTS = ['test:all:a', 'test:all:b'] as const

function waitForValue<T>(register: (resolve: (value: T) => void) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for event bus message')), 1000)
    register((value) => {
      clearTimeout(timeout)
      resolve(value)
    })
  })
}

function postFromPeer(event: string, payload?: unknown): void {
  const peer = new BroadcastChannel(CHANNEL_NAME)
  peer.postMessage({
    type: 'bus:event',
    event,
    payload: payload ?? {},
  })
  peer.close()
}

afterEach(() => {
  for (const [event, listeners] of channelListeners.entries()) {
    listeners.forEach((listener) => {
      broadcastChannel.removeEventListener('message', listener as EventListener)
    })
    listeners.clear()
    channelListeners.delete(event)
  }
})

describe('event bus channel helpers', () => {
  it('emit() posts the expected message shape', async () => {
    const peer = new BroadcastChannel(CHANNEL_NAME)

    const message = await waitForValue((resolve) => {
      peer.addEventListener('message', (event: Event) => {
        resolve((event as MessageEvent).data as { type: string; event: string; payload: unknown })
      }, { once: true })
      emit('test:emit', { ok: true })
    })

    expect(message).toEqual({
      type: 'bus:event',
      event: 'test:emit',
      payload: { ok: true },
    })

    peer.close()
  })

  it('on() receives matching events from another channel instance', async () => {
    const payloadPromise = waitForValue<{ value: number }>((resolve) => {
      on('test:on', (payload) => resolve(payload as { value: number }))
    })

    postFromPeer('test:on', { value: 42 })

    await expect(payloadPromise).resolves.toEqual({ value: 42 })
  })

  it('once() fires only once and cleans up its listener', async () => {
    const handler = vi.fn()

    once('test:once', handler)

    postFromPeer('test:once', { count: 1 })
    postFromPeer('test:once', { count: 2 })

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ count: 1 })
    })

    expect(channelListeners.get('test:once')?.size ?? 0).toBe(0)
  })

  it('off(event, handler) removes only the matching listener', async () => {
    const removed = vi.fn()
    const kept = vi.fn()

    on(OFF_ONE_EVENT, removed)
    on(OFF_ONE_EVENT, kept)
    off(OFF_ONE_EVENT, removed)

    postFromPeer(OFF_ONE_EVENT, { ok: true })

    await vi.waitFor(() => {
      expect(removed).not.toHaveBeenCalled()
      expect(kept).toHaveBeenCalledTimes(1)
    })
  })

  it('off(event) removes all listeners for that event', async () => {
    const handlerA = vi.fn()
    const handlerB = vi.fn()

    on(OFF_ALL_EVENT, handlerA)
    on(OFF_ALL_EVENT, handlerB)
    off(OFF_ALL_EVENT)

    postFromPeer(OFF_ALL_EVENT, { ok: true })

    await new Promise((resolve) => setTimeout(resolve, 25))

    expect(handlerA).not.toHaveBeenCalled()
    expect(handlerB).not.toHaveBeenCalled()
    expect(channelListeners.get(OFF_ALL_EVENT)?.size ?? 0).toBe(0)
  })

  it('onceAll() waits for all events in any order and fires once', async () => {
    const handler = vi.fn()

    onceAll([...ALL_EVENTS], handler)

    postFromPeer(ALL_EVENTS[1])
    postFromPeer(ALL_EVENTS[0])
    postFromPeer(ALL_EVENTS[0])

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  it('onceAll([]) fires immediately', () => {
    const handler = vi.fn()

    onceAll([], handler)

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
