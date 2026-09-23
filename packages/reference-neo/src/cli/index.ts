// CLI entry: it takes the raw argv tail and emits the process exit code.
// Commander owns the argv shape — verbs, the optional dir, the --watch flag —
// while the per-command files own their runs and prints. Unknown verbs fall
// through to the usage error below; --help prints Commander help plus the
// pinned usage block the bin tests assert.
import { Command } from 'commander'
import { registerCleanCommand } from './clean.ts'
import { USAGE, printUsageError } from './output.ts'
import { registerSyncCommand } from './sync.ts'

export async function runCli(argv: string[]): Promise<number> {
  let code = 0
  const report = (next: number): void => {
    code = next
  }
  const program = new Command()
  program
    .name('ref')
    .description('the Neo host CLI for case worlds and consumer projects')
    .addHelpText('after', () => `\n${USAGE}\n`)
  program.on('command:*', (operands: string[]) => {
    code = printUsageError(`unknown command: ${operands[0] ?? '(none)'}`)
  })
  registerSyncCommand(program, report)
  registerCleanCommand(program, report)
  await program.parseAsync(argv, { from: 'user' })
  return code
}
