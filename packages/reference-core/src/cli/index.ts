#!/usr/bin/env node
import { Command } from 'commander'
import { syncCommand, type SyncOptions } from './sync'
import { runCommand } from './lib/run-command'
import { log } from './lib/log'

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('ref')
    .description('Reference UI Design System CLI')
    .version('0.0.1', '-v, --version')

  program
    .command('sync', { isDefault: true })
    .description('Build and sync the design system')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .action(runCommand(options => syncCommand(process.cwd(), options as SyncOptions)))

  program.parse()
}

main().catch(error => {
  log.error('Fatal error:', error)
  process.exit(1)
})
