/**
 * Content panel: the measured, animated, isolated div behind Content. It
 * composes the presence ping, focus evacuation, browser-find reveal,
 * collapse motion, and isolation attributes over one host node, then renders
 * the div with its open/closed state, hidden/inert hiding, and measured
 * styles. Content owns mounting; this file owns the mounted life.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { CollapsibleContentProps } from '../types'
import { CollapsibleContext } from '../context'
import { setRef } from '../shared/refs'
import { resolveContentIsolation } from '../isolation/state'
import { usePresenceLifecycle } from '../hooks/use-presence-lifecycle'
import { useFocusEvacuation } from '../hooks/use-focus-evacuation'
import { useBeforeMatchReveal } from '../hooks/use-beforematch-reveal'
import { useCollapseMotion } from '../hooks/use-collapse-motion'
import { useContentIsolation } from '../hooks/use-content-isolation'

export type CollapsibleContentPanelProps = Omit<CollapsibleContentProps, 'hiddenUntilFound' | 'forceMount'> & {
  isOpen: boolean
  disabled: boolean
  consumerRef?: React.Ref<HTMLDivElement>
  skipEnterRef: React.MutableRefObject<boolean>
  skipMotionOnceRef: React.MutableRefObject<boolean>
  untilFound: boolean
  forceMountAlone: boolean
  inert?: boolean
  'aria-hidden'?: boolean | 'true' | 'false'
}

export const CollapsibleContentPanel = React.forwardRef<HTMLDivElement, CollapsibleContentPanelProps>(
  function CollapsibleContentPanel(
    {
      isOpen,
      disabled,
      consumerRef,
      skipEnterRef,
      skipMotionOnceRef,
      untilFound,
      forceMountAlone,
      children,
      style,
      inert: userInert,
      'aria-hidden': userAriaHidden,
      ...props
    },
    presenceRef
  ) {
    const nodeRef = React.useRef<HTMLDivElement | null>(null)

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node
        setRef(presenceRef, node)
        setRef(consumerRef, node)
      },
      [presenceRef, consumerRef]
    )

    const context = React.useContext(CollapsibleContext)

    usePresenceLifecycle(context?.setIsContentPresent)
    useFocusEvacuation({ nodeRef, isOpen, context, forceMountAlone })
    useBeforeMatchReveal({ nodeRef, untilFound, isOpen, context, skipMotionOnceRef })
    useCollapseMotion({ nodeRef, isOpen, skipEnterRef, skipMotionOnceRef, untilFound, forceMountAlone })

    const { isInert, isAriaHidden, contentStyle } = resolveContentIsolation({
      isOpen,
      forceMountAlone,
      userInert,
      userAriaHidden,
      style,
    })

    const untilFoundClosed = untilFound && !isOpen
    useContentIsolation({ nodeRef, untilFoundClosed, isInert })

    return (
      <Div
        ref={setRefs}
        {...props}
        hidden={untilFoundClosed ? true : undefined}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={disabled ? '' : undefined}
        aria-hidden={isAriaHidden}
        style={contentStyle}
      >
        {children}
      </Div>
    )
  }
)
