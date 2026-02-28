import { EventEmitter } from 'node:events'
import { broadcastChannel } from './channel'
import { emit } from './emit'
import { on, once } from './on'
import { off } from './off'
import { onceAll } from './onceAll'
import { initEventBus } from './init'
import { config } from './config'
import type { Events } from './events'

export const bus = new EventEmitter()

export { broadcastChannel, config, emit, initEventBus, off, on, once, onceAll }
export type { Events }
