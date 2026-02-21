import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const markStyleFn = /* @__PURE__ */ createRecipe('r_mark', {}, [])

const markStyleVariantMap = {}

const markStyleVariantKeys = Object.keys(markStyleVariantMap)

export const markStyle = /* @__PURE__ */ Object.assign(memo(markStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'markStyle',
  __getCompoundVariantCss__: markStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: markStyleVariantKeys,
  variantMap: markStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, markStyleVariantKeys)
  },
  getVariantProps: markStyleFn.getVariantProps,
})