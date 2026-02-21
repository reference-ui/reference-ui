#!/usr/bin/env node
import { Command } from 'commander'
import { syncCommand } from './sync'
import { runCommand } from './utils'
const cwd = process.cwd()

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
    .action(runCommand(options => syncCommand(cwd, { watch: options.watch })))

  program.parse()
}

main()
