import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const bStyleFn = /* @__PURE__ */ createRecipe('r_b', {}, [])

const bStyleVariantMap = {}

const bStyleVariantKeys = Object.keys(bStyleVariantMap)

export const bStyle = /* @__PURE__ */ Object.assign(memo(bStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'bStyle',
  __getCompoundVariantCss__: bStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: bStyleVariantKeys,
  variantMap: bStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, bStyleVariantKeys)
  },
  getVariantProps: bStyleFn.getVariantProps,
})