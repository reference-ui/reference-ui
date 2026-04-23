/**
 * Matrix consumer package.json generation.
 *
 * The matrix runner synthesizes a downstream consumer inside Dagger so it can
 * install from the staged Verdaccio registry instead of the workspace while
 * still preserving the fixture's own scripts and dependency shape.
 */

export interface MatrixFixturePackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: unknown
  name: string
  private?: boolean
  scripts?: Record<string, string>
  type?: string
}

interface MatrixConsumerPackageJsonOptions {
  coreVersion: string
  fixturePackageJson: MatrixFixturePackageJson
  libVersion: string
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
      dependencies: replaceWorkspaceProtocolVersions(options.fixturePackageJson.dependencies, versionOverrides),
      devDependencies: replaceWorkspaceProtocolVersions(options.fixturePackageJson.devDependencies, versionOverrides),
    },
    null,
    2,
  )}\n`
}