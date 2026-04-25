import { TAGS } from '../../system/primitives/tags'
import type { McpComponent, McpComponentProp } from './types'
import { isStylePropName } from './style-props'

export interface ReferenceUiPrimitiveObservation {
  name: string
  count: number
  examples: string[]
  filePresence: number
  propCounts: Record<string, number>
  usedWithCounts: Record<string, number>
}

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
  primitiveProp('display', 'StylePropValue<string>', 'CSS display style prop.', true),
  primitiveProp('color', 'StylePropValue<ColorToken | string>', 'Token-aware text color style prop.', true),
  primitiveProp('padding', 'StylePropValue<string>', 'Token-aware padding style prop.', true),
  primitiveProp('gap', 'StylePropValue<string>', 'Token-aware gap style prop.', true),
  primitiveProp('borderRadius', 'StylePropValue<string>', 'Token-aware border radius style prop.', true),
  primitiveProp('fontSize', 'StylePropValue<string>', 'Token-aware font size style prop.', true),
]

function scoreUsage(count: number, total: number) {
  if (total === 0) return 'unused' as const

  const ratio = count / total
  if (ratio >= 0.5) return 'very common' as const
  if (ratio >= 0.2) return 'common' as const
  if (ratio >= 0.1) return 'occasional' as const
  if (ratio > 0) return 'rare' as const
  return 'unused' as const
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
  const tag = name === 'Obj'
    ? 'object'
    : name === 'Var'
      ? 'var'
      : name.toLowerCase()

  return {
    name,
    kind: 'primitive',
    source: '@reference-ui/react',
    count: 0,
    usage: 'unused',
    usedWith: {},
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

export function createObservedReferenceUiPrimitives(
  observations: ReferenceUiPrimitiveObservation[]
): McpComponent[] {
  const total = observations.reduce((sum, observation) => sum + observation.count, 0)

  return observations.flatMap(observation => {
    const primitive = findReferenceUiPrimitive(observation.name)
    if (!primitive) return []

    primitive.count = observation.count
    primitive.usage = scoreUsage(observation.count, total)
    primitive.examples = observation.examples.length > 0
      ? observation.examples
      : primitive.examples
    primitive.usedWith = Object.fromEntries(
      Object.entries(observation.usedWithCounts)
        .map(([name, count]) => [name, scoreUsage(count, observation.filePresence)])
    )

    for (const [name, count] of Object.entries(observation.propCounts)) {
      const existing = primitive.props.find(prop => prop.name === name)
      if (existing) {
        existing.count = count
        existing.usage = scoreUsage(count, observation.count)
        existing.origin = 'observed'
        continue
      }

      primitive.props.push({
        name,
        count,
        usage: scoreUsage(count, observation.count),
        type: null,
        description: null,
        optional: true,
        readonly: false,
        origin: 'observed',
        styleProp: isStylePropName(name),
      })
    }

    return [primitive]
  })
}
