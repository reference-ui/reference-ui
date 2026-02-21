import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const uStyleFn = /* @__PURE__ */ createRecipe('r_u', {}, [])

const uStyleVariantMap = {}

const uStyleVariantKeys = Object.keys(uStyleVariantMap)

export const uStyle = /* @__PURE__ */ Object.assign(memo(uStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'uStyle',
  __getCompoundVariantCss__: uStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: uStyleVariantKeys,
  variantMap: uStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, uStyleVariantKeys)
  },
  getVariantProps: uStyleFn.getVariantProps,
})