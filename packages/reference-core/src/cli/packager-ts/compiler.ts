import * as ts from 'typescript'
import { log } from '../lib/log'

/**
 * Run TypeScript compiler programmatically to generate declarations.
 * Uses the TS API for direct control and better performance than CLI.
 */
export async function compileDeclarations(
  cwd: string,
  configPath: string
): Promise<void> {
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

  // Create compiler host (reusable across multiple files)
  const host = ts.createCompilerHost(parsedConfig.options)

  // Create the program
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options,
    host,
  })

  // Emit only declarations
  const emitResult = program.emit(
    undefined, // All files
    undefined, // Default writeFile
    undefined, // No cancellation token
    true, // Only emit .d.ts files
    undefined // No custom transformers
  )

  // Only check emit diagnostics (skip expensive pre-emit checks)
  const relevantDiagnostics = emitResult.diagnostics.filter(diagnostic => {
    if (!diagnostic.file) return false
    return !diagnostic.file.fileName.includes('node_modules')
  })

  // Log errors only
  if (relevantDiagnostics.length > 0) {
    const errors = relevantDiagnostics.filter(
      d => d.category === ts.DiagnosticCategory.Error
    )

    if (errors.length > 0) {
      for (const diagnostic of errors) {
        log.debug('packager-ts', `Error: ${formatDiagnostic(diagnostic)}`)
      }
      throw new Error(`TypeScript compilation failed with ${errors.length} error(s)`)
    }
  }

  if (emitResult.emitSkipped) {
    throw new Error('TypeScript emit was skipped')
  }
}

/**
 * Format a TypeScript diagnostic message for display
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
