import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const pStyleFn = /* @__PURE__ */ createRecipe('r_p', {}, [])

const pStyleVariantMap = {}

const pStyleVariantKeys = Object.keys(pStyleVariantMap)

export const pStyle = /* @__PURE__ */ Object.assign(memo(pStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'pStyle',
  __getCompoundVariantCss__: pStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: pStyleVariantKeys,
  variantMap: pStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, pStyleVariantKeys)
  },
  getVariantProps: pStyleFn.getVariantProps,
})