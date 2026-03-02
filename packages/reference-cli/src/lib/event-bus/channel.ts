import { BroadcastChannel } from 'node:worker_threads'

/**
 * BroadcastChannel for cross-thread communication.
 * Works in main thread and worker threads.
 */
export const broadcastChannel = new BroadcastChannel('reference-ui:events')

export const channelListeners = new Map<string, Set<Function>>()
