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
import { findReferenceUiLibraryComponent } from './library-catalog'
import { findComponentDoc } from './component-docs'

const DEFAULT_LIMIT = 25
const DEFAULT_PROP_PREVIEW_LIMIT = 8
const DEFAULT_COMPONENT_PROP_LIMIT = 30
const TOKEN_COMPRESSION_THRESHOLD = 200
const REFERENCE_UI_REACT_SOURCE = '@reference-ui/react'
const REFERENCE_UI_LIB_SOURCE = '@reference-ui/lib'

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
    description: left.description || right.description || null,
    count: Math.max(left.count, right.count),
    usage: chooseUsage(left.usage, right.usage),
    usedWith: { ...right.usedWith, ...left.usedWith },
    examples: Array.from(new Set([...left.examples, ...right.examples])).slice(0, 5),
    anatomy: left.anatomy || right.anatomy || null,
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

function findReferenceUiComponentFallback(
  input: McpGetComponentInput,
  artifact?: McpBuildArtifact
): McpComponent | null {
  if (
    input.source &&
    input.source !== REFERENCE_UI_REACT_SOURCE &&
    input.source !== REFERENCE_UI_LIB_SOURCE
  ) {
    return null
  }
  if (!input.source || input.source === REFERENCE_UI_REACT_SOURCE) {
    const primitive = findReferenceUiPrimitive(input.name)
    if (primitive) return primitive
  }
  if (!input.source || input.source === REFERENCE_UI_LIB_SOURCE) {
    if (artifact && artifact.useReferenceLibrary === false) {
      return null
    }
    return findReferenceUiLibraryComponent(input.name)
  }
  return null
}

export function summarizeProps(props: McpComponentProp[], returned: number): McpPropSummary {
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
      if (artifact.useReferenceLibrary === false && component.source === REFERENCE_UI_LIB_SOURCE) {
        return false
      }
      if (source && component.source !== source) return false
      if (!query) return true

      return [component.name, component.source, component.interface?.name ?? ''].some(
        value => value.toLowerCase().includes(query)
      )
    })
    .slice(0, limit)
    .map(summarizeComponent)
}

export function enrichComponent(
  component: McpComponent,
  artifact?: McpBuildArtifact
): McpComponent {
  const enriched: McpComponent = {
    ...component,
    examples: [...component.examples],
    props: [...component.props],
    usedWith: { ...component.usedWith },
  }

  // 1. If it has a local doc in the workspace root, read from disk
  if (artifact?.workspaceRoot) {
    const doc = findComponentDoc(artifact.workspaceRoot, component.name, component.source)
    if (doc) {
      enriched.description = enriched.description || doc.description
      if (!enriched.anatomy && doc.anatomy) {
        enriched.anatomy = doc.anatomy
      }
      if (enriched.examples.length === 0 && doc.examples.length > 0) {
        enriched.examples = doc.examples.slice(0, 5)
      }
    }
  }

  // 2. If it matches a @reference-ui/lib component, merge catalog documentation
  const libComponent = findReferenceUiLibraryComponent(component.name)
  if (libComponent) {
    enriched.description = enriched.description || libComponent.description
    if (!enriched.anatomy && libComponent.anatomy) {
      enriched.anatomy = libComponent.anatomy
    }
    if (enriched.examples.length === 0 && libComponent.examples.length > 0) {
      enriched.examples = libComponent.examples.slice(0, 5)
    }
  }

  return enriched
}

export function findComponent(
  artifact: McpBuildArtifact,
  input: McpGetComponentInput
): McpComponent | null {
  if (artifact.useReferenceLibrary === false && input.source === REFERENCE_UI_LIB_SOURCE) {
    return null
  }

  const matches = findCanonicalComponentMatches(artifact, input.name)
    .filter(component => !(artifact.useReferenceLibrary === false && component.source === REFERENCE_UI_LIB_SOURCE))

  let baseComponent: McpComponent | null = null

  if (input.source) {
    baseComponent = matches.find(component => component.source === input.source)
      ?? findReferenceUiComponentFallback(input, artifact)
  } else if (matches.length === 1) {
    baseComponent = matches[0] ?? null
  } else if (matches.length === 0) {
    baseComponent = findReferenceUiComponentFallback(input, artifact)
  } else {
    const exactLocal = matches.find(component => component.source.startsWith('.'))
    baseComponent = exactLocal ?? matches[0] ?? null
  }

  if (!baseComponent) return null

  return enrichComponent(baseComponent, artifact)
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
    description: component.description ?? null,
    count: component.count,
    usage: component.usage,
    usageSemantics: USAGE_SEMANTICS,
    usedWith: component.usedWith,
    examples: component.examples,
    anatomy: component.anatomy ?? null,
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
      // Hide `_private` token subtrees from default listings. They remain
      // discoverable when explicitly queried (by path or name fragment) so a
      // package's own MCP surface can still surface its locally-authored
      // private tokens, but they don't pollute the broad readout that an
      // assistant uses to understand the design system at a glance.
      if (!query && token.path.split('.').includes('_private')) return false
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
