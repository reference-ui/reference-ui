import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const sStyleFn = /* @__PURE__ */ createRecipe('r_s', {}, [])

const sStyleVariantMap = {}

const sStyleVariantKeys = Object.keys(sStyleVariantMap)

export const sStyle = /* @__PURE__ */ Object.assign(memo(sStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'sStyle',
  __getCompoundVariantCss__: sStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: sStyleVariantKeys,
  variantMap: sStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, sStyleVariantKeys)
  },
  getVariantProps: sStyleFn.getVariantProps,
})