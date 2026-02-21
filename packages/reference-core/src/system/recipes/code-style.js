import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const codeStyleFn = /* @__PURE__ */ createRecipe('r_code', {}, [])

const codeStyleVariantMap = {}

const codeStyleVariantKeys = Object.keys(codeStyleVariantMap)

export const codeStyle = /* @__PURE__ */ Object.assign(memo(codeStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'codeStyle',
  __getCompoundVariantCss__: codeStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: codeStyleVariantKeys,
  variantMap: codeStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, codeStyleVariantKeys)
  },
  getVariantProps: codeStyleFn.getVariantProps,
})