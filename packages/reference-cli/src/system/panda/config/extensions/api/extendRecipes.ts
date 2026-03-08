import type { Config } from '@pandacss/dev'
import { deepMerge, getPandaConfig, toRecord, type RuntimeStore } from './runtime'

type RecipeConfig = Record<string, unknown>

export function extendRecipes(recipes: RecipeConfig): Partial<Config> {
  if (Object.keys(recipes).length === 0) {
    return getPandaConfig()
  }

  const pandaConfig = getPandaConfig() as RuntimeStore

  pandaConfig.theme = deepMerge({}, toRecord(pandaConfig.theme), {
    recipes,
  })

  return pandaConfig as Partial<Config>
}
