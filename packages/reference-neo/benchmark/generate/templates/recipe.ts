// Recipe template for bench repos.
// It takes a style context plus a recipe index and emits recipe definitions.
// The simple shape carries base plus tone/size axes: small, uniform, easy to count.
// Groups read like slot recipes: one root plus two or three parts fanning the same axes.

import { int } from '../rng.ts'
import { styleObject, type StyleContext } from './style.ts'

export function recipeModule(ctx: StyleContext, index: number): string {
  const { rng, plan, sampler } = ctx
  const tones = ['accent', 'muted', 'plain'].map(
    (tone) => `${tone}: { color: '${sampler.color(rng, plan)}' }`,
  )
  const sizes = ['sm', 'md', 'lg'].map(
    (size) => `${size}: { p: '${sampler.space(rng, plan)}' }`,
  )
  return [
    "import { recipe } from '@reference-ui/react'",
    '',
    `export const comp${index} = recipe({`,
    `  className: 'comp${index}',`,
    `  base: ${styleObject(ctx)},`,
    '  variants: {',
    `    tone: { ${tones.join(', ')} },`,
    `    size: { ${sizes.join(', ')} },`,
    '  },',
    "  defaultVariants: { tone: 'muted', size: 'md' },",
    '})',
    '',
  ].join('\n')
}

const GROUP_BASES: readonly string[] = [
  'dialog',
  'menu',
  'card',
  'popover',
  'toast',
  'tabs',
  'accordion',
  'tooltip',
  'badge',
  'banner',
]

const GROUP_PARTS: readonly string[] = ['Header', 'Body', 'Footer']

const GROUP_AXES: ReadonlyArray<{ axis: string; options: readonly string[] }> = [
  { axis: 'tone', options: ['accent', 'muted', 'plain'] },
  { axis: 'size', options: ['sm', 'md', 'lg'] },
  { axis: 'mood', options: ['info', 'danger'] },
  { axis: 'density', options: ['tight', 'loose'] },
]

export function groupRootName(index: number): string {
  return `${GROUP_BASES[index % GROUP_BASES.length] as string}${index}`
}

function axisBlock(ctx: StyleContext, options: readonly string[]): string {
  return options.map((option) => `${option}: ${styleObject(ctx)}`).join(', ')
}

function compoundBlock(ctx: StyleContext): string {
  const first = int(ctx.rng, 0, 1) === 0
    ? "{ tone: 'accent', size: 'lg'"
    : "{ mood: 'danger', size: 'sm'"
  return `${first}, css: ${styleObject(ctx)} }`
}

function groupRecipe(ctx: StyleContext, name: string, axes: number): string {
  const variants = GROUP_AXES.slice(0, axes).map(
    ({ axis, options }) => `    ${axis}: { ${axisBlock(ctx, options)} },`,
  )
  const defaults = GROUP_AXES.slice(0, axes).map(
    ({ axis, options }) => `${axis}: '${options[1] as string}'`,
  )
  return [
    `export const ${name} = recipe({`,
    `  className: '${name}',`,
    `  base: ${styleObject(ctx)},`,
    '  variants: {',
    ...variants,
    '  },',
    `  defaultVariants: { ${defaults.join(', ')} },`,
    `  compoundVariants: [${compoundBlock(ctx)}, ${compoundBlock(ctx)}],`,
    '})',
    '',
  ].join('\n')
}

export function recipeGroup(ctx: StyleContext, index: number): string {
  const root = groupRootName(index)
  const axes = index % 2 === 0 ? 4 : 3
  const parts = GROUP_PARTS.slice(0, index % 3 === 0 ? 2 : 3)
  const lines = ["import { recipe } from '@reference-ui/react'", '']
  lines.push(groupRecipe(ctx, root, axes))
  for (const part of parts) lines.push(groupRecipe(ctx, `${root}${part}`, axes))
  return `${lines.join('\n')}`
}
