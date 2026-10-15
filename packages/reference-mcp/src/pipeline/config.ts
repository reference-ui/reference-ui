import type { AtlasConfig } from '@reference-ui/rust/atlas'
import type { ReferenceUIConfig } from '@reference-ui/neo/config/types'
import { REFERENCE_UI_PRIMITIVE_NAMES } from './primitives'

export interface McpAtlasSelectors {
  include?: string[]
  exclude?: string[]
}

/**
 * Config as the MCP server reads it: Neo's shape plus the mcp-only fields
 * Neo leaves untyped (they pass through validation at runtime). Vendored
 * here because Neo deliberately drops the `mcp` surface from its types.
 */
export type McpAwareConfig = ReferenceUIConfig & {
  mcp?: McpAtlasSelectors
  useReferenceLibrary?: boolean
  use_reference_library?: boolean
  useReferenceIcons?: boolean
  use_reference_icons?: boolean
}

/**
 * Atlas config for the MCP build. Always asks Atlas to observe the Reference UI
 * primitives, so primitive usage comes from the same parse as component usage.
 * Empty mcp include/exclude lists are dropped, so Atlas sees no selector at all.
 */
export function getAtlasMcpConfig(config: McpAwareConfig | undefined): AtlasConfig {
  return {
    rootDir: '',
    include: nonEmptyPatterns(config?.mcp?.include),
    exclude: nonEmptyPatterns(config?.mcp?.exclude),
    observe: [{ source: '@reference-ui/react', names: REFERENCE_UI_PRIMITIVE_NAMES }],
  }
}

function nonEmptyPatterns(patterns: string[] | undefined): string[] | undefined {
  return patterns?.length ? patterns : undefined
}
