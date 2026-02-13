import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const abbrFn = /* @__PURE__ */ createRecipe('r_abbr', {}, [])

const abbrVariantMap = {}

const abbrVariantKeys = Object.keys(abbrVariantMap)

export const abbr = /* @__PURE__ */ Object.assign(memo(abbrFn.recipeFn), {
  __recipe__: true,
  __name__: 'abbr',
  __getCompoundVariantCss__: abbrFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: abbrVariantKeys,
  variantMap: abbrVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, abbrVariantKeys)
  },
  getVariantProps: abbrFn.getVariantProps,
})