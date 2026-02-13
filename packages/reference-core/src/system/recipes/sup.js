import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const supFn = /* @__PURE__ */ createRecipe('r_sup', {}, [])

const supVariantMap = {}

const supVariantKeys = Object.keys(supVariantMap)

export const sup = /* @__PURE__ */ Object.assign(memo(supFn.recipeFn), {
  __recipe__: true,
  __name__: 'sup',
  __getCompoundVariantCss__: supFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: supVariantKeys,
  variantMap: supVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, supVariantKeys)
  },
  getVariantProps: supFn.getVariantProps,
})