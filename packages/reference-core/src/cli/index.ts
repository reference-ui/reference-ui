#!/usr/bin/env node
import { Command } from 'commander'
import pc from 'picocolors'
import { syncCommand } from './commands/sync'

const { cyan, green, red } = pc
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
    .action(async (options) => {
      try {
        console.log(cyan('🎨 Syncing design system...\n'))
        await syncCommand(cwd, { watch: options.watch })
        console.log(`\n${green('✓')} Design system synced successfully`)
      } catch (err) {
        console.error(`\n${red('✗')} Sync failed:`)
        console.error(err)
        process.exit(1)
      }
    })

  program.parse()
}

main()

