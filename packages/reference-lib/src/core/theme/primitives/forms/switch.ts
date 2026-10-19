// Switch primitive styles: monochrome track and thumb on the switch button.
// It takes nothing and emits the globalCss map for [data-reference-switch] and its
// thumb, off quiet and on at the checkbox checked fill.
import { globalCss } from '@reference-ui/system'
import { focusRingStyles } from '../shared'

// Monochrome, matching Checkbox and Radio. Off is a quiet neutral track (the
// radio's off surface, a step off the page) under a light thumb; on is the
// checkbox's checked fill under the checkbox's tick colour, so the thumb flips
// to contrast with the bright track. Hover nudges the off track one small step
// toward the foreground; the on track already sits at the foreground.
const offTrack = '{colors.ui.radio.track.background}'
const offHover = `color-mix(in oklch, ${offTrack}, {colors.design.foreground} 10%)`
const onTrack = '{colors.ui.checkbox.checked.fill}'
const offThumb = '{colors.gray.50}'
const onThumb = '{colors.ui.checkbox.tick.stroke}'

export const switchPrimitiveStyles = {
  '.ref-button[data-reference-switch]': {
    ...focusRingStyles,
    appearance: 'none',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexShrink: 0,
    width: '11r',
    height: '6r',
    padding: '0.5r',
    gap: '0',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: 'full',
    backgroundColor: offTrack,
    color: 'transparent',
    fontSize: '0',
    lineHeight: '0',
    cursor: 'pointer',
    userSelect: 'none',
    _hover: {
      backgroundColor: offHover,
    },
    _active: {
      boxShadow: 'none',
    },
    _disabled: {
      pointerEvents: 'none',
      cursor: 'not-allowed',
      opacity: 0.55,
    },
  },

  '.ref-button[data-reference-switch][data-state="checked"]': {
    backgroundColor: onTrack,
    _hover: {
      backgroundColor: onTrack,
    },
  },

  '[data-reference-switch-thumb]': {
    display: 'block',
    width: '5r',
    height: '5r',
    flexShrink: 0,
    borderRadius: 'full',
    backgroundColor: offThumb,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transform: 'translateX(0)',
    transitionProperty: 'transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    pointerEvents: 'none',
  },

  '[data-reference-switch-thumb][data-state="checked"]': {
    backgroundColor: onThumb,
    transform: 'translateX(1.25rem)',
  },
} as const

globalCss(switchPrimitiveStyles)
