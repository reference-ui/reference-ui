/**
 * Next nav part: steps the pane one month forward. Month stepping is a
 * day-view gesture — in month/year view Next is native-disabled and
 * silent.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { CalendarContext } from '../context'
import type { CalendarNextButtonProps } from '../types'

export function CalendarNextButton({
  children = '›',
  className,
  style,
  onClick,
  ...props
}: CalendarNextButtonProps) {
  const context = React.useContext(CalendarContext)
  // Month stepping is a day-view gesture: in month/year view Next is
  // native-disabled and silent (CA-VIEW-08).
  const navDisabled = (context?.nextDisabled ?? false) || (context ? context.view !== 'day' : false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented) {
      context?.goToNextMonth()
    }
  }

  return (
    <Button
      type="button"
      aria-label={context?.nextLabel ?? 'Next month'}
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
