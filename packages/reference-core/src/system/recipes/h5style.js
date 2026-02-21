import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h5StyleFn = /* @__PURE__ */ createRecipe('r_h5', {}, [])

const h5StyleVariantMap = {}

const h5StyleVariantKeys = Object.keys(h5StyleVariantMap)

export const h5Style = /* @__PURE__ */ Object.assign(memo(h5StyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'h5Style',
  __getCompoundVariantCss__: h5StyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h5StyleVariantKeys,
  variantMap: h5StyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h5StyleVariantKeys)
  },
  getVariantProps: h5StyleFn.getVariantProps,
})