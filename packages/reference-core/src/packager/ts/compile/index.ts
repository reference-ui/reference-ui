import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { findDtsFile } from './find-dts'
import { createTempTsconfig } from './create-temp-tsconfig'

function copyFileAtomic(sourcePath: string, targetPath: string): void {
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`
  copyFileSync(sourcePath, tempPath)
  renameSync(tempPath, targetPath)
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
  const tmpOut = realpathSync(mkdtempSync(join(tmpdir(), 'ref-ui-dts-')))
  const tempTsconfigPath = createTempTsconfig({
    cliDir,
    projectCwd,
    tempDir: tmpOut,
  })

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

    const tmpDtsPath = findDtsFile(tmpOut)
    if (!tmpDtsPath) {
      throw new Error(`tsdown did not produce .d.ts or .d.mts in ${tmpOut}`)
    }

    mkdirSync(dirname(outDtsPath), { recursive: true })
    copyFileAtomic(tmpDtsPath, outDtsPath)
    return outDtsPath
  } finally {
    rmSync(tmpOut, { recursive: true, force: true })
  }
}
