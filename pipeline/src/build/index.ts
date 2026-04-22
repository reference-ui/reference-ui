import { computePackageBuildHashes, readBuildState, writeBuildState } from './cache.js'
import { ensureLocalRegistryAndStagePublicPackages } from '../registry/index.js'
import { logSkip } from '../lib/log/index.js'
import {
  listRegistryWorkspacePackages,
  run,
  sortPackagesForInternalDependencyOrder,
  type WorkspacePackage,
} from './workspace.js'

export function listBuildTargetPackages(): WorkspacePackage[] {
  return sortPackagesForInternalDependencyOrder(
    listRegistryWorkspacePackages().filter((pkg) => typeof pkg.scripts.build === 'string'),
  )
}

export async function buildWorkspacePackages(): Promise<void> {
  const buildTargets = listBuildTargetPackages()
  const buildHashes = computePackageBuildHashes(buildTargets)
  const buildState = await readBuildState()

  for (const pkg of buildTargets) {
    const packageHash = buildHashes.get(pkg.name)
    if (!packageHash) {
      throw new Error(`Missing build hash for ${pkg.name}`)
    }

    if (buildState[pkg.name]?.hash === packageHash) {
      logSkip(`Skipping ${pkg.name}; build hash unchanged`)
      continue
    }

    await run('pnpm', ['--filter', pkg.name, 'run', 'build'], {
      env: {
        REF_PIPELINE_SKIP_DEPENDENCY_BUILDS: '1',
      },
      label: `Build ${pkg.name}`,
    })

    buildState[pkg.name] = {
      builtAt: new Date().toISOString(),
      hash: packageHash,
    }
  }

  await writeBuildState(buildState)

  await ensureLocalRegistryAndStagePublicPackages()
}