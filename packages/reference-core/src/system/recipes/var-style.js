import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const varStyleFn = /* @__PURE__ */ createRecipe('r_var', {}, [])

const varStyleVariantMap = {}

const varStyleVariantKeys = Object.keys(varStyleVariantMap)

export const varStyle = /* @__PURE__ */ Object.assign(memo(varStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'varStyle',
  __getCompoundVariantCss__: varStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: varStyleVariantKeys,
  variantMap: varStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, varStyleVariantKeys)
  },
  getVariantProps: varStyleFn.getVariantProps,
})