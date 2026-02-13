import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const subFn = /* @__PURE__ */ createRecipe('r_sub', {}, [])

const subVariantMap = {}

const subVariantKeys = Object.keys(subVariantMap)

export const sub = /* @__PURE__ */ Object.assign(memo(subFn.recipeFn), {
  __recipe__: true,
  __name__: 'sub',
  __getCompoundVariantCss__: subFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: subVariantKeys,
  variantMap: subVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, subVariantKeys)
  },
  getVariantProps: subFn.getVariantProps,
})