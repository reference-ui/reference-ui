import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const citeStyleFn = /* @__PURE__ */ createRecipe('r_cite', {}, [])

const citeStyleVariantMap = {}

const citeStyleVariantKeys = Object.keys(citeStyleVariantMap)

export const citeStyle = /* @__PURE__ */ Object.assign(memo(citeStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'citeStyle',
  __getCompoundVariantCss__: citeStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: citeStyleVariantKeys,
  variantMap: citeStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, citeStyleVariantKeys)
  },
  getVariantProps: citeStyleFn.getVariantProps,
})