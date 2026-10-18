import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const project = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = [
  'exec', '--', 'tsc', '--noEmit', '--strict', '--skipLibCheck',
  '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'es2022',
  'repro/config-controls.ts',
]
console.log('Reference UI MCP configuration controls — consumer typecheck')
console.log('Documentation: docs/mcp.md, Customization Tiers (ui.config.ts)')
console.log('Expected: documented false flags accepted by typed defineConfig.')
console.log('Runtime check: sync succeeds; MCP guards library and icons correctly.')
console.log('$ npm ' + args.join(' '))
const result = spawnSync('npm', args, { cwd: project, encoding: 'utf8' })
process.stdout.write(result.stdout ?? '')
process.stdout.write(result.stderr ?? '')
console.log('Exit status: ' + result.status)
process.exitCode = result.status ?? 1
