import { css, recipe } from '@reference-ui/react'
import { cssSelectorsMatrixConstants } from './constants'

export const descendantSelectorClass = css({
  '& [data-slot=inner]': {
    marginTop: cssSelectorsMatrixConstants.descendantMarginTop,
  },
})

export const directChildSelectorClass = css({
  '& > [data-slot=child]': {
    paddingLeft: cssSelectorsMatrixConstants.directChildPaddingLeft,
  },
})

export const adjacentSiblingSelectorClass = css({
  '& + [data-slot=peer]': {
    marginLeft: cssSelectorsMatrixConstants.adjacentSiblingMarginLeft,
  },
})

export const generalSiblingSelectorClass = css({
  '& ~ [data-slot=overlay]': {
    paddingTop: cssSelectorsMatrixConstants.generalSiblingPaddingTop,
  },
})

export const hoverSelectorClass = css({
  textDecoration: cssSelectorsMatrixConstants.baseTextDecoration,
  '&:hover': {
    textDecoration: cssSelectorsMatrixConstants.hoverTextDecoration,
  },
})

export const focusVisibleSelectorClass = css({
  '&:focus-visible': {
    outlineStyle: cssSelectorsMatrixConstants.focusVisibleOutlineStyle,
    outlineWidth: cssSelectorsMatrixConstants.focusVisibleOutlineWidth,
  },
})

export const topLevelConstantControlClass = css({
  borderTopWidth: cssSelectorsMatrixConstants.topLevelBorderTopWidth,
  borderStyle: cssSelectorsMatrixConstants.topLevelBorderStyle,
})

export const selfAttributeSelectorClass = css({
  borderStyle: cssSelectorsMatrixConstants.topLevelBorderStyle,
  '&[data-component=card]': {
    borderTopWidth: cssSelectorsMatrixConstants.selfAttributeBorderTopWidth,
  },
})

export const selfAttributeHoverSelectorClass = css({
  borderStyle: cssSelectorsMatrixConstants.topLevelBorderStyle,
  '&[data-component=card]:hover': {
    borderTopWidth: cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth,
  },
})

export const selfAttributeQuotedSelectorClass = css({
  borderStyle: cssSelectorsMatrixConstants.topLevelBorderStyle,
  '&[data-component="card"]': {
    borderRightWidth: cssSelectorsMatrixConstants.selfAttributeQuotedBorderRightWidth,
  },
})

export const selfAttributeStateSelectorClass = css({
  borderStyle: cssSelectorsMatrixConstants.topLevelBorderStyle,
  '&[data-component=card][data-state=open]': {
    borderLeftWidth: cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth,
  },
})

export const selectorRecipe = recipe({
  base: {
    borderStyle: cssSelectorsMatrixConstants.recipeBaseBorderStyle,
    borderTopWidth: cssSelectorsMatrixConstants.recipeBaseBorderTopWidth,
    '& [data-slot=recipe-inner]': {
      marginTop: cssSelectorsMatrixConstants.recipeDescendantMarginTop,
    },
    '& > [data-slot=recipe-child]': {
      paddingLeft: cssSelectorsMatrixConstants.recipeDirectChildPaddingLeft,
    },
  },
  variants: {
    tone: {
      interactive: {
        textDecoration: cssSelectorsMatrixConstants.baseTextDecoration,
        '&:hover': {
          textDecoration: cssSelectorsMatrixConstants.recipeHoverTextDecoration,
        },
      },
      quiet: {
        '&[data-component="recipe-card"]': {
          borderRightWidth: cssSelectorsMatrixConstants.recipeQuotedBorderRightWidth,
        },
      },
    },
    state: {
      open: {
        '&[data-component=recipe-card][data-state=open]': {
          borderLeftWidth: cssSelectorsMatrixConstants.recipeStateBorderLeftWidth,
        },
      },
      closed: {},
    },
    emphasis: {
      strong: {},
      soft: {},
    },
  },
  compoundVariants: [
    {
      tone: 'interactive',
      emphasis: 'strong',
      css: {
        '&[data-component=recipe-card]': {
          borderTopWidth: cssSelectorsMatrixConstants.recipeCompoundBorderTopWidth,
        },
      },
    },
  ],
  defaultVariants: {
    tone: 'interactive',
    state: 'closed',
    emphasis: 'soft',
  },
})

export const cssSelectorsMatrixClasses = {
  descendantSelector: descendantSelectorClass,
  directChildSelector: directChildSelectorClass,
  adjacentSiblingSelector: adjacentSiblingSelectorClass,
  generalSiblingSelector: generalSiblingSelectorClass,
  hoverSelector: hoverSelectorClass,
  focusVisibleSelector: focusVisibleSelectorClass,
  topLevelConstantControl: topLevelConstantControlClass,
  selfAttribute: selfAttributeSelectorClass,
  selfAttributeHover: selfAttributeHoverSelectorClass,
  selfAttributeQuoted: selfAttributeQuotedSelectorClass,
  selfAttributeState: selfAttributeStateSelectorClass,
} as const