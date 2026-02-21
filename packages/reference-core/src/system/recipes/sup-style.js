import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const supStyleFn = /* @__PURE__ */ createRecipe('r_sup', {}, [])

const supStyleVariantMap = {}

const supStyleVariantKeys = Object.keys(supStyleVariantMap)

export const supStyle = /* @__PURE__ */ Object.assign(memo(supStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'supStyle',
  __getCompoundVariantCss__: supStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: supStyleVariantKeys,
  variantMap: supStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, supStyleVariantKeys)
  },
  getVariantProps: supStyleFn.getVariantProps,
})