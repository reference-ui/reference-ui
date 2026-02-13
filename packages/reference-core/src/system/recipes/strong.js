import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const strongFn = /* @__PURE__ */ createRecipe('r_strong', {}, [])

const strongVariantMap = {}

const strongVariantKeys = Object.keys(strongVariantMap)

export const strong = /* @__PURE__ */ Object.assign(memo(strongFn.recipeFn), {
  __recipe__: true,
  __name__: 'strong',
  __getCompoundVariantCss__: strongFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: strongVariantKeys,
  variantMap: strongVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, strongVariantKeys)
  },
  getVariantProps: strongFn.getVariantProps,
})