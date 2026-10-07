// Module-load census runner (voyage-one-shot wave 0).
// It bundles then evaluates a real `ui.config.ts` exactly as loadUserConfig
// does, using the census `load` hook to record every file: URL touched during
// the evaluate import, then attributes the loads by package. Setup loads (the
// runner's own neo imports, esbuild) happen before the slice point and are
// excluded, so the reported graph is the config import's graph alone.
//
// Usage:
//   CENSUS_OUT=/path/log node --import ./register.mjs run.mjs <pkgDir> [outJson]
//
// Modes (2nd positional after pkgDir): default "config" evaluates the config
// bundle; "barrel" imports '@reference-ui/lib' directly (the isolated graph).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../../../../../', import.meta.url).pathname.replace(/\/$/, '')
const dist = `${ROOT}/packages/reference-neo/dist/src`

const [cwdArg, mode = 'config', outJson] = process.argv.slice(2)
if (!cwdArg) {
  console.error('usage: run.mjs <pkgDir> [config|barrel] [outJson]')
  process.exit(2)
}
const out = process.env.CENSUS_OUT
if (!out) {
  console.error('CENSUS_OUT env is required')
  process.exit(2)
}

writeFileSync(out, '')

let configPath = null
let depInputs = 0
let codeBytes = 0
let payload
try {
  if (mode === 'config') {
    const { bundleConfigWithDependencies } = await import(`${dist}/config/bundle.js`)
    const { evaluateConfig } = await import(`${dist}/config/evaluate.js`)
    const { resolveRefConfigFile } = await import(`${dist}/lib/paths/index.js`)
    configPath = resolveRefConfigFile(`${ROOT}/${cwdArg}`)
    const bundled = await bundleConfigWithDependencies(configPath)
    depInputs = bundled.dependencyPaths.length
    codeBytes = bundled.code.length
    payload = { code: bundled.code, configPath }
  }
} catch (err) {
  console.error('setup failed:', err?.stack ?? err)
  process.exit(1)
}

// Slice point: everything before this line is runner/neo/esbuild setup.
const before = readFileSync(out, 'utf8')

try {
  if (mode === 'config') {
    const { evaluateConfig } = await import(`${dist}/config/evaluate.js`)
    await evaluateConfig(payload.code, payload.configPath)
  } else {
    await import('@reference-ui/lib')
  }
} catch (err) {
  console.error('import failed:', err?.stack ?? err)
  process.exit(1)
}
// Let the loader thread flush its final appends before we read.
await new Promise((resolve) => setTimeout(resolve, 250))

const added = readFileSync(out, 'utf8').slice(before.length).split('\n').filter(Boolean)

function packageOf(url) {
  let p
  try {
    p = fileURLToPath(url)
  } catch {
    return '(non-file)'
  }
  const nm = p.lastIndexOf('/node_modules/')
  if (nm !== -1) {
    const seg = p.slice(nm + '/node_modules/'.length).split('/')
    return seg[0].startsWith('@') ? `${seg[0]}/${seg[1]}` : seg[0]
  }
  const ws = p.match(/\/packages\/(reference-[^/]+)\//)
  if (ws) return `@reference-ui/${ws[1].replace(/^reference-/, '')}`
  if (p.includes('/esbuild/')) return 'esbuild'
  return '(other)'
}

const counts = new Map()
const uniqueSets = new Map()
for (const url of added) {
  const pkg = packageOf(url)
  counts.set(pkg, (counts.get(pkg) ?? 0) + 1)
  if (!uniqueSets.has(pkg)) uniqueSets.set(pkg, new Set())
  uniqueSets.get(pkg).add(url)
}

const packages = [...counts.entries()]
  .map(([pkg, count]) => ({ pkg, loads: count, unique: uniqueSets.get(pkg).size }))
  .sort((a, b) => b.loads - a.loads)

const result = {
  mode,
  pkgDir: cwdArg,
  configPath,
  depInputs,
  codeBytes,
  totalLoads: added.length,
  uniqueModules: new Set(added).size,
  packages,
}

if (outJson) {
  writeFileSync(outJson, `${JSON.stringify(result, null, 2)}\n`)
  writeFileSync(`${outJson}.urls.txt`, `${[...new Set(added)].sort().join('\n')}\n`)
}
console.log(JSON.stringify(result, null, 2))
