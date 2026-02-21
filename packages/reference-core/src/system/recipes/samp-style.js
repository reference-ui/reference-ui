import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const sampStyleFn = /* @__PURE__ */ createRecipe('r_samp', {}, [])

const sampStyleVariantMap = {}

const sampStyleVariantKeys = Object.keys(sampStyleVariantMap)

export const sampStyle = /* @__PURE__ */ Object.assign(memo(sampStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'sampStyle',
  __getCompoundVariantCss__: sampStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: sampStyleVariantKeys,
  variantMap: sampStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, sampStyleVariantKeys)
  },
  getVariantProps: sampStyleFn.getVariantProps,
})