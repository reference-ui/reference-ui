import * as ts from 'typescript'
import { join, dirname, resolve } from 'node:path'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { log } from '../lib/log'
import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'

/**
 * Generate TypeScript declarations from the TypeScript SOURCE, not from bundled .js.
 * Reading .js with allowJs loses all the rich types (PrimitiveProps<T>, BoxProps, etc.)
 * - we need the actual source typings.
 */
export async function runColdBuild(
  cwd: string,
  packages: Array<{ name: string; sourceEntry: string; outFile: string }>,
  _config: ReferenceUIConfig
): Promise<void> {
  const coreDir = resolveCorePackageDir(cwd)

  for (const pkg of packages) {
    const packageDir = join(cwd, 'node_modules', pkg.name)
    const entryPath = resolve(coreDir, pkg.sourceEntry)

    if (!existsSync(entryPath)) {
      log(`[packager-ts] Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
      continue
    }

    log(`[packager-ts] Generating types for ${pkg.name} from source...`)

    mkdirSync(packageDir, { recursive: true })

    const options: ts.CompilerOptions = {
      declaration: true,
      emitDeclarationOnly: true,
      outDir: packageDir,
      rootDir: coreDir,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      skipLibCheck: true,
      declarationMap: false,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: 'react',
    }

    const program = ts.createProgram([entryPath], options)
    const emitResult = program.emit(
      undefined,
      (fileName, data) => {
        mkdirSync(dirname(fileName), { recursive: true })
        writeFileSync(fileName, data, 'utf-8')
      },
      undefined,
      true
    )

    if (emitResult.diagnostics.length > 0) {
      const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: p => p,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => '\n',
      }
      log(ts.formatDiagnosticsWithColorAndContext(emitResult.diagnostics, formatHost))
    }

    // Update package.json types to point at the emitted entry .d.ts
    // Entry src/entry/react.ts -> packageDir/src/entry/react.d.ts
    const typesPath = `./${pkg.sourceEntry.replace(/\.tsx?$/, '.d.ts')}`
    const pkgJsonPath = join(packageDir, 'package.json')
    if (existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
      pkgJson.types = typesPath
      if (pkgJson.exports && pkgJson.exports['.']) {
        pkgJson.exports['.'].types = typesPath
      }
      writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
    }

    log(`[packager-ts] Emitted declarations (types: ${typesPath})`)
  }
}
