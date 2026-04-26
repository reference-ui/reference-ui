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
  McpCompactToken,
  McpToken,
  McpTokenListResult,
  McpUsageSemantics,
} from './types'
import { findReferenceUiPrimitive } from './primitives'

const DEFAULT_LIMIT = 25
const DEFAULT_PROP_PREVIEW_LIMIT = 8
const DEFAULT_COMPONENT_PROP_LIMIT = 30
const TOKEN_COMPRESSION_THRESHOLD = 200
const REFERENCE_UI_REACT_SOURCE = '@reference-ui/react'

const USAGE_SEMANTICS: McpUsageSemantics = {
  count:
    'Number of resolved JSX opening-element occurrences in the analyzed files.',
  usage:
    'Relative usage bucket derived from count using the same Reference UI usage thresholds across component tools.',
}

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

function chooseUsage(left: McpComponentProp['usage'], right: McpComponentProp['usage']) {
  return rankUsage(left) <= rankUsage(right) ? left : right
}

function mergeProps(left: McpComponentProp, right: McpComponentProp): McpComponentProp {
  return {
    ...right,
    ...left,
    count: Math.max(left.count, right.count),
    usage: chooseUsage(left.usage, right.usage),
    values: left.values ?? right.values,
    type: left.type ?? right.type,
    description: left.description ?? right.description,
    defaultValue: left.defaultValue ?? right.defaultValue,
    origin: isObservedProp(left) || isObservedProp(right) ? 'observed' : left.origin ?? right.origin,
    styleProp: left.styleProp ?? right.styleProp,
  }
}

function mergeComponents(left: McpComponent, right: McpComponent): McpComponent {
  const props = new Map<string, McpComponentProp>()
  for (const prop of right.props) props.set(prop.name, { ...prop })
  for (const prop of left.props) {
    const existing = props.get(prop.name)
    props.set(prop.name, existing ? mergeProps(prop, existing) : { ...prop })
  }

  return {
    ...right,
    ...left,
    kind: left.kind ?? right.kind ?? 'project',
    count: Math.max(left.count, right.count),
    usage: chooseUsage(left.usage, right.usage),
    usedWith: { ...right.usedWith, ...left.usedWith },
    examples: Array.from(new Set([...left.examples, ...right.examples])).slice(0, 5),
    interface: left.interface ?? right.interface,
    props: Array.from(props.values()),
  }
}

function componentKey(component: Pick<McpComponent, 'name' | 'source'>): string {
  return `${component.name}@@${component.source}`
}

function getCanonicalComponents(artifact: McpBuildArtifact): McpComponent[] {
  // Merge duplicate component entries from the build artifact so all query
  // helpers operate on one canonical view per name/source pair.
  const componentsByKey = new Map<string, McpComponent>()

  for (const component of artifact.components) {
    const normalized = {
      ...component,
      kind: component.kind ?? 'project' as const,
    }
    const key = componentKey(normalized)
    const existing = componentsByKey.get(key)
    componentsByKey.set(key, existing ? mergeComponents(normalized, existing) : normalized)
  }

  return Array.from(componentsByKey.values())
}

function findCanonicalComponentMatches(
  artifact: McpBuildArtifact,
  name: string
): McpComponent[] {
  return getCanonicalComponents(artifact)
    .filter(component => component.name === name)
}

function findReferenceUiComponentFallback(input: McpGetComponentInput): McpComponent | null {
  if (input.source && input.source !== REFERENCE_UI_REACT_SOURCE) return null
  return findReferenceUiPrimitive(input.name)
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
    kind: component.kind ?? 'project',
    source: component.source,
    usage: component.usage,
    count: component.count,
    usageSemantics: USAGE_SEMANTICS,
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
  const components = getCanonicalComponents(artifact)

  return components
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
  const matches = findCanonicalComponentMatches(artifact, input.name)

  if (input.source) {
    return matches.find(component => component.source === input.source)
      ?? findReferenceUiComponentFallback(input)
  }

  if (matches.length === 1) return matches[0] ?? null

  // In empty or lightly-used projects, allow direct queries for packaged
  // Reference UI primitives even when they have not been observed yet.
  if (matches.length === 0) return findReferenceUiComponentFallback(input)

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
    kind: component.kind ?? 'project',
    source: component.source,
    count: component.count,
    usage: component.usage,
    usageSemantics: USAGE_SEMANTICS,
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

function compactToken(token: McpToken): McpCompactToken {
  return {
    path: token.path,
    category: token.category,
    value: token.value,
    light: token.light,
    dark: token.dark,
  }
}

function createTokenMessage(
  input: McpGetTokensInput,
  total: number,
  compressed: boolean
): string | undefined {
  if (compressed) {
    return 'Token output compressed to paths, categories, and raw values because the result set is large. Query a token path for descriptions and richer metadata.'
  }

  if (total !== 0) return undefined

  if (input.category) {
    return `No tokens found for category "${input.category}". Token categories are project data; style prop compatibility may mention categories that this project does not define.`
  }

  return 'No tokens matched this query.'
}

export function listTokens(
  artifact: McpBuildArtifact,
  input: McpGetTokensInput = {}
): McpTokenListResult {
  const query = input.query?.trim().toLowerCase()
  const category = input.category?.trim().toLowerCase()
  const allTokens = artifact.tokens ?? []
  const availableCategories = Array.from(new Set(allTokens.map(token => token.category))).sort()

  let tokens = allTokens
    .filter(token => {
      if (category && token.category.toLowerCase() !== category) return false
      if (!query) return true

      return [
        token.path,
        token.category,
        typeof token.description === 'string' ? token.description : '',
      ].some(value => value.toLowerCase().includes(query))
    })
  const total = tokens.length
  const compressed = total > TOKEN_COMPRESSION_THRESHOLD
  const message = createTokenMessage(input, total, compressed)

  if (compressed) {
    tokens = tokens.map(compactToken)
  }
  if (input.limit) tokens = tokens.slice(0, input.limit)

  return {
    tokens,
    total,
    returned: tokens.length,
    compressed,
    ...(total === 0 ? { availableCategories } : {}),
    ...(message ? { message } : {}),
  }
}
