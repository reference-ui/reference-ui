import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const citeFn = /* @__PURE__ */ createRecipe('r_cite', {}, [])

const citeVariantMap = {}

const citeVariantKeys = Object.keys(citeVariantMap)

export const cite = /* @__PURE__ */ Object.assign(memo(citeFn.recipeFn), {
  __recipe__: true,
  __name__: 'cite',
  __getCompoundVariantCss__: citeFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: citeVariantKeys,
  variantMap: citeVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, citeVariantKeys)
  },
  getVariantProps: citeFn.getVariantProps,
})