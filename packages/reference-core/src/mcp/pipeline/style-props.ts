import { COLOR_PROP_KEYS } from '../../types/colors'
import type { McpGetStylePropsInput } from './types'

interface StylePropCategory {
  name: string
  description: string
  tokenCategories: string[]
  props: string[]
}

const SPACING_PROPS = [
  'm',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginX',
  'marginY',
  'mt',
  'mr',
  'mb',
  'ml',
  'mx',
  'my',
  'p',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingX',
  'paddingY',
  'pt',
  'pr',
  'pb',
  'pl',
  'px',
  'py',
  'gap',
  'rowGap',
  'columnGap',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
]

const SIZE_PROPS = [
  'w',
  'width',
  'minW',
  'minWidth',
  'maxW',
  'maxWidth',
  'h',
  'height',
  'minH',
  'minHeight',
  'maxH',
  'maxHeight',
  'boxSize',
  'inlineSize',
  'blockSize',
]

const LAYOUT_PROPS = [
  'display',
  'position',
  'overflow',
  'overflowX',
  'overflowY',
  'visibility',
  'zIndex',
  'aspectRatio',
  'objectFit',
  'objectPosition',
]

const FLEX_GRID_PROPS = [
  'alignItems',
  'alignContent',
  'alignSelf',
  'justifyItems',
  'justifyContent',
  'justifySelf',
  'flex',
  'flexBasis',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexWrap',
  'grid',
  'gridArea',
  'gridAutoColumns',
  'gridAutoFlow',
  'gridAutoRows',
  'gridColumn',
  'gridRow',
  'gridTemplateColumns',
  'gridTemplateRows',
]

const TYPOGRAPHY_PROPS = [
  'font',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecoration',
  'textTransform',
  'whiteSpace',
  'wordBreak',
]

const BORDER_PROPS = [
  'border',
  'borderWidth',
  'borderStyle',
  'borderRadius',
  'rounded',
  'roundedTop',
  'roundedRight',
  'roundedBottom',
  'roundedLeft',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
]

const EFFECT_PROPS = [
  'opacity',
  'boxShadow',
  'shadow',
  'filter',
  'backdropFilter',
  'mixBlendMode',
  'transform',
  'transformOrigin',
  'transition',
]

const REFERENCE_PROPS = ['container', 'r', 'css', 'colorMode']

export const STYLE_PROP_CATEGORIES: StylePropCategory[] = [
  {
    name: 'spacing',
    description: 'Margin, padding, gap, and positional distance props.',
    tokenCategories: ['spacing'],
    props: SPACING_PROPS,
  },
  {
    name: 'sizing',
    description: 'Width, height, min/max size, and box size props.',
    tokenCategories: ['sizes', 'spacing'],
    props: SIZE_PROPS,
  },
  {
    name: 'layout',
    description: 'Display, positioning, overflow, object fit, and stacking props.',
    tokenCategories: ['zIndex'],
    props: LAYOUT_PROPS,
  },
  {
    name: 'flex-grid',
    description: 'Flexbox and CSS grid alignment/placement props.',
    tokenCategories: ['spacing', 'sizes'],
    props: FLEX_GRID_PROPS,
  },
  {
    name: 'color',
    description: 'Color-bearing props narrowed to Reference UI color tokens plus safe CSS keywords.',
    tokenCategories: ['colors'],
    props: [...COLOR_PROP_KEYS],
  },
  {
    name: 'typography',
    description: 'Font, text, alignment, and inline text treatment props.',
    tokenCategories: ['fonts', 'fontSizes', 'fontWeights', 'lineHeights', 'letterSpacings'],
    props: TYPOGRAPHY_PROPS,
  },
  {
    name: 'border',
    description: 'Border width/style/radius props and border color props.',
    tokenCategories: ['borders', 'radii', 'colors'],
    props: BORDER_PROPS,
  },
  {
    name: 'effects',
    description: 'Shadow, opacity, filter, transform, and transition props.',
    tokenCategories: ['shadows', 'opacity', 'durations', 'easings'],
    props: EFFECT_PROPS,
  },
  {
    name: 'reference-ui',
    description: 'Reference UI additions layered on top of Panda style props.',
    tokenCategories: ['breakpoints', 'containers', 'fonts'],
    props: REFERENCE_PROPS,
  },
]

const STYLE_PROP_NAMES = new Set(
  STYLE_PROP_CATEGORIES.flatMap(category => category.props)
)

const STYLE_PROP_PATTERNS = [
  /^(?:_)?(?:hover|focus|active|disabled|visited|checked|expanded|open|closed)$/,
  /^(?:margin|padding|border|rounded|grid|flex|align|justify|font|text|box|background|bg)/,
  /(?:Color|Width|Height|Size|Radius|Shadow|Spacing|Gap|Inset|Opacity|Transform|Transition)$/,
  /^Webkit/,
]

export function isStylePropName(name: string): boolean {
  return STYLE_PROP_NAMES.has(name) || STYLE_PROP_PATTERNS.some(pattern => pattern.test(name))
}

export function getStylePropsReference(input: McpGetStylePropsInput = {}) {
  const query = input.query?.trim().toLowerCase()
  const includeProps = input.includeProps ?? false
  const hasExactPropMatch = query
    ? STYLE_PROP_CATEGORIES.some(category =>
        category.props.some(prop => prop.toLowerCase() === query)
      )
    : false
  const categories = STYLE_PROP_CATEGORIES.map(category => {
    const props = query && hasExactPropMatch
      ? category.props.filter(prop => prop.toLowerCase() === query)
      : query
        ? category.props.filter(prop => prop.toLowerCase().includes(query))
        : category.props

    return {
      name: category.name,
      description: category.description,
      tokenCategories: category.tokenCategories,
      ...(includeProps ? { props } : { exampleProps: props.slice(0, 8) }),
    }
  }).filter(category => {
    if (!query) return true
    if (hasExactPropMatch) {
      return 'props' in category
        ? category.props.length > 0
        : category.exampleProps.length > 0
    }
    return (
      category.name.includes(query) ||
      category.description.toLowerCase().includes(query) ||
      category.tokenCategories.some(token => token.toLowerCase().includes(query)) ||
      ('props' in category
        ? category.props.length > 0
        : category.exampleProps.length > 0)
    )
  })

  return {
    description:
      'Reference UI primitives accept Panda-style CSS props through StyleProps. Component responses only point here so inherited CSS-style props are not repeated for every component.',
    valueModel:
      'Most style props accept raw CSS values, token names from compatible categories, responsive objects, and conditional values. Color-bearing props are narrowed to color tokens plus safe CSS keywords.',
    tokenGuidance:
      'Use get_tokens to inspect project token paths and descriptions. Token category compatibility is summarized per style prop category, but a compatible category may be absent in the current project.',
    includeProps,
    ...(hasExactPropMatch && query ? { matchedProp: query } : {}),
    categories,
  }
}
