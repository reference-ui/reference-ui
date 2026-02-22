import * as ts from 'typescript'
import { log } from '../lib/log'

/**
 * Run TypeScript compiler using the programmatic API.
 * Generates declarations directly without spawning a child process.
 */
export async function runTsc(cwd: string, configPath: string): Promise<void> {
  // Read and parse the tsconfig
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  if (configFile.error) {
    throw new Error(formatDiagnostic(configFile.error))
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd,
    undefined,
    configPath
  )

  if (parsedConfig.errors.length > 0) {
    const errors = parsedConfig.errors.map(formatDiagnostic).join('\n')
    throw new Error(`TypeScript config errors:\n${errors}`)
  }

  log(`[packager-ts] Compiling ${parsedConfig.fileNames.length} files...`)

  // Create the program
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
  })

  // Emit only declarations
  const emitResult = program.emit(
    undefined, // All files
    undefined, // Default writeFile
    undefined, // No cancellation token
    true, // Only emit .d.ts files
    undefined // No custom transformers
  )

  // Collect diagnostics
  const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)

  // Filter out errors we want to ignore (e.g., from node_modules)
  const relevantDiagnostics = allDiagnostics.filter(diagnostic => {
    if (!diagnostic.file) return false
    return !diagnostic.file.fileName.includes('node_modules')
  })

  // Log warnings but don't fail
  if (relevantDiagnostics.length > 0) {
    for (const diagnostic of relevantDiagnostics) {
      if (diagnostic.category === ts.DiagnosticCategory.Error) {
        log(`[packager-ts] Error: ${formatDiagnostic(diagnostic)}`)
      } else {
        log(`[packager-ts] Warning: ${formatDiagnostic(diagnostic)}`)
      }
    }

    // Only fail on actual errors
    const errors = relevantDiagnostics.filter(
      d => d.category === ts.DiagnosticCategory.Error
    )
    if (errors.length > 0) {
      throw new Error(`TypeScript compilation failed with ${errors.length} error(s)`)
    }
  }

  if (emitResult.emitSkipped) {
    throw new Error('TypeScript emit was skipped')
  }

  log(`[packager-ts] ✓ Emitted declarations`)
}

/**
 * Format a TypeScript diagnostic message
 */
function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  if (diagnostic.file && diagnostic.start !== undefined) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start
    )
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
  }
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
}
