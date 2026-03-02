#!/usr/bin/env node
import { Command } from 'commander'

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('ref')
    .description('Reference UI CLI')
    .version('0.0.1', '-v, --version')

  program
    .command('sync', { isDefault: true })
    .description('Build and sync the design system')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .action((options: { watch?: boolean }) => {
      console.log('hello world')
      if (options.watch) {
        // Keep process alive when running in background
        setInterval(() => {}, 60_000)
      }
    })

  program.parse()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
