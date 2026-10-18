// Runner: build -> check:dist -> pack -> bare Vite consumer app ->
// vite build (warning scan) -> tsc types check (skipLibCheck on, then off for
// lib's declarations, then the SyncedSystem probe: a strict consumer's fill
// must reach lib's props) -> dev-server Playwright probe (mount-all +
// behaviors + zero console errors) -> layered override (extendSystem through a
// real ref sync: the served sheet checked as text, then a lib Button painted in
// light and dark against the override and against lib's own default).
//
// Usage: node scripts/consumer-smoke/run.mjs [--port 5199] [--keep]
// On failure the scaffold dir is kept and its path printed for inspection.
import { spawn, execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
// Declaration errors under sibling packages that have not shipped
// self-contained types yet. Named here so each residual keeps its owner.
const SIBLING_OWNED_PREFIXES = ['node_modules/@reference-ui/icons/']

const step = (name) => console.log(`\n=== smoke: ${name} ===`)
const run = (command, commandArgs, options = {}) =>
  execFileSync(command, commandArgs, {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })

// SyncedSystem probe (pass 3): synced-probe/probe.tsx against lib's declarations
// with skipLibCheck off. A line carrying the off-token value must fail with a
// TS2322 naming it; every other probe line, the offset line included, must
// compile; lib adds no error. Any other diagnostic fails the gate.
const SYNCED_PROBE_FILE = 'synced-probe/probe.tsx'
const SYNCED_OFF_TOKEN = 'smokeOffToken'
const SYNCED_ACCEPTED = 'offset={8}'
const DIAGNOSTIC_LINE = /^(.+?)\((\d+),\d+\): error (TS\d+): (.*)$/

const numberedLines = (lines, needle) =>
  lines.flatMap((text, index) => (text.includes(needle) ? [index + 1] : []))

function checkSyncedProbe(outputLines, probeLines) {
  const failures = []
  const rejected = new Set()
  const named = new Set()
  let libErrors = 0
  let siblingErrors = 0
  for (const line of outputLines) {
    if (!/error TS\d+/.test(line)) continue
    if (SIBLING_OWNED_PREFIXES.some((prefix) => line.startsWith(prefix))) {
      siblingErrors += 1
      continue
    }
    const match = DIAGNOSTIC_LINE.exec(line)
    if (!match) {
      failures.push(`unparsed diagnostic: ${line}`)
      continue
    }
    const [, file, lineText, code, message] = match
    const lineNo = Number(lineText)
    if (file.startsWith('node_modules/@reference-ui/lib/')) libErrors += 1
    if (file !== SYNCED_PROBE_FILE) {
      failures.push(line)
      continue
    }
    rejected.add(lineNo)
    const offToken = probeLines[lineNo - 1]?.includes(SYNCED_OFF_TOKEN) ?? false
    if (!offToken || code !== 'TS2322' || !message.includes(SYNCED_OFF_TOKEN)) {
      failures.push(`unexpected probe error: ${line}`)
      continue
    }
    named.add(lineNo)
  }
  const offLines = numberedLines(probeLines, SYNCED_OFF_TOKEN)
  const acceptedLines = numberedLines(probeLines, SYNCED_ACCEPTED)
  if (offLines.length === 0) failures.push(`probe has no ${SYNCED_OFF_TOKEN} line`)
  if (acceptedLines.length === 0) failures.push(`probe has no ${SYNCED_ACCEPTED} line`)
  for (const lineNo of offLines) {
    if (!named.has(lineNo)) failures.push(`${SYNCED_PROBE_FILE}:${lineNo} did not fail as TS2322 naming the value`)
  }
  for (const lineNo of acceptedLines) {
    if (rejected.has(lineNo)) failures.push(`${SYNCED_PROBE_FILE}:${lineNo} (offset) was rejected`)
  }
  return {
    failures,
    offCount: offLines.length,
    acceptedCount: acceptedLines.length,
    libErrors,
    siblingErrors,
  }
}

// Layered override pass (step 7). lib's published base system is layered whole by one config, and the same base
// wrapped in extendSystem by another. Each config is synced for real by the core bin, and the sheet it serves is
// checked as text. Then one lib Button per colour mode is painted on three pages: the override sheet, the control
// sheet, and lib's own prebuilt styles. The override is a light and a dark value on lib's default button background.
const CORE_BIN = resolve(packageRoot, '..', 'reference-core', 'dist', 'bin', 'ref.js')
const CORE_ENSURE = resolve(packageRoot, '..', 'reference-core', 'tools', 'ensure-dist.mjs')
const LAYER_OVERRIDE = { light: '#fde68a', dark: '#1e3a8a' }
// ui.button.default.background: the token lib's default <Button> paints, light gray.100 and dark gray.700.
const LAYER_TOKEN = '--colors-ui-button-default-background'
const LAYER_RULE = {
  light: '[data-layer="reference-ui"], [data-layer="reference-ui"][data-color-mode=light]',
  dark: '[data-layer="reference-ui"][data-color-mode=dark]',
}
const LAYER_BASE_IMPORT = "import { baseSystem as libBaseSystem } from '@reference-ui/lib/baseSystem'"
const OVERRIDE_CONFIG = `import { defineConfig, extendSystem } from '@reference-ui/core'
${LAYER_BASE_IMPORT}

const branded = extendSystem(libBaseSystem, {
  tokens: {
    colors: {
      ui: {
        button: {
          default: {
            background: { light: '${LAYER_OVERRIDE.light}', dark: '${LAYER_OVERRIDE.dark}' },
          },
        },
      },
    },
  },
})

export default defineConfig({
  name: 'consumer-smoke',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  layers: [branded],
})
`
const CONTROL_CONFIG = `import { defineConfig } from '@reference-ui/core'
${LAYER_BASE_IMPORT}

export default defineConfig({
  name: 'consumer-smoke',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  layers: [libBaseSystem],
})
`
// The three pages the paint probe opens. Each renders the same Probe: one lib Button in light and one in dark.
const LAYER_PAGES = [
  { name: 'override', css: './sheets/override.css' },
  { name: 'control', css: './sheets/control.css' },
  { name: 'libown', css: '@reference-ui/lib/styles.css' },
]
const PROBE_COMPONENT = `import { Button, Div } from '@reference-ui/lib/primitives'

export function Probe() {
  return (
    <Div>
      <Button id="light" colorMode="light">Light</Button>
      <Button id="dark" colorMode="dark">Dark</Button>
    </Div>
  )
}
`

function pageHtml(name) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>layers ${name}</title></head>
  <body><div id="root"></div><script type="module" src="/src/${name}.tsx"></script></body>
</html>
`
}

function pageEntry(css) {
  return `import '${css}'
import { createRoot } from 'react-dom/client'
import { Probe } from './probe'

createRoot(document.getElementById('root') as HTMLElement).render(<Probe />)
`
}

// One real sync of the scaffold through the core bin. A failed sync throws with its own output, never a stale sheet.
function syncScaffold(dir) {
  const result = spawnSync(process.execPath, [CORE_BIN, 'sync', '--quiet', dir], { cwd: dir, encoding: 'utf8' })
  if (result.status !== 0) {
    const output = `${result.stdout}${result.stderr}`.slice(-3000)
    throw new Error(`smoke: ref sync failed in the scaffold (exit ${result.status}): ${output}`)
  }
}

// The declaration bodies of every rule the served sheet prints under one exact selector.
function rulesUnder(sheet, selector) {
  const open = `${selector} {`
  const bodies = []
  for (let at = sheet.indexOf(open); at >= 0; at = sheet.indexOf(open, at + open.length)) {
    bodies.push(sheet.slice(at + open.length, sheet.indexOf('}', at)))
  }
  return bodies
}

// Reads the two served sheets from disk. The override must print its light and dark values under the reference-ui
// stamp. The control must print lib's own defaults and none of the override values.
function proveLayeredSheets(sheetsDir) {
  const override = readFileSync(join(sheetsDir, 'override.css'), 'utf8')
  const control = readFileSync(join(sheetsDir, 'control.css'), 'utf8')
  const printsUnder = (sheet, mode, value) =>
    rulesUnder(sheet, LAYER_RULE[mode]).some((body) => body.includes(`${LAYER_TOKEN}: ${value};`))
  const checks = [
    [
      'override sheet prints its light value under the reference-ui stamp',
      printsUnder(override, 'light', LAYER_OVERRIDE.light),
    ],
    [
      'override sheet prints its dark value under the reference-ui dark stamp',
      printsUnder(override, 'dark', LAYER_OVERRIDE.dark),
    ],
    ["control sheet prints lib's light default", printsUnder(control, 'light', 'var(--colors-gray-100)')],
    ["control sheet prints lib's dark default", printsUnder(control, 'dark', 'var(--colors-gray-700)')],
    [
      'control sheet carries no override value',
      !control.includes(LAYER_OVERRIDE.light) && !control.includes(LAYER_OVERRIDE.dark),
    ],
  ]
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name)
  if (failed.length > 0) throw new Error(`smoke: layered sheet check failed: ${failed.join('; ')}`)
  for (const [name] of checks) console.log(`smoke: PASS sheet: ${name}`)
}

// Writes the pages into the scaffold: the shared Probe component, then one entry and one html file per page.
function writeLayerPages(dir) {
  mkdirSync(join(dir, 'src'), { recursive: true })
  writeFileSync(join(dir, 'src', 'probe.tsx'), PROBE_COMPONENT)
  for (const { name, css } of LAYER_PAGES) {
    writeFileSync(join(dir, `${name}.html`), pageHtml(name))
    writeFileSync(join(dir, 'src', `${name}.tsx`), pageEntry(css))
  }
}

// Syncs the override config, then the control config. Each served sheet is copied beside the pages before the next
// sync overwrites it. The scaffold's ui.config.ts is this pass's own: the template ships none.
function prepareLayeredPass(dir) {
  execFileSync(process.execPath, [CORE_ENSURE], { cwd: packageRoot, stdio: 'inherit' })
  const served = join(dir, '.reference-ui', 'styled', 'styles.css')
  const sheets = join(dir, 'src', 'sheets')
  mkdirSync(sheets, { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), OVERRIDE_CONFIG)
  syncScaffold(dir)
  copyFileSync(served, join(sheets, 'override.css'))
  writeFileSync(join(dir, 'ui.config.ts'), CONTROL_CONFIG)
  syncScaffold(dir)
  copyFileSync(served, join(sheets, 'control.css'))
  proveLayeredSheets(sheets)
  writeLayerPages(dir)
}

// The paint half: layers-probe.mjs opens the three pages on the served dev server and checks each Button's paint.
function probeLayeredPages(base) {
  try {
    execFileSync(process.execPath, [join(here, 'layers-probe.mjs'), base, JSON.stringify(LAYER_OVERRIDE)], {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
    })
  } catch {
    throw new Error('smoke: layered paint probe failed (see check lines above)')
  }
}

let scaffold = null
let server = null

// Stops the dev server this run started, if one is up: SIGTERM, then SIGKILL after five seconds.
async function stopServer() {
  if (!server) return
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

// Starts the scaffold's vite dev server into the `server` handle and resolves once it answers. A server that exits or
// never answers fails loud with its log, and the handle stays set so cleanup still stops it.
async function startDevServer(cwd, devPort) {
  server = spawn('npx', ['vite', '--port', String(devPort), '--strictPort'], {
    cwd,
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
      const response = await fetch(`http://localhost:${devPort}/`)
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
}

async function cleanup({ failed }) {
  await stopServer()
  if (scaffold && !keep && !failed) {
    await rm(scaffold, { recursive: true, force: true })
    scaffold = null
  }
  if (scaffold) console.log(`smoke scaffold kept at ${scaffold}`)
}

try {
  // 1. Dist must be fresh: the gate smokes what `pnpm build` just produced,
  // never a stale artifact.
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
  // new ./primitives types chain and the ./baseSystem types probe.
  step('tsc --noEmit (consumer types)')
  try {
    run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], { cwd: scaffold })
  } catch (error) {
    console.error((error.stdout ?? '').slice(-4000))
    throw new Error('smoke: consumer tsc failed (exports-map types broken?)')
  }

  // 4b. Same app with skipLibCheck off: lib's published declarations must
  // check without the escape hatch, which is what a consumer with
  // skipLibCheck: false sees. Every error fails the gate except those under a
  // sibling package that has not yet shipped self-contained declarations; those
  // are counted and named so the residual keeps its owner.
  step('tsc --noEmit, skipLibCheck false (lib declarations)')
  let libTypesOutput = ''
  try {
    run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.lib-types.json'], { cwd: scaffold })
  } catch (error) {
    libTypesOutput = String(error.stdout ?? '')
    if (!/error TS\d+/.test(libTypesOutput)) {
      console.error(String(error.stderr ?? '').slice(-2000))
      throw new Error('smoke: lib-types tsc failed without diagnostics')
    }
  }
  const diagnostics = libTypesOutput.split('\n').filter((line) => /error TS\d+/.test(line))
  const siblingOwned = (line) => SIBLING_OWNED_PREFIXES.some((prefix) => line.startsWith(prefix))
  const gated = diagnostics.filter((line) => !siblingOwned(line))
  const named = diagnostics.filter(siblingOwned)
  console.log(
    `smoke: skipLibCheck=false: ${gated.length} errors gated, ${named.length} owned by sibling packages (not gated)`,
  )
  if (named.length > 0) console.log(`smoke: first sibling residual: ${named[0].slice(0, 220)}`)
  if (gated.length > 0) {
    console.error(gated.slice(0, 20).join('\n'))
    throw new Error(`smoke: lib declarations fail under skipLibCheck: false (${gated.length} errors)`)
  }

  // 4c. SyncedSystem probe (pass 3). The template copy puts synced-probe/ in the
  // scaffold; only tsconfig.synced.json includes it, so passes 1 and 2 never see
  // it. A nonzero exit is expected: the off-token probes must fail. The gate reads
  // the diagnostics and fails on any other one.
  step('tsc --noEmit, SyncedSystem probe (strict consumer)')
  let probeOutput = null
  let probeStatus = 0
  try {
    run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.synced.json'], { cwd: scaffold })
  } catch (error) {
    probeStatus = error.status ?? 1
    probeOutput = String(error.stdout ?? '')
    if (!/error TS\d+/.test(probeOutput)) {
      console.error(String(error.stderr ?? '').slice(-2000))
      throw new Error('smoke: synced probe tsc failed without diagnostics')
    }
  }
  if (probeOutput === null) {
    throw new Error('smoke: synced probe compiled clean, so the strict fill never reached lib props')
  }
  const probeLines = (await readFile(join(scaffold, SYNCED_PROBE_FILE), 'utf8')).split('\n')
  const probe = checkSyncedProbe(probeOutput.split('\n'), probeLines)
  console.log(
    `smoke: synced probe: tsc exit ${probeStatus} (nonzero expected); ${probe.offCount} off-token lines and ${probe.acceptedCount} offset line checked; ${probe.libErrors} lib errors; ${probe.siblingErrors} owned by sibling packages (not gated)`,
  )
  if (probe.failures.length > 0) {
    console.error(probe.failures.slice(0, 20).join('\n'))
    throw new Error(`smoke: SyncedSystem probe failed (${probe.failures.length} problems)`)
  }

  // 5. Production build must succeed with zero node-builtin/externalization
  // warnings (regression scan).
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
    throw new Error('smoke: consumer build mentions externalized/node builtins')
  }
  console.log('smoke: vite build clean')

  // 6. Dev server + Playwright probe (dev React: element.ref noise and dev
  // diagnostics only fire outside production builds).
  step(`vite dev + probe (port ${port})`)
  await startDevServer(scaffold, port)
  try {
    execFileSync(process.execPath, [join(here, 'probe.mjs'), `http://localhost:${port}/`], {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
    })
  } catch {
    throw new Error('smoke: probe failed (see check lines above)')
  }

  // 7. Layered override through the real sync: extendSystem over lib's base
  // system, synced by the core bin. The served sheet is checked as text, then a
  // lib Button is painted in light and dark. The dev server restarts first so
  // the new pages are served from a fresh dependency scan.
  step('layers: extendSystem through ref sync')
  prepareLayeredPass(scaffold)
  await stopServer()
  step(`layered paint probe (port ${port})`)
  await startDevServer(scaffold, port)
  probeLayeredPages(`http://localhost:${port}/`)

  await cleanup({ failed: false })
  console.log('\nSMOKE-GATE PASS')
} catch (error) {
  await cleanup({ failed: true })
  console.error(`\nSMOKE-GATE FAIL: ${error.message}`)
  process.exit(1)
}
