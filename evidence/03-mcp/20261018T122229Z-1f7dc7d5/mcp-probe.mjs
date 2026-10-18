import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

// One-shot consumer protocol probe. Never reads server implementation or resources.
const project = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')
const logDirectory = resolve(project, 'logs')
await mkdir(logDirectory, { recursive: true })
const output = resolve(logDirectory, 'mcp-results.jsonl')
const stderrPath = resolve(logDirectory, 'mcp-stderr.log')
await writeFile(output, '')
await writeFile(stderrPath, '')
const started = Date.now()
const record = async (event) => {
  const entry = { elapsedMs: Date.now() - started, ...event }
  await appendFile(output, `${JSON.stringify(entry)}\n`)
  console.log(JSON.stringify(entry))
}
const abort = new AbortController()
const overallTimer = setTimeout(() => abort.abort(new Error('Overall probe timeout (90 seconds)')), 90_000)
const options = () => ({ signal: abort.signal, timeout: 15_000, maxTotalTimeout: 15_000 })
const client = new Client({ name: 'reference-ui-consumer-probe', version: '1.0.0' }, { capabilities: {} })
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(project, 'node_modules/@reference-ui/mcp/bin/mcp.mjs')],
  cwd: project,
  stderr: 'pipe',
})
const stderrWrites = []
transport.stderr?.on('data', chunk => stderrWrites.push(appendFile(stderrPath, chunk)))
client.onerror = error => { stderrWrites.push(appendFile(stderrPath, `${error.stack ?? error}\n`)) }
const decode = result => {
  if (result.structuredContent) return result.structuredContent
  for (const block of result.content ?? []) {
    if (block.type === 'text') {
      try { return JSON.parse(block.text) } catch { /* Preserve text on own-project calls only. */ }
    }
  }
  return null
}
const call = async (name, args, { discovery = false } = {}) => {
  const result = await client.callTool({ name, arguments: args }, undefined, options())
  const parsed = decode(result)
  if (discovery) {
    if (!parsed || !Array.isArray(parsed.projects)) {
      await record({ method: name, arguments: args, isError: Boolean(result.isError), result: 'Discovery response not JSON with projects; omitted to avoid inspecting unrelated projects.' })
    } else {
      await record({ method: name, arguments: args, isError: Boolean(result.isError), result: {
        activeProject: parsed.activeProject === project ? project : '[other project omitted]',
        projects: parsed.projects.filter(entry => entry.path === project),
        omittedProjectCount: parsed.projects.filter(entry => entry.path !== project).length,
      } })
    }
  } else {
    await record({ method: name, arguments: args, result })
  }
  return { result, parsed }
}

try {
  await record({ command: 'node mcp-probe.mjs', project, serverBin: 'node_modules/@reference-ui/mcp/bin/mcp.mjs' })
  await client.connect(transport, options())
  await record({ method: 'initialize', server: client.getServerVersion(), capabilities: client.getServerCapabilities() })
  const tools = await client.listTools({}, options())
  await record({ method: 'tools/list', tools: tools.tools.map(({ name, inputSchema }) => ({ name, inputSchema })) })
  await call('list_projects', { scanPath: project, maxDepth: 1 }, { discovery: true })
  const selection = await call('select_project', { path: project })
  if (selection.result.isError || selection.parsed?.project !== project) {
    throw new Error('Cannot verify explicit assigned-project selection; stopping before project queries.')
  }
  for (const [name, args] of [
    ['list_components', { project, limit: 10 }],
    ['get_component', { project, name: 'Accordion' }],
    ['get_component_props', { project, name: 'Accordion', includeStyleProps: false, limit: 15 }],
    ['get_tokens', { project, category: 'colors', limit: 10 }],
    ['list_icons', { project, query: 'search', verbose: true, limit: 3 }],
    ['get_style_props', { project, query: 'padding' }],
  ]) {
    await call(name, args)
  }
  await record({ status: 'completed' })
} catch (error) {
  process.exitCode = 1
  await record({ status: 'failed', error: error.stack ?? String(error) })
} finally {
  clearTimeout(overallTimer)
  const closeTimer = setTimeout(() => {
    // pid is the transport-owned child, and is null once the transport clears it.
    if (transport.pid !== null) {
      try { process.kill(transport.pid, 'SIGTERM') } catch { /* Already exited. */ }
    }
  }, 5_000)
  await client.close().catch(error => record({ status: 'close-failed', error: String(error) }))
  clearTimeout(closeTimer)
  await Promise.allSettled(stderrWrites)
}
