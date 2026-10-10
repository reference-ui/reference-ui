/**
 * ReferenceLibrary mounts the document-level runtimes — Toast, the live-region
 * announcer, Tooltip warmup, and focus-visible tracking — without becoming a
 * provider boundary: children render transparently with no wrapper and no
 * context, and Overlay, Popover, and Menu work fine outside it. The root is
 * pure composition: `useRuntimeHost` runs the mount's election and activation,
 * and the elected mount alone renders `RuntimeHosts` while standbys pass
 * children through. Server renders emit children only, since no election can
 * run without a document.
 */
import * as React from 'react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'
import type { ReferenceLibraryProps } from './types'
import { useRuntimeHost } from './hooks/use-runtime-host'
import { RuntimeHosts } from './parts/RuntimeHosts'

setupFocusVisible()

export function ReferenceLibrary({
  children,
  toaster,
  tooltip,
}: ReferenceLibraryProps) {
  const { isActiveHost } = useRuntimeHost(tooltip?.skipDelay)

  return (
    <>
      {children}

      {isActiveHost && <RuntimeHosts toaster={toaster} />}
    </>
  )
}
