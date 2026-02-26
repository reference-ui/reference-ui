#!/usr/bin/env node
/**
 * Vanilla Extract benchmark runner.
 * Invoked as child process: node runner.mjs <benchDir>
 * Uses esbuild + @vanilla-extract/esbuild-plugin to build a minimal VE project.
 * Memory consumed by this process is tracked by the parent via spawnMonitored.
 */

import { resolve } from 'node:path'
import { build } from 'esbuild'
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin'

const benchDir = process.argv[2] || process.cwd()
const entryPath = resolve(benchDir, 'entry.ts')
const outDir = resolve(benchDir, 'dist')

try {
  await build({
    entryPoints: [entryPath],
    bundle: true,
    outdir: outDir,
    platform: 'browser',
    format: 'esm',
    plugins: [vanillaExtractPlugin()],
    logLevel: 'silent',
  })
} catch (err) {
  console.error(err)
  process.exit(1)
}
