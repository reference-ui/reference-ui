import { css, recipe } from '@reference-ui/react'

export const responsiveViewportConstants = {
  cssActiveBackground: '#7c3aed',
  cssActivePadding: '24px',
  cssBreakpointWidth: 800,
  mixedContainerBackground: '#fef3c7',
  mixedContainerPadding: '18px',
  mixedViewportBorderColor: '#ea580c',
  mixedViewportBorderWidth: '6px',
  recipeActiveBackground: '#0f766e',
  recipeActivePadding: '16px',
  recipeBreakpointHeight: 700,
  sharedContainerBreakpoint: 360,
  sharedCssBackground: '#1d4ed8',
  sharedCssPadding: '14px',
  sharedPrimitiveBackground: '#dbeafe',
  sharedPrimitivePadding: '10px',
  sharedRecipeBackground: '#15803d',
  sharedRecipePadding: '18px',
  viewportForeground: '#ffffff',
} as const

export const responsiveMatrixClasses = {
  sidebarCss: css({
    padding: '0px',
    backgroundColor: 'transparent',
    r: {
      200: {
        padding: '12px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
      },
    },
  }),
  viewportCss: css({
    padding: '0px',
    backgroundColor: 'transparent',
    '@media (min-width: 800px)': {
      padding: responsiveViewportConstants.cssActivePadding,
      backgroundColor: responsiveViewportConstants.cssActiveBackground,
      color: responsiveViewportConstants.viewportForeground,
    },
  }),
  mixedCss: css({
    paddingTop: '0px',
    backgroundColor: 'transparent',
    borderTopStyle: 'solid',
    borderTopWidth: '0px',
    borderTopColor: 'transparent',
    r: {
      260: {
        paddingTop: responsiveViewportConstants.mixedContainerPadding,
        backgroundColor: responsiveViewportConstants.mixedContainerBackground,
      },
    },
    '@media (min-width: 800px)': {
      borderTopWidth: responsiveViewportConstants.mixedViewportBorderWidth,
      borderTopColor: responsiveViewportConstants.mixedViewportBorderColor,
    },
  }),
  sharedCss: css({
    paddingTop: '0px',
    backgroundColor: 'transparent',
    color: 'transparent',
    r: {
      [responsiveViewportConstants.sharedContainerBreakpoint]: {
        paddingTop: responsiveViewportConstants.sharedCssPadding,
        backgroundColor: responsiveViewportConstants.sharedCssBackground,
        color: responsiveViewportConstants.viewportForeground,
      },
    },
  }),
} as const

export const responsiveCardRecipe = recipe({
  base: {
    padding: '0px',
    backgroundColor: 'transparent',
    r: {
      300: {
        padding: '12px',
        backgroundColor: '#16a34a',
        color: '#ffffff',
      },
    },
  },
})

export const responsiveViewportRecipe = recipe({
  base: {
    padding: '0px',
    backgroundColor: 'transparent',
    '@media (min-height: 700px)': {
      padding: responsiveViewportConstants.recipeActivePadding,
      backgroundColor: responsiveViewportConstants.recipeActiveBackground,
      color: responsiveViewportConstants.viewportForeground,
    },
  },
})

export const responsiveSharedRecipe = recipe({
  base: {
    paddingTop: '0px',
    backgroundColor: 'transparent',
    color: 'transparent',
    r: {
      [responsiveViewportConstants.sharedContainerBreakpoint]: {
        paddingTop: responsiveViewportConstants.sharedRecipePadding,
        backgroundColor: responsiveViewportConstants.sharedRecipeBackground,
        color: responsiveViewportConstants.viewportForeground,
      },
    },
  },
})
