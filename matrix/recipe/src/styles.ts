import { recipe, type RecipeVariantProps } from '@reference-ui/react'
import { tokens } from '@reference-ui/system'

export const recipeMatrixConstants = {
  solidBackground: 'recipeMatrixSolidBackground',
  solidForeground: 'recipeMatrixSolidForeground',
  outlineBackground: 'recipeMatrixOutlineBackground',
  outlineForeground: 'recipeMatrixOutlineForeground',
  outlineBorder: 'recipeMatrixOutlineBorder',
  compoundBackground: 'recipeMatrixCompoundBackground',
  compoundForeground: 'recipeMatrixCompoundForeground',
  compoundBorder: 'recipeMatrixCompoundBorder',
  capsuleRadius: '9999px',
  capsuleSpacing: '0.08em',
  responsiveViewportBackground: 'recipeMatrixResponsiveViewportBackground',
  responsiveViewportBreakpoint: 900,
  responsiveViewportQuery: '@media (min-width: 900px)',
  responsiveViewportPadding: '20px',
  responsiveContainerBorder: 'recipeMatrixResponsiveContainerBorder',
  responsiveContainerBreakpoint: 320,
  responsiveContainerQuery: '@container (min-width: 320px)',
  responsiveContainerBorderWidth: '7px',
} as const

tokens({
  colors: {
    [recipeMatrixConstants.solidBackground]: { value: '#2563eb' },
    [recipeMatrixConstants.solidForeground]: { value: '#ffffff' },
    [recipeMatrixConstants.outlineBackground]: { value: '#f8fafc' },
    [recipeMatrixConstants.outlineForeground]: { value: '#0f172a' },
    [recipeMatrixConstants.outlineBorder]: { value: '#94a3b8' },
    [recipeMatrixConstants.compoundBackground]: { value: '#fce7f3' },
    [recipeMatrixConstants.compoundForeground]: { value: '#be185d' },
    [recipeMatrixConstants.compoundBorder]: { value: '#ec4899' },
    [recipeMatrixConstants.responsiveViewportBackground]: { value: '#1d4ed8' },
    [recipeMatrixConstants.responsiveContainerBorder]: { value: '#f97316' },
  },
})

const recipeMatrixButtonRuntime = recipe({
  base: {
    padding: '2r',
    borderRadius: '12px',
    fontWeight: '600',
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: recipeMatrixConstants.solidBackground,
        color: recipeMatrixConstants.solidForeground,
      },
      outline: {
        backgroundColor: recipeMatrixConstants.outlineBackground,
        color: recipeMatrixConstants.outlineForeground,
        border: '1px solid',
        borderColor: recipeMatrixConstants.outlineBorder,
        fontWeight: '500',
      },
    },
    tone: {
      teal: {},
      pink: {},
    },
    size: {
      sm: {
        fontSize: '14px',
      },
      lg: {
        fontSize: '18px',
      },
    },
    capsule: {
      false: {},
      true: {
        borderRadius: recipeMatrixConstants.capsuleRadius,
        textTransform: 'uppercase',
        letterSpacing: recipeMatrixConstants.capsuleSpacing,
      },
    },
  },
  compoundVariants: [
    {
      visual: 'outline',
      tone: 'pink',
      css: {
        backgroundColor: recipeMatrixConstants.compoundBackground,
        color: recipeMatrixConstants.compoundForeground,
        borderColor: recipeMatrixConstants.compoundBorder,
        fontWeight: '700',
      },
    },
  ],
  defaultVariants: {
    visual: 'solid',
    tone: 'teal',
    size: 'sm',
    capsule: false,
  },
})

type RecipeMatrixButtonVariants = RecipeVariantProps<typeof recipeMatrixButtonRuntime>

export function recipeMatrixButton(variants?: RecipeMatrixButtonVariants): string {
  return recipeMatrixButtonRuntime(variants)
}

const recipeMatrixResponsiveCardRuntime = recipe({
  base: {
    paddingTop: '0px',
    backgroundColor: 'transparent',
    borderTopStyle: 'solid',
    borderTopWidth: '0px',
    borderTopColor: 'transparent',
    [recipeMatrixConstants.responsiveContainerQuery]: {
      borderTopWidth: recipeMatrixConstants.responsiveContainerBorderWidth,
      borderTopColor: recipeMatrixConstants.responsiveContainerBorder,
    },
  },
  variants: {
    tone: {
      calm: {},
      alert: {
        [recipeMatrixConstants.responsiveViewportQuery]: {
          paddingTop: recipeMatrixConstants.responsiveViewportPadding,
          backgroundColor: recipeMatrixConstants.responsiveViewportBackground,
        },
      },
    },
  },
  defaultVariants: {
    tone: 'calm',
  },
})

type RecipeMatrixResponsiveCardVariants = RecipeVariantProps<typeof recipeMatrixResponsiveCardRuntime>

export function recipeMatrixResponsiveCard(variants?: RecipeMatrixResponsiveCardVariants): string {
  return recipeMatrixResponsiveCardRuntime(variants)
}