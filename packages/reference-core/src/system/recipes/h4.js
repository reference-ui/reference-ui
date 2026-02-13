import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h4Fn = /* @__PURE__ */ createRecipe('r_h4', {}, [])

const h4VariantMap = {}

const h4VariantKeys = Object.keys(h4VariantMap)

export const h4 = /* @__PURE__ */ Object.assign(memo(h4Fn.recipeFn), {
  __recipe__: true,
  __name__: 'h4',
  __getCompoundVariantCss__: h4Fn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h4VariantKeys,
  variantMap: h4VariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h4VariantKeys)
  },
  getVariantProps: h4Fn.getVariantProps,
})