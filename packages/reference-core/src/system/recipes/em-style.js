import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const emStyleFn = /* @__PURE__ */ createRecipe('r_em', {}, [])

const emStyleVariantMap = {}

const emStyleVariantKeys = Object.keys(emStyleVariantMap)

export const emStyle = /* @__PURE__ */ Object.assign(memo(emStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'emStyle',
  __getCompoundVariantCss__: emStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: emStyleVariantKeys,
  variantMap: emStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, emStyleVariantKeys)
  },
  getVariantProps: emStyleFn.getVariantProps,
})