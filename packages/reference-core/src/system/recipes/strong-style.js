import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const strongStyleFn = /* @__PURE__ */ createRecipe('r_strong', {}, [])

const strongStyleVariantMap = {}

const strongStyleVariantKeys = Object.keys(strongStyleVariantMap)

export const strongStyle = /* @__PURE__ */ Object.assign(memo(strongStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'strongStyle',
  __getCompoundVariantCss__: strongStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: strongStyleVariantKeys,
  variantMap: strongStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, strongStyleVariantKeys)
  },
  getVariantProps: strongStyleFn.getVariantProps,
})