/**
 * Pipeline dev: publish release tarballs to Verdaccio, npm-ping it from a Dagger
 * container, materialize a package tree under .pipeline/dev with packed deps,
 * run pnpm install against Verdaccio, then start the dev script on the host.
 */

import * as dagger from '@dagger.io/dagger'
import type { Writable } from 'node:stream'
import { DEFAULT_REGISTRY_URL, REGISTRY_URL_IN_CONTAINER, RELEASE_PACKAGE_NAMES } from '../../config.js'
import { buildWorkspacePackages } from '../build/index.js'
import { run } from '../build/workspace.js'
import { ensureContainerRuntime } from '../lib/runtime/ensure-container-runtime.js'
import { materializeRegistryBackedDevWorkspace } from './materialize.js'
import { baseNodeContainer, hostRegistryService } from '../testing/matrix/runner/container.js'
import { externalPnpmStoreCacheKey, matrixNodeImage } from '../testing/matrix/node-modules/cache.js'

export interface RunPipelineDevOptions {
  trace?: boolean
}

async function runRegistryServicePreflight(): Promise<void> {
  logPhase(`npm ping ${REGISTRY_URL_IN_CONTAINER} from the preflight container`)
  const workspace = baseNodeContainer(externalPnpmStoreCacheKey(matrixNodeImage))
  const registry = hostRegistryService()
  await workspace
    .withServiceBinding('registry', registry)
    .withExec(['npm', 'ping', '--registry', REGISTRY_URL_IN_CONTAINER])
    .stdout()
}

function logPhase(message: string): void {
  console.log(`[pipeline dev] ${message}`)
}

async function runPipelineDevDocsInner(trace?: boolean): Promise<void> {
  logPhase(`Building ${RELEASE_PACKAGE_NAMES.join(', ')} and loading tarballs into Verdaccio at ${DEFAULT_REGISTRY_URL}`)
  await buildWorkspacePackages(undefined, RELEASE_PACKAGE_NAMES, { trace })
  await runRegistryServicePreflight()

  logPhase('Writing .pipeline/dev/reference-docs from packages/reference-docs (workspace deps replaced with packed tarballs)')
  const { workdir } = await materializeRegistryBackedDevWorkspace({
    relativePackageDir: 'packages/reference-docs',
    slug: 'reference-docs',
  })

  await run('pnpm', ['install', '--reporter', 'append-only', '--registry', DEFAULT_REGISTRY_URL], {
    cwd: workdir,
    label: `pnpm install --registry ${DEFAULT_REGISTRY_URL}`,
  })

  await run('pnpm', ['run', 'dev'], {
    cwd: workdir,
    interactive: true,
    label: 'reference-docs dev',
  })
}

async function runPipelineDevLibInner(trace?: boolean): Promise<void> {
  logPhase(`Building ${RELEASE_PACKAGE_NAMES.join(', ')} and loading tarballs into Verdaccio at ${DEFAULT_REGISTRY_URL}`)
  await buildWorkspacePackages(undefined, RELEASE_PACKAGE_NAMES, { trace })
  await runRegistryServicePreflight()

  logPhase('Writing .pipeline/dev/reference-lib from packages/reference-lib (workspace deps replaced with packed tarballs)')
  const { workdir } = await materializeRegistryBackedDevWorkspace({
    relativePackageDir: 'packages/reference-lib',
    slug: 'reference-lib',
  })

  await run('pnpm', ['install', '--reporter', 'append-only', '--registry', DEFAULT_REGISTRY_URL], {
    cwd: workdir,
    label: `pnpm install --registry ${DEFAULT_REGISTRY_URL}`,
  })

  await run('pnpm', ['run', 'cosmos'], {
    cwd: workdir,
    interactive: true,
    label: 'reference-lib cosmos',
  })
}

function connectionOptions(trace: boolean | undefined): dagger.ConnectOpts | undefined {
  return trace ? { LogOutput: process.stdout as Writable } : undefined
}

export async function runDevDocs(options: RunPipelineDevOptions = {}): Promise<void> {
  logPhase('Checking Docker daemon responds (resource sizing checks skipped for pipeline dev)')
  ensureContainerRuntime({
    commandLabel: 'pnpm pipeline dev docs',
    verifyDockerResources: false,
  })

  logPhase('Connecting Dagger engine (--trace prints engine logs)')
  await dagger.connection(async () => {
    await runPipelineDevDocsInner(options.trace)
  }, connectionOptions(options.trace))
}

export async function runDevLib(options: RunPipelineDevOptions = {}): Promise<void> {
  logPhase('Checking Docker daemon responds (resource sizing checks skipped for pipeline dev)')
  ensureContainerRuntime({
    commandLabel: 'pnpm pipeline dev lib',
    verifyDockerResources: false,
  })

  logPhase('Connecting Dagger engine (--trace prints engine logs)')
  await dagger.connection(async () => {
    await runPipelineDevLibInner(options.trace)
  }, connectionOptions(options.trace))
}
