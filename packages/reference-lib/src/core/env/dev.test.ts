/**
 * Production-build proof for isDevelopment(): a tiny consumer imports a real
 * lib diagnostic (Tabs' warnTabs) and the gate, passes through the lib's own
 * esbuild step (scripts/build-bundle.mjs settings), then through a consumer
 * bundler. Each bundle runs in a bare VM context with no `process`, the way
 * a browser would run it, and the test reads what reached the console.
 * Production (Vite build, esbuild minify) must be silent; Vite dev must warn.
 */
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { build as esbuild } from 'esbuild'
import { build as viteBuild, createServer } from 'vite'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const SRC = resolve(__dirname, '../..')
const MARKER = 'DEV-GATE-PROOF'

interface RunResult {
  warnings: string[]
  isDevelopment: unknown
}

// Runs a script-form bundle with a console spy and no process global, then
// reads what the consumer recorded.
function runInBrowserLikeContext(code: string): RunResult {
  const warnings: string[] = []
  const record = (...args: unknown[]) => {
    warnings.push(args.join(' '))
  }
  const context: Record<string, unknown> = {
    console: { error: record, warn: record, log: record },
  }
  context.globalThis = context
  runInNewContext(code, context)
  return { warnings, isDevelopment: context.__isDevelopment }
}

let dir: string
let libBundlePath: string

beforeAll(async () => {
  // realpath: macOS tmpdir is a /var symlink, and Vite serves by real path.
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'lib-dev-gate-')))
  const entry = join(dir, 'consumer.ts')
  writeFileSync(
    entry,
    [
      `import { warnTabs } from ${JSON.stringify(join(SRC, 'components/Tabs/shared/warn.ts'))}`,
      `import { isDevelopment } from ${JSON.stringify(join(SRC, 'core/env/dev.ts'))}`,
      `warnTabs(${JSON.stringify(MARKER)})`,
      `;(globalThis as Record<string, unknown>).__isDevelopment = isDevelopment()`,
    ].join('\n')
  )
  // Stage 1: the lib's own build step. platform node and no minify mean no
  // NODE_ENV define, so the shipped dist keeps the expression for consumers.
  libBundlePath = join(dir, 'lib-bundle.mjs')
  await esbuild({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    minify: false,
    treeShaking: true,
    outfile: libBundlePath,
    logLevel: 'silent',
  })
})

afterAll(() => {
  vi.unstubAllEnvs()
  rmSync(dir, { recursive: true, force: true })
})

async function viteBundle(nodeEnv: 'production' | 'development'): Promise<string> {
  // `vite build` sets NODE_ENV=production when unset; vitest has set it to
  // "test", so pin it to what a real CLI run would see.
  vi.stubEnv('NODE_ENV', nodeEnv)
  try {
    const output = await viteBuild({
      configFile: false,
      root: dir,
      logLevel: 'silent',
      mode: nodeEnv,
      build: {
        write: false,
        minify: nodeEnv === 'production',
        rollupOptions: { input: libBundlePath },
      },
    })
    const result = Array.isArray(output) ? output[0] : output
    if (!('output' in result)) throw new Error('vite build returned a watcher')
    const chunk = result.output.find((file) => file.type === 'chunk')
    if (!chunk || chunk.type !== 'chunk') throw new Error('vite build emitted no chunk')
    return chunk.code
  } finally {
    vi.unstubAllEnvs()
  }
}

describe('isDevelopment() through real bundles', () => {
  it('DEV-GATE-01: the lib build keeps process.env.NODE_ENV for the consumer to replace', () => {
    expect(readFileSync(libBundlePath, 'utf8')).toContain('process.env.NODE_ENV')
  })

  it('DEV-GATE-02: a Vite production build is silent and leaves no process reference', async () => {
    const code = await viteBundle('production')
    expect(code).not.toContain('process')
    expect(runInBrowserLikeContext(code)).toEqual({ warnings: [], isDevelopment: false })
  })

  it('DEV-GATE-03: an esbuild minified browser bundle (implicit production define) is silent', async () => {
    const result = await esbuild({
      entryPoints: [libBundlePath],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      minify: true,
      write: false,
      logLevel: 'silent',
    })
    const code = result.outputFiles[0]?.text ?? ''
    expect(code).not.toContain('process')
    expect(runInBrowserLikeContext(code)).toEqual({ warnings: [], isDevelopment: false })
  })

  it('DEV-GATE-04: a Vite development build warns', async () => {
    const code = await viteBundle('development')
    const run = runInBrowserLikeContext(code)
    expect(run.isDevelopment).toBe(true)
    expect(run.warnings).toEqual([`Reference UI: Tabs ${MARKER}`])
  })

  it('DEV-GATE-05: the Vite dev server rewrites the expression, so dev pages warn without a process shim', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const server = await createServer({
      configFile: false,
      root: dir,
      logLevel: 'silent',
      server: { middlewareMode: true, hmr: false, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    try {
      const transformed = await server.transformRequest('/lib-bundle.mjs')
      const code = transformed?.code ?? ''
      expect(code).not.toContain('process.env.NODE_ENV')
      expect(runInBrowserLikeContext(code)).toEqual({
        warnings: [`Reference UI: Tabs ${MARKER}`],
        isDevelopment: true,
      })
    } finally {
      await server.close()
      vi.unstubAllEnvs()
    }
  })

  it('DEV-GATE-06: an unbundled page (unreplaced, no process global) counts as development without throwing', async () => {
    const result = await esbuild({
      entryPoints: [libBundlePath],
      bundle: true,
      format: 'iife',
      platform: 'neutral',
      minify: false,
      write: false,
      logLevel: 'silent',
    })
    const code = result.outputFiles[0]?.text ?? ''
    expect(code).toContain('process.env.NODE_ENV')
    expect(runInBrowserLikeContext(code)).toEqual({
      warnings: [`Reference UI: Tabs ${MARKER}`],
      isDevelopment: true,
    })
  })
})
