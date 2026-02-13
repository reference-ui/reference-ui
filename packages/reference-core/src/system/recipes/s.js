import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const sFn = /* @__PURE__ */ createRecipe('r_s', {}, [])

const sVariantMap = {}

const sVariantKeys = Object.keys(sVariantMap)

export const s = /* @__PURE__ */ Object.assign(memo(sFn.recipeFn), {
  __recipe__: true,
  __name__: 's',
  __getCompoundVariantCss__: sFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: sVariantKeys,
  variantMap: sVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, sVariantKeys)
  },
  getVariantProps: sFn.getVariantProps,
})