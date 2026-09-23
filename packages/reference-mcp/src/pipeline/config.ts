import type { AtlasConfig } from '@reference-ui/rust/atlas'
import type { ReferenceUIConfig } from '@reference-ui/neo/config/types'

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

export function getAtlasMcpConfig(
  config: McpAwareConfig | undefined
): AtlasConfig | undefined {
  const include = config?.mcp?.include
  const exclude = config?.mcp?.exclude

  if (!include?.length && !exclude?.length) {
    return undefined
  }

  return {
    rootDir: '',
    include,
    exclude,
  }
}
