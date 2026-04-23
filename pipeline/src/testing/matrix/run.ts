/**
 * Containerized matrix bootstrap runner.
 *
 * This is the first real Dagger-owned matrix step. It reuses the single
 * pipeline-managed local Verdaccio registry on the host, binds that registry
 * into the Dagger graph, generates a minimal downstream consumer from the
 * install-test fixture, and runs `ref sync` in a clean container.
 */

import { dag } from '@dagger.io/dagger'
import * as dagger from '@dagger.io/dagger'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  consumerDirInContainer,
  defaultRegistryUrl,
  managedRegistryHost,
  managedRegistryPort,
  managedRegistryServiceHost,
  registryUrlInContainer,
} from '../../../config.js'
import { buildWorkspacePackages } from '../../build/index.js'
import { ensureContainerRuntime } from '../../lib/runtime/ensure-container-runtime.js'
import { readRegistryManifest } from '../../registry/manifest.js'
import { createMatrixConsumerPackageJson } from './transforms/package-json.js'
import { createMatrixConsumerTsconfig } from './transforms/tsconfig.js'
import { validateMatrixFixtures } from './validate.js'

const matrixDir = dirname(fileURLToPath(import.meta.url))
const pipelineDir = resolve(matrixDir, '..', '..', '..')
const repoRoot = resolve(pipelineDir, '..')
const matrixLogDir = resolve(repoRoot, '.pipeline', 'testing', 'matrix')

interface FixtureSourceFiles {
  appSource: string
  configSource: string
  indexSource: string
}

function isDirectExecution(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

function registryManifestCacheKey(manifest: Awaited<ReturnType<typeof readRegistryManifest>>): string {
  const fingerprint = manifest.packages
    .map((pkg) => `${pkg.name}@${pkg.version}:${pkg.hash}`)
    .join('|')

  const digest = createHash('sha256').update(fingerprint).digest('hex').slice(0, 16)
  return `reference-ui-pipeline-pnpm-store-${digest}`
}

function baseNodeContainer(pnpmStoreCacheKey: string) {
  const pnpmStore = dag.cacheVolume(pnpmStoreCacheKey)

  return dag
    .container()
    .from('node:24-bookworm')
    .withEnvVariable('CI', '1')
    .withEnvVariable('NO_COLOR', '1')
    .withEnvVariable('npm_config_update_notifier', 'false')
    .withEnvVariable('PNPM_STORE_DIR', '/pnpm/store')
    .withMountedCache('/pnpm/store', pnpmStore)
    .withExec(['corepack', 'enable'])
    .withExec(['corepack', 'prepare', 'pnpm@10.29.3', '--activate'])
}

async function readInstallTestFixtureSource(): Promise<FixtureSourceFiles> {
  const fixtureDir = resolve(repoRoot, 'fixtures', 'install-test')

  const [appSource, configSource, indexSource] = await Promise.all([
    readFile(resolve(fixtureDir, 'src', 'App.tsx'), 'utf8'),
    readFile(resolve(fixtureDir, 'ui.config.ts'), 'utf8'),
    readFile(resolve(fixtureDir, 'src', 'index.ts'), 'utf8'),
  ])

  return {
    appSource,
    configSource,
    indexSource,
  }
}

function hostRegistryService() {
  return dag.host().service([{ backend: managedRegistryPort }], {
    host: managedRegistryHost,
  })
}

async function writeStageLog(fileName: string, output: string): Promise<void> {
  await mkdir(matrixLogDir, { recursive: true })
  await writeFile(resolve(matrixLogDir, fileName), output)
}

export async function runMatrixBootstrapInDagger(): Promise<void> {
  console.log('1. Discovering matrix-enabled fixtures...')
  validateMatrixFixtures()

  console.log('2. Building changed workspace packages and staging the shared host Verdaccio registry...')
  console.log(`   Using the single pipeline registry at ${defaultRegistryUrl}.`)
  await buildWorkspacePackages()
  const manifest = await readRegistryManifest()

  console.log('3. Reading install-test fixture source...')
  const fixtureSource = await readInstallTestFixtureSource()
  const corePackage = manifest.packages.find((pkg) => pkg.name === '@reference-ui/core')
  const libPackage = manifest.packages.find((pkg) => pkg.name === '@reference-ui/lib')

  if (!corePackage) {
    throw new Error('Expected @reference-ui/core to be present in the packed registry manifest.')
  }

  if (!libPackage) {
    throw new Error('Expected @reference-ui/lib to be present in the packed registry manifest.')
  }

  const workspace = baseNodeContainer(registryManifestCacheKey(manifest))
  const registry = hostRegistryService()

  let consumerWorkspace = workspace.withServiceBinding('registry', registry)

  console.log('4. Binding the shared host Verdaccio registry into the Dagger graph...')
  console.log(
    `   Verdaccio still lives on the host; Dagger is only forwarding it into the container graph as ${managedRegistryServiceHost}:${managedRegistryPort}.`,
  )
  console.log(`   Step logs will be written to ${matrixLogDir}.`)

  console.log('4.1 Checking registry connectivity from inside the container graph...')
  const pingRunner = consumerWorkspace.withExec(['npm', 'ping', '--registry', registryUrlInContainer])
  const pingOutput = await pingRunner.stdout()
  await writeStageLog('publish-ping.log', pingOutput)
  if (pingOutput.trim().length > 0) {
    process.stdout.write(pingOutput)
  }
  consumerWorkspace = pingRunner

  const publishedPackageNames = manifest.packages.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')
  await writeStageLog('publish.log', `${publishedPackageNames}\n`)

  const consumerBase = consumerWorkspace
    .withNewFile(
      `${consumerDirInContainer}/package.json`,
      createMatrixConsumerPackageJson({
        coreVersion: corePackage.version,
        libVersion: libPackage.version,
      }),
    )
    .withNewFile(`${consumerDirInContainer}/tsconfig.json`, createMatrixConsumerTsconfig())
    .withNewFile(`${consumerDirInContainer}/ui.config.ts`, fixtureSource.configSource)
    .withNewFile(`${consumerDirInContainer}/src/App.tsx`, fixtureSource.appSource)
    .withNewFile(`${consumerDirInContainer}/src/index.ts`, fixtureSource.indexSource)
    .withWorkdir(consumerDirInContainer)

  console.log('5. Installing consumer dependencies from Verdaccio...')
  console.log(`   Output is buffered by the Dagger Node SDK and will be written to ${resolve(matrixLogDir, 'install.log')}.`)
  const installRunner = consumerBase.withExec([
    'pnpm',
    'install',
    '--reporter',
    'append-only',
    '--registry',
    registryUrlInContainer,
  ])
  const installOutput = await installRunner.stdout()
  await writeStageLog('install.log', installOutput)
  if (installOutput.trim().length > 0) {
    process.stdout.write(installOutput)
  }

  console.log('6. Running ref sync inside the clean consumer container...')
  console.log(`   Output is buffered by the Dagger Node SDK and will be written to ${resolve(matrixLogDir, 'ref-sync.log')}.`)
  const syncRunner = installRunner.withExec(['pnpm', 'exec', 'ref', 'sync'])

  try {
    const output = await syncRunner.stdout()
    await writeStageLog('ref-sync.log', output)
    process.stdout.write(output)
    console.log('\nMatrix smoke completed successfully inside Dagger.')
  } catch (error) {
    await writeStageLog('ref-sync.log', error instanceof Error ? error.message : String(error))
    if (error instanceof Error) {
      console.error(error.message)
    }
    process.exitCode = 1
  }
}

if (isDirectExecution()) {
  ensureContainerRuntime()
  await dagger.connection(runMatrixBootstrapInDagger, { LogOutput: process.stdout })
}