import { BroadcastChannel } from 'node:worker_threads'
import { BUS_CHANNEL_NAME } from './wire'

/**
 * BroadcastChannel for cross-thread communication.
 * Works transparently in main thread and worker threads.
 */
export const broadcastChannel = new BroadcastChannel(BUS_CHANNEL_NAME)

/** Message event listener – wrapper around user handler for BroadcastChannel */
export type ChannelListener = (ev: Event) => void

/** Map to track listeners on BroadcastChannel so we can properly clean up */
export const channelListeners = new Map<string, Set<ChannelListener>>()
