import { EventEmitter } from 'node:events'
import type { Events } from './events'

export const bus = new EventEmitter()

export type { Events }

/**
 * Initialize event bus with debug logging if enabled
 */
export function initEventBus(config: { debug?: boolean }) {
  if (config.debug) {
    // Wrap emit to log all events
    const originalEmit = bus.emit.bind(bus)
    bus.emit = (event, ...args) => {
      console.log(`[bus] ${String(event)}`, args[0])
      return originalEmit(event, ...args)
    }
  }
}

// Typed overloads
export function emit<K extends keyof Events>(event: K, payload: Events[K]): void
export function emit(event: string, payload?: any): void
export function emit(event: string, payload?: any) {
  bus.emit(event, payload)
}

export function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function on(event: string, handler: (payload: any) => void | Promise<void>): void
export function on(event: string, handler: (payload: any) => void | Promise<void>) {
  bus.on(event, handler)
}

export function once<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function once(event: string, handler: (payload: any) => void | Promise<void>): void
export function once(event: string, handler: (payload: any) => void | Promise<void>) {
  bus.once(event, handler)
}

export function off<K extends keyof Events>(event: K, handler?: Function): void
export function off(event: string, handler?: Function): void
export function off(event: string, handler?: Function) {
  if (handler) {
    bus.off(event, handler as any)
  } else {
    bus.removeAllListeners(event)
  }
}
