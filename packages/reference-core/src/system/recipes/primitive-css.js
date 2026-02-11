import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const primitiveCSSFn = /* @__PURE__ */ createRecipe('primitiveCSS', {}, [])

const primitiveCSSVariantMap = {}

const primitiveCSSVariantKeys = Object.keys(primitiveCSSVariantMap)

export const primitiveCSS = /* @__PURE__ */ Object.assign(memo(primitiveCSSFn.recipeFn), {
  __recipe__: true,
  __name__: 'primitiveCSS',
  __getCompoundVariantCss__: primitiveCSSFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: primitiveCSSVariantKeys,
  variantMap: primitiveCSSVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, primitiveCSSVariantKeys)
  },
  getVariantProps: primitiveCSSFn.getVariantProps,
})