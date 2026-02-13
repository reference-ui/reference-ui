import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const iFn = /* @__PURE__ */ createRecipe('r_i', {}, [])

const iVariantMap = {}

const iVariantKeys = Object.keys(iVariantMap)

export const i = /* @__PURE__ */ Object.assign(memo(iFn.recipeFn), {
  __recipe__: true,
  __name__: 'i',
  __getCompoundVariantCss__: iFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: iVariantKeys,
  variantMap: iVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, iVariantKeys)
  },
  getVariantProps: iFn.getVariantProps,
})