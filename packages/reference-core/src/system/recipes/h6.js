import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h6Fn = /* @__PURE__ */ createRecipe('r_h6', {}, [])

const h6VariantMap = {}

const h6VariantKeys = Object.keys(h6VariantMap)

export const h6 = /* @__PURE__ */ Object.assign(memo(h6Fn.recipeFn), {
  __recipe__: true,
  __name__: 'h6',
  __getCompoundVariantCss__: h6Fn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h6VariantKeys,
  variantMap: h6VariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h6VariantKeys)
  },
  getVariantProps: h6Fn.getVariantProps,
})