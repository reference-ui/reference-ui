import type { AtlasDiagnostic, Usage } from '@reference-ui/rust/atlas'

export type McpComponentPropOrigin = 'observed' | 'documented'

export interface McpComponentInterface {
  name: string
  source: string
}

export interface McpComponentProp {
  name: string
  count: number
  usage: Usage
  values?: Record<string, Usage>
  type: string | null
  description: string | null
  optional: boolean
  readonly: boolean
  defaultValue?: string
  origin?: McpComponentPropOrigin
  styleProp?: boolean
}

export interface McpComponent {
  name: string
  source: string
  count: number
  usage: Usage
  usedWith: Record<string, Usage>
  examples: string[]
  interface: McpComponentInterface | null
  props: McpComponentProp[]
}

export interface McpToken {
  path: string
  category: string
  value?: unknown
  light?: unknown
  dark?: unknown
  description?: string
}

export type McpCompactToken = Omit<McpToken, 'description'>

export interface McpTokenListResult {
  tokens: Array<McpToken | McpCompactToken>
  total: number
  returned: number
  compressed: boolean
  message?: string
}

export interface McpBuildArtifact {
  schemaVersion: 1
  generatedAt: string
  workspaceRoot: string
  manifestPath: string
  diagnostics: AtlasDiagnostic[]
  components: McpComponent[]
  tokens?: McpToken[]
}

export interface McpPublicModel {
  schemaVersion: 1
  generatedAt: string
  components: McpComponentSummary[]
}

export interface McpListComponentsInput {
  query?: string
  source?: string
  limit?: number
}

export interface McpGetComponentInput {
  name: string
  source?: string
}

export interface McpGetComponentPropsInput extends McpGetComponentInput {
  includeUnused?: boolean
  includeStyleProps?: boolean
  query?: string
  limit?: number
}

export interface McpGetTokensInput {
  category?: string
  query?: string
  limit?: number
}

export interface McpGetStylePropsInput {
  query?: string
  includeProps?: boolean
}

export interface McpComponentStylePropsSummary {
  supported: boolean
  observed: string[]
  tool: 'get_style_props'
  note: string
}

export interface McpPropSummary {
  total: number
  observed: number
  documented: number
  style: number
  returned: number
}

export interface McpComponentSummary {
  name: string
  source: string
  usage: Usage
  count: number
  interfaceName: string | null
  propCount: number
  observedProps: string[]
  styleProps: McpComponentStylePropsSummary
}

export interface McpComponentCompact {
  name: string
  source: string
  count: number
  usage: Usage
  usedWith: Record<string, Usage>
  examples: string[]
  interface: McpComponentInterface | null
  props: McpComponentProp[]
  propSummary: McpPropSummary
  styleProps: McpComponentStylePropsSummary
}
