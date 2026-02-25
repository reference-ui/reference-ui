import { EventEmitter } from 'node:events'
import { BroadcastChannel, isMainThread } from 'node:worker_threads'
import type { Events } from './events'
import { config } from './config'
import { log } from '../lib'

export const bus = new EventEmitter()

/**
 * BroadcastChannel for cross-thread communication
 * Works transparently in main thread and worker threads
 */
export const broadcastChannel = new BroadcastChannel('reference-ui:events')

// Map to track listeners on BroadcastChannel so we can properly clean up
const channelListeners = new Map<string, Set<Function>>()

export { config }
export type { Events }

/**
 * Initialize event bus with debug logging if enabled
 */
export function initEventBus() {
  if (config.debug && isMainThread) {
    // Log all bus events as they arrive (emit() uses BroadcastChannel, not bus.emit)
    broadcastChannel.addEventListener('message', (msg: Event) => {
      const data = (msg as any).data
      if (data?.type === 'bus:event') {
        log.debug(`[bus] ${data.event}`, data.payload)
      }
    })
  }
}

/**
 * Typed emit - sends to BroadcastChannel (all threads see it)
 */
export function emit<K extends keyof Events>(event: K, payload: Events[K]): void
export function emit(event: string, payload?: any): void
export function emit(event: string, payload?: any) {
  broadcastChannel.postMessage({
    type: 'bus:event',
    event,
    payload,
  })
}

/**
 * Typed on - listens on BroadcastChannel (works in any thread)
 */
export function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function on(event: string, handler: (payload: any) => void | Promise<void>): void
export function on(event: string, handler: (payload: any) => void | Promise<void>) {
  const listener = (msg: Event) => {
    if ((msg as any).data?.type === 'bus:event' && (msg as any).data?.event === event) {
      handler((msg as any).data.payload)
    }
  }

  broadcastChannel.addEventListener('message', listener as EventListener)

  // Track listener for cleanup
  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}

/**
 * Typed once - listens once on BroadcastChannel (works in any thread)
 */
export function once<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function once(event: string, handler: (payload: any) => void | Promise<void>): void
export function once(event: string, handler: (payload: any) => void | Promise<void>) {
  const listener = (msg: Event) => {
    if ((msg as any).data?.type === 'bus:event' && (msg as any).data?.event === event) {
      broadcastChannel.removeEventListener('message', listener as EventListener)
      channelListeners.get(event)?.delete(listener)
      handler((msg as any).data.payload)
    }
  }

  broadcastChannel.addEventListener('message', listener as EventListener)

  // Track listener for cleanup
  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}

/**
 * Remove event listener
 */
export function off<K extends keyof Events>(event: K, handler?: Function): void
export function off(event: string, handler?: Function): void
export function off(event: string, handler?: Function) {
  const listeners = channelListeners.get(event)
  if (!listeners) return

  if (handler) {
    listeners.forEach(listener => {
      if (listener === handler || (listener as any).originalHandler === handler) {
        broadcastChannel.removeEventListener('message', listener as EventListener)
        listeners.delete(listener)
      }
    })
  } else {
    listeners.forEach(listener => {
      broadcastChannel.removeEventListener('message', listener as EventListener)
    })
    listeners.clear()
  }
}
