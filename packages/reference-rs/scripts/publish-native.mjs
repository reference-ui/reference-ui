import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { artifactsDir, packageDir } from './paths.mjs'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function run(command, args, cwd = packageDir) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  })
}

function isPublished(name, version) {
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
const targetPackages = []

for (const entry of readdirSync(npmDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const targetPackageDir = join(npmDir, entry.name)
  const pkg = readJson(join(targetPackageDir, 'package.json'))
  targetPackages.push({ dir: targetPackageDir, pkg })
}

const rootPackageJsonPath = join(packageDir, 'package.json')
const rootPackageJsonRaw = readFileSync(rootPackageJsonPath, 'utf8')
const rootPkg = JSON.parse(rootPackageJsonRaw)
rootPkg.optionalDependencies = Object.fromEntries(
  targetPackages.map(({ pkg }) => [pkg.name, pkg.version])
)
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

  if (isPublished(rootPkg.name, rootPkg.version)) {
    console.log(`Skipping already published root package ${rootPkg.name}@${rootPkg.version}`)
    process.exit(0)
  }

  console.log(`Publishing root package ${rootPkg.name}@${rootPkg.version}`)
  run('npm', ['publish', '--provenance', '--access', 'public'])
} finally {
  writeFileSync(rootPackageJsonPath, rootPackageJsonRaw)
}
