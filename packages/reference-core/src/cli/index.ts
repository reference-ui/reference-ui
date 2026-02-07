#!/usr/bin/env node
import { syncCommand } from './commands/sync.js'
import { linkSystemCommand } from './commands/link-system.js'

const cwd = process.cwd()

async function main(): Promise<void> {
  try {
    const [command] = process.argv.slice(2)
    if (command === 'link-system') {
      await linkSystemCommand(cwd)
      return
    }
    await syncCommand(cwd)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
