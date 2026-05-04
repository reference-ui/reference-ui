import { css } from '../styled-system/css'
import { cssSelectorsPlaygroundConstants } from './constants'

export const descendantSelectorClass = css({
  '& [data-slot=inner]': {
    marginTop: cssSelectorsPlaygroundConstants.descendantMarginTop,
  },
})

export const descendantSelectorInlineClass = css({
  '& [data-slot=inner]': {
    marginTop: '13px',
  },
})

export const hoverSelectorClass = css({
  textDecoration: 'none',
  '&:hover': {
    textDecoration: cssSelectorsPlaygroundConstants.hoverTextDecoration,
  },
})

export const hoverSelectorInlineClass = css({
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'line-through',
  },
})

export const topLevelConstantControlClass = css({
  borderTopWidth: cssSelectorsPlaygroundConstants.selfAttributeHoverBorderTopWidth,
  borderStyle: 'solid',
})

export const selfAttributeSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card]': {
    borderTopWidth: cssSelectorsPlaygroundConstants.selfAttributeBorderTopWidth,
  },
})

export const selfAttributeHoverSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card]:hover': {
    borderTopWidth: cssSelectorsPlaygroundConstants.selfAttributeHoverBorderTopWidth,
  },
})

export const selfAttributeHoverInlineClass = css({
  borderStyle: 'solid',
  '&[data-component=card]:hover': {
    borderTopWidth: '9px',
  },
})

export const selfAttributeQuotedSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component="card"]': {
    borderRightWidth: cssSelectorsPlaygroundConstants.selfAttributeQuotedBorderRightWidth,
  },
})

export const selfAttributeStateSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card][data-state=open]': {
    borderLeftWidth: cssSelectorsPlaygroundConstants.selfAttributeStateBorderLeftWidth,
  },
})

export const cssPlaygroundClasses = {
  descendantSelector: descendantSelectorClass,
  descendantSelectorInline: descendantSelectorInlineClass,
  hoverSelector: hoverSelectorClass,
  hoverSelectorInline: hoverSelectorInlineClass,
  topLevelConstantControl: topLevelConstantControlClass,
  selfAttribute: selfAttributeSelectorClass,
  selfAttributeHover: selfAttributeHoverSelectorClass,
  selfAttributeHoverInline: selfAttributeHoverInlineClass,
  selfAttributeQuoted: selfAttributeQuotedSelectorClass,
  selfAttributeState: selfAttributeStateSelectorClass,
} as const