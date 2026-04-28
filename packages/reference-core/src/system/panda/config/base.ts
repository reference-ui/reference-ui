import type { Config } from '@pandacss/dev'

/**
 * Userspace base config for ref sync.
 * Used when generating panda.config.ts in the user's outDir (.reference-ui).
 * Panda runs with cwd=outDir, so outdir 'styled' → output to outDir/styled.
 *
 * NOT used by build/styled.ts (CLI internal build) — that passes a full
 * baseConfig override tailored for src/system/styled.
 */
export const baseConfig = {
  presets: [],
  jsxFramework: 'react' as const,
  preflight: false,
  // Match the virtual rewrite target (`src/system/runtime`) so Panda extracts
  // css()/cva() usage from transformed user files.
  importMap: 'src/system',

  /** Relative to outDir: virtual/ = transformed sources, src/ = user src */
  include: ['virtual/**/*.{ts,tsx,js,jsx}', 'src/**/*.{ts,tsx,js,jsx}'],

  exclude: ['**/node_modules/**'],

  /** Output directly into the styled package (outDir/styled) */
  outdir: 'styled',
  outExtension: 'js' as const,
  hash: false,
} satisfies Partial<Config>
