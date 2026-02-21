import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const fontStyleFn = /* @__PURE__ */ createRecipe('r_font', {}, [])

const fontStyleVariantMap = {
  "font": [
    "sans",
    "serif",
    "mono"
  ]
}

const fontStyleVariantKeys = Object.keys(fontStyleVariantMap)

export const fontStyle = /* @__PURE__ */ Object.assign(memo(fontStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'fontStyle',
  __getCompoundVariantCss__: fontStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: fontStyleVariantKeys,
  variantMap: fontStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, fontStyleVariantKeys)
  },
  getVariantProps: fontStyleFn.getVariantProps,
})