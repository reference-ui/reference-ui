import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const iStyleFn = /* @__PURE__ */ createRecipe('r_i', {}, [])

const iStyleVariantMap = {}

const iStyleVariantKeys = Object.keys(iStyleVariantMap)

export const iStyle = /* @__PURE__ */ Object.assign(memo(iStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'iStyle',
  __getCompoundVariantCss__: iStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: iStyleVariantKeys,
  variantMap: iStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, iStyleVariantKeys)
  },
  getVariantProps: iStyleFn.getVariantProps,
})