import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

import { artifactsDir, packageDir } from '../shared/paths'

interface PackageJson {
  name: string
  version: string
  optionalDependencies?: Record<string, string>
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
  for (const { dir: targetPackageDir, pkg } of targetPackages) {
    if (isPublished(pkg.name, pkg.version)) {
      console.log(`Skipping already published native package ${pkg.name}@${pkg.version}`)
      continue
    }

    console.log(`Publishing native package ${pkg.name}@${pkg.version}`)
    run('npm', ['publish', '--provenance', '--access', 'public'], targetPackageDir)
  }
} finally {
  writeFileSync(rootPackageJsonPath, rootPackageJsonRaw)
}
