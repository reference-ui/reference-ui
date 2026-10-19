#!/usr/bin/env node
// Published bin entry for ref-mcp (also reference-mcp, mcp).
// It takes the CLI argv and runs the compiled dist CLI, exiting 1 with the error on failure.
import { runCli } from '../dist/cli.mjs'

runCli(process.argv.slice(2)).catch(err => {
  console.error(err)
  process.exit(1)
})
