import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h5Fn = /* @__PURE__ */ createRecipe('r_h5', {}, [])

const h5VariantMap = {}

const h5VariantKeys = Object.keys(h5VariantMap)

export const h5 = /* @__PURE__ */ Object.assign(memo(h5Fn.recipeFn), {
  __recipe__: true,
  __name__: 'h5',
  __getCompoundVariantCss__: h5Fn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h5VariantKeys,
  variantMap: h5VariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h5VariantKeys)
  },
  getVariantProps: h5Fn.getVariantProps,
})