import { css } from '@reference-ui/react'

/**
 * Frosted surface for controls that float over scrolling content. A translucent
 * fill plus blur (and a hairline) keep header actions legible without giving
 * them an opaque bar of their own. Consumers add sizing and radius.
 */
export const controlSurface = css({
  background: 'docsControlBg',
  border: '1px solid',
  borderColor: 'docsControlBorder',
  color: 'docsText',
  backdropFilter: 'blur(10px)',
  transition: 'background 0.15s ease, color 0.15s ease',
  _hover: {
    background: 'docsHoverBg',
  },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'docsRing',
    outlineOffset: '2px',
  },
})
