import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { pipelineStateDir, repoRoot, type WorkspacePackage } from './workspace.js'

export interface BuildStateEntry {
  builtAt: string
  hash: string
}

type BuildState = Record<string, BuildStateEntry>

const buildStateDir = resolve(pipelineStateDir, 'build')
const buildStatePath = resolve(buildStateDir, 'package-state.json')
const sharedHashInputs = ['pnpm-lock.yaml'] as const

function hashContent(parts: readonly (string | Buffer)[]): string {
  const hash = createHash('sha256')

  for (const part of parts) {
    hash.update(part)
    hash.update('\n')
  }

  return hash.digest('hex')
}

function listHashInputFiles(packageDir: string): string[] {
  const packagePath = relative(repoRoot, packageDir)
  const output = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--modified',
      '--others',
      '--exclude-standard',
      '--',
      packagePath,
      ...sharedHashInputs,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  ).trim()

  if (output.length === 0) {
    return []
  }

  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .sort((left, right) => left.localeCompare(right))
}

function computeOwnPackageHash(pkg: WorkspacePackage): string {
  const hashInputs = listHashInputFiles(pkg.dir)
  const parts: (string | Buffer)[] = [pkg.name, pkg.version]

  for (const relativePath of hashInputs) {
    const absolutePath = resolve(repoRoot, relativePath)
    parts.push(relativePath)
    parts.push(readFileSync(absolutePath))
  }

  return hashContent(parts)
}

export function computePackageBuildHashes(
  packages: readonly WorkspacePackage[],
): Map<string, string> {
  const packageNames = new Set(packages.map((pkg) => pkg.name))
  const hashes = new Map<string, string>()

  for (const pkg of packages) {
    const ownHash = computeOwnPackageHash(pkg)
    const dependencyHashes = Object.keys(pkg.dependencies)
      .filter((dependencyName) => packageNames.has(dependencyName))
      .sort((left, right) => left.localeCompare(right))
      .flatMap((dependencyName) => [dependencyName, hashes.get(dependencyName) ?? ''])

    hashes.set(pkg.name, hashContent([pkg.name, ownHash, ...dependencyHashes]))
  }

  return hashes
}

export async function readBuildState(): Promise<BuildState> {
  if (!existsSync(buildStatePath)) {
    return {}
  }

  try {
    const contents = await readFile(buildStatePath, 'utf8')
    return JSON.parse(contents) as BuildState
  } catch {
    return {}
  }
}

export async function writeBuildState(state: BuildState): Promise<void> {
  await mkdir(buildStateDir, { recursive: true })
  await writeFile(buildStatePath, `${JSON.stringify(state, null, 2)}\n`)
}