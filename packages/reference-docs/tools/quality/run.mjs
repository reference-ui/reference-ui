#!/usr/bin/env node
/**
 * Docs quality gate. It takes optional paths, walks the docs sources, and
 * runs two Biome passes (a failing error config and a loud warn config), a
 * strict TypeScript pass, a banned-suppression scan, and a file-length tier.
 * It prints one greppable finding per line and exits 0 (clean), 1 (findings),
 * or 2 (tooling missing). It is structural only; no formatting opinions.
 */
import { execFile } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = path.dirname(path.dirname(HERE))
const CONFIG = path.join(HERE, 'biome.json')
const WARN_CONFIG = path.join(HERE, 'biome.warn.json')
const CODE_EXTS = new Set(['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs', '.jsx'])
const TYPE_EXTS = new Set(['.ts', '.mts', '.cts', '.tsx'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.content-collections', '.reference-ui', '.git'])
const ROOT_FILES = ['vite.config.ts', 'ui.config.ts']
const FILE_FAIL = 500
const FILE_WARN = 365
// Split so this file never contains the banned pragmas it scans for.
const BIOME_NEEDLE = 'biome-' + 'ignore'
const TS_IGNORE = '@ts-' + 'ignore'
const TS_EXPECT = '@ts-expect-' + 'error'
const TSC_ERROR = /^(.*?)\((\d+),\d+\):\s+error\s+(TS\d+):\s+(.*)$/
const BIOME_TEXT_HIT = /^(.+?):(\d+):\d+\s+(lint\/[A-Za-z]+\/[A-Za-z0-9]+)/
const LOCAL_REQUIRE = createRequire(import.meta.url)

function runCmd(cmd, args, cwd) {
  return new Promise(resolve => {
    execFile(cmd, args, { env: process.env, cwd, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ code: err?.code ?? 0, out: String(stdout ?? ''), errOut: String(stderr ?? '') })
    })
  })
}

function resolveBin(packageName, rel) {
  try {
    const pkg = LOCAL_REQUIRE.resolve(`${packageName}/package.json`)
    return path.join(path.dirname(pkg), rel)
  } catch {
    return null
  }
}

function parseArgs(argv) {
  const args = argv[0] === 'q' ? argv.slice(1) : argv
  return {
    help: args.includes('--help') || args.includes('-h'),
    paths: args.filter(a => !a.startsWith('-')).map(p => path.resolve(p)),
  }
}

async function walk(entry, out) {
  let info
  try {
    info = await stat(entry)
  } catch {
    return
  }
  if (!info.isDirectory()) {
    if (CODE_EXTS.has(path.extname(entry).toLowerCase())) out.add(path.resolve(entry))
    return
  }
  if (SKIP_DIRS.has(path.basename(entry))) return
  for (const kid of await readdir(entry)) await walk(path.join(entry, kid), out)
}

async function collect(paths) {
  if (paths.length) {
    const out = new Set()
    for (const p of paths) await walk(p, out)
    return [...out].sort()
  }
  const out = new Set()
  for (const file of ROOT_FILES) await walk(path.join(DOCS_DIR, file), out)
  await walk(path.join(DOCS_DIR, 'src'), out)
  await walk(path.join(DOCS_DIR, 'tools/quality'), out)
  return [...out].sort()
}

async function readTexts(files) {
  const texts = new Map()
  for (const f of files) {
    try {
      texts.set(f, await readFile(f, 'utf8'))
    } catch {
      texts.set(f, null)
    }
  }
  return texts
}

function parseBiomeJson(out) {
  const start = out.indexOf('{')
  if (start < 0) return null
  try {
    const parsed = JSON.parse(out.slice(start))
    if (!parsed || !Array.isArray(parsed.diagnostics)) return null
    return parsed.diagnostics.map(d => ({
      file: typeof d.location?.path === 'string' ? d.location.path : '(unknown)',
      line: typeof d.location?.start?.line === 'number' ? d.location.start.line : 1,
      ruleId: typeof d.category === 'string' ? d.category : 'unknown',
      severity: d.severity === 'error' ? 2 : 1,
      message: typeof d.message === 'string' ? d.message : String(d.message ?? ''),
    }))
  } catch {
    return null
  }
}

function parseBiomeText(out, severity) {
  const diags = []
  for (const line of out.split('\n')) {
    const hit = line.match(BIOME_TEXT_HIT)
    if (hit) diags.push({ file: hit[1], line: Number(hit[2]), ruleId: hit[3], severity, message: `${hit[3]} (parsed from text output)` })
  }
  return diags
}

async function biomePass(bin, config, files, fallbackSeverity) {
  const args = ['lint', '--config-path', config, '--max-diagnostics', 'none', '--reporter', 'json', '--vcs-enabled', 'false', '--no-errors-on-unmatched', ...files]
  // Biome rejects a nested config when invoked from the project root, so run from neutral ground.
  const r = await runCmd(process.execPath, [bin, ...args], tmpdir())
  const json = parseBiomeJson(r.out)
  if (json) return { diags: json, ok: true }
  const text = parseBiomeText(`${r.out}\n${r.errOut}`, fallbackSeverity)
  if (text.length) return { diags: text, ok: true }
  return { diags: [], ok: false }
}

function classify(diag, ctx) {
  const key = `${diag.file} ${diag.ruleId} ${diag.line} ${diag.message}`
  if (ctx.seen.has(key)) return
  ctx.seen.add(key)
  const at = `${diag.file} ${diag.ruleId} ${diag.line}`
  if (diag.severity === 2) {
    ctx.errorAt.add(at)
    ctx.errors.push(diag)
  } else if (!ctx.errorAt.has(at)) {
    ctx.warnings.push(diag)
  }
}

async function biomeTier(files) {
  if (!files.length) return { errors: [], warnings: [], missing: null }
  const bin = resolveBin('@biomejs/biome', 'bin/biome')
  if (!bin) return { errors: [], warnings: [], missing: 'biome' }
  const ctx = { seen: new Set(), errorAt: new Set(), errors: [], warnings: [] }
  let ok = true
  for (const [config, fallback] of [[CONFIG, 2], [WARN_CONFIG, 1]]) {
    const pass = await biomePass(bin, config, files, fallback)
    ok = pass.ok && ok
    for (const diag of pass.diags) classify(diag, ctx)
  }
  return { errors: ctx.errors, warnings: ctx.warnings, missing: ok ? null : 'biome' }
}

function suppressionTier(files, texts) {
  const hits = []
  for (const file of files) {
    const lines = (texts.get(file) ?? '').split('\n')
    lines.forEach((line, idx) => {
      if (line.includes(BIOME_NEEDLE)) hits.push(suppression(file, idx + 1, 'a linter suppression comment cannot land; fix the code instead.'))
      if (line.includes(TS_IGNORE)) hits.push(suppression(file, idx + 1, 'a ts-ignore comment cannot land; fix the types instead.'))
      const at = line.indexOf(TS_EXPECT)
      if (at >= 0 && line.slice(at + TS_EXPECT.length).replace(/^[\s:;-]+/, '').length < 10)
        hits.push(suppression(file, idx + 1, 'a bare ts-expect-error cannot land; justify it on the same line (10+ chars) or fix the types.'))
    })
  }
  return hits
}

function suppression(file, line, message) {
  return { file, line, ruleId: 'docs/suppression', severity: 2, message }
}

function fileLengthTier(files, texts) {
  const errors = []
  const warnings = []
  for (const file of files) {
    const text = texts.get(file)
    if (text === null || text === undefined) continue
    const lines = text === '' ? 0 : text.split('\n').length
    if (lines > FILE_FAIL) errors.push({ file, line: 1, ruleId: 'docs/file-lines', severity: 2, message: `docs/file-lines: ${lines} lines (fail above ${FILE_FAIL}).` })
    else if (lines > FILE_WARN) warnings.push({ file, line: 1, ruleId: 'docs/file-lines', severity: 1, message: `docs/file-lines: ${lines} lines (warn above ${FILE_WARN}).` })
  }
  return { errors, warnings }
}

async function tscTier(files) {
  const tsFiles = files.filter(f => TYPE_EXTS.has(path.extname(f).toLowerCase()))
  if (!tsFiles.length) return { errors: [], missing: null }
  const bin = resolveBin('typescript', 'bin/tsc')
  if (!bin) return { errors: [], missing: 'typescript' }
  const wanted = new Set(tsFiles.map(f => path.resolve(f)))
  const r = await runCmd(process.execPath, [bin, '--noEmit', '-p', DOCS_DIR], DOCS_DIR)
  const errors = []
  for (const line of `${r.out}\n${r.errOut}`.split('\n')) {
    const m = line.match(TSC_ERROR)
    if (m && wanted.has(path.resolve(m[1]))) errors.push({ file: path.resolve(m[1]), line: Number(m[2]), ruleId: 'docs/tsc', severity: 2, message: `${m[3]}: ${m[4]}` })
  }
  if (r.code !== 0 && r.code !== 1) return { errors, missing: 'typescript' }
  return { errors, missing: null }
}

function printGroup(title, violations) {
  if (!violations.length) return
  console.log(`[docs-quality] ${title} (${violations.length}):`)
  for (const v of violations) {
    console.log(`  ${v.severity === 2 ? 'error' : 'warn'} ${v.file}:${v.line} ${v.ruleId} ${v.message}`)
  }
}

async function main() {
  const started = Date.now()
  const { help, paths } = parseArgs(process.argv.slice(2))
  if (help) {
    console.log('usage: pnpm agentdocs q [paths...]')
    return 0
  }
  const files = await collect(paths)
  const texts = await readTexts(files)
  let missing = null
  const biome = await biomeTier(files)
  missing = biome.missing
  const tsc = await tscTier(files)
  missing = tsc.missing ?? missing
  const length = fileLengthTier(files, texts)
  const suppressions = suppressionTier(files, texts)
  const errors = [...suppressions, ...length.errors, ...biome.errors, ...tsc.errors]
  const warnings = [...length.warnings, ...biome.warnings]
  const sorts = (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line)
  printGroup('suppressions', errors.filter(v => v.ruleId === 'docs/suppression').sort(sorts))
  printGroup('errors', errors.filter(v => v.ruleId !== 'docs/suppression').sort(sorts))
  printGroup('warnings (non-failing)', warnings.sort(sorts))
  console.log(`[docs-quality] ${errors.length} errors, ${warnings.length} warnings, ${files.length} files in ${Date.now() - started}ms`)
  if (missing) {
    console.log(`[docs-quality] tooling missing: ${missing} is not installed; install dependencies and rerun.`)
    return 2
  }
  return errors.length ? 1 : 0
}

main().then(code => process.exit(code))
