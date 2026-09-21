// App generator: product-shaped load for the realistic curve.
// It takes a load plan plus a directory and emits components, recipe groups, and dead majority.
// One-off values collide through small Zipf pools: the same white and 16px recur by the thousand.
// Tokens read like a palette, recipes fan variant axes to parts, and most files hold components.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LoadPlan } from '../plans.ts'
import { int, mulberry32, zipfDraw, zipfTable, type Rng, type ZipfTable } from '../rng.ts'
import { componentModule, componentName, type RecipeHookup } from '../templates/component.ts'
import { configFile } from '../templates/config.ts'
import { deadFile } from '../templates/dead.ts'
import { globalFile } from '../templates/global.ts'
import { groupRootName, recipeGroup } from '../templates/recipe.ts'
import { APP_DIALECT, uniqueColor, uniqueSpace, type StyleContext, type ValueSampler } from '../templates/style.ts'
import { appColorName, appSpaceName, appTokensFile } from '../templates/tokens.ts'

export interface AppStats {
  projectDir: string
  styleFiles: number
  deadFiles: number
  cssCalls: number
  recipes: number
}

const HOT_COLORS: readonly string[] = [
  '#ffffff',
  '#000000',
  'white',
  'black',
  'transparent',
  'currentColor',
  '#4f46e5',
  '#0ea5e9',
]

const HOT_SPACING: readonly string[] = ['0', 'auto', '100%', '8px', '16px', '4px', '12px', '24px']

const TAIL_COLORS = 248
const TAIL_SPACING = 40
const ZIPF_SKEW = 1.15
const HOOK_PROB = 0.3

interface OneOffPools {
  colors: readonly string[]
  colorZipf: ZipfTable
  spacing: readonly string[]
  spaceZipf: ZipfTable
}

function buildPools(seed: number): OneOffPools {
  const rng = mulberry32((seed ^ 0x9e37) >>> 0)
  const tailColors: string[] = []
  for (let i = 0; i < TAIL_COLORS; i += 1) tailColors.push(uniqueColor(rng))
  const tailSpacing: string[] = []
  for (let i = 0; i < TAIL_SPACING; i += 1) tailSpacing.push(uniqueSpace(rng))
  const colors = [...HOT_COLORS, ...tailColors]
  const spacing = [...HOT_SPACING, ...tailSpacing]
  return {
    colors,
    colorZipf: zipfTable(colors.length, ZIPF_SKEW),
    spacing,
    spaceZipf: zipfTable(spacing.length, ZIPF_SKEW),
  }
}

function poolDraw(rng: Rng, pool: readonly string[], table: ZipfTable): string {
  return pool[zipfDraw(rng, table)] as string
}

function writeSharded(dir: string, shard: string, name: string, content: string): void {
  const folder = join(dir, 'src', shard)
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, name), content, 'utf-8')
}

function pickHookup(ctx: StyleContext): RecipeHookup | null {
  if (ctx.plan.recipes === 0) return null
  if (ctx.rng() < HOOK_PROB) {
    const group = int(ctx.rng, 0, ctx.plan.recipes - 1)
    return { name: groupRootName(group), path: `../recipes/recipe${group}` }
  }
  return null
}

export function assembleAppRepo(plan: LoadPlan, dir: string): AppStats {
  const pools = buildPools(plan.seed)
  const sampler: ValueSampler = {
    color: (rng, p) => (
      rng() < p.uniqueRatio
        ? poolDraw(rng, pools.colors, pools.colorZipf)
        : appColorName(int(rng, 0, p.tokenColors - 1))
    ),
    space: (rng, p) => (
      rng() < p.uniqueRatio
        ? poolDraw(rng, pools.spacing, pools.spaceZipf)
        : appSpaceName(int(rng, 0, p.tokenSpacing - 1))
    ),
  }
  const ctx: StyleContext = { rng: mulberry32(plan.seed), plan, sampler, dialect: APP_DIALECT }
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), configFile(plan), 'utf-8')
  writeFileSync(join(dir, 'theme', 'tokens.ts'), appTokensFile(plan), 'utf-8')
  writeFileSync(join(dir, 'theme', 'global.ts'), globalFile(), 'utf-8')
  let cssCalls = 0
  for (let i = 0; i < plan.files; i += 1) {
    const shard = `ui${Math.floor(i / 100)}`
    const file = componentModule(ctx, i, pickHookup(ctx))
    cssCalls += file.calls
    writeSharded(dir, shard, `${componentName(i)}.ts`, file.content)
  }
  for (let i = 0; i < plan.recipes; i += 1) {
    writeSharded(dir, 'recipes', `recipe${i}.ts`, recipeGroup(ctx, i))
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
