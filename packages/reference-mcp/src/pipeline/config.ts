// Atlas config for the MCP build.
// It takes the project ui.config and emits the Atlas selector: the project's own include/
// exclude plus an observe entry for the Reference UI primitives. Empty lists are dropped
// so Atlas sees no selector at all.
import type { AtlasConfig } from '@reference-ui/rust/atlas'
import type { ReferenceUIConfig } from '@reference-ui/core/config/types'
import { REFERENCE_UI_PRIMITIVE_NAMES } from './primitives'

/**
 * Atlas config for the MCP build. Always asks Atlas to observe the Reference UI
 * primitives, so primitive usage comes from the same parse as component usage.
 * Empty mcp include/exclude lists are dropped, so Atlas sees no selector at all.
 */
export function getAtlasMcpConfig(config: ReferenceUIConfig | undefined): AtlasConfig {
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
