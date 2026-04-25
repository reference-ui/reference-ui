import type {
  McpBuildArtifact,
  McpComponent,
  McpComponentCompact,
  McpComponentProp,
  McpComponentSummary,
  McpGetComponentInput,
  McpGetComponentPropsInput,
  McpGetTokensInput,
  McpListComponentsInput,
  McpPropSummary,
} from './types'

const DEFAULT_LIMIT = 25
const DEFAULT_PROP_PREVIEW_LIMIT = 8
const DEFAULT_COMPONENT_PROP_LIMIT = 30
const DEFAULT_TOKEN_LIMIT = 200

const USAGE_RANK: Record<string, number> = {
  'very common': 0,
  common: 1,
  occasional: 2,
  rare: 3,
  unused: 4,
}

function rankUsage(value: string): number {
  return USAGE_RANK[value] ?? Number.MAX_SAFE_INTEGER
}

function isObservedProp(prop: McpComponentProp): boolean {
  return prop.origin === 'observed' || prop.count > 0 || prop.usage !== 'unused'
}

function sortProps(left: McpComponentProp, right: McpComponentProp): number {
  const usageDelta = rankUsage(left.usage) - rankUsage(right.usage)
  if (usageDelta !== 0) return usageDelta
  if (right.count !== left.count) return right.count - left.count
  return left.name.localeCompare(right.name)
}

function summarizeProps(props: McpComponentProp[], returned: number): McpPropSummary {
  const observed = props.filter(isObservedProp).length
  const style = props.filter(prop => prop.styleProp).length

  return {
    total: props.length,
    observed,
    documented: props.length - observed,
    style,
    returned,
  }
}

function getStylePropsSummary(component: McpComponent) {
  const observed = component.props
    .filter(prop => prop.styleProp && isObservedProp(prop))
    .sort(sortProps)
    .map(prop => prop.name)
    .slice(0, DEFAULT_PROP_PREVIEW_LIMIT)
  const supported = component.props.some(prop => prop.styleProp)

  return {
    supported,
    observed,
    tool: 'get_style_props' as const,
    note: supported
      ? 'This component accepts Reference UI StyleProps. Use get_style_props for the shared style prop/token reference.'
      : 'No StyleProps surface was detected for this component.',
  }
}

export function summarizeComponent(component: McpComponent): McpComponentSummary {
  const observedProps = component.props
    .filter(isObservedProp)
    .sort(sortProps)
    .map(prop => prop.name)
    .slice(0, DEFAULT_PROP_PREVIEW_LIMIT)

  return {
    name: component.name,
    source: component.source,
    usage: component.usage,
    count: component.count,
    interfaceName: component.interface?.name ?? null,
    propCount: component.props.length,
    observedProps,
    styleProps: getStylePropsSummary(component),
  }
}

export function listComponents(
  artifact: McpBuildArtifact,
  input: McpListComponentsInput = {}
): McpComponentSummary[] {
  const query = input.query?.trim().toLowerCase()
  const source = input.source?.trim()
  const limit = input.limit ?? DEFAULT_LIMIT

  return artifact.components
    .filter(component => {
      if (source && component.source !== source) return false
      if (!query) return true

      return [component.name, component.source, component.interface?.name ?? ''].some(
        value => value.toLowerCase().includes(query)
      )
    })
    .slice(0, limit)
    .map(summarizeComponent)
}

export function findComponent(
  artifact: McpBuildArtifact,
  input: McpGetComponentInput
): McpComponent | null {
  const matches = artifact.components.filter(component => component.name === input.name)
  if (input.source) {
    return matches.find(component => component.source === input.source) ?? null
  }

  if (matches.length === 1) return matches[0] ?? null
  if (matches.length === 0) return null

  const exactLocal = matches.find(component => component.source.startsWith('.'))
  return exactLocal ?? matches[0] ?? null
}

export function compactComponent(component: McpComponent): McpComponentCompact {
  const observedProps = component.props.filter(isObservedProp)
  const documentedProps = component.props.filter(prop => !isObservedProp(prop) && !prop.styleProp)
  const props = [...observedProps, ...documentedProps]
    .sort(sortProps)
    .slice(0, DEFAULT_COMPONENT_PROP_LIMIT)

  return {
    name: component.name,
    source: component.source,
    count: component.count,
    usage: component.usage,
    usedWith: component.usedWith,
    examples: component.examples,
    interface: component.interface,
    props,
    propSummary: summarizeProps(component.props, props.length),
    styleProps: getStylePropsSummary(component),
  }
}

export function getComponentProps(
  artifact: McpBuildArtifact,
  input: McpGetComponentPropsInput
): { component: McpComponent; props: McpComponentProp[]; propSummary: McpPropSummary } | null {
  const component = findComponent(artifact, input)
  if (!component) return null

  const includeUnused = input.includeUnused ?? true
  const includeStyleProps = input.includeStyleProps ?? true
  const query = input.query?.trim().toLowerCase()
  const limit = input.limit

  let props = component.props.filter(prop => {
    if (!includeUnused && !isObservedProp(prop)) return false
    if (!includeStyleProps && prop.styleProp) return false
    if (!query) return true

    return [prop.name, prop.type ?? '', prop.description ?? ''].some(value =>
      value.toLowerCase().includes(query)
    )
  })

  props = props.sort(sortProps)
  if (limit) props = props.slice(0, limit)

  return {
    component,
    props,
    propSummary: summarizeProps(component.props, props.length),
  }
}

export function listTokens(artifact: McpBuildArtifact, input: McpGetTokensInput = {}) {
  const query = input.query?.trim().toLowerCase()
  const category = input.category?.trim().toLowerCase()
  const limit = input.limit ?? DEFAULT_TOKEN_LIMIT

  return (artifact.tokens ?? [])
    .filter(token => {
      if (category && token.category.toLowerCase() !== category) return false
      if (!query) return true

      return [
        token.path,
        token.category,
        typeof token.description === 'string' ? token.description : '',
      ].some(value => value.toLowerCase().includes(query))
    })
    .slice(0, limit)
}
