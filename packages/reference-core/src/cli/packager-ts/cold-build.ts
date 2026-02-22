import * as ts from 'typescript'
import { join, dirname } from 'node:path'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { log } from '../lib/log'
import type { ReferenceUIConfig } from '../config'

/**
 * Run one-shot TypeScript declaration generation from bundled .js files.
 * Reads .js from node_modules/@reference-ui/* and emits .d.ts alongside.
 */
export async function runColdBuild(
  cwd: string,
  packages: Array<{ name: string; entry: string }>,
  _config: ReferenceUIConfig
): Promise<void> {
  let emittedCount = 0

  for (const pkg of packages) {
    const packageDir = join(cwd, 'node_modules', pkg.name)
    const entryPath = join(packageDir, pkg.entry)

    if (!existsSync(entryPath)) {
      log(`[packager-ts] Skipping ${pkg.name} (no ${pkg.entry})`)
      continue
    }

    log(`[packager-ts] Generating types for ${pkg.name}...`)

    const options: ts.CompilerOptions = {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
      outDir: packageDir,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      skipLibCheck: true,
    }

    const program = ts.createProgram([entryPath], options)

    program.emit(
      undefined,
      (fileName, data) => {
        mkdirSync(dirname(fileName), { recursive: true })
        writeFileSync(fileName, data, 'utf-8')
        emittedCount++
      },
      undefined,
      true
    )
  }

  if (emittedCount > 0) {
    log(`[packager-ts] Emitted ${emittedCount} declaration(s)`)
  }
}
