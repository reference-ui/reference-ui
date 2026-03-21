/**
 * Value-derived resolution scenario for keyof/typeof/indexed access/template literals.
 */

const intents = {
  primary: 'blue',
  danger: 'red',
} as const

const sizes = ['sm', 'md', 'lg'] as const

export type IntentKey = keyof typeof intents
export type IntentValue = (typeof intents)[keyof typeof intents]
export type SizeValue = (typeof sizes)[number]
export type ToneLabel = `tone-${(typeof sizes)[number]}`
export type Variant = 'solid' | 'ghost' | 'outline'
export type VariantTone = `tone-${Variant}`
export type IntentFromInterface = WithValueResolution['intent']

export interface WithValueResolution {
  intent: keyof typeof intents
  value: (typeof intents)[keyof typeof intents]
  size: (typeof sizes)[number]
  tone: `tone-${(typeof sizes)[number]}`
}
