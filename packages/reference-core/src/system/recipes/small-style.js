import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const smallStyleFn = /* @__PURE__ */ createRecipe('r_small', {}, [])

const smallStyleVariantMap = {}

const smallStyleVariantKeys = Object.keys(smallStyleVariantMap)

export const smallStyle = /* @__PURE__ */ Object.assign(memo(smallStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'smallStyle',
  __getCompoundVariantCss__: smallStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: smallStyleVariantKeys,
  variantMap: smallStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, smallStyleVariantKeys)
  },
  getVariantProps: smallStyleFn.getVariantProps,
})