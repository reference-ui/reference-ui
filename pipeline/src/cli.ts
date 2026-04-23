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

await program.parseAsync(process.argv)