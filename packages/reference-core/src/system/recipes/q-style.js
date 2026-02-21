import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const qStyleFn = /* @__PURE__ */ createRecipe('r_q', {}, [])

const qStyleVariantMap = {}

const qStyleVariantKeys = Object.keys(qStyleVariantMap)

export const qStyle = /* @__PURE__ */ Object.assign(memo(qStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'qStyle',
  __getCompoundVariantCss__: qStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: qStyleVariantKeys,
  variantMap: qStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, qStyleVariantKeys)
  },
  getVariantProps: qStyleFn.getVariantProps,
})