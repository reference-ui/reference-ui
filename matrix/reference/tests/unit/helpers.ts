import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const packageRoot = process.cwd()

export const typesPackageDir = join(packageRoot, '.reference-ui', 'types')
export const typesTastyDir = join(typesPackageDir, 'tasty')
export const typesPackageManifestPath = join(typesTastyDir, 'manifest.js')
export const typesPackageJsonPath = join(typesPackageDir, 'package.json')
export const installedTypesPackageDir = join(
  packageRoot,
  'node_modules',
  '@reference-ui',
  'types',
)

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 8_000,
  intervalMs = 50,
): Promise<boolean> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  return predicate()
}

export async function waitForReferenceArtifacts(timeoutMs = 8_000): Promise<boolean> {
  return waitFor(() => existsSync(typesPackageManifestPath), timeoutMs)
}

export async function waitForTypesPackage(timeoutMs = 8_000): Promise<boolean> {
  return waitFor(
    () => existsSync(typesPackageManifestPath) && existsSync(typesPackageJsonPath),
    timeoutMs,
  )
}

export async function createReferenceTestApi(manifestPath = typesPackageManifestPath) {
  const coreTastyApiPath = join(
    packageRoot,
    'node_modules',
    '@reference-ui',
    'core',
    'src',
    'reference',
    'tasty',
    'api.ts',
  )
  const { createReferenceUiTastyApi } = await import(pathToFileURL(coreTastyApiPath).href)

  return createReferenceUiTastyApi({ manifestPath })
}

export function runRefCommand(...args: string[]): string {
  try {
    return execFileSync('pnpm', ['exec', 'ref', ...args], {
      cwd: packageRoot,
      env: { ...process.env, FORCE_COLOR: '0' },
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    }).toString('utf8')
  } catch (error) {
    if (!(error instanceof Error) || !('stdout' in error) || !('stderr' in error)) {
      throw error
    }

    const stdout = Buffer.isBuffer(error.stdout)
      ? error.stdout.toString('utf8')
      : String(error.stdout)
    const stderr = Buffer.isBuffer(error.stderr)
      ? error.stderr.toString('utf8')
      : String(error.stderr)

    throw new Error(
      [
        `ref ${args.join(' ')} failed`,
        '',
        'stdout:',
        stdout.trim() || '(empty)',
        '',
        'stderr:',
        stderr.trim() || '(empty)',
      ].join('\n'),
    )
  }
}