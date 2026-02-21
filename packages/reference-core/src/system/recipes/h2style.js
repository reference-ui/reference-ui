import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h2StyleFn = /* @__PURE__ */ createRecipe('r_h2', {}, [])

const h2StyleVariantMap = {}

const h2StyleVariantKeys = Object.keys(h2StyleVariantMap)

export const h2Style = /* @__PURE__ */ Object.assign(memo(h2StyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'h2Style',
  __getCompoundVariantCss__: h2StyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h2StyleVariantKeys,
  variantMap: h2StyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h2StyleVariantKeys)
  },
  getVariantProps: h2StyleFn.getVariantProps,
})