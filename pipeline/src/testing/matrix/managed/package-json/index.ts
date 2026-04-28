/**
 * Managed package.json generation for matrix workspaces.
 *
 * This folder owns both package.json shapes used by matrix testing:
 * - the monorepo fixture package.json managed by pipeline for local commands
 * - the synthetic consumer package.json generated inside Dagger
 */

import type { MatrixPackageConfig } from '../../discovery/index.js'
import { getManagedBundlerDevDependencies } from '../bundlers/index.js'
import { getManagedReactProfile } from '../react/index.js'

export interface MatrixFixturePackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: unknown
  name: string
  private?: boolean
  scripts?: Record<string, string>
  type?: string
  version?: string
}

interface MatrixConsumerPackageJsonOptions {
  fixturePackageJson: MatrixFixturePackageJson
  internalTarballSpecifiers?: Readonly<Record<string, string>>
}

interface ManagedMatrixPackageJsonOptions {
  config: Pick<MatrixPackageConfig, 'bundlers' | 'react'>
  existingPackageJson?: Partial<MatrixFixturePackageJson>
  packageName: string
}

const managedDependencies = {
  '@reference-ui/core': 'workspace:*',
  '@reference-ui/lib': 'workspace:*',
} as const

const managedDevDependencies = {
  '@types/node': '^25.1.0',
  typescript: '~5.9.3',
  vitest: '^4.0.18',
} as const

const managedIgnoredBuiltDependencies = [
  '@parcel/watcher',
  '@swc/core',
  'esbuild',
  'nx',
] as const

function omitManagedDependencies(
  dependencies: Record<string, string> | undefined,
  managedNames: readonly string[],
): Record<string, string> | undefined {
  if (!dependencies) {
    return undefined
  }

  const filteredEntries = Object.entries(dependencies)
    .filter(([packageName]) => !managedNames.includes(packageName))
    .sort(([left], [right]) => left.localeCompare(right))

  return filteredEntries.length > 0 ? Object.fromEntries(filteredEntries) : undefined
}

function pipelineCliTestCommand(packageName: string): string {
  return `pnpm --dir ../../pipeline exec tsx src/cli.ts test --packages=${packageName}`
}

function pipelineCliSetupCommand(packageName: string): string {
  return `pnpm --dir ../../pipeline exec tsx src/cli.ts setup --packages=${packageName} --sync`
}

function isPipelineManagedScript(command: string | undefined): boolean {
  return typeof command === 'string' && command.includes('src/cli.ts')
}

function replaceWorkspaceProtocolVersions(
  dependencies: Record<string, string> | undefined,
  internalTarballSpecifiers: Readonly<Record<string, string>>,
): Record<string, string> | undefined {
  if (!dependencies) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([packageName, version]) => [
      packageName,
      version.startsWith('workspace:') ? (internalTarballSpecifiers[packageName] ?? version) : version,
    ]),
  )
}

export function createManagedMatrixPackageJson(options: ManagedMatrixPackageJsonOptions): string {
  const existingPackageJson: Partial<MatrixFixturePackageJson> = options.existingPackageJson ?? {}
  const reactProfile = getManagedReactProfile(options.config.react)
  const bundlerDevDependencies = getManagedBundlerDevDependencies(options.config.bundlers)
  const extraDependencies = omitManagedDependencies(
    existingPackageJson.dependencies,
    [...Object.keys(managedDependencies), ...Object.keys(reactProfile.dependencies)],
  )
  const extraDevDependencies = omitManagedDependencies(
    existingPackageJson.devDependencies,
    [...Object.keys(managedDevDependencies), ...Object.keys(reactProfile.devDependencies), ...Object.keys(bundlerDevDependencies)],
  )
  const rawSetupCommand = existingPackageJson.scripts?.sync
    ?? (existingPackageJson.scripts?.setup && !isPipelineManagedScript(existingPackageJson.scripts.setup)
      ? existingPackageJson.scripts.setup
      : undefined)
    ?? 'pnpm exec ref sync'

  return `${JSON.stringify(
    {
      name: options.packageName,
      version: existingPackageJson.version ?? '0.0.1',
      private: true,
      type: existingPackageJson.type ?? 'module',
      scripts: {
        setup: pipelineCliSetupCommand(options.packageName),
        test: pipelineCliTestCommand(options.packageName),
        sync: rawSetupCommand,
      },
      exports: existingPackageJson.exports ?? { '.': './src/index.ts' },
      dependencies: {
        ...managedDependencies,
        ...reactProfile.dependencies,
        ...extraDependencies,
      },
      devDependencies: {
        ...managedDevDependencies,
        ...reactProfile.devDependencies,
        ...bundlerDevDependencies,
        ...extraDevDependencies,
      },
    },
    null,
    2,
  )}\n`
}

export function createMatrixConsumerPackageJson(
  options: MatrixConsumerPackageJsonOptions,
): string {
  return `${JSON.stringify(
    {
      ...options.fixturePackageJson,
      ignoredBuiltDependencies: managedIgnoredBuiltDependencies,
      scripts: undefined,
      dependencies: replaceWorkspaceProtocolVersions(
        options.fixturePackageJson.dependencies,
        options.internalTarballSpecifiers ?? {},
      ),
      devDependencies: replaceWorkspaceProtocolVersions(
        options.fixturePackageJson.devDependencies,
        options.internalTarballSpecifiers ?? {},
      ),
    },
    null,
    2,
  )}\n`
}
