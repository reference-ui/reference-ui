import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RUST_PACKAGE = '@reference-ui/rust'
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const packagesDir = join(repoRoot, 'packages')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
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

function writeGithubOutput(name, value) {
  const githubOutput = process.env.GITHUB_OUTPUT
  if (!githubOutput) return

  appendFileSync(githubOutput, `${name}<<EOF\n${value}\nEOF\n`)
}

const publicPackages = listPublicPackages()
const unpublishedPackages = publicPackages
  .filter((pkg) => !isPublished(pkg.name, pkg.version))
  .map(({ dir, private: isPrivate, ...pkg }) => pkg)

const shouldPublish = unpublishedPackages.length > 0
const needsRust = unpublishedPackages.some((pkg) => pkg.name === RUST_PACKAGE)

console.log(
  JSON.stringify(
    {
      shouldPublish,
      needsRust,
      unpublishedPackages,
    },
    null,
    2
  )
)

writeGithubOutput('should_publish', String(shouldPublish))
writeGithubOutput('needs_rust', String(needsRust))
writeGithubOutput('unpublished_packages_json', JSON.stringify(unpublishedPackages))
