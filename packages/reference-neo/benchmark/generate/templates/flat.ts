// Flat style-module template for bench repos.
// It takes a style context plus a file index and emits top-level css() exports.
// Each file holds a plan-sized run of styleN_M constants: dense, flat, no components.

import { int } from '../rng.ts'
import { styleObject, type StyleContext } from './style.ts'

export interface FlatModule {
  content: string
  calls: number
}

function cssCall(ctx: StyleContext, name: string): string {
  return `export const ${name} = css(${styleObject(ctx)})\n`
}

export function flatModule(ctx: StyleContext, index: number): FlatModule {
  const calls = int(ctx.rng, ctx.plan.minCalls, ctx.plan.maxCalls)
  const lines = ["import { css } from '@reference-ui/react'", '']
  for (let i = 0; i < calls; i += 1) lines.push(cssCall(ctx, `style${index}_${i}`))
  return { content: `${lines.join('\n')}\n`, calls }
}
