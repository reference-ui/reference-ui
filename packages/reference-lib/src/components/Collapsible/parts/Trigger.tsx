/**
 * Disclosure trigger: the button that requests toggles and exposes panel
 * state. It links to the mounted content id while open or exiting, carries
 * the open/closed/disabled data attributes, collapses its bottom border
 * under shown content, and renders the rotating disclosure icon unless the
 * author hides or replaces it. Only native primary activation toggles.
 */
import * as React from 'react'
import { Button, Span } from '@reference-ui/react'
import { KeyboardArrowDownIcon } from '@reference-ui/icons'
import type { CollapsibleTriggerProps } from '../types'
import { CollapsibleContext } from '../context'
import { resolveTriggerLinkage, resolveTriggerStyle } from '../linkage/state'
import { setRef } from '../shared/refs'

export const CollapsibleTrigger: React.ForwardRefExoticComponent<
  CollapsibleTriggerProps & React.RefAttributes<HTMLButtonElement>
> = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger(
    {
      children,
      onClick,
      disabled: disabledProp,
      type = 'button',
      hideIcon = false,
      icon,
      style,
      borderBottomWidth,
      ...props
    },
    forwardedRef
  ) {
    const context = React.useContext(CollapsibleContext)
    const isDisabled = disabledProp ?? context?.disabled ?? false
    const isOpen = context?.isOpen ?? false
    const isContentPresent = context?.isContentPresent ?? isOpen
    const isContentMounted = context?.isContentMounted ?? false
    const { hideBottomBorder, ariaControls } = resolveTriggerLinkage({
      isOpen,
      isContentPresent,
      isContentMounted,
      contentId: context?.contentId,
    })

    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        if (context) {
          context.triggerRef.current = node
        }
        return setRef(forwardedRef, node)
      },
      [forwardedRef, context]
    )

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      // CO-ACT-08: Collapsible owns only native primary button activation
      if (e.button !== 0) return
      if (!e.defaultPrevented && !isDisabled && context) {
        context.setIsOpen(!context.isOpen)
      }
    }

    const triggerStyle: React.CSSProperties | undefined = React.useMemo(
      () => resolveTriggerStyle({ hideBottomBorder, style }),
      [hideBottomBorder, style]
    )

    const renderIcon = () => {
      if (hideIcon) return null
      return (
        <Span
          data-reference-disclosure-icon=""
          aria-hidden="true"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          ml="auto"
          flexShrink={0}
          color="design.text.light"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            marginLeft: 'auto',
            flexShrink: 0,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          {icon ?? <KeyboardArrowDownIcon />}
        </Span>
      )
    }

    return (
      <Button
        type={type}
        {...props}
        ref={setRefs}
        aria-expanded={isOpen}
        aria-controls={ariaControls}
        data-state={isOpen ? 'open' : 'closed'}
        data-disabled={isDisabled ? '' : undefined}
        data-content-present={isContentPresent ? '' : undefined}
        data-reference-accordion-item={context?.accordionItem ? '' : undefined}
        disabled={isDisabled}
        onClick={handleClick}
        borderBottomWidth={hideBottomBorder && borderBottomWidth !== undefined ? '0px' : borderBottomWidth}
        style={triggerStyle}
      >
        {children}
        {renderIcon()}
      </Button>
    )
  }
)
