import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { workspacePackageRoots } from '../../config.js'
import { failStep, finishStep, formatDuration, startStep, writeFailureOutput } from '../lib/log/index.js'

export interface WorkspacePackage {
  dependencies: Record<string, string>
  dir: string
  name: string
  private: boolean
  scripts: Record<string, string>
  version: string
}

const buildDir = dirname(fileURLToPath(import.meta.url))

export const repoRoot = resolve(buildDir, '..', '..', '..')
export const pipelineStateDir = resolve(repoRoot, '.pipeline')

interface RunOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  label?: string
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

function listConfiguredPackageJsonPaths(): string[] {
  const packageJsonPaths = new Set<string>()

  for (const packageRoot of workspacePackageRoots) {
    const absoluteRoot = resolve(repoRoot, packageRoot)
    if (!existsSync(absoluteRoot)) {
      continue
    }

    for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue
      }

      const packageJsonPath = join(absoluteRoot, entry.name, 'package.json')
      if (!existsSync(packageJsonPath)) {
        continue
      }

      packageJsonPaths.add(packageJsonPath)
    }
  }

  return [...packageJsonPaths].sort((left, right) => left.localeCompare(right))
}

export async function run(command: string, args: string[], options: RunOptions = {}): Promise<void> {
  const startedAt = Date.now()
  const spinner = options.label ? startStep(options.label) : null

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let settled = false

    let stdout = ''
    let stderr = ''

    const settle = (handler: () => void) => {
      if (settled) {
        return
      }

      settled = true
      handler()
    }

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString()
    })

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      settle(() => {
        if (spinner) {
          failStep(spinner, options.label ?? `${command} failed`)
        }
        writeFailureOutput(stdout, 'stdout')
        writeFailureOutput(stderr, 'stderr')
        rejectPromise(error)
      })
    })

    child.on('close', (code, signal) => {
      if (code === 0) {
        settle(() => {
          if (spinner && options.label) {
            finishStep(spinner, `${options.label} (${formatDuration(Date.now() - startedAt)})`)
          }
          resolvePromise()
        })
        return
      }

      settle(() => {
        if (spinner) {
          failStep(spinner, options.label ?? `${command} failed`)
        }
        writeFailureOutput(stdout, 'stdout')
        writeFailureOutput(stderr, 'stderr')

        if (signal) {
          rejectPromise(new Error(`Command terminated by signal ${signal}: ${command} ${args.join(' ')}`))
          return
        }

        rejectPromise(new Error(`Command failed with exit code ${code ?? 'unknown'}: ${command} ${args.join(' ')}`))
      })
    })
  })
}

export function listWorkspacePackages(): WorkspacePackage[] {
  return listConfiguredPackageJsonPaths()
    .map((packageJsonPath) => {
      const pkg = readJson<{
        dependencies?: Record<string, string>
        name: string
        private?: boolean
        scripts?: Record<string, string>
        version: string
      }>(packageJsonPath)

      return {
        dependencies: pkg.dependencies ?? {},
        dir: dirname(packageJsonPath),
        name: pkg.name,
        private: pkg.private === true,
        scripts: pkg.scripts ?? {},
        version: pkg.version,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function listPublicWorkspacePackages(): WorkspacePackage[] {
  return listWorkspacePackages().filter((pkg) => !pkg.private)
}

export function sortPackagesForInternalDependencyOrder(
  packages: readonly WorkspacePackage[],
): WorkspacePackage[] {
  const packageMap = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const incomingCount = new Map(packages.map((pkg) => [pkg.name, 0]))
  const dependents = new Map(packages.map((pkg) => [pkg.name, [] as string[]]))

  for (const pkg of packages) {
    for (const dependencyName of Object.keys(pkg.dependencies)) {
      if (!packageMap.has(dependencyName)) {
        continue
      }

      incomingCount.set(pkg.name, (incomingCount.get(pkg.name) ?? 0) + 1)
      dependents.get(dependencyName)?.push(pkg.name)
    }
  }

  const queue = packages
    .map((pkg) => pkg.name)
    .filter((name) => (incomingCount.get(name) ?? 0) === 0)
    .sort((a, b) => a.localeCompare(b))
  const sorted: WorkspacePackage[] = []

  while (queue.length > 0) {
    const name = queue.shift()

    if (!name) {
      break
    }

    const pkg = packageMap.get(name)
    if (!pkg) {
      continue
    }

    sorted.push(pkg)

    for (const dependentName of [...(dependents.get(name) ?? [])].sort((a, b) => a.localeCompare(b))) {
      const nextCount = (incomingCount.get(dependentName) ?? 0) - 1
      incomingCount.set(dependentName, nextCount)
      if (nextCount === 0) {
        queue.push(dependentName)
        queue.sort((a, b) => a.localeCompare(b))
      }
    }
  }

  if (sorted.length === packages.length) {
    return sorted
  }

  const sortedNames = new Set(sorted.map((pkg) => pkg.name))
  return [
    ...sorted,
    ...packages
      .filter((pkg) => !sortedNames.has(pkg.name))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ]
}