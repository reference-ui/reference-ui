/**
 * napi-rs target package preparation for the build pipeline.
 *
 * This file owns the Rust-specific mechanics: generating `npm/*` package dirs,
 * copying local artifacts into them when available, and materializing publish-
 * style tarballs for each platform package.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

import type {
  BuildPackageJsonOverride,
  BuildRegistryArtifactPackage,
} from '../types.js'
import { repoRoot, run } from '../workspace.js'
import { rustGeneratedTarballsDir } from './state.js'

export const REFERENCE_RUST_PACKAGE_NAME = '@reference-ui/rust'

interface ReferenceRustTargetPackage {
  dir: string
  hasLocalBinary: boolean
  name: string
  version: string
}

interface RustTargetPackageJson {
  name: string
  version: string
}

function referenceRustArtifactsDir(packageDir: string): string {
  return resolve(packageDir, 'artifacts')
}

function referenceRustNpmDir(packageDir: string): string {
  return resolve(packageDir, 'npm')
}

function packedTarballName(name: string, version: string): string {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}

function hashTarballContents(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function isPublishedOnNpm(name: string, version: string): boolean {
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

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function hasLocalNativeBinary(targetDir: string): boolean {
  return readdirSync(targetDir, { withFileTypes: true }).some(
    entry => entry.isFile() && entry.name.endsWith('.node')
  )
}

function listReferenceRustTargetPackages(packageDir: string): ReferenceRustTargetPackage[] {
  const npmDir = referenceRustNpmDir(packageDir)
  if (!existsSync(npmDir)) {
    return []
  }

  return readdirSync(npmDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map((entry) => {
      const dir = join(npmDir, entry.name)
      const packageJson = readJson<RustTargetPackageJson>(join(dir, 'package.json'))

      return {
        dir,
        hasLocalBinary: hasLocalNativeBinary(dir),
        name: packageJson.name,
        version: packageJson.version,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function createReferenceRustPackageJsonOverride(
  targetPackages: readonly Pick<ReferenceRustTargetPackage, 'name' | 'version'>[],
): BuildPackageJsonOverride | undefined {
  if (targetPackages.length === 0) {
    return undefined
  }

  return {
    optionalDependencies: Object.fromEntries(
      targetPackages.map(targetPackage => [targetPackage.name, targetPackage.version]),
    ),
  }
}

async function ensureReferenceRustGeneratedPackages(
  packageDir: string,
): Promise<ReferenceRustTargetPackage[]> {
  await run('pnpm', ['run', 'create-npm-dirs'], {
    cwd: packageDir,
    env: {
      npm_config_ignore_scripts: 'true',
    },
    label: 'Prepare @reference-ui/rust npm target dirs',
  })

  if (existsSync(referenceRustArtifactsDir(packageDir))) {
    await run('pnpm', ['run', 'artifacts'], {
      cwd: packageDir,
      env: {
        npm_config_ignore_scripts: 'true',
      },
      label: 'Populate @reference-ui/rust npm target dirs',
    })
  }

  return listReferenceRustTargetPackages(packageDir)
}

export async function materializeReferenceRustTargetTarballs(
  packageDir: string,
): Promise<BuildRegistryArtifactPackage[]> {
  const targetPackages = await ensureReferenceRustGeneratedPackages(packageDir)
  const generatedPackages: BuildRegistryArtifactPackage[] = []

  await mkdir(rustGeneratedTarballsDir, { recursive: true })

  for (const targetPackage of targetPackages) {
    const tarballFileName = packedTarballName(targetPackage.name, targetPackage.version)
    const tarballPath = resolve(rustGeneratedTarballsDir, tarballFileName)
    await rm(tarballPath, { force: true })

    if (targetPackage.hasLocalBinary) {
      await run('npm', ['pack', '--pack-destination', rustGeneratedTarballsDir], {
        cwd: targetPackage.dir,
        env: {
          npm_config_ignore_scripts: 'true',
        },
        label: `Pack ${targetPackage.name}`,
      })
    } else if (isPublishedOnNpm(targetPackage.name, targetPackage.version)) {
      await run('npm', ['pack', `${targetPackage.name}@${targetPackage.version}`, '--pack-destination', rustGeneratedTarballsDir], {
        cwd: repoRoot,
        env: {
          npm_config_ignore_scripts: 'true',
        },
        label: `Fetch ${targetPackage.name}`,
      })
    } else {
      continue
    }

    const tarball = await readFile(tarballPath)
    generatedPackages.push({
      hash: hashTarballContents(tarball),
      internalDependencies: [],
      name: targetPackage.name,
      sourceDir: relative(repoRoot, targetPackage.dir),
      tarballFileName,
      tarballPath: relative(repoRoot, tarballPath),
      version: targetPackage.version,
    })
  }

  return generatedPackages
}