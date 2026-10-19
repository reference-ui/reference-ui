// The ref-mcp commander program.
// It takes argv and emits the parsed command dispatch; tests drive the real argv parsing
// without starting a server. runCli is the bin entry's call.
import { Command } from 'commander'
import { mcpCommand, type McpCommandOptions } from './command'

/**
 * The ref-mcp commander program. `run` receives the parsed options, so tests can
 * drive the real argv parsing without starting a server.
 */
export function createMcpProgram(
  run: (options: McpCommandOptions) => Promise<void>
): Command {
  const program = new Command()

  program
    .name('ref-mcp')
    .description('Reference UI MCP server')
    .version('0.0.1', '-v, --version')
    .argument('[project]', 'Optional path to target project')
    .option('--project <path>', 'Path to target project')
    // No commander default: unset lets resolveTransport pick http for --port or --host.
    .option(
      '--transport <transport>',
      'Transport to use: stdio or http (default: http with --port or --host, else stdio)'
    )
    .option('--http', 'Shorthand for --transport http')
    .option('--host <host>', 'Host to bind when using HTTP transport')
    .option('--port <port>', 'Port to bind when using HTTP transport', value =>
      Number.parseInt(value, 10)
    )
    .action(async (positionalProject?: string, commandOptions?: McpCommandOptions) => {
      const options = commandOptions ?? {}
      const project = options.project || positionalProject || process.env.REF_PROJECT

      await run({
        ...options,
        project,
      })
    })

  return program
}

export async function runCli(argv: string[]): Promise<void> {
  const program = createMcpProgram(options => mcpCommand(process.cwd(), options))

  await program.parseAsync(argv, { from: 'user' })
}
