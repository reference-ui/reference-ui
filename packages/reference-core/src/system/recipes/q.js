import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const qFn = /* @__PURE__ */ createRecipe('r_q', {}, [])

const qVariantMap = {}

const qVariantKeys = Object.keys(qVariantMap)

export const q = /* @__PURE__ */ Object.assign(memo(qFn.recipeFn), {
  __recipe__: true,
  __name__: 'q',
  __getCompoundVariantCss__: qFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: qVariantKeys,
  variantMap: qVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, qVariantKeys)
  },
  getVariantProps: qFn.getVariantProps,
})