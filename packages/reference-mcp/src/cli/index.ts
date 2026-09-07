import { Command } from 'commander'
import { mcpCommand, type McpCommandOptions } from './command'

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command()

  program
    .name('ref-mcp')
    .description('Reference UI MCP server')
    .version('0.0.1', '-v, --version')
    .argument('[project]', 'Optional path to target project')
    .option('--project <path>', 'Path to target project')
    .option('--transport <transport>', 'Transport to use (stdio or http)', 'stdio')
    .option('--host <host>', 'Host to bind when using HTTP transport')
    .option('--port <port>', 'Port to bind when using HTTP transport', value =>
      Number.parseInt(value, 10)
    )
    .action(async (positionalProject?: string, commandOptions?: McpCommandOptions) => {
      const options = commandOptions ?? {}
      const project = options.project || positionalProject || process.env.REF_PROJECT

      await mcpCommand(process.cwd(), {
        ...options,
        project,
      })
    })

  await program.parseAsync(argv, { from: 'user' })
}
