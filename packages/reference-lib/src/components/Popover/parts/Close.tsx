/**
 * Popover close: a button that dismisses its owning Overlay unless the
 * consumer's click handler already prevented the default. Chains the
 * consumer `onClick` first so overrides observe the press before close.
 */
import * as React from 'react'
import { Button, type PrimitiveProps } from '@reference-ui/react'
import { useOverlay } from '../../Overlay'

export type PopoverCloseProps = PrimitiveProps<'button'>

export function PopoverClose({
  children,
  ...props
}: PopoverCloseProps) {
  const overlay = useOverlay()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented) {
      overlay?.setIsOpen(false)
    }
  }

  return (
    <Button type="button" {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}
