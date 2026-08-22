/**
 * Materialize a registry-backed dev workspace: package sources plus a consumer
 * package.json where workspace:* deps are rewritten to local packed tarballs,
 * matching the matrix consumer boundary (real install graphs, tree-shaking).
 *
 * Unlike matrix runs, the dev materialization intentionally preserves selected
 * generated caches between runs so docs/lib dev loops do not re-install or
 * re-generate everything from scratch.
 */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DEFAULT_REGISTRY_URL } from '../../config.js'
import { readRegistryManifest } from '../registry/manifest.js'
import { repoRoot } from '../build/workspace.js'
import {
  resolveMatrixInternalTarballSpecs,
} from '../testing/matrix/runner/consumer.js'
import { createMatrixConsumerPackageJson } from '../testing/matrix/managed/package-json/index.js'
import type { MatrixFixturePackageJson } from '../testing/matrix/managed/package-json/index.js'

const excludedTopLevelNames = new Set(['node_modules', 'dist', '.git', '.turbo'])
const preservedDevWorkspaceEntries = new Set([
  '.content-collections',
  '.pipeline-dev-install-state.json',
  '.reference-ui',
  'node_modules',
  'pnpm-lock.yaml',
])
const devInstallStateFileName = '.pipeline-dev-install-state.json'

function hashContent(parts: readonly (string | Buffer)[]): string {
  const hash = createHash('sha256')

  for (const part of parts) {
    hash.update(part)
    hash.update('\n')
  }

  return hash.digest('hex')
}

async function removePath(targetPath: string): Promise<void> {
  await rm(targetPath, {
    force: true,
    maxRetries: 10,
    recursive: true,
    retryDelay: 100,
  })
}

async function resetDevWorkspace(workdir: string): Promise<void> {
  await mkdir(workdir, { recursive: true })
  const entries = await readdir(workdir, { withFileTypes: true })

  for (const entry of entries) {
    if (preservedDevWorkspaceEntries.has(entry.name)) {
      continue
    }

    await removePath(join(workdir, entry.name))
  }
}

async function copyPackageSources(srcDir: string, destDir: string): Promise<void> {
  await mkdir(destDir, { recursive: true })
  const entries = await readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    if (excludedTopLevelNames.has(entry.name)) {
      continue
    }

    const from = join(srcDir, entry.name)
    const to = join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyPackageSources(from, to)
      continue
    }

    if (entry.isFile() || entry.isSymbolicLink()) {
      await copyFile(from, to)
    }
  }
}

/**
 * Materialized packages live under .pipeline/dev/<slug>, so any tsconfig that
 * extends `../../tsconfig.base.json` no longer resolves. Rewrite the relative
 * extends to an absolute path back into the repo so editors and esbuild stop
 * spamming "Cannot find base config file" warnings.
 *
 * Additionally, the inherited base config carries workspace `paths` that map
 * `@reference-ui/*` and friends to repo-relative source files. Those paths do
 * not exist relative to the materialized workdir, which causes downstream
 * tools (e.g. styletrace) to chase non-existent files and warn. Override
 * `compilerOptions.paths` to an empty object so module resolution falls back
 * to `node_modules` (the packed tarballs) instead of the workspace tree.
 */
async function rewriteTsconfig(workdir: string): Promise<void> {
  const tsconfigPath = join(workdir, 'tsconfig.json')
  let raw: string
  try {
    raw = await readFile(tsconfigPath, 'utf8')
  } catch {
    return
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return
  }

  const baseConfigAbsPath = resolve(repoRoot, 'tsconfig.base.json')
  const extendsValue = parsed.extends
  if (typeof extendsValue === 'string' && /^(?:\.\.\/)+tsconfig\.base\.json$/u.test(extendsValue)) {
    parsed.extends = baseConfigAbsPath
  }

  const compilerOptions = (parsed.compilerOptions as Record<string, unknown> | undefined) ?? {}
  compilerOptions.paths = {}
  parsed.compilerOptions = compilerOptions

  await writeFile(tsconfigPath, `${JSON.stringify(parsed, null, 2)}\n`)
}

function mergeFixtureIntoConsumerPackageJson(
  fixture: MatrixFixturePackageJson,
  consumerJsonText: string,
): string {
  const consumer = JSON.parse(consumerJsonText) as Record<string, unknown>
  const merged: Record<string, unknown> = {
    ...consumer,
  }

  if (fixture.scripts !== undefined) {
    merged.scripts = rewriteRefBinInvocations(fixture.scripts)
  }

  return `${JSON.stringify(merged, null, 2)}\n`
}

/** Without workspace hoisting, bare `ref` is often missing from PATH under `sh`. */
function rewriteRefBinInvocations(scripts: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {}

  for (const [name, cmd] of Object.entries(scripts)) {
    next[name] = cmd.replace(/(?<!pnpm exec )\bref\s+/gu, 'pnpm exec ref ')
  }

  return next
}

interface DevWorkspaceInstallStateFile {
  installInputsHash: string
}

async function readDevWorkspaceInstallState(
  installStatePath: string,
): Promise<DevWorkspaceInstallStateFile | null> {
  try {
    const raw = await readFile(installStatePath, 'utf8')
    const parsed = JSON.parse(raw) as Partial<DevWorkspaceInstallStateFile>

    if (typeof parsed.installInputsHash !== 'string' || parsed.installInputsHash.length === 0) {
      return null
    }

    return { installInputsHash: parsed.installInputsHash }
  } catch {
    return null
  }
}

function computeDevInstallInputsHash(parts: {
  npmrcContents: string
  packageJsonContents: string
  workspaceYamlContents: string
}): string {
  return hashContent([
    parts.packageJsonContents,
    parts.workspaceYamlContents,
    parts.npmrcContents,
  ])
}

export interface MaterializeRegistryBackedDevWorkspaceOptions {
  relativePackageDir: string
  slug: string
}

export interface MaterializeRegistryBackedDevWorkspaceResult {
  installState: {
    installInputsHash: string
    installRequired: boolean
  }
  workdir: string
}

export async function markDevWorkspaceInstallComplete(
  workdir: string,
  installInputsHash: string,
): Promise<void> {
  await writeFile(
    join(workdir, devInstallStateFileName),
    `${JSON.stringify({ installInputsHash }, null, 2)}\n`,
  )
}

export async function materializeRegistryBackedDevWorkspace(
  options: MaterializeRegistryBackedDevWorkspaceOptions,
): Promise<MaterializeRegistryBackedDevWorkspaceResult> {
  const packageDir = resolve(repoRoot, options.relativePackageDir)
  const packageJsonPath = join(packageDir, 'package.json')
  const fixturePackageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as MatrixFixturePackageJson

  const manifest = await readRegistryManifest()
  const internalTarballSpecs = resolveMatrixInternalTarballSpecs(fixturePackageJson, manifest.packages)

  const workdir = resolve(repoRoot, '.pipeline', 'dev', options.slug)
  await resetDevWorkspace(workdir)

  await copyPackageSources(packageDir, workdir)
  await rewriteTsconfig(workdir)

  const tarballDir = join(workdir, '.matrix-tarballs')
  await mkdir(tarballDir, { recursive: true })

  const consumerPackageJsonSource = createMatrixConsumerPackageJson({
    bundlers: [],
    fixturePackageJson,
    internalTarballSpecifiers: Object.fromEntries(
      internalTarballSpecs.map(spec => [spec.packageName, spec.specifier]),
    ),
  })

  const mergedPackageJson = mergeFixtureIntoConsumerPackageJson(fixturePackageJson, consumerPackageJsonSource)
  const workspaceYamlContents = 'packages: []\n'
  const npmrcContents = [
    `registry=${DEFAULT_REGISTRY_URL}`,
    'ignore-workspace=true',
    'link-workspace-packages=false',
    '',
  ].join('\n')
  const installInputsHash = computeDevInstallInputsHash({
    npmrcContents,
    packageJsonContents: mergedPackageJson,
    workspaceYamlContents,
  })
  const installStatePath = join(workdir, devInstallStateFileName)
  const previousInstallState = await readDevWorkspaceInstallState(installStatePath)
  const installRequired = !existsSync(join(workdir, 'node_modules'))
    || previousInstallState?.installInputsHash !== installInputsHash

  await writeFile(join(workdir, 'package.json'), mergedPackageJson)

  // Isolate this directory from the surrounding pnpm workspace. Without this,
  // pnpm walks up to the repo's pnpm-workspace.yaml, refuses to install into a
  // non-member directory, and downstream `pnpm exec ref` resolves nothing.
  await writeFile(join(workdir, 'pnpm-workspace.yaml'), workspaceYamlContents)
  await writeFile(join(workdir, '.npmrc'), npmrcContents)

  await Promise.all(
    internalTarballSpecs.map(spec =>
      copyFile(spec.absoluteTarballPath, join(tarballDir, spec.stagedFileName))),
  )

  return {
    installState: {
      installInputsHash,
      installRequired,
    },
    workdir,
  }
}
