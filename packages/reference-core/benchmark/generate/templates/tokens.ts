// Token theme template for bench repos.
// It takes a seeded rng plus the plan and emits the tokens() fragment file.
// Churn names run c000.. and s00..; app names read like a product palette. Samplers
// reference the same names by index, so definitions and references always agree.

import type { LoadPlan } from '../plans.ts'
import { mulberry32, type Rng } from '../rng.ts'
import { uniqueColor } from './style.ts'

export function colorName(index: number): string {
  return `c${String(index).padStart(3, '0')}`
}

export function spaceName(index: number): string {
  return `s${String(index).padStart(2, '0')}`
}

export function tokensFile(rng: Rng, plan: LoadPlan): string {
  const colors: string[] = []
  for (let i = 0; i < plan.tokenColors; i += 1) {
    colors.push(`    ${colorName(i)}: { value: '${uniqueColor(rng)}' },`)
  }
  const spacing: string[] = []
  for (let i = 0; i < plan.tokenSpacing; i += 1) {
    spacing.push(`    ${spaceName(i)}: { value: '${(i + 1) * 0.25}rem' },`)
  }
  return [
    "import { tokens } from '@reference-ui/neo'",
    '',
    'tokens({',
    '  colors: {',
    ...colors,
    '  },',
    '  spacing: {',
    ...spacing,
    '  },',
    '})',
    '',
  ].join('\n')
}

const APP_STANDALONES: readonly string[] = ['white', 'black']

const APP_FAMILIES: readonly string[] = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'brand', 'ink',
  'paper', 'accent', 'muted', 'success', 'warning', 'danger', 'info',
]

const APP_STEPS: readonly number[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

const APP_SPACING: readonly string[] = [
  '0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4',
  '5', '6', '7', '8', '9', '10', '11', '12', '14', '16',
  '20', '24', '28', '32', '36', '40', '44', '48', '52', '56',
  '60', '64', '72', '80', '96', '104', '112', '128', '144', '160',
  '176', '192', '208', '224', '240', '256', '1/2', '1/3', '2/3', '1/4',
  '3/4', 'full', 'screen', 'auto', 'min', 'max', 'fit', 'xs', 'sm', 'md',
  'lg', 'xl', 'gutter', 'safe',
]

export function appColorName(index: number): string {
  if (index < APP_STANDALONES.length) return APP_STANDALONES[index] as string
  const slot = index - APP_STANDALONES.length
  const family = APP_FAMILIES[Math.floor(slot / APP_STEPS.length) % APP_FAMILIES.length] as string
  const step = APP_STEPS[slot % APP_STEPS.length] as number
  return `${family}-${step}`
}

export function appSpaceName(index: number): string {
  return APP_SPACING[index % APP_SPACING.length] as string
}

export function appTokensFile(plan: LoadPlan): string {
  const rng = mulberry32((plan.seed ^ 0x70b3) >>> 0)
  const colors: string[] = []
  for (let i = 0; i < plan.tokenColors; i += 1) {
    colors.push(`    '${appColorName(i)}': { value: '${uniqueColor(rng)}' },`)
  }
  const spacing: string[] = []
  for (let i = 0; i < plan.tokenSpacing; i += 1) {
    spacing.push(`    '${appSpaceName(i)}': { value: '${(i + 1) * 0.25}rem' },`)
  }
  return [
    "import { tokens } from '@reference-ui/neo'",
    '',
    'tokens({',
    '  colors: {',
    ...colors,
    '  },',
    '  spacing: {',
    ...spacing,
    '  },',
    '})',
    '',
  ].join('\n')
}
