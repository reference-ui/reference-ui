import { cva as styledCva } from '@reference-ui/styled/css/cva'
import type { RecipeCreatorFn, RecipeDefinition } from '../../../types'
import { lowerResponsiveStyles } from '../css/lowerResponsiveStyles'

// Reference UI extends Panda's generated cva()/recipe runtime at this seam.
// Virtual still lowers author code for extraction; this wrapper keeps runtime
// recipe resolution on the same lowered container-query shape.
export const customCvaFn = ((config: RecipeDefinition) => {
  return styledCva(lowerResponsiveRecipeDefinition(config) as Parameters<typeof styledCva>[0])
}) as RecipeCreatorFn

function lowerResponsiveRecipeDefinition(config: RecipeDefinition): RecipeDefinition {
  const loweredBase = config.base
    ? lowerResponsiveStyles(config.base)
    : config.base

  const loweredVariants = config.variants
    ? Object.fromEntries(
        Object.entries(config.variants).map(([variantName, variantValues]) => [
          variantName,
          Object.fromEntries(
            Object.entries(variantValues).map(([variantValue, styles]) => [
              variantValue,
              lowerResponsiveStyles(styles),
            ])
          ),
        ])
      )
    : config.variants

  const loweredCompoundVariants = config.compoundVariants?.map(compoundVariant => ({
    ...compoundVariant,
    css: lowerResponsiveStyles(compoundVariant.css),
  }))

  const loweredConfig: RecipeDefinition = {
    ...config,
  }

  if (loweredBase !== undefined) {
    loweredConfig.base = loweredBase
  }

  if (loweredVariants !== undefined) {
    loweredConfig.variants = loweredVariants as RecipeDefinition['variants']
  }

  if (loweredCompoundVariants !== undefined) {
    loweredConfig.compoundVariants = loweredCompoundVariants as RecipeDefinition['compoundVariants']
  }

  return loweredConfig
}