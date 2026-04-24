/**
 * Workspace discovery and process execution helpers for the pipeline.
 *
 * The rest of the pipeline intentionally depends on this module for package
 * enumeration and child-process execution so those concerns stay consistent.
 */

import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registryPackageNames, releasePackageNames, workspacePackageRoots } from '../../config.js'
import { failStep, finishStep, formatDuration, startStep, writeFailureOutput } from '../lib/log/index.js'
import type { WorkspacePackage } from './types.js'

const buildDir = dirname(fileURLToPath(import.meta.url))

export const repoRoot = resolve(buildDir, '..', '..', '..')
export const pipelineStateDir = resolve(repoRoot, '.pipeline')
export const defaultNpmRegistryUrl = 'https://registry.npmjs.org'

function loadRepoEnvFile(envFilePath: string = resolve(repoRoot, '.env'), env: NodeJS.ProcessEnv = process.env): void {
  if (!existsSync(envFilePath)) {
    return
  }

  const contents = readFileSync(envFilePath, 'utf8')

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim()

    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(key) || env[key] !== undefined) {
      continue
    }

    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }
}

function npmAuthConfigKey(registryUrl: string): string {
  const url = new URL(registryUrl)
  const normalizedPath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`

  return `//${url.host}${normalizedPath}:_authToken`
}

function npmAuthUserConfigPath(registryUrl: string): string {
  const url = new URL(registryUrl)
  const safeRegistryName = `${url.host}${url.pathname}`.replace(/[^a-z0-9]+/giu, '-').replace(/^-|-$/gu, '') || 'registry'

  return resolve(pipelineStateDir, 'npm', `${safeRegistryName}.npmrc`)
}

function sanitizeBaseNpmUserConfig(baseUserConfig: string, registryUrl: string): string {
  if (baseUserConfig.length === 0) {
    return ''
  }

  const authKey = npmAuthConfigKey(registryUrl)

  return baseUserConfig
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith(`${authKey}=`))
    .filter((line) => line !== 'always-auth=true')
    .join('\n')
}

function readBaseNpmUserConfig(env: NodeJS.ProcessEnv, generatedUserConfigPath: string): string {
  const configuredUserConfigPath = env.NPM_CONFIG_USERCONFIG ?? env.npm_config_userconfig
  const baseUserConfigPath = configuredUserConfigPath && configuredUserConfigPath !== generatedUserConfigPath
    ? configuredUserConfigPath
    : resolve(homedir(), '.npmrc')

  if (!existsSync(baseUserConfigPath)) {
    return ''
  }

  return readFileSync(baseUserConfigPath, 'utf8').trim()
}

export function createNpmCommandEnv(
  registryUrl: string = defaultNpmRegistryUrl,
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const token = env.NODE_AUTH_TOKEN ?? env.NPM_TOKEN

  if (!token) {
    return env
  }

  const userConfigPath = npmAuthUserConfigPath(registryUrl)
  const baseUserConfig = sanitizeBaseNpmUserConfig(readBaseNpmUserConfig(env, userConfigPath), registryUrl)
  const authConfig = `${npmAuthConfigKey(registryUrl)}=${token}`
  const userConfigContents = [
    baseUserConfig,
    authConfig,
  ].filter((entry) => entry.length > 0).join('\n') + '\n'

  mkdirSync(dirname(userConfigPath), { recursive: true })
  writeFileSync(userConfigPath, userConfigContents)

  return {
    ...env,
    NODE_AUTH_TOKEN: token,
    NPM_CONFIG_USERCONFIG: userConfigPath,
    NPM_TOKEN: token,
    npm_config_userconfig: userConfigPath,
  }
}

loadRepoEnvFile()

interface RunOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  interactive?: boolean
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
  const spinner = options.label && !options.interactive ? startStep(options.label) : null

  if (options.label && options.interactive) {
    console.log(`${options.label}...`)
  }

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? repoRoot,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: options.interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
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

    if (!options.interactive) {
      child.stdout?.on('data', (chunk: Buffer | string) => {
        stdout += chunk.toString()
      })

      child.stderr?.on('data', (chunk: Buffer | string) => {
        stderr += chunk.toString()
      })
    }

    child.on('error', (error) => {
      settle(() => {
        if (spinner) {
          failStep(spinner, options.label ?? `${command} failed`)
        }
        if (!options.interactive) {
          writeFailureOutput(stdout, 'stdout')
          writeFailureOutput(stderr, 'stderr')
        }
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
        if (!options.interactive) {
          writeFailureOutput(stdout, 'stdout')
          writeFailureOutput(stderr, 'stderr')
        }

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

export function listNamedWorkspacePackages(packageNames: readonly string[]): WorkspacePackage[] {
  const selectedNames = new Set<string>(packageNames)

  return listWorkspacePackages().filter((pkg) => selectedNames.has(pkg.name))
}

export function listRegistryWorkspacePackages(packageNames: readonly string[] = registryPackageNames): WorkspacePackage[] {
  const registryNames = new Set<string>(packageNames)

  return listWorkspacePackages().filter((pkg) => registryNames.has(pkg.name))
}

export function listReleaseWorkspacePackages(): WorkspacePackage[] {
  return listNamedWorkspacePackages(releasePackageNames)
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