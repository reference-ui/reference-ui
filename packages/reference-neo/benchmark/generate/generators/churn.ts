// Churn generator: namer and atom-table stress, not an app.
// It takes a load plan plus a directory and emits flat utility dumps.
// Every one-off value draws a fresh hex, so uniqueness climbs with file count.
// Keep it for compiler fuzz; reach for the app generator for product-shaped load.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LoadPlan } from '../plans.ts'
import { int, mulberry32, type Rng } from '../rng.ts'
import { configFile } from '../templates/config.ts'
import { deadFile } from '../templates/dead.ts'
import { flatModule } from '../templates/flat.ts'
import { globalFile } from '../templates/global.ts'
import { recipeModule } from '../templates/recipe.ts'
import { uniqueColor, uniqueSpace, type StyleContext, type ValueSampler } from '../templates/style.ts'
import { colorName, spaceName, tokensFile } from '../templates/tokens.ts'

export interface ChurnStats {
  projectDir: string
  styleFiles: number
  deadFiles: number
  cssCalls: number
  recipes: number
}

function tokenColor(rng: Rng, plan: LoadPlan): string {
  return colorName(int(rng, 0, plan.tokenColors - 1))
}

function tokenSpace(rng: Rng, plan: LoadPlan): string {
  return spaceName(int(rng, 0, plan.tokenSpacing - 1))
}

const sampler: ValueSampler = {
  color: (rng, plan) => (rng() < plan.uniqueRatio ? uniqueColor(rng) : tokenColor(rng, plan)),
  space: (rng, plan) => (rng() < plan.uniqueRatio ? uniqueSpace(rng) : tokenSpace(rng, plan)),
}

function writeSharded(dir: string, shard: string, name: string, content: string): void {
  const folder = join(dir, 'src', shard)
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, name), content, 'utf-8')
}

export function assembleChurnRepo(plan: LoadPlan, dir: string): ChurnStats {
  const rng = mulberry32(plan.seed)
  const ctx: StyleContext = { rng, plan, sampler }
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), configFile(plan), 'utf-8')
  writeFileSync(join(dir, 'theme', 'tokens.ts'), tokensFile(rng, plan), 'utf-8')
  writeFileSync(join(dir, 'theme', 'global.ts'), globalFile(), 'utf-8')
  let cssCalls = 0
  for (let i = 0; i < plan.files; i += 1) {
    const shard = `feat${Math.floor(i / 100)}`
    const file = flatModule(ctx, i)
    cssCalls += file.calls
    writeSharded(dir, shard, `mod${i}.ts`, file.content)
  }
  for (let i = 0; i < plan.recipes; i += 1) {
    writeSharded(dir, 'recipes', `recipe${i}.ts`, recipeModule(ctx, i))
  }
  for (let i = 0; i < plan.deadFiles; i += 1) {
    writeSharded(dir, 'util', `util${i}.ts`, deadFile(i))
  }
  return {
    projectDir: dir,
    styleFiles: plan.files,
    deadFiles: plan.deadFiles,
    cssCalls,
    recipes: plan.recipes,
  }
}
