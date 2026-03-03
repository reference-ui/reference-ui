#!/usr/bin/env node
import { Command } from 'commander'
import { log } from './lib/log'
import { runCommand } from './lib/run'
import { cleanCommand } from './clean'
import { syncCommand, type SyncOptions } from './sync'

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('ref')
    .description('Reference UI CLI')
    .version('0.1.0', '-v, --version')

  program
    .command('sync', { isDefault: true })
    .description('Build and sync the design system')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .action(
      runCommand((options) =>
        syncCommand(process.cwd(), options as SyncOptions)
      )
    )

  program
    .command('clean')
    .description('Remove the output directory (.reference-ui) for a fresh state')
    .action(runCommand(() => cleanCommand(process.cwd())))

  program.parse()
}

main().catch((err) => {
  log.error('Fatal error:', err)
  process.exit(1)
})
