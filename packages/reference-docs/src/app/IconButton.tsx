import type { MouseEventHandler, ReactNode } from 'react'
import { css } from '@reference-ui/react'
import { controlSurface } from './controlSurface'

/**
 * Square icon button used across the docs shell (menu, close, theme).
 * `iconLayout` carries sizing only; the surface supplies fill, border, and
 * hover, so `ghost` can share the frosted surface that floats over content.
 */
const iconLayout = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '9r',
  height: '9r',
  padding: '0',
  flexShrink: '0',
  borderRadius: 'md',
  cursor: 'pointer',
})

const plainSurface = css({
  border: 'none',
  background: 'transparent',
  color: 'docsMuted',
  transition: 'background 0.15s ease, color 0.15s ease',
  _hover: {
    background: 'docsHoverBg',
    color: 'docsText',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'docsRing',
    outlineOffset: '2px',
  },
})

export function IconButton({
  label,
  onClick,
  expanded,
  variant = 'plain',
  children,
}: {
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  expanded?: boolean
  variant?: 'plain' | 'ghost'
  children: ReactNode
}) {
  const className = [iconLayout, variant === 'ghost' ? controlSurface : plainSurface].join(' ')

  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  )
}
