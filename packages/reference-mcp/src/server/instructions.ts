import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from './logger'
import { resolveCorePackageDir } from '@reference-ui/core/paths'

export const REFERENCE_UI_INSTRUCTIONS_FALLBACK = `# Reference UI Agent Instructions & Guiding Principles

Reference UI is a knowledge-first component and design-system engine for React, featuring generated primitives, token-aware atomic styling, rhythm units, and container-query-first responsive design.

1. Primitives First: Import from @reference-ui/react (<Div>, <Section>, <Main>, <P>, <Button>).
2. StyleProps: Use camelCased atomic StyleProps; no Tailwind or arbitrary CSS classes.
3. Rhythm Spacing: Use strings ending in 'r' (e.g. '1r', '2r', '4r').
4. Container Queries: Use container and r={{ 320: { ... }, 640: { ... } }}. No viewport media queries.
5. Workspace Intelligence: Call list_projects, select_project, or pass project parameter to target packages.
6. Dynamic Values: Pass calculated runtime numbers (e.g. dynamic zIndex or opacity) via inline style={{ ... }} rather than props, as static atomic CSS engines drop arbitrary runtime prop values.
`

const instructionsCache = new Map<string, string>()

export function loadReferenceMcpInstructions(cwd: string): string {
  const cached = instructionsCache.get(cwd)
  if (cached) return cached

  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const candidates = [
      resolve(here, '../../instructions.md'),
      resolve(here, '../instructions.md'),
    ]
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        const content = readFileSync(candidate, 'utf8')
        instructionsCache.set(cwd, content)
        return content
      }
    }

    const coreDir = resolveCorePackageDir(cwd)
    const coreCandidate = resolve(coreDir, 'src', 'mcp', 'instructions.md')
    if (existsSync(coreCandidate)) {
      const content = readFileSync(coreCandidate, 'utf8')
      instructionsCache.set(cwd, content)
      return content
    }
  } catch (error) {
    log.warn('[mcp] Failed to load instructions.md; using fallback instructions.', error)
  }

  return REFERENCE_UI_INSTRUCTIONS_FALLBACK
}

export function clearInstructionsCache(): void {
  instructionsCache.clear()
}
