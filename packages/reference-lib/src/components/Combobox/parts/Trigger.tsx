/**
 * Combobox's select-only focus source: the Trigger part. Native pointer
 * activation toggles (with Safari focus repair and mousedown focus
 * hold); keyboard activation, arrows, grid keys, tree delegation,
 * Escape/Tab mirror, Home/End, and typeahead come from the keyboard
 * hook over the typeahead session. Focus stays on the Trigger; nothing
 * commits until activation. All decisions live in the hooks.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { useOverlay } from '../../Overlay'
import { ComboboxContext } from '../combobox-context'
import { useTriggerKeyboard, useTriggerTypeahead } from '../hooks'
import type { ComboboxTriggerProps } from '../types'

export const ComboboxTrigger: React.ForwardRefExoticComponent<
  ComboboxTriggerProps & React.RefAttributes<HTMLButtonElement>
> = React.forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  function ComboboxTrigger(
    {
      children,
      onClick,
      onMouseDown,
      onKeyDown,
      onBlur,
      disabled: disabledProp,
      className,
      style,
      type: typeProp,
      ...props
    }: ComboboxTriggerProps,
    userRef
  ) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const registerFocusSource = context?.registerFocusSource
  const typeaheadRef = useTriggerTypeahead()

  React.useLayoutEffect(() => {
    if (registerFocusSource) return registerFocusSource('trigger')
  }, [registerFocusSource])

  const isDisabled = (context?.disabled ?? false) || disabledProp

  const handleKeyDown = useTriggerKeyboard({
    context,
    typeaheadRef,
    isDisabled,
    onKeyDown,
  })

  if (!context) return null

  const composedRef = (node: HTMLButtonElement | null) => {
    context.sourceRef.current = node
    if (overlay) overlay.triggerRef.current = node
    if (typeof userRef === 'function') {
      userRef(node)
    } else if (userRef && 'current' in userRef) {
      ;(userRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }

  // Pointer path: native activation toggles (CB-OPEN-04). Keyboard commit
  // is decided in keydown below, which suppresses the native click so the
  // two paths never double-fire (CB-SELECT-04).
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      // Safari never focuses buttons on pointer activation, which strands
      // follow-up keyboard handling on body (F16/F24/F26). Re-deliver the
      // focused state the click carries on Chromium/Firefox (no-op there).
      e.currentTarget.focus()
      context.setIsOpen(!context.isOpen)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseDown?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      // Safari blurs the focused trigger on mousedown default, which would
      // dismiss via blur and make the click toggle re-open (CB-OPEN-04).
      // Holding focus keeps the toggle one decision on all engines.
      e.preventDefault()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    onBlur?.(e)
    if (!isDisabled) {
      context.handleSourceBlur(e.relatedTarget)
    }
  }

  return (
    <Button
      {...props}
      ref={composedRef}
      // CB-SELECT-06: `button` by default (no accidental submit), but an
      // explicit native type stays application-owned.
      type={typeProp ?? 'button'}
      role="combobox"
      aria-expanded={context.isOpen}
      aria-haspopup={context.popupRole}
      aria-controls={context.popoverId}
      aria-activedescendant={context.isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`ref-input ${className || ''}`}
      style={style}
    >
      {children}
    </Button>
  )
  }
)
