/**
 * Public CLI surface for the pipeline package.
 *
 * The command tree stays intentionally small; the implementation details live in
 * the subsystem modules so the CLI remains a thin routing layer.
 */

import { Command } from 'commander'
import { buildWorkspacePackages } from './build/index.js'
import { cleanPipeline } from './clean/index.js'
import {
  defaultRegistryUrl,
  ensureManagedLocalRegistry,
  packPublicPackages,
  loadPackedTarballsIntoLocalRegistry,
  registryManifestPath,
} from './registry/index.js'
import {
  defaultNpmAuthRegistryUrl,
  formatReleasePlan,
  getReleasePlan,
  runLocalRelease,
} from './release/index.js'
import { runMatrixTests } from './testing/matrix/run.js'
import { setupMatrixPackages } from './testing/matrix/setup/index.js'

function parsePackageOption(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined
  }

  const packageNames = value
    .split(',')
    .map(packageName => packageName.trim())
    .filter(packageName => packageName.length > 0)

  return packageNames.length > 0 ? packageNames : undefined
}

const program = new Command()

program
  .name('reference-ui pipeline')
  .description('Reference UI pipeline CLI')
  .showHelpAfterError()
  .addHelpText(
    'after',
    `

Defaults:
  registry url: ${defaultRegistryUrl}
  manifest: ${registryManifestPath()}

Notes:
  build reuses the managed local registry and only loads packages that are missing from it.
`,
  )

program
  .command('build')
  .description('Build the public workspace packages and stage them into the managed local registry')
  .action(async () => {
    await buildWorkspacePackages()
  })

program
  .command('clean')
  .description('Clean pipeline-managed local state used for testing, including registry and build cache')
  .action(async () => {
    await cleanPipeline()
  })

program
  .command('setup')
  .description('Generate and optionally install the pipeline-managed matrix package files')
  .option('--packages <names>', 'Comma-separated matrix package names, for example @matrix/typescript')
  .option('--no-install', 'Skip the workspace pnpm install after syncing matrix package manifests')
  .action(async (options: { install: boolean; packages?: string }) => {
    await setupMatrixPackages({
      install: options.install,
      packageNames: parsePackageOption(options.packages),
    })
  })

program
  .command('test')
  .description('Run the Dagger-backed matrix test flow')
  .option('--no-dagger-cache', 'Disable Dagger exec-result caching for this run')
  .option('--packages <names>', 'Comma-separated matrix package names, for example @matrix/typescript')
  .action(async (options: { daggerCache: boolean; packages?: string }) => {
    await runMatrixTests({
      commandLabel: 'pnpm pipeline test',
      disableDaggerExecCache: !options.daggerCache,
      packageNames: parsePackageOption(options.packages),
    })
  })

const registryCommand = program
  .command('registry')
  .description('Registry-oriented commands for the pipeline-local npm-compatible registry')

registryCommand
  .command('pack')
  .description('Pack the configured registry packages into tarballs and write the manifest')
  .action(async () => {
    const manifest = await packPublicPackages()
    console.log(`Packed ${manifest.packages.length} registry packages into ${registryManifestPath()}`)
  })

registryCommand
  .command('start')
  .description('Ensure the managed local registry is running without resetting its stored packages')
  .option('--registry <url>', 'Registry URL', defaultRegistryUrl)
  .action(async (options: { registry: string }) => {
    await ensureManagedLocalRegistry(options.registry)
  })

registryCommand
  .command('load')
  .description('Load the packed tarballs from the manifest into the local registry')
  .option('--registry <url>', 'Registry URL', defaultRegistryUrl)
  .action(async (options: { registry: string }) => {
    await loadPackedTarballsIntoLocalRegistry(options.registry)
  })

const releaseCommand = program
  .command('release')
  .description('Publish the current release package tarballs to npm')
  .option('--auth-registry <url>', 'Registry URL used for npm whoami and publish', defaultNpmAuthRegistryUrl)
  .option('--no-npm-auth-check', 'Skip the npm whoami preflight against the publish registry')
  .action(async (options: {
    authRegistry: string
    npmAuthCheck: boolean
  }) => {
    await runLocalRelease({
      authRegistryUrl: options.authRegistry,
      verifyNpmAuth: options.npmAuthCheck,
    })
  })

releaseCommand
  .command('plan')
  .description('Show the current unpublished release packages that would be published')
  .action(async () => {
    console.log(formatReleasePlan(await getReleasePlan()))
  })

try {
  await program.parseAsync(process.argv)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}