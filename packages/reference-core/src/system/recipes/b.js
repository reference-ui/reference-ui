import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const bFn = /* @__PURE__ */ createRecipe('r_b', {}, [])

const bVariantMap = {}

const bVariantKeys = Object.keys(bVariantMap)

export const b = /* @__PURE__ */ Object.assign(memo(bFn.recipeFn), {
  __recipe__: true,
  __name__: 'b',
  __getCompoundVariantCss__: bFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: bVariantKeys,
  variantMap: bVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, bVariantKeys)
  },
  getVariantProps: bFn.getVariantProps,
})