import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const kbdStyleFn = /* @__PURE__ */ createRecipe('r_kbd', {}, [])

const kbdStyleVariantMap = {}

const kbdStyleVariantKeys = Object.keys(kbdStyleVariantMap)

export const kbdStyle = /* @__PURE__ */ Object.assign(memo(kbdStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'kbdStyle',
  __getCompoundVariantCss__: kbdStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: kbdStyleVariantKeys,
  variantMap: kbdStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, kbdStyleVariantKeys)
  },
  getVariantProps: kbdStyleFn.getVariantProps,
})