import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const varFn = /* @__PURE__ */ createRecipe('r_var', {}, [])

const varVariantMap = {}

const varVariantKeys = Object.keys(varVariantMap)

export const var = /* @__PURE__ */ Object.assign(memo(varFn.recipeFn), {
  __recipe__: true,
  __name__: 'var',
  __getCompoundVariantCss__: varFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: varVariantKeys,
  variantMap: varVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, varVariantKeys)
  },
  getVariantProps: varFn.getVariantProps,
})