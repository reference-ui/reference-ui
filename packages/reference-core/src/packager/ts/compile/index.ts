import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { findDtsFile } from './find-dts'
import { createTempTsconfig } from './create-temp-tsconfig'

function copyFileAtomic(sourcePath: string, targetPath: string): void {
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`
  copyFileSync(sourcePath, tempPath)
  renameSync(tempPath, targetPath)
}

function toModuleSpecifier(fromDir: string, targetPath: string): string {
  const relativePath = relative(fromDir, targetPath).replaceAll('\\', '/')
  const withoutExtension = relativePath.replace(/\.[cm]?[jt]sx?$/, '')
  return withoutExtension.startsWith('.') ? withoutExtension : `./${withoutExtension}`
}

function writeCompileEntry(tempDir: string, sourceEntryPath: string): string {
  const entryPath = join(tempDir, 'entry.ts')
  writeFileSync(
    entryPath,
    `export * from ${JSON.stringify(toModuleSpecifier(tempDir, sourceEntryPath))}\n`,
    'utf-8'
  )
  return entryPath
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
  const entryPath = writeCompileEntry(tempDir, resolve(cliDir, entryFile))
  const tempTsconfigPath = createTempTsconfig({
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
        entry: [entryPath],
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

    const tmpDtsPath = findDtsFile(tmpOut)
    if (!tmpDtsPath) {
      throw new Error(`tsdown did not produce .d.ts or .d.mts in ${tmpOut}`)
    }

    mkdirSync(dirname(outDtsPath), { recursive: true })
    copyFileAtomic(tmpDtsPath, outDtsPath)
    return outDtsPath
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}
