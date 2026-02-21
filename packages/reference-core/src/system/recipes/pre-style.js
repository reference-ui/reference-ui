import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const preStyleFn = /* @__PURE__ */ createRecipe('r_pre', {}, [])

const preStyleVariantMap = {}

const preStyleVariantKeys = Object.keys(preStyleVariantMap)

export const preStyle = /* @__PURE__ */ Object.assign(memo(preStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'preStyle',
  __getCompoundVariantCss__: preStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: preStyleVariantKeys,
  variantMap: preStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, preStyleVariantKeys)
  },
  getVariantProps: preStyleFn.getVariantProps,
})