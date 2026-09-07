import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../lib/log'
import { resolveCorePackageDir } from '../../lib/paths/core-package-dir'

export const REFERENCE_UI_INSTRUCTIONS_FALLBACK = `# Reference UI Agent Instructions & Guiding Principles

Reference UI is a knowledge-first component and design-system engine for React, featuring generated primitives, token-aware atomic styling, rhythm units, and container-query-first responsive design.

1. Primitives First: Import from @reference-ui/react (<Div>, <Section>, <Main>, <P>, <Button>).
2. StyleProps: Use camelCased atomic StyleProps; no Tailwind or arbitrary CSS classes.
3. Rhythm Spacing: Use strings ending in 'r' (e.g. '1r', '2r', '4r').
4. Container Queries: Use container and r={{ 320: { ... }, 640: { ... } }}. No viewport media queries.
5. Workspace Intelligence: Call list_projects, select_project, or pass project parameter to target packages.
`

const instructionsCache = new Map<string, string>()

export function loadReferenceMcpInstructions(cwd: string): string {
  const cached = instructionsCache.get(cwd)
  if (cached) return cached

  try {
    const coreDir = resolveCorePackageDir(cwd)
    const content = readFileSync(resolve(coreDir, 'src', 'mcp', 'instructions.md'), 'utf8')
    instructionsCache.set(cwd, content)
    return content
  } catch (error) {
    log.warn('[mcp] Failed to load instructions.md; using fallback instructions.', error)
    return REFERENCE_UI_INSTRUCTIONS_FALLBACK
  }
}

export function clearInstructionsCache(): void {
  instructionsCache.clear()
}
