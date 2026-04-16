import type {
  McpBuildArtifact,
  McpCommonPattern,
  McpComponent,
  McpComponentSummary,
  McpGetCommonPatternsInput,
  McpGetComponentInput,
  McpListComponentsInput,
} from './types'

const DEFAULT_LIMIT = 25

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

export function summarizeComponent(component: McpComponent): McpComponentSummary {
  return {
    name: component.name,
    source: component.source,
    usage: component.usage,
    count: component.count,
    interfaceName: component.interface?.name ?? null,
    propCount: component.props.length,
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

export function getCommonPatterns(
  artifact: McpBuildArtifact,
  input: McpGetCommonPatternsInput
): McpCommonPattern[] | null {
  const component = findComponent(artifact, input)
  if (!component) return null

  return Object.entries(component.usedWith)
    .map(([name, usage]) => ({ name, usage }))
    .sort((left, right) => {
      const usageDelta = rankUsage(left.usage) - rankUsage(right.usage)
      if (usageDelta !== 0) return usageDelta
      return left.name.localeCompare(right.name)
    })
    .slice(0, input.limit ?? 10)
}
