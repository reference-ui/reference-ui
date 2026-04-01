import type { AtlasDiagnostic, Usage } from '@reference-ui/rust/atlas'

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
  warnings: string[]
}

export interface McpBuildArtifact {
  schemaVersion: 1
  generatedAt: string
  workspaceRoot: string
  manifestPath: string
  diagnostics: AtlasDiagnostic[]
  components: McpComponent[]
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

export interface McpGetCommonPatternsInput extends McpGetComponentInput {
  limit?: number
}

export interface McpComponentSummary {
  name: string
  source: string
  usage: Usage
  count: number
  interfaceName: string | null
  propCount: number
}

export interface McpCommonPattern {
  name: string
  usage: Usage
}
