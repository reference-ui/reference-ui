/**
 * Materialize a registry-backed dev workspace: package sources plus a consumer
 * package.json where workspace:* deps are rewritten to local packed tarballs,
 * matching the matrix consumer boundary (real install graphs, tree-shaking).
 */

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

export interface MaterializeRegistryBackedDevWorkspaceOptions {
  relativePackageDir: string
  slug: string
}

export async function materializeRegistryBackedDevWorkspace(
  options: MaterializeRegistryBackedDevWorkspaceOptions,
): Promise<{ workdir: string }> {
  const packageDir = resolve(repoRoot, options.relativePackageDir)
  const packageJsonPath = join(packageDir, 'package.json')
  const fixturePackageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as MatrixFixturePackageJson

  const manifest = await readRegistryManifest()
  const internalTarballSpecs = resolveMatrixInternalTarballSpecs(fixturePackageJson, manifest.packages)

  const workdir = resolve(repoRoot, '.pipeline', 'dev', options.slug)
  await rm(workdir, { recursive: true, force: true })
  await mkdir(workdir, { recursive: true })

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
  await writeFile(join(workdir, 'package.json'), mergedPackageJson)

  // Isolate this directory from the surrounding pnpm workspace. Without this,
  // pnpm walks up to the repo's pnpm-workspace.yaml, refuses to install into a
  // non-member directory, and downstream `pnpm exec ref` resolves nothing.
  await writeFile(join(workdir, 'pnpm-workspace.yaml'), 'packages: []\n')
  await writeFile(
    join(workdir, '.npmrc'),
    [
      `registry=${DEFAULT_REGISTRY_URL}`,
      'ignore-workspace=true',
      'link-workspace-packages=false',
      '',
    ].join('\n'),
  )

  await Promise.all(
    internalTarballSpecs.map(spec =>
      copyFile(spec.absoluteTarballPath, join(tarballDir, spec.stagedFileName))),
  )

  return { workdir }
}
