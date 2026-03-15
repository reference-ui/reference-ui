/**
 * Runner CLI: quick | ui | dev
 */

import { runQuick, runUi, startDev } from './index.js'

const cmd = process.argv[2] ?? 'quick'

async function main() {
  switch (cmd) {
    case 'quick':
      await runQuick()
      break
    case 'ui':
      await runUi()
      break
    case 'dev':
      await startDev()
      break
    default:
      console.error(`Unknown command: ${cmd}. Use quick, ui, or dev.`)
      process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
