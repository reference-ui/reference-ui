/**
 * Previous nav part: steps the pane one month back. Month stepping is a
 * day-view gesture — in month/year view Previous is native-disabled and
 * silent.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { CalendarContext } from '../context'
import type { CalendarPrevButtonProps } from '../types'

export function CalendarPrevButton({
  children = '‹',
  className,
  style,
  onClick,
  ...props
}: CalendarPrevButtonProps) {
  const context = React.useContext(CalendarContext)
  // Month stepping is a day-view gesture: in month/year view Previous is
  // native-disabled and silent (CA-VIEW-08).
  const navDisabled = (context?.prevDisabled ?? false) || (context ? context.view !== 'day' : false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToPrevMonth()
    }
  }

  return (
    <Button
      type="button"
      aria-label={context?.prevLabel ?? 'Previous month'}
      disabled={navDisabled}
      onClick={handleClick}
      width="7r"
      height="7r"
      p="0"
      borderRadius="sm"
      border="none"
      bg="transparent"
      color="design.text.base"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      cursor={navDisabled ? 'not-allowed' : 'pointer'}
      _hover={!navDisabled ? { bg: 'ui.button.mutedBackground' } : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}
