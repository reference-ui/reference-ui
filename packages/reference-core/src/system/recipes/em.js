import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const emFn = /* @__PURE__ */ createRecipe('r_em', {}, [])

const emVariantMap = {}

const emVariantKeys = Object.keys(emVariantMap)

export const em = /* @__PURE__ */ Object.assign(memo(emFn.recipeFn), {
  __recipe__: true,
  __name__: 'em',
  __getCompoundVariantCss__: emFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: emVariantKeys,
  variantMap: emVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, emVariantKeys)
  },
  getVariantProps: emFn.getVariantProps,
})