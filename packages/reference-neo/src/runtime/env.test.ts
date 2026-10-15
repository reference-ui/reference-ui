// Production-build proof for the runtime's isProductionBuild() gate.
// A tiny consumer stores the gate's answer, goes through a real consumer
// bundler (Vite build in production and development mode, esbuild minified
// browser), and runs in a bare VM context with no `process`, the way a
// browser runs it. Production must read true, development false, and an
// unreplaced read with no process (an unbundled page) counts as development.

import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { build as esbuild } from 'esbuild'
import { build as viteBuild } from 'vite'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const ENV_SOURCE = resolve(import.meta.dirname, 'env.ts')

let dir: string
let entry: string

function runBare(code: string): unknown {
  const context: Record<string, unknown> = {}
  context.globalThis = context
  runInNewContext(code, context)
  return context.__isProductionBuild
}

async function viteBundle(nodeEnv: 'production' | 'development'): Promise<string> {
  // `vite build` sets NODE_ENV=production when unset; vitest set "test".
  vi.stubEnv('NODE_ENV', nodeEnv)
  try {
    const output = await viteBuild({
      configFile: false,
      root: dir,
      logLevel: 'silent',
      mode: nodeEnv,
      build: { write: false, minify: nodeEnv === 'production', rollupOptions: { input: entry } },
    })
    const result = Array.isArray(output) ? output[0] : output
    if (result === undefined || !('output' in result)) throw new Error('vite build returned no output')
    const chunk = result.output.find((file) => file.type === 'chunk')
    if (chunk === undefined || chunk.type !== 'chunk') throw new Error('vite build emitted no chunk')
    return chunk.code
  } finally {
    vi.unstubAllEnvs()
  }
}

beforeAll(() => {
  // realpath: macOS tmpdir is a /var symlink, and Vite resolves real paths.
  dir = realpathSync(mkdtempSync(join(tmpdir(), 'neo-env-gate-')))
  entry = join(dir, 'consumer.ts')
  writeFileSync(
    entry,
    `import { isProductionBuild } from ${JSON.stringify(ENV_SOURCE)}\n` +
      `;(globalThis as Record<string, unknown>).__isProductionBuild = isProductionBuild()\n`
  )
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('isProductionBuild() through real bundles', () => {
  it('reads production in a Vite production build, with no process reference left', async () => {
    const code = await viteBundle('production')
    expect(code).not.toContain('process')
    expect(runBare(code)).toBe(true)
  })

  it('reads development in a Vite development build without a process shim', async () => {
    const code = await viteBundle('development')
    expect(runBare(code)).toBe(false)
  })

  it('reads production in an esbuild minified browser bundle', async () => {
    const result = await esbuild({
      entryPoints: [entry],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      minify: true,
      write: false,
      logLevel: 'silent',
    })
    expect(runBare(result.outputFiles[0]?.text ?? '')).toBe(true)
  })

  it('counts as development, without throwing, when nothing replaced the read and no process exists', async () => {
    const result = await esbuild({
      entryPoints: [entry],
      bundle: true,
      format: 'iife',
      platform: 'neutral',
      write: false,
      logLevel: 'silent',
    })
    const code = result.outputFiles[0]?.text ?? ''
    expect(code).toContain('process.env.NODE_ENV')
    expect(runBare(code)).toBe(false)
  })
})
