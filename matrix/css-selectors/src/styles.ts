import { css } from '@reference-ui/react'
import { cssSelectorsMatrixConstants } from './constants'

export const descendantSelectorClass = css({
  '& [data-slot=inner]': {
    marginTop: cssSelectorsMatrixConstants.descendantMarginTop,
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
    textDecoration: cssSelectorsMatrixConstants.hoverTextDecoration,
  },
})

export const hoverSelectorInlineClass = css({
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'line-through',
  },
})

export const topLevelConstantControlClass = css({
  borderTopWidth: cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth,
  borderStyle: 'solid',
})

export const selfAttributeSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card]': {
    borderTopWidth: cssSelectorsMatrixConstants.selfAttributeBorderTopWidth,
  },
})

export const selfAttributeHoverSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card]:hover': {
    borderTopWidth: cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth,
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
    borderRightWidth: cssSelectorsMatrixConstants.selfAttributeQuotedBorderRightWidth,
  },
})

export const selfAttributeStateSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card][data-state=open]': {
    borderLeftWidth: cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth,
  },
})

export const cssSelectorsMatrixClasses = {
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