import { writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { getOutDirPath } from '../../lib/paths/out-dir'

export interface WriteTsconfigOptions {
  cliDir: string
  entryFiles: string[]
  projectCwd: string
  tempDir: string
}

function toConfigRelativePath(fromDir: string, targetPath: string): string {
  const relativePath = relative(fromDir, targetPath).replaceAll('\\', '/')
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

export function writeTsconfig(options: WriteTsconfigOptions): string {
  const { cliDir, entryFiles, projectCwd, tempDir } = options
  const styledDir = resolve(getOutDirPath(projectCwd), 'styled')
  const srcDir = resolve(cliDir, 'src')
  const tsconfigPath = join(tempDir, 'tsconfig.ref-ui-dts.json')

  writeFileSync(
    tsconfigPath,
    JSON.stringify(
      {
        files: entryFiles.map((entryFile) =>
          toConfigRelativePath(tempDir, resolve(cliDir, entryFile))
        ),
        include: [],
        compilerOptions: {
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          rootDir: toConfigRelativePath(tempDir, srcDir),
          moduleResolution: 'bundler',
          module: 'esnext',
          target: 'es2020',
          lib: ['es2020', 'es2022'],
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          declaration: true,
          emitDeclarationOnly: true,
          paths: {
            '@reference-ui/styled': [toConfigRelativePath(tempDir, styledDir)],
            '@reference-ui/styled/*': [toConfigRelativePath(tempDir, join(styledDir, '*'))],
          },
          verbatimModuleSyntax: true,
          isolatedModules: false,
        },
      },
      null,
      2
    ),
    'utf-8'
  )

  return tsconfigPath
}
