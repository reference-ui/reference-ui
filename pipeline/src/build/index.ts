/**
 * Build orchestration for the registry-target workspace packages.
 *
 * This module only decides what to build and when to skip; it leaves process
 * execution, package discovery, and registry staging to dedicated modules.
 */

import { computePackageBuildHashes, readBuildState, writeBuildState } from './cache.js'
import { ensureLocalRegistryAndStagePublicPackages } from '../registry/index.js'
import { logSkip, logWarning } from '../lib/log/index.js'
import { REGISTRY_PACKAGE_NAMES } from '../../config.js'
import type { VirtualNativeTarget } from '../../../packages/reference-rs/js/shared/targets.js'
import {
  listRegistryWorkspacePackages,
  run,
  sortPackagesForInternalDependencyOrder,
} from './workspace.js'
import type { WorkspacePackage } from './types.js'

const temporarilyFreshBuildPackageNames = new Set(['@reference-ui/core'])

export interface BuildWorkspacePackageOptions {
  requiredRustTargets?: readonly VirtualNativeTarget[]
  trace?: boolean
}

export function listBuildTargetPackages(packageNames: readonly string[] = REGISTRY_PACKAGE_NAMES): WorkspacePackage[] {
  return sortPackagesForInternalDependencyOrder(
    listRegistryWorkspacePackages(packageNames).filter((pkg) => typeof pkg.scripts.build === 'string'),
  )
}

export async function buildWorkspaceArtifacts(
  packageNames: readonly string[] = REGISTRY_PACKAGE_NAMES,
  options: Pick<BuildWorkspacePackageOptions, 'trace'> = {},
): Promise<void> {
  const buildTargets = listBuildTargetPackages(packageNames)
  const buildHashes = computePackageBuildHashes(buildTargets)
  const buildState = await readBuildState()

  for (const pkg of buildTargets) {
    const packageHash = buildHashes.get(pkg.name)
    if (!packageHash) {
      throw new Error(`Missing build hash for ${pkg.name}`)
    }

    const shouldForceFreshBuild = temporarilyFreshBuildPackageNames.has(pkg.name)

    if (!shouldForceFreshBuild && buildState[pkg.name]?.hash === packageHash) {
      logSkip(`Skipping ${pkg.name}; build hash unchanged`)
      continue
    }

    if (shouldForceFreshBuild) {
      logWarning(`Temporary: building ${pkg.name} fresh for baseline measurements`)
    }

    await run('pnpm', ['--filter', pkg.name, 'run', 'build'], {
      env: {
        REF_PIPELINE_SKIP_DEPENDENCY_BUILDS: '1',
      },
      interactive: options.trace,
      label: `Build ${pkg.name}`,
    })

    buildState[pkg.name] = {
      builtAt: new Date().toISOString(),
      hash: packageHash,
    }
  }

  await writeBuildState(buildState)
}

export async function buildWorkspacePackages(
  registryUrl?: string,
  packageNames: readonly string[] = REGISTRY_PACKAGE_NAMES,
  options: BuildWorkspacePackageOptions = {},
): Promise<void> {
  await buildWorkspaceArtifacts(packageNames, { trace: options.trace })
  await ensureLocalRegistryAndStagePublicPackages(
    registryUrl,
    packageNames,
    options.requiredRustTargets,
  )
}