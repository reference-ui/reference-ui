/**
 * Runner CLI: quick | ui | dev
 */

import { runQuick, runUi, startDev } from './index.js'

const cmd = process.argv[2] ?? 'quick'
const playwrightArgs = process.argv.slice(3).filter((arg) => arg !== '--')

async function main() {
  switch (cmd) {
    case 'quick':
      await runQuick(playwrightArgs)
      break
    case 'ui':
      await runUi(playwrightArgs)
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
