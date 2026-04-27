/**
 * Managed package.json generation for matrix workspaces.
 *
 * This folder owns both package.json shapes used by matrix testing:
 * - the monorepo fixture package.json managed by pipeline for local commands
 * - the synthetic consumer package.json generated inside Dagger
 */

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
  coreVersion: string
  fixturePackageJson: MatrixFixturePackageJson
  libVersion: string
}

interface ManagedMatrixPackageJsonOptions {
  existingPackageJson?: Partial<MatrixFixturePackageJson>
  packageName: string
}

const managedDependencies = {
  '@reference-ui/core': 'workspace:*',
  '@reference-ui/lib': 'workspace:*',
  react: '^19.2.0',
  'react-dom': '^19.2.0',
} as const

const managedDevDependencies = {
  '@types/node': '^25.1.0',
  '@types/react': '^19.2.2',
  '@types/react-dom': '^19.2.2',
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

function pipelineCliCommand(command: 'setup' | 'test', packageName: string): string {
  return `pnpm --dir ../../pipeline exec tsx src/cli.ts ${command} --packages=${packageName}`
}

function isPipelineManagedScript(command: string | undefined): boolean {
  return typeof command === 'string' && command.includes('src/cli.ts')
}

function replaceWorkspaceProtocolVersions(
  dependencies: Record<string, string> | undefined,
  versionOverrides: Readonly<Record<string, string>>,
): Record<string, string> | undefined {
  if (!dependencies) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([packageName, version]) => [
      packageName,
      version.startsWith('workspace:') ? (versionOverrides[packageName] ?? version) : version,
    ]),
  )
}

export function createManagedMatrixPackageJson(options: ManagedMatrixPackageJsonOptions): string {
  const existingPackageJson: Partial<MatrixFixturePackageJson> = options.existingPackageJson ?? {}
  const extraDependencies = omitManagedDependencies(
    existingPackageJson.dependencies,
    Object.keys(managedDependencies),
  )
  const extraDevDependencies = omitManagedDependencies(
    existingPackageJson.devDependencies,
    Object.keys(managedDevDependencies),
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
        setup: pipelineCliCommand('setup', options.packageName),
        test: pipelineCliCommand('test', options.packageName),
        sync: rawSetupCommand,
      },
      exports: existingPackageJson.exports ?? { '.': './src/index.ts' },
      dependencies: {
        ...managedDependencies,
        ...extraDependencies,
      },
      devDependencies: {
        ...managedDevDependencies,
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
  const versionOverrides = {
    '@reference-ui/core': options.coreVersion,
    '@reference-ui/lib': options.libVersion,
  }

  return `${JSON.stringify(
    {
      ...options.fixturePackageJson,
      ignoredBuiltDependencies: managedIgnoredBuiltDependencies,
      scripts: undefined,
      dependencies: replaceWorkspaceProtocolVersions(options.fixturePackageJson.dependencies, versionOverrides),
      devDependencies: replaceWorkspaceProtocolVersions(options.fixturePackageJson.devDependencies, versionOverrides),
    },
    null,
    2,
  )}\n`
}
