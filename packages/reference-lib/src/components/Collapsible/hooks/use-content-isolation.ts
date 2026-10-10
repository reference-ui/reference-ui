/**
 * Content isolation attributes: the imperative half of closed-content
 * hiding. Closed hidden-until-found panels upgrade to `hidden="until-found"`
 * before paint (React owns removal on open), and `inert` toggles
 * imperatively because React only knows the attribute from 19 — the 17/18
 * runtimes would drop it.
 */
import * as React from 'react'

export interface ContentIsolationOptions {
  nodeRef: React.RefObject<HTMLDivElement | null>
  untilFoundClosed: boolean
  isInert: boolean
}

export function useContentIsolation({
  nodeRef,
  untilFoundClosed,
  isInert,
}: ContentIsolationOptions): void {
  // CO-MOUNT: closed hidden-until-found content carries `hidden`, upgraded
  // to `until-found` before paint; React owns removal on open.
  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return
    if (untilFoundClosed) {
      node.setAttribute('hidden', 'until-found')
    }
  }, [untilFoundClosed])

  // `inert` is a known React attribute only from 19 (17/18 skip dash-less
  // unknown attributes), so toggle it imperatively for every runtime.
  React.useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return
    if (isInert) {
      node.setAttribute('inert', '')
    } else {
      node.removeAttribute('inert')
    }
  }, [isInert])
}
