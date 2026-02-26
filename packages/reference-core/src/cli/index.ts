#!/usr/bin/env node
import { Command } from 'commander'
import { syncCommand, type SyncOptions } from './sync'
import { vanillaCommand } from './vanilla'
import { runCommand } from './lib'
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

  program
    .command('vanilla')
    .description('Run Vanilla Extract stress benchmark (memory vs Panda)')
    .option('-m, --minimal', 'Minimal benchmark: 2 files only (no stress)')
    .option('-f, --files <n>', 'Number of style files (default: 500)', '500')
    .option('-p, --styles-per-file <n>', 'Styles per file (default: 20)', '20')
    .action(runCommand((opts) => vanillaCommand(process.cwd(), opts)))

  program.parse()
}

main().catch(error => {
  log.error('Fatal error:', error)
  process.exit(1)
})
