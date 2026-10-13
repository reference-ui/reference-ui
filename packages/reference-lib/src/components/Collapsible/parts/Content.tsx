/**
 * Disclosure content: the mounting gate over the panel. It registers the
 * trigger/content linkage atomically with mount, resolves the mount policy
 * (hidden-until-found vs force-mount vs plain Presence), and renders the
 * panel through Presence so exits complete before unmount. Without a
 * Collapsible ancestor there is no session, so it renders nothing.
 */
import * as React from 'react'
import { Presence } from '../../Presence'
import type { CollapsibleContentProps } from '../types'
import { CollapsibleContext } from '../context'
import { resolveMountPolicy, resolvePresent } from '../mount/policy'
import { useContentRegistration } from '../hooks/use-content-registration'
import { CollapsibleContentPanel } from './Panel'

export const CollapsibleContent: React.ForwardRefExoticComponent<
  CollapsibleContentProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContent(
    { children, id: idProp, style, hiddenUntilFound: hiddenUntilFoundProp, forceMount = false, ...props },
    forwardedRef
  ) {
    const context = React.useContext(CollapsibleContext)
    useContentRegistration({ context, idProp })

    if (!context) return null

    const contentId = idProp ?? context.contentId
    const { untilFound, forceMountAlone } = resolveMountPolicy({
      contentProp: hiddenUntilFoundProp,
      rootDefault: context.hiddenUntilFound,
      forceMount,
    })

    return (
      <Presence present={resolvePresent({ isOpen: context.isOpen, untilFound, forceMount })}>
        <CollapsibleContentPanel
          id={contentId}
          isOpen={context.isOpen}
          disabled={context.disabled}
          consumerRef={forwardedRef}
          skipEnterRef={context.skipEnterRef}
          skipMotionOnceRef={context.skipMotionOnceRef}
          untilFound={untilFound}
          forceMountAlone={forceMountAlone}
          style={style}
          {...props}
        >
          {children}
        </CollapsibleContentPanel>
      </Presence>
    )
  }
)
