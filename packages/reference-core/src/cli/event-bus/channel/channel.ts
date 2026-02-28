import { BroadcastChannel } from 'node:worker_threads'

/**
 * BroadcastChannel for cross-thread communication.
 * Works transparently in main thread and worker threads.
 */
export const broadcastChannel = new BroadcastChannel('reference-ui:events')

/** Map to track listeners on BroadcastChannel so we can properly clean up */
export const channelListeners = new Map<string, Set<Function>>()
