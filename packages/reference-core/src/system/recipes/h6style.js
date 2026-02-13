import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h6StyleFn = /* @__PURE__ */ createRecipe('r_h6', {}, [])

const h6StyleVariantMap = {}

const h6StyleVariantKeys = Object.keys(h6StyleVariantMap)

export const h6Style = /* @__PURE__ */ Object.assign(memo(h6StyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'h6Style',
  __getCompoundVariantCss__: h6StyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h6StyleVariantKeys,
  variantMap: h6StyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h6StyleVariantKeys)
  },
  getVariantProps: h6StyleFn.getVariantProps,
})