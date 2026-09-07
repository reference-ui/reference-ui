import {
  findReferenceUiPrimitive,
  REFERENCE_UI_PRIMITIVES,
} from '../pipeline/primitives'
import {
  findReferenceUiLibraryComponent,
  REFERENCE_UI_LIBRARY_COMPONENTS,
} from '../pipeline/library-catalog'
import { searchIcons } from '../pipeline/icons-catalog'
import { compactComponent, summarizeComponent, summarizeProps } from '../pipeline/queries'
import { getStylePropsReference } from '../pipeline/style-props'

export const UNIVERSAL_PRIMITIVES_NOTICE =
  'No ui.config.ts detected in this workspace. Serving Reference UI built-in primitives, library components, and StyleProps.'

function asUniversalResult<T extends Record<string, unknown>>(payload: T) {
  return {
    mode: 'universal_primitives' as const,
    notice: UNIVERSAL_PRIMITIVES_NOTICE,
    primitivesOverview:
      'All standard HTML elements are available as capitalized primitives from @reference-ui/react (Div, Span, Section, Button, P, H1-H6, etc.) and accept token-aware StyleProps. Call get_style_props for styling reference.',
    ...payload,
  }
}

export function getUniversalComponents(options?: { query?: string; limit?: number }) {
  let components = [...REFERENCE_UI_PRIMITIVES, ...REFERENCE_UI_LIBRARY_COMPONENTS]

  if (options?.query) {
    const q = options.query.toLowerCase()
    components = components.filter(p => p.name.toLowerCase().includes(q))
  }

  if (options?.limit && options.limit > 0) {
    components = components.slice(0, options.limit)
  }

  return asUniversalResult({
    components: components.map(summarizeComponent),
  })
}

export function getUniversalComponent(name: string) {
  const component = findReferenceUiPrimitive(name) ?? findReferenceUiLibraryComponent(name)
  if (!component) {
    return {
      error: `Component '${name}' not found. In Universal Reference Mode built-in primitives and library components are available.`,
    }
  }
  return asUniversalResult({ ...compactComponent(component) })
}

export function getUniversalComponentProps(name: string) {
  const component = findReferenceUiPrimitive(name) ?? findReferenceUiLibraryComponent(name)
  if (!component) {
    return {
      error: `Component '${name}' not found. Run 'ref init' to set up a project.`,
    }
  }
  const compact = compactComponent(component)
  return asUniversalResult({
    name: component.name,
    kind: component.kind,
    source: component.source,
    count: component.count,
    usage: component.usage,
    usageSemantics: compact.usageSemantics,
    interface: component.interface,
    props: component.props,
    propSummary: summarizeProps(component.props, component.props.length),
    styleProps: compact.styleProps,
  })
}

export function getUniversalComponentExamples(name: string) {
  const component = findReferenceUiPrimitive(name) ?? findReferenceUiLibraryComponent(name)
  if (!component) {
    return {
      error: `Component '${name}' not found.`,
    }
  }
  return asUniversalResult({
    name: component.name,
    kind: component.kind,
    source: component.source,
    examples: component.examples,
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

export function getUniversalIcons(options?: { query?: string; limit?: number }) {
  return asUniversalResult(searchIcons(options))
}
