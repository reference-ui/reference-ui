import {
  isWholeShorthandValue,
  parseShorthandTokens,
  resolveShorthandColor,
  splitShorthandTokens,
  type TransformContext,
} from './parser'

export interface ShorthandConfig {
  shorthand?: string | string[]
  className: string
  values?: string
  group?: string
  mainProp: string
  widthProp: string
  styleProp: string
  colorProp: string
  isOutline?: boolean
  noneValue?: Record<string, string | number> | string
}

/**
 * High-integrity factory for CSS shorthand decomposition in atomic CSS.
 *
 * Decomposes multi-property shorthands (border, outline) into orthogonal
 * width and style longhands to prevent CSS shorthand reset of omitted
 * color properties to initial values (currentColor).
 */
export function createShorthandUtility(cfg: ShorthandConfig) {
  const values = cfg.values ?? 'borders'
  const group = cfg.group ?? 'Border'

  return {
    shorthand: cfg.shorthand,
    className: cfg.className,
    values,
    group,
    transform: (value: unknown, args: TransformContext) => {
      const raw = typeof args.raw === 'string' ? args.raw : value

      // 1. Zero check (0, '0', '0px', '0rem', etc.)
      if (
        raw === 0 ||
        raw === '0' ||
        (typeof raw === 'string' && /^0(px|rem|em|%)?$/.test(raw.trim()))
      ) {
        return { [cfg.widthProp]: '0px' }
      }

      // 2. Non-string passthrough (objects, numbers)
      if (typeof raw !== 'string') {
        return { [cfg.mainProp]: value as string | number }
      }

      const trimmed = raw.trim()

      // 3. 'none' handling (custom accessible fallback or 'none')
      if (trimmed === 'none') {
        if (cfg.noneValue !== undefined) {
          return typeof cfg.noneValue === 'string'
            ? { [cfg.mainProp]: cfg.noneValue }
            : cfg.noneValue
        }
        return { [cfg.mainProp]: 'none' }
      }

      // 4. Whole-value passthrough (variables, global keywords, tokens)
      if (isWholeShorthandValue(trimmed)) {
        return { [cfg.mainProp]: value as string | number }
      }

      // 5. Tokenize with paren-depth preservation
      const tokens = splitShorthandTokens(trimmed)
      if (tokens.length === 0) {
        return { [cfg.mainProp]: value as string | number }
      }

      // 6. Semantic classification
      const { width, style, color } = parseShorthandTokens(tokens, {
        isOutline: cfg.isOutline,
      })

      if (!style && !width && !color) {
        return { [cfg.mainProp]: value as string | number }
      }

      // 7. Decomposed output
      const result: Record<string, string | number> = {}

      if (width) {
        result[cfg.widthProp] = width
      }
      if (style) {
        result[cfg.styleProp] = style
      }
      if (color) {
        result[cfg.colorProp] = resolveShorthandColor(color, args)
      }

      return result
    },
  }
}
