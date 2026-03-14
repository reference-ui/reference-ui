import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const REFERENCE_RS_PACKAGE = '@reference-ui/reference-rs'
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const packagesDir = join(repoRoot, 'packages')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    ...options,
  })
}

function listPublicPackages() {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name, 'package.json'))
    .filter((packageJsonPath) => existsSync(packageJsonPath))
    .map((packageJsonPath) => {
      const pkg = readJson(packageJsonPath)
      return {
        dir: dirname(packageJsonPath),
        name: pkg.name,
        private: pkg.private === true,
        version: pkg.version,
      }
    })
    .filter((pkg) => !pkg.private)
}

function isPublished(name, version) {
  try {
    const output = execFileSync('npm', ['view', `${name}@${version}`, 'version', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    return output.length > 0
  } catch {
    return false
  }
}

const unpublishedPackages = listPublicPackages().filter((pkg) => !isPublished(pkg.name, pkg.version))
if (unpublishedPackages.length === 0) {
  console.log('No unpublished workspace packages found.')
  process.exit(0)
}

if (unpublishedPackages.some((pkg) => pkg.name === REFERENCE_RS_PACKAGE)) {
  console.log('Publishing native packages for @reference-ui/reference-rs')
  run('pnpm', ['--filter', REFERENCE_RS_PACKAGE, 'run', 'publish:native'])
}

console.log('Publishing workspace packages with Changesets')
run('pnpm', ['exec', 'changeset', 'publish'])
