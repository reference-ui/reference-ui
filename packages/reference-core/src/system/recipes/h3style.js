import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const h3StyleFn = /* @__PURE__ */ createRecipe('r_h3', {}, [])

const h3StyleVariantMap = {}

const h3StyleVariantKeys = Object.keys(h3StyleVariantMap)

export const h3Style = /* @__PURE__ */ Object.assign(memo(h3StyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'h3Style',
  __getCompoundVariantCss__: h3StyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: h3StyleVariantKeys,
  variantMap: h3StyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, h3StyleVariantKeys)
  },
  getVariantProps: h3StyleFn.getVariantProps,
})