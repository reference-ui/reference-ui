/**
 * useThumbRegistry: mount-id identity for thumbs. Claim order is the DOM
 * order on first paint and SSR; after commit, getThumbIndex reconciles each
 * id to DOM-order rank through the node map. The version counter rerenders
 * thumbs when membership changes so ranks refresh after mount, unmount, or
 * reorder commits. Session coupling stays out — the root wires unregistration
 * to its pointer session.
 */
import * as React from 'react'
import { sortThumbIdsByDomOrder } from '../shared/registry'

export interface ThumbRegistry {
  claimThumbId: () => number
  getThumbIndex: (id: number) => number
  getThumbNode: (index: number) => HTMLDivElement | undefined
  getThumbCount: () => number
  setThumbNode: (id: number, node: HTMLDivElement) => void
  removeThumbNode: (id: number) => void
  version: number
}

export function useThumbRegistry(): ThumbRegistry {
  // Thumb registry keyed by mount id (claim order = mount order); the
  // version rerenders Thumbs when membership changes so DOM-order ranks
  // refresh after mount/unmount/reorder commits.
  const thumbNodesRef = React.useRef<Map<number, HTMLDivElement>>(new Map())
  const nextThumbIdRef = React.useRef(0)
  const firstThumbIdRef = React.useRef<number | null>(null)
  const [thumbRegistryVersion, setThumbRegistryVersion] = React.useState(0)

  const claimThumbId = React.useCallback(() => {
    const id = nextThumbIdRef.current
    nextThumbIdRef.current += 1
    if (firstThumbIdRef.current === null) {
      firstThumbIdRef.current = id
    }
    return id
  }, [])

  const getThumbIndex = React.useCallback((id: number): number => {
    const ordered = sortThumbIdsByDomOrder(thumbNodesRef.current)
    const rank = ordered.indexOf(id)
    if (rank !== -1) return rank
    // Unregistered (first paint, SSR, StrictMode remount): claim order is
    // the DOM order, so the offset from the first claim is the index.
    return id - (firstThumbIdRef.current ?? id)
  }, [])

  const getThumbNode = React.useCallback((index: number): HTMLDivElement | undefined => {
    const ordered = sortThumbIdsByDomOrder(thumbNodesRef.current)
    const id = ordered[index]
    return id === undefined ? undefined : thumbNodesRef.current.get(id)
  }, [])

  const getThumbCount = React.useCallback(() => thumbNodesRef.current.size, [])

  const setThumbNode = React.useCallback((id: number, node: HTMLDivElement) => {
    if (thumbNodesRef.current.get(id) !== node) {
      thumbNodesRef.current.set(id, node)
      setThumbRegistryVersion(v => v + 1)
    }
  }, [])

  const removeThumbNode = React.useCallback((id: number) => {
    if (thumbNodesRef.current.delete(id)) {
      setThumbRegistryVersion(v => v + 1)
    }
  }, [])

  return {
    claimThumbId,
    getThumbIndex,
    getThumbNode,
    getThumbCount,
    setThumbNode,
    removeThumbNode,
    version: thumbRegistryVersion,
  }
}
