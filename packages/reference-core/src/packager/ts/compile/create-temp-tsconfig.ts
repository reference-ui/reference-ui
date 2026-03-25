import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { getOutDirPath } from '../../../lib/paths/out-dir'

export interface CreateTempTsconfigOptions {
  cliDir: string
  projectCwd: string
  tempDir: string
}

/**
 * Declaration builds need a synthetic tsconfig instead of the consumer's
 * real tsconfig:
 *
 * - We must keep `@reference-ui/core` compiling with the core package's own
 *   tsconfig, otherwise consumer `rootDir` settings reject core source files.
 * - At the same time, `@reference-ui/styled` must resolve to the consumer's
 *   generated `.reference-ui/styled` package so color/token types come from
 *   the downstream system, not core's local fallback build output.
 *
 * This temp config preserves the core compile context while overriding only
 * the module paths that must point at the consumer's generated package.
 */
export function createTempTsconfig(options: CreateTempTsconfigOptions): string {
  const { cliDir, projectCwd, tempDir } = options
  const styledDir = resolve(getOutDirPath(projectCwd), 'styled')
  const tempTsconfigPath = join(tempDir, 'tsconfig.ref-ui-dts.json')

  writeFileSync(
    tempTsconfigPath,
    JSON.stringify(
      {
        extends: resolve(cliDir, 'tsconfig.json'),
        compilerOptions: {
          paths: {
            '@reference-ui/react': [resolve(cliDir, 'src/entry/react.ts')],
            '@reference-ui/styled': [styledDir],
            '@reference-ui/styled/*': [join(styledDir, '*')],
          },
          preserveValueImports: true,
          verbatimModuleSyntax: true,
          isolatedModules: false,
        },
      },
      null,
      2
    ),
    'utf-8'
  )

  return tempTsconfigPath
}
