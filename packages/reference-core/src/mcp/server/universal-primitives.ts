import {
  findReferenceUiPrimitive,
  REFERENCE_UI_PRIMITIVES,
} from '../pipeline/primitives'
import { compactComponent, summarizeComponent, summarizeProps } from '../pipeline/queries'
import { getStylePropsReference } from '../pipeline/style-props'

export const UNIVERSAL_PRIMITIVES_NOTICE =
  'No ui.config.ts detected in this workspace. Serving Reference UI built-in primitives and StyleProps.'

function asUniversalResult<T extends Record<string, unknown>>(payload: T) {
  return {
    mode: 'universal_primitives' as const,
    notice: UNIVERSAL_PRIMITIVES_NOTICE,
    ...payload,
  }
}

export function getUniversalComponents(options?: { query?: string; limit?: number }) {
  let primitives = REFERENCE_UI_PRIMITIVES

  if (options?.query) {
    const q = options.query.toLowerCase()
    primitives = primitives.filter(p => p.name.toLowerCase().includes(q))
  }

  if (options?.limit && options.limit > 0) {
    primitives = primitives.slice(0, options.limit)
  }

  return asUniversalResult({
    components: primitives.map(summarizeComponent),
  })
}

export function getUniversalComponent(name: string) {
  const primitive = findReferenceUiPrimitive(name)
  if (!primitive) {
    return {
      error: `Component '${name}' not found. In Universal Reference Mode only built-in primitives are available.`,
    }
  }
  return asUniversalResult({ ...compactComponent(primitive) })
}

export function getUniversalComponentProps(name: string) {
  const primitive = findReferenceUiPrimitive(name)
  if (!primitive) {
    return {
      error: `Detailed prop inspection for '${name}' requires a synced project with ui.config.ts. Run 'ref init' to set up.`,
    }
  }
  const compact = compactComponent(primitive)
  return asUniversalResult({
    name: primitive.name,
    kind: primitive.kind,
    source: primitive.source,
    count: primitive.count,
    usage: primitive.usage,
    usageSemantics: compact.usageSemantics,
    interface: primitive.interface,
    props: primitive.props,
    propSummary: summarizeProps(primitive.props, primitive.props.length),
    styleProps: compact.styleProps,
  })
}

export function getUniversalComponentExamples(name: string) {
  const primitive = findReferenceUiPrimitive(name)
  if (!primitive) {
    return {
      error: `Usage examples for '${name}' require a synced project.`,
    }
  }
  return asUniversalResult({
    name: primitive.name,
    kind: primitive.kind,
    source: primitive.source,
    examples: primitive.examples,
  })
}

export function getUniversalTokens() {
  return asUniversalResult({
    message: 'Tokens require a synced project with ui.config.ts and token definitions.',
    total: 0,
    returned: 0,
    compressed: false,
    tokens: [],
  })
}

export function getUniversalStyleProps(input?: { query?: string; includeProps?: boolean }) {
  return asUniversalResult({ ...getStylePropsReference(input) })
}
