/**
 * The document runtimes the elected host renders: the visual Toast host plus
 * the live-region announcer, mounted in the winning React root rather than
 * portaled to the body so ShadowRoot ownership survives. `RuntimeHosts` takes
 * the library's `toaster` configuration, resolves it onto ToastHost props, and
 * renders the pair with no gating of its own — the root decides which mount is
 * active and renders this part only there, so standby mounts stay pure
 * application passthrough.
 */
import * as React from 'react'
import { ToastHost } from '../../Toast'
import { AnnouncerHost } from '../../Announcer/internal'
import type { ReferenceLibraryToaster } from '../types'
import { resolveToastHostProps } from './toast-props'

export function RuntimeHosts({ toaster }: { toaster?: ReferenceLibraryToaster }) {
  return (
    <>
      <ToastHost {...resolveToastHostProps(toaster)} />
      <AnnouncerHost />
    </>
  )
}
