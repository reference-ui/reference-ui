import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { randomInt } from 'node:crypto'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const project = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(project, '../..')
const name = path.basename(project)
const configPath = path.join(project, 'ui.config.ts')
const originalConfig = fs.readFileSync(configPath)
const results = []
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
let dev, browser, watch, vite
function child(command, args, log) {
  const stream = fs.createWriteStream(path.join(project, 'logs', log))
  const p = spawn(command, args, { cwd: project, stdio: ['ignore', 'pipe', 'pipe'] })
  p.output = ''
  for (const output of [p.stdout, p.stderr]) output.on('data', b => { p.output += b; stream.write(b) })
  p.closed = new Promise(resolve => p.once('close', (code, signal) => { p.outcome = { code, signal }; stream.end(); resolve(p.outcome) }))
  return p
}
async function run(args, log) {
  const p = child('npm', args, log)
  const timeout = setTimeout(() => p.kill('SIGTERM'), 60000)
  const result = await p.closed
  clearTimeout(timeout)
  return { ...result, output: p.output }
}
async function stop(p) {
  if (!p) return
  if (p.exitCode === null && p.signalCode === null) p.kill('SIGTERM')
  const timeout = setTimeout(() => { if (p.exitCode === null && p.signalCode === null) p.kill('SIGKILL') }, 5000)
  await p.closed
  clearTimeout(timeout)
}
async function startDev(log) {
  dev = child(process.execPath, [path.join(root, 'scripts/sandbox.mjs'), 'dev', name], log)
  for (let i = 0; i < 300; i++) {
    try { const s = JSON.parse(fs.readFileSync(path.join(project, '.sandbox/runtime.json'))); if (s.pid === dev.pid && s.running) return s } catch {}
    if (dev.exitCode !== null || dev.signalCode !== null) throw new Error('Managed dev exited before ready: ' + dev.output)
    await pause(100)
  }
  throw new Error('Managed dev startup timed out')
}
function save() { fs.writeFileSync(path.join(project, 'logs/runtime-regressions.json'), JSON.stringify(results, null, 2) + '\n') }
try {
  const general = await startDev('general-dev.log')
  const cli = child(process.execPath, ['verify-browser.mjs', general.url], 'browser-command.log')
  await cli.closed
  results.push({ phase: 'general-browser', outcome: cli.outcome, result: JSON.parse(fs.readFileSync(path.join(project, 'logs/browser-regressions.json'))) })
  save()
  await stop(dev); dev = null

  fs.mkdirSync(path.join(project, 'src/library'), { recursive: true })
  fs.copyFileSync(path.join(project, 'fixtures/library-tokens.ts'), path.join(project, 'src/library/tokens.ts'))
  fs.copyFileSync(path.join(project, 'fixtures/library-config.ts'), configPath)
  fs.writeFileSync(configPath, fs.readFileSync(configPath, 'utf8').replace('src/repro/', 'src/library/'))
  fs.writeFileSync(path.join(project, 'library.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Library import regression</title><div id="root"></div><script type="module" src="/src/library/main.tsx"></script></html>')
  const bindings = {}
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  for (const binding of ['unaliased', 'aliased']) {
    fs.copyFileSync(path.join(project, `fixtures/library-${binding}.tsx`), path.join(project, 'src/library/main.tsx'))
    const runtime = await startDev(`library-${binding}-dev.log`)
    const page = await browser.newPage({ viewport: { width: 1000, height: 650 } })
    await page.goto(runtime.url + '/library.html', { waitUntil: 'networkidle' })
    const metrics = {}
    for (const control of ['generated', 'library']) metrics[control] = await page.getByTestId(control + '-button').evaluate(e => { const s = getComputedStyle(e); return { background: s.backgroundColor, color: s.color, padding: s.padding, radius: s.borderRadius } })
    bindings[binding] = { url: page.url(), metrics }
    await page.screenshot({ path: path.join(project, `evidence/issue-19-${binding}.png`) })
    await page.close()
    await stop(dev); dev = null
  }
  const expected = m => m.background === 'rgb(15, 118, 110)' && m.padding === '16px' && m.radius === '10px'
  results.push({ issue: 19, passed: Object.values(bindings).every(x => expected(x.metrics.generated) && expected(x.metrics.library)), bindings })
  await browser.close(); browser = null
  save()

  fs.writeFileSync(configPath, "import {defineConfig} from '@reference-ui/core'\nimport {baseSystem} from '@reference-ui/lib/baseSystem'\nexport default defineConfig({name:'10-regression-20261020',include:['src/literal-watch.tsx'],extends:[baseSystem]})\n")
  fs.copyFileSync(configPath, path.join(project, 'repro/literal-watch-config.ts'))
  const literal = path.join(project, 'src/literal-watch.tsx')
  const literalSource = "import '@reference-ui/react/styles.css'\nimport {createRoot} from 'react-dom/client'\nimport {Div} from '@reference-ui/react'\ncreateRoot(document.getElementById('root')!).render(<Div data-testid=\"literal-probe\" padding=\"7.25r\">Exact-file include watch update</Div>)\n"
  fs.writeFileSync(literal, literalSource)
  fs.writeFileSync(path.join(project, 'literal.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Exact file watch regression</title><div id="root"></div><script type="module" src="/src/literal-watch.tsx"></script></html>')
  const initial = await run(['run', 'sync'], 'issue-20-once.log')
  watch = child(path.join(project, 'node_modules/.bin/ref'), ['sync', '--watch', '--verbose'], 'issue-20-watch.log')
  await pause(2000)
  if (watch.exitCode !== null || watch.signalCode !== null || initial.code !== 0) {
    results.push({ issue: 20, passed: false, initial, watch: watch.outcome, output: watch.output })
  } else {
    for (let attempt = 0; attempt < 8; attempt++) {
      vite = await createServer({ root: project, configFile: false, server: { host: '127.0.0.1', port: randomInt(20000, 60000), strictPort: true, fs: { strict: true, allow: [project] } }, resolve: { dedupe: ['react', 'react-dom'] } })
      try { await vite.listen(); break } catch (error) { await vite.close(); vite = null; if (!/EADDRINUSE|already in use/i.test(error.message)) throw error }
    }
    if (!vite) throw new Error('Could not bind a high loopback port')
    const address = vite.httpServer.address()
    const url = `http://127.0.0.1:${address.port}/literal.html`
    browser = await chromium.launch({ channel: 'chrome', headless: true })
    const page = await browser.newPage({ viewport: { width: 1000, height: 500 } })
    await page.goto(url, { waitUntil: 'networkidle' })
    const before = await page.getByTestId('literal-probe').evaluate(e => getComputedStyle(e).padding)
    fs.writeFileSync(literal, literalSource.replace('7.25r', '8.25r'))
    let changed = false
    try { await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="literal-probe"]')).padding === '33px', null, { timeout: 15000 }); changed = true } catch {}
    const after = await page.getByTestId('literal-probe').evaluate(e => getComputedStyle(e).padding)
    await page.screenshot({ path: path.join(project, 'evidence/issue-20-watch-updated.png') })
    results.push({ issue: 20, passed: before === '29px' && after === '33px' && changed && watch.exitCode === null && !watch.output.includes('ENOTDIR'), url, before, after, watchAlive: watch.exitCode === null, output: watch.output })
    await browser.close(); browser = null
    vite.httpServer?.closeAllConnections?.(); await vite.close(); vite = null
  }
  await stop(watch); watch = null
  fs.writeFileSync(literal, literalSource)
  save()
} catch (error) {
  results.push({ error: error.stack || String(error), passed: false })
  save()
  process.exitCode = 1
} finally {
  await browser?.close()
  if (vite) { vite.httpServer?.closeAllConnections?.(); await vite.close() }
  await stop(dev)
  await stop(watch)
  fs.writeFileSync(configPath, originalConfig)
  const restored = await run(['run', 'sync'], 'runtime-restored-sync.log')
  if (restored.code !== 0) { results.push({ check: 'restored-sync', passed: false, restored }); process.exitCode = 1 }
  save()
}
console.log(JSON.stringify(results, null, 2))
