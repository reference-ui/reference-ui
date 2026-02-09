#!/usr/bin/env node
import { syncCommand } from './commands/sync.js'
import { linkSystemCommand } from './commands/link-system.js'

const cwd = process.cwd()

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2)
    const command = args[0]
    const flags = args.slice(1)
    
    if (command === 'link-system') {
      await linkSystemCommand(cwd)
      return
    }
    
    const watch = flags.includes('--watch') || flags.includes('-w')
    await syncCommand(cwd, { watch })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
