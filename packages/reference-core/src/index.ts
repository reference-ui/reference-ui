#!/usr/bin/env node
import { Command } from 'commander'
import { log } from './lib/log'
import { runCommand } from './lib/run'
import { cleanCommand } from './clean'
import { syncCommand, type SyncOptions } from './sync'
import { mcpCommand, type McpCommandOptions } from './mcp/cli/command'

function runSync(options?: Partial<SyncOptions>) {
  return runCommand(commandOptions =>
    syncCommand(process.cwd(), {
      ...(commandOptions as SyncOptions),
      ...options,
    })
  )
}

async function main(): Promise<void> {
  const program = new Command()

  program.name('ref').description('Reference UI CLI').version('0.1.0', '-v, --version')

  program
    .command('sync', { isDefault: true })
    .description('Build and sync the design system')
    .option('--build', 'Install generated packages as real node_modules copies')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .option('-d, --debug', 'Enable debug logging')
    .action(runSync())

  program
    .command('build')
    .description('Shorthand for sync --build')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .option('-d, --debug', 'Enable debug logging')
    .action(runSync({ build: true }))

  program
    .command('clean')
    .description('Remove the output directory (.reference-ui) for a fresh state')
    .action(runCommand(() => cleanCommand(process.cwd())))

  program
    .command('mcp')
    .description('Run the Reference UI MCP server')
    .option('--transport <transport>', 'Transport to use (stdio or http)')
    .option('--host <host>', 'Host to bind when using HTTP transport')
    .option('--port <port>', 'Port to bind when using HTTP transport', value =>
      Number.parseInt(value, 10)
    )
    .action(
      runCommand(options => mcpCommand(process.cwd(), options as McpCommandOptions))
    )

  program.parse()
}

main().catch(err => {
  log.error('Fatal error:', err)
  process.exit(1)
})
