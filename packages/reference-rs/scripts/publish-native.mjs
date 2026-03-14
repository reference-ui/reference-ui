import { existsSync, readdirSync, readFileSync } from 'node:fs'
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
  throw new Error('Missing native artifacts for @reference-ui/reference-rs publish.')
}

run('pnpm', ['run', 'create-npm-dirs'])
run('pnpm', ['run', 'artifacts'])
run('pnpm', ['run', 'prepublish:npm'])

const npmDir = join(packageDir, 'npm')
for (const entry of readdirSync(npmDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue

  const targetPackageDir = join(npmDir, entry.name)
  const pkg = readJson(join(targetPackageDir, 'package.json'))
  if (isPublished(pkg.name, pkg.version)) {
    console.log(`Skipping already published native package ${pkg.name}@${pkg.version}`)
    continue
  }

  console.log(`Publishing native package ${pkg.name}@${pkg.version}`)
  run('npm', ['publish', '--provenance', '--access', 'public'], targetPackageDir)
}

const rootPkg = readJson(join(packageDir, 'package.json'))
if (isPublished(rootPkg.name, rootPkg.version)) {
  console.log(`Skipping already published root package ${rootPkg.name}@${rootPkg.version}`)
  process.exit(0)
}

console.log(`Publishing root package ${rootPkg.name}@${rootPkg.version}`)
run('npm', ['publish', '--provenance', '--access', 'public'])
