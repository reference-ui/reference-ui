// W-31 runner: build -> check:dist -> pack -> bare Vite consumer app ->
// vite build (warning scan) -> tsc types check -> dev-server Playwright
// probe (mount-all + B-11 behaviors + zero console errors).
//
// Usage: node scripts/consumer-smoke/run.mjs [--port 5199] [--keep]
// On failure the scaffold dir is kept and its path printed for inspection.
import { spawn, execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..', '..')

const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex === -1 ? 5199 : Number(args[portIndex + 1])
const keep = args.includes('--keep')
if (!Number.isInteger(port) || port <= 0) throw new Error(`bad --port ${args[portIndex + 1]}`)

const step = (name) => console.log(`\n=== smoke: ${name} ===`)
const run = (command, commandArgs, options = {}) =>
  execFileSync(command, commandArgs, {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })

let scaffold = null
let server = null
async function cleanup({ failed }) {
  if (server) {
    server.kill('SIGTERM')
    await new Promise((resolveDone) => {
      const timer = setTimeout(() => {
        server.kill('SIGKILL')
        resolveDone(null)
      }, 5000)
      server.on('exit', () => {
        clearTimeout(timer)
        resolveDone(null)
      })
    })
    server = null
  }
  if (scaffold && !keep && !failed) {
    await rm(scaffold, { recursive: true, force: true })
    scaffold = null
  }
  if (scaffold) console.log(`smoke scaffold kept at ${scaffold}`)
}

try {
  // 1. Dist must be fresh: the gate smokes what `pnpm build` just produced,
  // never a stale artifact (B-11).
  step('check:dist')
  run(process.execPath, ['scripts/check-dist-fresh.mjs'])

  // 2. Pack exactly what would publish. npm (not pnpm: `pnpm pack` has no
  // script-skipping flag) with --ignore-scripts: the build above is the
  // build; prepack would redundantly rebuild and re-fail on tsc exit codes.
  step('npm pack')
  const packOutput = run('npm', ['pack', '--ignore-scripts'])
  const tarballName = packOutput.trim().split('\n').at(-1).trim()
  if (!tarballName.endsWith('.tgz')) throw new Error(`unexpected pack output: ${packOutput}`)
  const tarball = join(packageRoot, tarballName)

  // 3. Scaffold the bare consumer app in a temp dir (outside the workspace so
  // no aliases, no workspace links, no tribal setup can leak in).
  step('scaffold + install')
  scaffold = await mkdtemp(join(tmpdir(), 'reference-ui-smoke-'))
  await cp(join(here, 'template'), scaffold, { recursive: true })
  const templatePkgPath = join(scaffold, 'package.json')
  const templatePkg = JSON.parse(await readFile(templatePkgPath, 'utf8'))
  templatePkg.dependencies['@reference-ui/lib'] = `file:${tarball}`
  await writeFile(templatePkgPath, `${JSON.stringify(templatePkg, null, 2)}\n`)
  try {
    run('npm', ['install', '--no-audit', '--no-fund'], { cwd: scaffold })
  } catch (error) {
    console.error((error.stdout ?? '').slice(-3000))
    console.error((error.stderr ?? '').slice(-3000))
    throw new Error('smoke: scaffold npm install failed')
  }

  // 3b. The ./baseSystem subpath must resolve from the packed tarball in both
  // conditions: runtime import here, types via the tsc pass below.
  step('baseSystem subpath')
  const baseSystemProbe = run(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "const s = (await import('@reference-ui/lib/baseSystem')).baseSystem; " +
        "const hasFragment = typeof s?.fragment === 'string' && s.fragment.trim() !== ''; " +
        "const hasStreams = Array.isArray(s?.streams) && s.streams.length > 0; " +
        "const hasJsx = Array.isArray(s?.jsxElements) && s.jsxElements.length > 0; " +
        "if (!s || typeof s.name !== 'string' || (!hasFragment && !hasStreams && !hasJsx)) " +
        "throw new Error('baseSystem subpath did not export a synced system'); " +
        "console.log('baseSystem:', s.name)",
    ],
    { cwd: scaffold },
  )
  console.log(baseSystemProbe.trim())

  // 4. Types must resolve through the published exports map, including the
  // new ./primitives types chain (B-13) and the ./baseSystem types probe.
  step('tsc --noEmit (consumer types)')
  try {
    run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], { cwd: scaffold })
  } catch (error) {
    console.error((error.stdout ?? '').slice(-4000))
    throw new Error('smoke: consumer tsc failed (exports-map types broken?)')
  }

  // 5. Production build must succeed with zero node-builtin/externalization
  // warnings (B-35 regression scan).
  step('vite build (warning scan)')
  let buildOutput = ''
  try {
    buildOutput = run('npx', ['vite', 'build'], { cwd: scaffold })
  } catch (error) {
    console.error((error.stdout ?? '').slice(-4000))
    console.error((error.stderr ?? '').slice(-2000))
    throw new Error('smoke: consumer vite build failed')
  }
  const buildLog = String(buildOutput)
  const NOISE = [/externalized for browser/i, /has been externalized/i, /Module "node:/i]
  const noiseHits = NOISE.flatMap((pattern) =>
    buildLog.split('\n').filter((line) => pattern.test(line)),
  )
  if (noiseHits.length > 0) {
    console.error(noiseHits.slice(0, 10).join('\n'))
    throw new Error('smoke: consumer build mentions externalized/node builtins (B-35?)')
  }
  console.log('smoke: vite build clean')

  // 6. Dev server + Playwright probe (dev React: B-03 noise and dev
  // diagnostics only fire outside production builds).
  step(`vite dev + probe (port ${port})`)
  server = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: scaffold,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let serverLog = ''
  server.stdout.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  server.stderr.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  const deadline = Date.now() + 90000
  let ready = false
  while (Date.now() < deadline) {
    if (server.exitCode !== null) break
    try {
      const response = await fetch(`http://localhost:${port}/`)
      if (response.ok) {
        ready = true
        break
      }
    } catch {
      // not listening yet
    }
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 500))
  }
  if (!ready) {
    console.error(serverLog.slice(-4000))
    throw new Error('smoke: dev server never became ready')
  }
  try {
    execFileSync(process.execPath, [join(here, 'probe.mjs'), `http://localhost:${port}/`], {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
    })
  } catch {
    throw new Error('smoke: probe failed (see check lines above)')
  }

  await cleanup({ failed: false })
  console.log('\nSMOKE-GATE PASS')
} catch (error) {
  await cleanup({ failed: true })
  console.error(`\nSMOKE-GATE FAIL: ${error.message}`)
  process.exit(1)
}
