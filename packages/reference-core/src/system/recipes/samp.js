import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const sampFn = /* @__PURE__ */ createRecipe('r_samp', {}, [])

const sampVariantMap = {}

const sampVariantKeys = Object.keys(sampVariantMap)

export const samp = /* @__PURE__ */ Object.assign(memo(sampFn.recipeFn), {
  __recipe__: true,
  __name__: 'samp',
  __getCompoundVariantCss__: sampFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: sampVariantKeys,
  variantMap: sampVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, sampVariantKeys)
  },
  getVariantProps: sampFn.getVariantProps,
})