import type { GenerateDesignSystemConfig } from './types.js'

export interface BuildResult {
  files: Map<string, string | Uint8Array>
  metadata: {
    hash: string
    tokensUsed: string[]
    components: string[]
  }
}

function debugCompileStep(step: string, data: unknown): void {
  if (process.env.REFERENCE_DEBUG === '1') {
    console.log(`[DEBUG] ${step}:`, data)
  }
}

function rewriteCoreImportsForConsumer(sourcePath: string, content: string): string {
  // Rewrite core css imports for consumer.
  if (sourcePath.startsWith('components/')) {
    return content.replace(
      /from\s+['"]@reference-ui\/core\/styled-system\/css['"]/g,
      "from '../css'"
    )
  }

  return content
}

/** Pure compilation. Returns BuildResult; CLI materializes to disk. */
export function compile(config: GenerateDesignSystemConfig): BuildResult {
  debugCompileStep('Received Config', config)

  const result: BuildResult = {
    files: new Map<string, string>(),
    metadata: {
      hash: '',
      tokensUsed: [],
      components: [],
    },
  }

  const sourceFiles = config.sourceFiles ?? {}

  // Copy source files; skip css.ts and index.ts (we generate those).
  for (const [sourcePath, content] of Object.entries(sourceFiles)) {
    debugCompileStep(`Processing File: ${sourcePath}`, sourcePath)

    const normalizedPath = sourcePath.replace(/\\/g, '/')

    if (normalizedPath === 'css.ts' || normalizedPath === 'index.ts') {
      continue
    }

    const rewritten = rewriteCoreImportsForConsumer(normalizedPath, content)
    result.files.set(normalizedPath, rewritten)
  }

  // Re-export Panda css from system.
  result.files.set(
    'css.ts',
    [
      "export { css, cx, cva, sva } from './system/css/index.js'",
      '',
    ].join('\n')
  )

  result.files.set(
    'index.ts',
    [
      '/** Generated entry. Do not edit. */',
      "export { RefButton } from './components/Button.js'",
      "export type { ButtonVariant, ButtonSize, RefButtonProps } from './components/Button.js'",
      "export { tokens } from './tokens.js'",
      "export { defaultTheme, defaultStaticCss } from './panda-config.js'",
      "export { css, cx, cva, sva } from './css'",
      '',
    ].join('\n')
  )

  debugCompileStep('Generated Result', result)
  return result
}
