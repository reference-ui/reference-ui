import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h1StyleFn = /* @__PURE__ */ createRecipe('r_h1', {}, [])

const h1StyleVariantMap = {}

const h1StyleVariantKeys = Object.keys(h1StyleVariantMap)

export const h1Style = /* @__PURE__ */ Object.assign(memo(h1StyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'h1Style',
  __getCompoundVariantCss__: h1StyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h1StyleVariantKeys,
  variantMap: h1StyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h1StyleVariantKeys)
  },
  getVariantProps: h1StyleFn.getVariantProps,
})