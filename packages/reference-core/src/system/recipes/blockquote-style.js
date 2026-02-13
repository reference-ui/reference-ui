import { memo, splitProps } from '../helpers.js';
import { createRecipe, mergeRecipes } from './create-recipe.js';

const blockquoteStyleFn = /* @__PURE__ */ createRecipe('r_blockquote', {}, [])

const blockquoteStyleVariantMap = {}

const blockquoteStyleVariantKeys = Object.keys(blockquoteStyleVariantMap)

export const blockquoteStyle = /* @__PURE__ */ Object.assign(memo(blockquoteStyleFn.recipeFn), {
  __recipe__: true,
  __name__: 'blockquoteStyle',
  __getCompoundVariantCss__: blockquoteStyleFn.__getCompoundVariantCss__,
  raw: (props) => props,
  variantKeys: blockquoteStyleVariantKeys,
  variantMap: blockquoteStyleVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, blockquoteStyleVariantKeys)
  },
  getVariantProps: blockquoteStyleFn.getVariantProps,
})