// Shared surface recipes for component-page demos.
// They take nothing and emit the floating and list surfaces, demo stacks, and note styles
// the demos compose.
import { css } from '@reference-ui/react'

/**
 * Shared chrome for the component demos on these pages. The lib components
 * ship behaviour, not panels, so floating content and list boxes take this
 * flat surface to read as distinct from the page.
 */
export const floatingSurface = css({
  padding: '3r',
  bg: 'ui.dialog.background',
  color: 'ui.dialog.foreground',
  borderRadius: 'md',
  border: '1px solid',
  borderColor: 'ui.dialog.border',
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
})

export const listSurface = css({
  minWidth: '60r',
  padding: '1r',
  border: '1px solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
})

export const demoStack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3r',
  width: '100%',
  maxWidth: '100r',
})

export const demoNote = css({
  fontSize: '0.875rem',
  color: 'docsMuted',
})
