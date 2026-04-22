import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RUST_PACKAGE = '@reference-ui/rust'
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const packagesDir = join(repoRoot, 'packages')

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    ...options,
  })
}

export function listPublicPackages() {
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
        dependencies: pkg.dependencies ?? {},
      }
    })
    .filter((pkg) => !pkg.private)
}

export function isPublished(name, version) {
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

function getPreviousRef() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (eventPath && existsSync(eventPath)) {
    try {
      const event = readJson(eventPath)
      if (typeof event.before === 'string' && event.before) {
        return event.before
      }
    } catch {
      // Fall through to git history.
    }
  }

  return execFileSync('git', ['rev-parse', 'HEAD^1'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function readJsonAtRef(ref, filePath) {
  try {
    const output = execFileSync('git', ['show', `${ref}:${filePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return JSON.parse(output)
  } catch {
    return null
  }
}

export function getReleaseTargetPackages() {
  const previousRef = getPreviousRef()
  const publicPackages = listPublicPackages()

  const releasePackages = publicPackages.filter((pkg) => {
    const previousPkg = readJsonAtRef(
      previousRef,
      relative(repoRoot, join(pkg.dir, 'package.json')),
    )
    if (!previousPkg) return false
    return previousPkg.version !== pkg.version
  })

  return {
    previousRef,
    publicPackages,
    releasePackages,
  }
}

export function sortPackagesForPublish(packages) {
  const packageMap = new Map(packages.map((pkg) => [pkg.name, pkg]))
  const incomingCount = new Map(packages.map((pkg) => [pkg.name, 0]))
  const dependents = new Map(packages.map((pkg) => [pkg.name, []]))

  for (const pkg of packages) {
    for (const dependencyName of Object.keys(pkg.dependencies ?? {})) {
      if (!packageMap.has(dependencyName)) continue
      incomingCount.set(pkg.name, (incomingCount.get(pkg.name) ?? 0) + 1)
      dependents.get(dependencyName)?.push(pkg.name)
    }
  }

  const queue = packages
    .map((pkg) => pkg.name)
    .filter((name) => (incomingCount.get(name) ?? 0) === 0)
    .sort()
  const sorted = []

  while (queue.length > 0) {
    const name = queue.shift()
    if (!name) break
    const pkg = packageMap.get(name)
    if (!pkg) continue
    sorted.push(pkg)

    const nextDependents = [...(dependents.get(name) ?? [])].sort()
    for (const dependentName of nextDependents) {
      const nextCount = (incomingCount.get(dependentName) ?? 0) - 1
      incomingCount.set(dependentName, nextCount)
      if (nextCount === 0) queue.push(dependentName)
    }
    queue.sort()
  }

  if (sorted.length === packages.length) return sorted

  const sortedNames = new Set(sorted.map((pkg) => pkg.name))
  const remaining = packages
    .filter((pkg) => !sortedNames.has(pkg.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  return [...sorted, ...remaining]
}