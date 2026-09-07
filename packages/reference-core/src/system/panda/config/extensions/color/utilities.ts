/**
 * Color utility transforms: normalize token paths so that both canonical tokens
 * (`gray.850`) and category-prefixed paths (`colors.gray.850`) resolve to CSS variables
 * via Panda's token dictionary rather than leaking raw invalid property declarations.
 */

const CSS_COLOR_KEYWORDS = new Set([
  'currentcolor',
  'inherit',
  'initial',
  'revert',
  'revert-layer',
  'unset',
  'transparent',
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
])

export function resolveColorToken(
  value: unknown,
  args?: {
    token?: (path: string) => string | undefined
    raw?: unknown
  },
): string | unknown {
  if (typeof value === 'string') {
    // Category-prefixed token (e.g. 'colors.blue.600', 'colors.white')
    if (value.startsWith('colors.')) {
      const stripped = value.slice(7)
      const resolved = args?.token?.(value) ?? args?.token?.(`colors.${stripped}`) ?? args?.token?.(stripped)
      if (resolved) {
        return resolved
      }

      // Check for CSS standard color keywords (e.g. 'colors.white' -> 'white')
      if (CSS_COLOR_KEYWORDS.has(stripped.toLowerCase())) {
        return stripped
      }

      // If it looks like a token scale (e.g. 'colors.gray.850'), map to safe CSS var
      if (/^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i.test(stripped)) {
        const varName = '--colors-' + stripped.replace(/\./g, '-')
        return `var(${varName})`
      }

      return stripped
    }

    // Canonical token without prefix (e.g. 'blue.600')
    const resolved = args?.token?.(`colors.${value}`) ?? args?.token?.(value)
    if (resolved) {
      return resolved
    }
  }

  return value
}

export function createColorMixTransform(prop: string) {
  return (
    value: unknown,
    args: {
      token: (path: string) => string | undefined
      raw?: unknown
      utils?: {
        colorMix: (val: unknown) => { invalid: boolean; value: string; color: string }
      }
    },
  ) => {
    if (typeof value === 'string') {
      // 1. Slash-notation color mixing (e.g. 'colors.blue.600/20' or 'blue.600/20')
      if (value.includes('/')) {
        const normalized = value.startsWith('colors.') ? value.slice(7) : value
        const mix = args?.utils?.colorMix ? args.utils.colorMix(normalized) : undefined
        if (mix && !mix.invalid) {
          const cssVar = '--mix-' + prop
          return {
            [cssVar]: mix.value,
            [prop]: `var(${cssVar}, ${mix.color})`,
          }
        }
      }

      const resolved = resolveColorToken(value, args)
      if (resolved !== value) {
        return { [prop]: resolved }
      }
    }

    // Raw CSS value, hex, rgba, or already resolved var(--...)
    return { [prop]: value }
  }
}

export const colorUtilities = {
  background: {
    shorthand: 'bg',
    className: 'bg',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('background'),
  },
  backgroundColor: {
    shorthand: 'bgColor',
    className: 'bg-c',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('backgroundColor'),
  },
  borderColor: {
    shorthand: 'borderC',
    className: 'bd-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderColor'),
  },
  borderInlineColor: {
    shorthand: 'borderXC',
    className: 'bd-x-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderInlineColor'),
  },
  borderBlockColor: {
    shorthand: 'borderYC',
    className: 'bd-y-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockColor'),
  },
  borderLeftColor: {
    className: 'bd-l-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderLeftColor'),
  },
  borderInlineStartColor: {
    shorthand: 'borderStartC',
    className: 'bd-s-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderInlineStartColor'),
  },
  borderRightColor: {
    className: 'bd-r-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderRightColor'),
  },
  borderInlineEndColor: {
    shorthand: 'borderEndC',
    className: 'bd-e-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderInlineEndColor'),
  },
  borderTopColor: {
    className: 'bd-t-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderTopColor'),
  },
  borderBottomColor: {
    className: 'bd-b-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBottomColor'),
  },
  borderBlockEndColor: {
    className: 'bd-be-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockEndColor'),
  },
  borderBlockStartColor: {
    className: 'bd-bs-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockStartColor'),
  },
  color: {
    shorthand: 'c',
    className: 'c',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('color'),
  },
  fill: {
    className: 'fill',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('fill'),
  },
  stroke: {
    className: 'stroke',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('stroke'),
  },
  outlineColor: {
    shorthand: 'ringColor',
    className: 'ring-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('outlineColor'),
  },
  accentColor: {
    className: 'accent-c',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('accentColor'),
  },
  caretColor: {
    className: 'caret-c',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('caretColor'),
  },
  textDecorationColor: {
    className: 'text-decor-c',
    values: 'colors',
    group: 'Typography',
    transform: createColorMixTransform('textDecorationColor'),
  },
  textEmphasisColor: {
    className: 'text-emphasis-c',
    values: 'colors',
    group: 'Typography',
    transform: createColorMixTransform('textEmphasisColor'),
  },
  divideColor: {
    className: 'divide-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderColor'),
  },
  scrollbarColor: {
    className: 'scrollbar-c',
    values: 'colors',
    group: 'Scrollbar',
    transform: createColorMixTransform('scrollbarColor'),
  },
}
