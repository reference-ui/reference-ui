/**
 * Listbox's grouping parts: Section (a labelled group of options),
 * Header (a standalone group label), and Empty (the no-results status).
 * Presentational only — no context reads, no registration; Section's
 * heading id wires the group label for assistive technology.
 */
import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import type { ListboxEmptyProps, ListboxHeaderProps, ListboxSectionProps } from '../types'

export function ListboxSection({
  title,
  children,
  className,
  style,
  ...props
}: ListboxSectionProps) {
  const headingId = React.useId()
  return (
    <Div
      role="group"
      aria-labelledby={title ? headingId : undefined}
      data-reference-listbox-section=""
      display="flex"
      flexDirection="column"
      gap="0.5r"
      py="1r"
      className={className}
      style={style}
      {...props}
    >
      {title && (
        <Span
          id={headingId}
          data-reference-listbox-header=""
          display="block"
          px="3r"
          py="1r"
          fontSize="2.75r"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="0.05em"
          color="design.text.light"
          userSelect="none"
        >
          {title}
        </Span>
      )}
      {children}
    </Div>
  )
}

export function ListboxHeader({
  children,
  className,
  style,
  ...props
}: ListboxHeaderProps) {
  return (
    <Span
      data-reference-listbox-header=""
      display="block"
      px="3r"
      py="1r"
      fontSize="2.75r"
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing="0.05em"
      color="design.text.light"
      userSelect="none"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Span>
  )
}

export function ListboxEmpty({
  children = 'No results found',
  className,
  style,
  ...props
}: ListboxEmptyProps) {
  return (
    <Div
      data-reference-listbox-empty=""
      role="status"
      aria-live="polite"
      px="3r"
      py="3r"
      fontSize="3.5r"
      color="design.text.light"
      textAlign="center"
      userSelect="none"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}
