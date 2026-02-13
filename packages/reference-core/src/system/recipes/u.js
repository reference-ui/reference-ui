import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const uFn = /* @__PURE__ */ createRecipe('r_u', {}, [])

const uVariantMap = {}

const uVariantKeys = Object.keys(uVariantMap)

export const u = /* @__PURE__ */ Object.assign(memo(uFn.recipeFn), {
  __recipe__: true,
  __name__: 'u',
  __getCompoundVariantCss__: uFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: uVariantKeys,
  variantMap: uVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, uVariantKeys)
  },
  getVariantProps: uFn.getVariantProps,
})