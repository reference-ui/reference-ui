import type { AtlasConfig } from '@reference-ui/rust/atlas'
import type { ReferenceUIConfig } from '@reference-ui/core/config'

export function getAtlasMcpConfig(
  config: ReferenceUIConfig | undefined
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
