// Public surface for the Neo style runtime, served to node as @reference-ui/neo/runtime.
// It takes nothing and re-exports css, recipe, plus plan registration.
// Worlds import the generated bundle while specs import this source entry,
// so the specifier stays put no matter how deep the importing case nests.

export { css, registerRuntimeData, type CssStyles, type SystemStyleObject } from './css/css.ts'
export {
  recipe,
  registerRecipeData,
  type RecipeCompoundConfig,
  type RecipeConfig,
  type RecipeProps,
  type RecipePropValue,
  type RecipeRuntimeFn,
} from './recipe/recipe.ts'
