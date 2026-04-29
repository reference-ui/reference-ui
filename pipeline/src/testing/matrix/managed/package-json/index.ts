/**
 * Managed package.json generation for matrix workspaces.
 *
 * This folder owns both package.json shapes used by matrix testing:
 * - the monorepo fixture package.json managed by pipeline for local commands
 * - the synthetic consumer package.json generated inside Dagger
 */

import type { MatrixPackageConfig } from '../../discovery/index.js'
import { getPreferredLocalMatrixBundlers } from '../../discovery/index.js'
import { getManagedBundlerDevDependencies } from '../bundlers/index.js'
import { getManagedReactProfile } from '../react/index.js'
import {
  createTemplateEntries,
  managedGeneratedNotice,
  renderManagedTemplate,
} from '../template.js'

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
  bundlers: readonly MatrixPackageConfig['bundlers'][number][]
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
  const bundlerDevDependencies = getManagedBundlerDevDependencies(
    getPreferredLocalMatrixBundlers(options.config.bundlers),
  )
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

  return renderManagedTemplate(new URL('./templates/fixture-package.json.liquid', import.meta.url), {
    dependencies: createTemplateEntries({
      ...managedDependencies,
      ...reactProfile.dependencies,
      ...extraDependencies,
    }),
    devDependencies: createTemplateEntries({
      ...managedDevDependencies,
      ...reactProfile.devDependencies,
      ...bundlerDevDependencies,
      ...extraDevDependencies,
    }),
    exportsValue: JSON.stringify(existingPackageJson.exports ?? { '.': './src/index.ts' }),
    generatedNotice: JSON.stringify(managedGeneratedNotice),
    name: JSON.stringify(options.packageName),
    privateValue: 'true',
    scripts: createTemplateEntries({
      setup: pipelineCliSetupCommand(options.packageName),
      test: pipelineCliTestCommand(options.packageName),
      sync: rawSetupCommand,
    }),
    type: JSON.stringify(existingPackageJson.type ?? 'module'),
    version: JSON.stringify(existingPackageJson.version ?? '0.0.1'),
  })
}

export function createMatrixConsumerPackageJson(
  options: MatrixConsumerPackageJsonOptions,
): string {
  return renderManagedTemplate(new URL('./templates/consumer-package.json.liquid', import.meta.url), {
    dependencies: createTemplateEntries(
      replaceWorkspaceProtocolVersions(
        options.fixturePackageJson.dependencies,
        options.internalTarballSpecifiers ?? {},
      ),
    ),
    devDependencies: createTemplateEntries({
      ...replaceWorkspaceProtocolVersions(
        options.fixturePackageJson.devDependencies,
        options.internalTarballSpecifiers ?? {},
      ),
      ...getManagedBundlerDevDependencies(options.bundlers),
    }),
    generatedNotice: JSON.stringify(managedGeneratedNotice),
    ignoredBuiltDependencies: createTemplateEntries(
      Object.fromEntries(managedIgnoredBuiltDependencies.map((dependency, index) => [String(index), dependency])),
    ),
    name: JSON.stringify(options.fixturePackageJson.name),
    privateValue: JSON.stringify(options.fixturePackageJson.private ?? true),
    type: JSON.stringify(options.fixturePackageJson.type ?? 'module'),
    version: JSON.stringify(options.fixturePackageJson.version ?? '0.0.1'),
  })
}
