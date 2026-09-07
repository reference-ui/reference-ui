#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { Command } from 'commander'
import { log } from './lib/log'
import { runCommand } from './lib/run'
import { cleanCommand } from './clean'
import { runSync } from './sync'

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
    .command('mcp [project]')
    .description('Run the Reference UI MCP server (delegates to @reference-ui/mcp)')
    .allowUnknownOption()
    .helpOption(false)
    .action(
      runCommand(() => {
        const mcpArgs = process.argv.slice(3)
        return new Promise<void>(resolve => {
          const child = spawn('ref-mcp', mcpArgs, {
            stdio: 'inherit',
            env: process.env,
          })

          child.on('error', () => {
            console.error(
              '[@reference-ui/core] The Reference UI MCP server has moved to its own package: @reference-ui/mcp.\n\n' +
                'To run the Reference UI MCP server, use:\n' +
                '  npx @reference-ui/mcp\n\n' +
                'Or install @reference-ui/mcp and run:\n' +
                '  ref-mcp\n'
            )
            process.exit(1)
          })

          child.on('exit', (code, signal) => {
            if (signal) {
              process.kill(process.pid, signal)
              return
            }
            if (code !== 0) {
              process.exit(code ?? 1)
            }
            resolve()
          })
        })
      })
    )

  program.parse()
}

main().catch(err => {
  log.error('Fatal error:', err)
  process.exit(1)
})
