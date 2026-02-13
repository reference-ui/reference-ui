import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const preFn = /* @__PURE__ */ createRecipe('r_pre', {}, [])

const preVariantMap = {}

const preVariantKeys = Object.keys(preVariantMap)

export const pre = /* @__PURE__ */ Object.assign(memo(preFn.recipeFn), {
  __recipe__: true,
  __name__: 'pre',
  __getCompoundVariantCss__: preFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: preVariantKeys,
  variantMap: preVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, preVariantKeys)
  },
  getVariantProps: preFn.getVariantProps,
})