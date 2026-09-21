// Shared style-literal builders for bench templates.
// They take a style context (seeded rng, plan, value sampler) and emit static object text.
// Every value is a static literal: extraction reads literal calls, never variables.
// The sampler decides token-vs-one-off per generator; the object shapes stay shared.

import type { LoadPlan } from '../plans.ts'
import { int, pick, type Rng } from '../rng.ts'

export interface ValueSampler {
  color(rng: Rng, plan: LoadPlan): string
  space(rng: Rng, plan: LoadPlan): string
}

export interface Dialect {
  colorProps: readonly string[]
  spaceProps: readonly string[]
  plainProps: readonly string[]
  plainValues: readonly string[]
  nesting: boolean
  responsive: 'duo' | 'full'
}

export interface StyleContext {
  rng: Rng
  plan: LoadPlan
  sampler: ValueSampler
  dialect?: Dialect
}

const COLOR_PROPS: readonly string[] = [
  'color',
  'backgroundColor',
  'borderColor',
  'outlineColor',
  'textDecorationColor',
]

const SPACE_PROPS: readonly string[] = ['p', 'px', 'py', 'm', 'mx', 'my', 'gap', 'top', 'left']

const PLAIN_PROPS: readonly string[] = [
  'display',
  'position',
  'fontWeight',
  'textAlign',
  'overflow',
  'cursor',
  'zIndex',
  'opacity',
]

const PLAIN_VALUES: readonly string[] = [
  'flex',
  'block',
  'relative',
  'absolute',
  'bold',
  'center',
  'hidden',
  'pointer',
]

const CONDITIONS: readonly string[] = [
  '_hover',
  '_dark',
  '_focus',
  '_focusVisible',
  '_active',
  '_disabled',
]

const APP_COLOR_PROPS: readonly string[] = [
  ...COLOR_PROPS,
  'background',
  'borderTopColor',
  'borderBottomColor',
  'caretColor',
  'accentColor',
  'fill',
  'stroke',
]

const APP_SPACE_PROPS: readonly string[] = [
  ...SPACE_PROPS,
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'fontSize',
  'borderWidth',
  'borderRadius',
  'flexBasis',
  'right',
  'bottom',
]

const APP_PLAIN_PROPS: readonly string[] = [
  ...PLAIN_PROPS,
  'flexDirection',
  'justifyContent',
  'alignItems',
  'flexWrap',
  'textTransform',
  'fontStyle',
  'borderStyle',
]

const APP_PLAIN_VALUES: readonly string[] = [
  ...PLAIN_VALUES,
  'column',
  'row',
  'space-between',
  'wrap',
  'uppercase',
  'italic',
  'solid',
  'nowrap',
]

const CHURN_DIALECT: Dialect = {
  colorProps: COLOR_PROPS,
  spaceProps: SPACE_PROPS,
  plainProps: PLAIN_PROPS,
  plainValues: PLAIN_VALUES,
  nesting: false,
  responsive: 'duo',
}

export const APP_DIALECT: Dialect = {
  colorProps: APP_COLOR_PROPS,
  spaceProps: APP_SPACE_PROPS,
  plainProps: APP_PLAIN_PROPS,
  plainValues: APP_PLAIN_VALUES,
  nesting: true,
  responsive: 'full',
}

const NEST_PROB = 0.3

function hexByte(rng: Rng): string {
  return int(rng, 0, 255).toString(16).padStart(2, '0')
}

export function uniqueColor(rng: Rng): string {
  return `#${hexByte(rng)}${hexByte(rng)}${hexByte(rng)}`
}

export function uniqueSpace(rng: Rng): string {
  const shape = rng()
  if (shape < 0.5) return `${int(rng, 1, 96)}px`
  if (shape < 0.8) return `${(int(rng, 1, 64) / 4).toFixed(2)}rem`
  return `${int(rng, 1, 100)}%`
}

function fullResponsive(ctx: StyleContext, value: string, spaced: boolean): string {
  const { rng, plan, sampler } = ctx
  const next = (): string => (spaced ? sampler.space(rng, plan) : sampler.color(rng, plan))
  const form = int(rng, 0, 2)
  if (form === 0) return `['${value}', '${next()}']`
  if (form === 1) return `{ base: '${value}', md: '${next()}' }`
  return `{ base: '${value}', sm: '${next()}', md: '${next()}', lg: '${next()}' }`
}

function responsiveWrap(ctx: StyleContext, value: string, spaced: boolean): string {
  const { rng, plan, sampler } = ctx
  const roll = rng()
  if (roll >= plan.responsiveRatio) return `'${value}'`
  if ((ctx.dialect ?? CHURN_DIALECT).responsive === 'full') return fullResponsive(ctx, value, spaced)
  if (rng() < 0.5) {
    const second = spaced ? sampler.space(rng, plan) : sampler.color(rng, plan)
    return `['${value}', '${second}']`
  }
  const second = spaced ? sampler.space(rng, plan) : sampler.color(rng, plan)
  return `{ base: '${value}', md: '${second}' }`
}

function declaration(ctx: StyleContext): string {
  const { rng, plan, sampler } = ctx
  const d = ctx.dialect ?? CHURN_DIALECT
  const roll = rng()
  if (roll < 0.4) {
    const prop = pick(rng, d.colorProps)
    return `${prop}: ${responsiveWrap(ctx, sampler.color(rng, plan), false)}`
  }
  if (roll < 0.75) {
    const prop = pick(rng, d.spaceProps)
    return `${prop}: ${responsiveWrap(ctx, sampler.space(rng, plan), true)}`
  }
  return `${pick(rng, d.plainProps)}: '${pick(rng, d.plainValues)}'`
}

function nestedBlock(ctx: StyleContext): string {
  const outer = pick(ctx.rng, CONDITIONS)
  const innerName = outer === '_hover' ? '_dark' : pick(ctx.rng, CONDITIONS)
  const nested = `${innerName}: { ${declaration(ctx)}, ${declaration(ctx)} }`
  return `${outer}: { ${declaration(ctx)}, ${nested} }`
}

function conditionBlock(ctx: StyleContext): string {
  if ((ctx.dialect ?? CHURN_DIALECT).nesting && ctx.rng() < NEST_PROB) return nestedBlock(ctx)
  const inner = [declaration(ctx), declaration(ctx)].join(', ')
  return `${pick(ctx.rng, CONDITIONS)}: { ${inner} }`
}

export function styleObject(ctx: StyleContext): string {
  const { rng, plan } = ctx
  const parts: string[] = []
  const count = int(rng, 2, 5)
  for (let i = 0; i < count; i += 1) parts.push(declaration(ctx))
  if (rng() < plan.conditionRatio) parts.push(conditionBlock(ctx))
  if (rng() < plan.conditionRatio / 2) parts.push(conditionBlock(ctx))
  return `{ ${parts.join(', ')} }`
}
