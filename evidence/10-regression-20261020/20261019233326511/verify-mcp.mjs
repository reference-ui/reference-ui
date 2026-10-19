import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const project = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(project, 'ui.config.ts')
const originalConfig = fs.readFileSync(configPath)
const checks = []
const decode = result => {
  if (result.structuredContent) return result.structuredContent
  const text = result.content?.filter(x => x.type === 'text').map(x => x.text).join('\n') || ''
  try { return JSON.parse(text) } catch { return { text } }
}
async function session(phase) {
  const transport = new StdioClientTransport({ command: path.join(project, 'node_modules/.bin/ref-mcp'), args: ['--project', project], cwd: project, stderr: 'pipe' })
  let stderr = ''
  transport.stderr?.on('data', b => { stderr += b })
  const client = new Client({ name: 'ref-consumer-regression', version: '1.0.0' })
  const response = { phase, calls: [] }
  try {
    await client.connect(transport, { timeout: 20000 })
    const listing = await client.listTools({}, { timeout: 20000 })
    response.tools = listing.tools.map(t => ({ name: t.name, inputSchema: t.inputSchema }))
    async function call(name, args) {
      const r = await client.callTool({ name, arguments: args }, undefined, { timeout: 20000 })
      const record = { name, args, isError: !!r.isError, result: decode(r) }
      response.calls.push(record)
      return record
    }
    const selected = await call('select_project', { path: project })
    if (selected.isError || selected.result.project !== project) throw new Error('Explicit own-project selection could not be confirmed')
    if (phase === 'baseline') {
      await call('get_component', { project, name: 'Accordion' })
      await call('get_component_props', { project, name: 'Accordion', includeStyleProps: false, query: 'defaultValue', limit: 50 })
    } else {
      await call('get_component', { project, name: 'Switch' })
      await call('list_icons', { project, query: 'settings', limit: 2 })
    }
  } finally {
    await client.close().catch(() => {})
    await transport.close().catch(() => {})
    fs.writeFileSync(path.join(project, `logs/mcp-${phase}-stderr.log`), stderr)
    fs.writeFileSync(path.join(project, `logs/mcp-${phase}.json`), JSON.stringify(response, null, 2) + '\n')
  }
  return response
}
function sync(log) {
  const r = spawnSync('npm', ['run', 'sync'], { cwd: project, encoding: 'utf8', timeout: 60000 })
  fs.writeFileSync(path.join(project, 'logs', log), (r.stdout || '') + (r.stderr || '') + '\nExit ' + r.status + '\n')
  if (r.status !== 0) throw new Error('MCP configuration sync failed')
}
try {
  const baseline = await session('baseline')
  const component = baseline.calls.find(c => c.name === 'get_component')
  const props = baseline.calls.find(c => c.name === 'get_component_props')
  const advertised = [...(component.result.props || []), ...(props.result.props || [])].some(p => p.name === 'defaultValue')
  const types = JSON.parse(fs.readFileSync(path.join(project, 'logs/type-regressions.json'))).find(c => c.issue === 16)
  checks.push({ issue: 16, passed: !component.isError && !props.isError && types.baseline.exit === 0 && (!advertised || types.defaultValue.exit === 0), advertisedDefaultValue: advertised, defaultValueTypeExit: types.defaultValue.exit, baselineTypeExit: types.baseline.exit, component, props })
  fs.writeFileSync(configPath, "import {defineConfig} from '@reference-ui/core'\nimport {baseSystem} from '@reference-ui/lib/baseSystem'\nexport default defineConfig({name:'10-regression-20261020',include:['src/**/*.{ts,tsx}'],extends:[baseSystem],use_reference_library:false,use_reference_icons:false})\n")
  fs.copyFileSync(configPath, path.join(project, 'repro/mcp-disabled-config.ts'))
  sync('mcp-disabled-sync.log')
  const disabled = await session('disabled')
  const library = disabled.calls.find(c => c.name === 'get_component')
  const icons = disabled.calls.find(c => c.name === 'list_icons')
  const libraryNotice = JSON.stringify(library.result)
  checks.push({ issue: 21, passed: !icons.isError && /disabled|not enabled|useReferenceLibrary|use_reference_library/i.test(libraryNotice) && icons.result.enabled === false, library, icons })
} catch (error) {
  checks.push({ passed: false, error: error.stack || String(error) })
  process.exitCode = 1
} finally {
  fs.writeFileSync(configPath, originalConfig)
  sync('mcp-restored-sync.log')
  fs.writeFileSync(path.join(project, 'logs/mcp-regressions.json'), JSON.stringify(checks, null, 2) + '\n')
}
console.log(JSON.stringify(checks, null, 2))
