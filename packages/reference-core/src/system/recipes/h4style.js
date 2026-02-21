import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h4StyleFn = /* @__PURE__ */ createRecipe('r_h4', {}, [])

const h4StyleVariantMap = {}

const h4StyleVariantKeys = Object.keys(h4StyleVariantMap)

export const h4Style = /* @__PURE__ */ Object.assign(memo(h4StyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'h4Style',
  __getCompoundVariantCss__: h4StyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h4StyleVariantKeys,
  variantMap: h4StyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h4StyleVariantKeys)
  },
  getVariantProps: h4StyleFn.getVariantProps,
})