import type { ComponentProp, ObservedElement } from '@reference-ui/rust/atlas'
import { TAGS } from './constants'
import type { McpComponent, McpComponentProp } from './types'
import { isStylePropName } from './style-props'

const COMMON_PRIMITIVES = [
  'Div',
  'Section',
  'Main',
  'Article',
  'Header',
  'Footer',
  'P',
  'H1',
  'H2',
  'H3',
  'A',
  'Button',
  'Span',
  'Img',
] as const

const STYLE_PROP_VALUE_STRING = 'StylePropValue<string>'

function toPrimitiveName(tag: string): string {
  if (tag === 'object') return 'Obj'
  if (tag === 'var') return 'Var'
  if (tag.length <= 1) return tag.toUpperCase()
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

function primitiveProp(
  name: string,
  type: string,
  description: string,
  styleProp = false
): McpComponentProp {
  return {
    name,
    count: 0,
    usage: 'unused',
    type,
    description,
    optional: true,
    readonly: false,
    origin: 'documented',
    styleProp,
  }
}

const PRIMITIVE_STYLE_PROPS = [
  primitiveProp('css', 'SystemStyleObject', 'Escape hatch for nested Panda style objects.', true),
  primitiveProp('container', 'boolean | string', 'Creates an inline-size container query context.', true),
  primitiveProp('r', 'Record<number, StyleProps>', 'Container-query responsive StyleProps keyed by container width.', true),
  primitiveProp('display', STYLE_PROP_VALUE_STRING, 'CSS display style prop.', true),
  primitiveProp('color', 'StylePropValue<ColorToken | string>', 'Token-aware text color style prop.', true),
  primitiveProp('padding', STYLE_PROP_VALUE_STRING, 'Token-aware padding style prop.', true),
  primitiveProp('gap', STYLE_PROP_VALUE_STRING, 'Token-aware gap style prop.', true),
  primitiveProp('borderRadius', STYLE_PROP_VALUE_STRING, 'Token-aware border radius style prop.', true),
  primitiveProp('fontSize', STYLE_PROP_VALUE_STRING, 'Token-aware font size style prop.', true),
]

function toHtmlTagName(name: string): string {
  if (name === 'Obj') return 'object'
  if (name === 'Var') return 'var'
  return name.toLowerCase()
}

function clonePrimitive(component: McpComponent): McpComponent {
  return {
    ...component,
    usedWith: { ...component.usedWith },
    examples: [...component.examples],
    interface: component.interface ? { ...component.interface } : null,
    props: component.props.map(prop => ({ ...prop })),
  }
}

export function createReferenceUiPrimitive(name: string): McpComponent {
  const tag = toHtmlTagName(name)

  return {
    name,
    kind: 'primitive',
    source: '@reference-ui/react',
    description: `HTML <${tag}> primitive driven by Reference UI StyleProps.`,
    count: 0,
    usage: 'unused',
    usedWith: {},
    anatomy: {
      pattern: 'single',
      root: name,
      parts: [],
    },
    examples: [
      `<${name} />`,
      `<${name} padding="2r" color="text" />`,
    ],
    interface: {
      name: `${name}Props`,
      source: '@reference-ui/react',
    },
    props: [
      primitiveProp('children', 'React.ReactNode', `Children rendered inside the underlying <${tag}> element.`),
      primitiveProp('className', 'string', 'Additional class names passed to the underlying element.'),
      primitiveProp('id', 'string', 'DOM id passed to the underlying element.'),
      primitiveProp('colorMode', 'string', 'Optional color mode scope for this primitive subtree.'),
      ...PRIMITIVE_STYLE_PROPS,
    ],
  }
}

export const REFERENCE_UI_PRIMITIVE_NAMES = TAGS.map(toPrimitiveName)
const orderedPrimitiveNames = [
  ...COMMON_PRIMITIVES,
  ...REFERENCE_UI_PRIMITIVE_NAMES.filter(name => !COMMON_PRIMITIVES.includes(name as typeof COMMON_PRIMITIVES[number])),
]

export const REFERENCE_UI_PRIMITIVES: McpComponent[] = orderedPrimitiveNames.map(createReferenceUiPrimitive)

export function findReferenceUiPrimitive(name: string): McpComponent | null {
  const primitive = REFERENCE_UI_PRIMITIVES.find(primitive => primitive.name === name)
  return primitive ? clonePrimitive(primitive) : null
}

/**
 * Maps Atlas `observed` elements onto the primitive catalog. Atlas has already
 * counted, scored and parsed the JSX, so this copies its fields as they are.
 * Primitives Atlas did not observe are omitted and keep their catalog defaults.
 */
export function createObservedReferenceUiPrimitives(
  observed: ObservedElement[]
): McpComponent[] {
  return observed.flatMap(element => {
    const primitive = findReferenceUiPrimitive(element.name)
    if (!primitive) return []

    primitive.count = element.count
    primitive.usage = element.usage
    primitive.examples = element.examples.length > 0
      ? element.examples
      : primitive.examples
    primitive.usedWith = { ...element.usedWith }

    for (const prop of element.props) {
      mergeObservedProp(primitive, prop)
    }

    return [primitive]
  })
}

function mergeObservedProp(primitive: McpComponent, prop: ComponentProp): void {
  const existing = primitive.props.find(candidate => candidate.name === prop.name)
  if (existing) {
    existing.count = prop.count
    existing.usage = prop.usage
    existing.origin = 'observed'
    if (prop.values) existing.values = prop.values
    return
  }

  primitive.props.push({
    name: prop.name,
    count: prop.count,
    usage: prop.usage,
    ...(prop.values ? { values: prop.values } : {}),
    type: null,
    description: null,
    optional: true,
    readonly: false,
    origin: 'observed',
    styleProp: isStylePropName(prop.name),
  })
}
