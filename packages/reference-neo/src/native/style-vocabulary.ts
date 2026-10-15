// Style-prop vocabulary for the MCP, read from Neo's committed primitives shelf.
// It takes the shelf's vocabulary.json and emits STYLE_PROP_NAMES, RESERVED_PROP_NAMES
// and isStylePropName: the shelf's stylePropNames plus the font, weight and css props,
// with condition arms recognised by the prefixes its conditionRule names. Reserved
// keys are never style props, except css, which the generated StyleProps type accepts
// even though the shelf lists it as reserved.

import vocabulary from './generated/primitives/vocabulary.json' with { type: 'json' }

/** Props the generated StyleProps type adds beyond the shelf's stylePropNames. */
const MACRO_STYLE_PROP_NAMES: readonly string[] = ['font', 'weight', 'css']

/** The one reserved key that still counts as a style prop. */
const RESERVED_STYLE_PROP_EXCEPTION = 'css'

interface ShelfFields {
  stylePropNames?: unknown
  reserved?: unknown
  conditionRule?: unknown
}

function isNonEmptyString(item: unknown): item is string {
  return typeof item === 'string' && item.length > 0
}

function readStrings(list: unknown, key: string): string[] {
  if (!Array.isArray(list) || !list.every(isNonEmptyString)) {
    throw new Error(`[style-vocabulary] E1 vocabulary.json carries no usable ${key} list`)
  }
  return list
}

/** Reads the prefixes from prose such as "Keys starting with `_`, `&`, or `@` resolve ...". */
function readConditionPrefixes(rule: unknown): string[] {
  if (typeof rule !== 'string') {
    throw new Error('[style-vocabulary] E1 vocabulary.json carries no conditionRule string')
  }
  const clause = /starting with (.*?) resolve/.exec(rule)?.[1] ?? ''
  const prefixes = [...clause.matchAll(/`([^`A-Za-z0-9])`/g)].flatMap(match =>
    match[1] ? [match[1]] : []
  )
  if (prefixes.length === 0) {
    throw new Error('[style-vocabulary] E1 conditionRule names no condition prefix')
  }
  return prefixes
}

const shelf: ShelfFields = vocabulary

/** Style prop names: the shelf's stylePropNames plus the macro props. */
export const STYLE_PROP_NAMES: ReadonlySet<string> = new Set([
  ...readStrings(shelf.stylePropNames, 'stylePropNames'),
  ...MACRO_STYLE_PROP_NAMES,
])

/** Reserved keys from the shelf. css is listed here; isStylePropName carves it back out. */
export const RESERVED_PROP_NAMES: ReadonlySet<string> = new Set(
  readStrings(shelf.reserved, 'reserved')
)

const CONDITION_PREFIXES: readonly string[] = readConditionPrefixes(shelf.conditionRule)

/** Vocabulary-only verdict: reserved keys are out except css; style names and condition arms are in. */
export function isStylePropName(name: string): boolean {
  if (RESERVED_PROP_NAMES.has(name) && name !== RESERVED_STYLE_PROP_EXCEPTION) return false
  return STYLE_PROP_NAMES.has(name) || CONDITION_PREFIXES.some(prefix => name.startsWith(prefix))
}
