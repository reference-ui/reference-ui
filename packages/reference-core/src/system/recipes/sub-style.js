import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const subStyleFn = /* @__PURE__ */ createRecipe('r_sub', {}, [])

const subStyleVariantMap = {}

const subStyleVariantKeys = Object.keys(subStyleVariantMap)

export const subStyle = /* @__PURE__ */ Object.assign(memo(subStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'subStyle',
  __getCompoundVariantCss__: subStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: subStyleVariantKeys,
  variantMap: subStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, subStyleVariantKeys)
  },
  getVariantProps: subStyleFn.getVariantProps,
})