import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnMonitoredAsync } from '../../../lib/child-process'

interface DeclarationDiagnosticsOptions {
  cliDir: string
  entryFile: string
  tempTsconfigPath: string
  tempDir: string
  projectCwd: string
}

interface DeclarationEmitOptions {
  cliDir: string
  projectCwd: string
  tempTsconfigPath: string
  outDir: string
}

const MAX_DIAGNOSTIC_OUTPUT_CHARS = 12000

function toConfigRelativePath(fromDir: string, targetPath: string): string {
  const relativePath = relative(fromDir, targetPath).replaceAll('\\', '/')
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

function trimDiagnosticOutput(output: string): string {
  if (output.length <= MAX_DIAGNOSTIC_OUTPUT_CHARS) {
    return output
  }

  return `${output.slice(0, MAX_DIAGNOSTIC_OUTPUT_CHARS)}\n...[diagnostics truncated]`
}

function resolveTypescriptCli(projectCwd: string, cliDir: string): string | null {
  const require = createRequire(import.meta.url)

  try {
    return require.resolve('typescript/lib/tsc', {
      paths: [projectCwd, cliDir],
    })
  } catch {
    return null
  }
}

export async function emitDeclarationsWithTypescript(
  options: DeclarationEmitOptions
): Promise<boolean> {
  const { cliDir, projectCwd, tempTsconfigPath, outDir } = options
  const typescriptCliPath = resolveTypescriptCli(projectCwd, cliDir)

  if (!typescriptCliPath) {
    return false
  }

  const { code } = await spawnMonitoredAsync(
    process.execPath,
    [
      typescriptCliPath,
      '--pretty',
      'false',
      '--project',
      tempTsconfigPath,
      '--outDir',
      outDir,
    ],
    {
      cwd: cliDir,
      processName: 'packager-ts-tsc-emit',
      logCategory: 'packager:ts',
    }
  )

  return code === 0
}

function writeDiagnosticsTsconfig(options: DeclarationDiagnosticsOptions): string {
  const { cliDir, entryFile, tempTsconfigPath, tempDir } = options
  const config = JSON.parse(readFileSync(tempTsconfigPath, 'utf-8')) as {
    compilerOptions?: Record<string, unknown>
  }
  const diagnosticsTsconfigPath = join(tempDir, 'tsconfig.ref-ui-dts-diagnostics.json')

  writeFileSync(
    diagnosticsTsconfigPath,
    JSON.stringify(
      {
        ...config,
        compilerOptions: {
          ...(config.compilerOptions ?? {}),
          noEmit: true,
          emitDeclarationOnly: false,
        },
        files: [toConfigRelativePath(dirname(diagnosticsTsconfigPath), resolve(cliDir, entryFile))],
      },
      null,
      2
    ),
    'utf-8'
  )

  return diagnosticsTsconfigPath
}

export async function collectDeclarationDiagnostics(
  options: DeclarationDiagnosticsOptions
): Promise<string> {
  const { cliDir, projectCwd } = options
  const typescriptCliPath = resolveTypescriptCli(projectCwd, cliDir)

  if (!typescriptCliPath) {
    return 'diagnostics: TypeScript CLI could not be resolved from the current runtime.'
  }

  const diagnosticsTsconfigPath = writeDiagnosticsTsconfig(options)
  const { code, signal, stderr, stdout } = await spawnMonitoredAsync(
    process.execPath,
    [typescriptCliPath, '--pretty', 'false', '--project', diagnosticsTsconfigPath],
    {
      cwd: cliDir,
      processName: 'packager-ts-diagnostics',
      logCategory: 'packager:ts',
    }
  )

  const output = trimDiagnosticOutput((stderr || stdout).trim())

  if (code === 0) {
    return output.length > 0
      ? `diagnostics: direct TypeScript diagnostic run exited cleanly and reported:\n${output}`
      : 'diagnostics: direct TypeScript diagnostic run exited cleanly and reported no errors.'
  }

  const status = code === null ? `signal ${signal ?? 'unknown'}` : `code ${code}`
  return output.length > 0
    ? `diagnostics: direct TypeScript diagnostic run failed with ${status}:\n${output}`
    : `diagnostics: direct TypeScript diagnostic run failed with ${status}, but produced no stdout/stderr.`
}