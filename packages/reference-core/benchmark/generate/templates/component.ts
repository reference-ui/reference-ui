// Component template for bench repos.
// It takes a style context, a file index, and an optional recipe hookup.
// Each file exports one function scoping a few css() calls, plus one recipe call on some.
// Calls stay static literals in function bodies: colocated like product code, still extractable.

import { int } from '../rng.ts'
import { styleObject, type StyleContext } from './style.ts'

export interface RecipeHookup {
  name: string
  path: string
}

export interface ComponentModule {
  content: string
  calls: number
}

const COMPONENT_NAMES: readonly string[] = [
  'Card',
  'Panel',
  'Button',
  'Dialog',
  'Menu',
  'Badge',
  'Avatar',
  'Banner',
  'Input',
  'Select',
]

const PART_NAMES: readonly string[] = ['root', 'title', 'body', 'icon', 'foot']

export function componentName(index: number): string {
  return `${COMPONENT_NAMES[index % COMPONENT_NAMES.length] as string}${index}`
}

export function componentModule(
  ctx: StyleContext,
  index: number,
  hookup: RecipeHookup | null,
): ComponentModule {
  const name = componentName(index)
  const calls = int(ctx.rng, ctx.plan.minCalls, ctx.plan.maxCalls)
  const lines = ["import { css } from '@reference-ui/react'"]
  if (hookup) lines.push(`import { ${hookup.name} } from '${hookup.path}'`)
  lines.push('', `export function ${name}(props: { tone: string }): string {`)
  const bound: string[] = []
  for (let i = 0; i < calls; i += 1) {
    const part = `${PART_NAMES[i % PART_NAMES.length] as string}${i}`
    lines.push(`  const ${part} = css(${styleObject(ctx)})`)
    bound.push(part)
  }
  if (hookup) {
    lines.push(`  const tone = ${hookup.name}({ tone: 'muted', size: 'md' })`)
    bound.push('tone')
  }
  lines.push(`  return [${bound.join(', ')}, props.tone].join(' ')`, '}', '')
  return { content: `${lines.join('\n')}\n`, calls }
}
