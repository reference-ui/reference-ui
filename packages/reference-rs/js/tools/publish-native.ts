import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

import { artifactsDir, packageDir } from '../shared/paths'

interface PackageJson {
  name: string
  version: string
  optionalDependencies?: Record<string, string>
}

interface PublishOptions {
  publishRoot?: boolean
}

function shouldPublishWithProvenance(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.REF_RELEASE_PROVENANCE ?? env.NPM_CONFIG_PROVENANCE ?? env.npm_config_provenance
  return value === 'true' || value === '1'
}

function publishArgs(includeProvenance: boolean): string[] {
  return [
    'publish',
    ...(includeProvenance ? ['--provenance'] : []),
    '--access',
    'public',
  ]
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function run(command: string, args: string[], cwd = packageDir) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })
}

function isPublished(name: string, version: string) {
  try {
    const output = execFileSync('npm', ['view', `${name}@${version}`, 'version', '--json'], {
      cwd: packageDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    return output.length > 0
  } catch {
    return false
  }
}

function shouldPublishRootPackage(): boolean {
  return process.argv.includes('--publish-root')
}

function assertRootPublishIsSafe(
  rootPkg: PackageJson,
  alreadyPublishedNativePackages: readonly PackageJson[],
) {
  if (alreadyPublishedNativePackages.length === 0) {
    return
  }

  const publishedNames = alreadyPublishedNativePackages.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')
  throw new Error(
    [
      `Refusing to publish ${rootPkg.name}@${rootPkg.version} because native target packages are already published for that version.`,
      `Published native packages: ${publishedNames}.`,
      'Publishing the root package now could mix new JS artifacts with older native binaries.',
      'Cut a new version before retrying the release.',
    ].join(' '),
  )
}

function publishRootPackage(rootPkg: PackageJson) {
  if (isPublished(rootPkg.name, rootPkg.version)) {
    console.log(`Skipping already published package ${rootPkg.name}@${rootPkg.version}`)
    return
  }

  console.log(`Publishing package ${rootPkg.name}@${rootPkg.version}`)
  run('npm', publishArgs(shouldPublishWithProvenance()))
}

if (!existsSync(artifactsDir)) {
  throw new Error('Missing native artifacts for @reference-ui/rust publish.')
}

run('pnpm', ['run', 'create-npm-dirs'])
run('pnpm', ['run', 'artifacts'])

const npmDir = join(packageDir, 'npm')
const targetPackages: Array<{ dir: string; pkg: PackageJson }> = []

for (const entry of readdirSync(npmDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const targetPackageDir = join(npmDir, entry.name)
  const pkg = readJson<PackageJson>(join(targetPackageDir, 'package.json'))
  targetPackages.push({ dir: targetPackageDir, pkg })
}

const rootPackageJsonPath = join(packageDir, 'package.json')
const rootPackageJsonRaw = readFileSync(rootPackageJsonPath, 'utf8')
const rootPkg = JSON.parse(rootPackageJsonRaw) as PackageJson
rootPkg.optionalDependencies = Object.fromEntries(targetPackages.map(({ pkg }) => [pkg.name, pkg.version]))
writeFileSync(rootPackageJsonPath, `${JSON.stringify(rootPkg, null, 2)}\n`)

try {
  const alreadyPublishedNativePackages = targetPackages
    .filter(({ pkg }) => isPublished(pkg.name, pkg.version))
    .map(({ pkg }) => pkg)

  if (shouldPublishRootPackage()) {
    assertRootPublishIsSafe(rootPkg, alreadyPublishedNativePackages)
  }

  for (const { dir: targetPackageDir, pkg } of targetPackages) {
    if (alreadyPublishedNativePackages.some((publishedPkg) => publishedPkg.name === pkg.name)) {
      console.log(`Skipping already published native package ${pkg.name}@${pkg.version}`)
      continue
    }

    console.log(`Publishing native package ${pkg.name}@${pkg.version}`)
    run('npm', publishArgs(shouldPublishWithProvenance()), targetPackageDir)
  }

  if (shouldPublishRootPackage()) {
    publishRootPackage(rootPkg)
  }
} finally {
  writeFileSync(rootPackageJsonPath, rootPackageJsonRaw)
}
