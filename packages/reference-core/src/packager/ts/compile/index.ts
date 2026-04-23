import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { findDtsFile } from './find-dts'
import { createTempTsconfig } from './create-temp-tsconfig'
import {
  collectDeclarationDiagnostics,
  emitDeclarationsWithTypescript,
} from './diagnostics'
import { getOutDirPath } from '../../../lib/paths/out-dir'

function copyFileAtomic(sourcePath: string, targetPath: string): void {
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`
  copyFileSync(sourcePath, tempPath)
  renameSync(tempPath, targetPath)
}

function describeDirectoryTree(dir: string): string {
  if (!existsSync(dir)) {
    return '(missing)'
  }

  const entries: string[] = []
  const visit = (currentDir: string, prefix = ''): void => {
    for (const name of readdirSync(currentDir).sort((left, right) => left.localeCompare(right))) {
      const path = join(currentDir, name)
      const label = prefix === '' ? name : `${prefix}/${name}`
      if (statSync(path).isDirectory()) {
        entries.push(`${label}/`)
        visit(path, label)
      } else {
        entries.push(label)
      }
    }
  }

  visit(dir)
  return entries.length > 0 ? entries.join(', ') : '(empty)'
}

function getTsdownRuntimeAssertion(tmpOut: string): string {
  if (!existsSync(tmpOut)) {
    return 'assertion: tsdown output directory is missing; runtime availability could not be confirmed.'
  }

  const emittedFiles = readdirSync(tmpOut).filter(name => name.endsWith('.mjs') || name.endsWith('.js'))
  if (emittedFiles.length > 0) {
    return `assertion: tsdown emitted JavaScript output (${emittedFiles.join(', ')}), so its runtime/native backend is available in this environment; the failure is in declaration emission, not tsdown startup.`
  }

  return 'assertion: tsdown emitted no JavaScript output; runtime availability remains inconclusive.'
}

function formatMissingDeclarationsError(options: {
  cliDir: string
  entryFile: string
  projectCwd: string
  styledDir: string
  tempTsconfigPath: string
  tmpOut: string
}): string {
  const { cliDir, entryFile, projectCwd, styledDir, tempTsconfigPath, tmpOut } = options
  const entryPath = resolve(cliDir, entryFile)
  const tempTsconfig = readFileSync(tempTsconfigPath, 'utf-8')

  return [
    `tsdown did not produce .d.ts or .d.mts in ${tmpOut}`,
    `entry: ${entryFile}`,
    `entryPath: ${entryPath} (${existsSync(entryPath) ? 'exists' : 'missing'})`,
    `cliDir: ${cliDir}`,
    `projectCwd: ${projectCwd}`,
    `styledDir: ${styledDir} (${existsSync(styledDir) ? 'exists' : 'missing'})`,
    `tmpOut contents: ${describeDirectoryTree(tmpOut)}`,
    getTsdownRuntimeAssertion(tmpOut),
    `temp tsconfig: ${tempTsconfig}`,
  ].join('\n')
}

/**
 * Compile TypeScript source to .d.mts declarations.
 * Spawns tsup, writes output to a temp dir, then copies the emitted declaration
 * to the requested target path.
 *
 * We intentionally generate a synthetic tsconfig for this run so declaration
 * bundling keeps the core package's own compile settings while resolving
 * `@reference-ui/styled` from the consumer's generated `.reference-ui/styled`
 * package. That preserves downstream token/color types without inheriting the
 * consumer project's incompatible `rootDir` or path settings.
 */
export async function compileDeclarations(
  cliDir: string,
  entryFile: string,
  outDtsPath: string,
  projectCwd: string
): Promise<string> {
  const packageDir = dirname(outDtsPath)
  mkdirSync(packageDir, { recursive: true })

  const tempDir = realpathSync(mkdtempSync(join(packageDir, '.ref-ui-dts-')))
  const tmpOut = join(tempDir, 'out')
  const styledDir = resolve(getOutDirPath(projectCwd), 'styled')
  const tempTsconfigPath = createTempTsconfig({
    cliDir,
    entryFile,
    projectCwd,
    tempDir,
  })
  mkdirSync(tmpOut, { recursive: true })

  try {
    const { build } = await import('tsdown')

    try {
      await build({
        config: false,
        cwd: cliDir,
        entry: [entryFile],
        outDir: tmpOut,
        clean: false,
        format: 'esm',
        target: 'es2020',
        tsconfig: tempTsconfigPath,
        dts: {
          resolver: 'tsc',
        },
        deps: {
          neverBundle: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            '@reference-ui/styled',
            /^@reference-ui\/styled\/.*$/,
          ],
        },
        outExtensions() {
          return { js: '.mjs', dts: '.d.mts' }
        },
        report: false,
        exports: false,
        publint: false,
        attw: false,
        unused: false,
        logLevel: 'silent',
      })
    } catch (error) {
      throw new Error(
        `tsdown build failed for ${entryFile}: ${error instanceof Error ? error.message : String(error)}`,
        {
          cause: error,
        }
      )
    }

    const tsdownDtsPath = findDtsFile(tmpOut)
    const tmpDtsPath =
      tsdownDtsPath ??
      ((await emitDeclarationsWithTypescript({
        cliDir,
        projectCwd,
        tempTsconfigPath,
        outDir: tmpOut,
      }))
        ? findDtsFile(tmpOut)
        : null)

    if (!tmpDtsPath) {
      const diagnostics = await collectDeclarationDiagnostics({
        cliDir,
        entryFile,
        tempTsconfigPath,
        tempDir,
        projectCwd,
      })

      throw new Error(
        `${formatMissingDeclarationsError({
          cliDir,
          entryFile,
          projectCwd,
          styledDir,
          tempTsconfigPath,
          tmpOut,
        })}\n${diagnostics}`
      )
    }

    mkdirSync(dirname(outDtsPath), { recursive: true })
    copyFileAtomic(tmpDtsPath, outDtsPath)
    return outDtsPath
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}
