import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const abbrStyleFn = /* @__PURE__ */ createRecipe('r_abbr', {}, [])

const abbrStyleVariantMap = {}

const abbrStyleVariantKeys = Object.keys(abbrStyleVariantMap)

export const abbrStyle = /* @__PURE__ */ Object.assign(memo(abbrStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'abbrStyle',
  __getCompoundVariantCss__: abbrStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: abbrStyleVariantKeys,
  variantMap: abbrStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, abbrStyleVariantKeys)
  },
  getVariantProps: abbrStyleFn.getVariantProps,
})