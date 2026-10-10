/**
 * Shard resolution for one render: useShards memoizes the shards prop into
 * the getResolvedShards callback and mirrors it onto the session, so every
 * effect and callback reads the current connected shard set through one
 * stable ref without resubscribing.
 */
import * as React from 'react'
import { resolveShardElements } from '../shared/targets'
import type { FocusLockProps } from '../types'
import type { FocusLockSession } from './use-lock-session'

export function useShards(
  session: FocusLockSession,
  shardsProp: FocusLockProps['shards']
): () => HTMLElement[] {
  const getResolvedShards = React.useCallback((): HTMLElement[] => {
    return resolveShardElements(shardsProp)
  }, [shardsProp])
  session.getResolvedShardsRef.current = getResolvedShards
  return getResolvedShards
}
