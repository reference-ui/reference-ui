// Parent-side measurement for Neo sync benchmarks.
// It takes a generated project dir and emits run samples plus bundle sizes.
// Each run syncs in a fresh child process, so no two runs share a heap.
// Worker output is validated structurally: a malformed line fails the run, never parses silent.

import { spawn } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

export interface WorkerSample {
  syncMs: number
  rssBefore: number
  rssPeak: number
  rssAfter: number
}

export interface BundleSizes {
  cssBytes: number
  dataBytes: number
  totalBytes: number
  cssGzip: number
  dataGzip: number
  totalGzip: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isWorkerSample(value: unknown): value is WorkerSample {
  if (!isRecord(value)) return false
  return (
    typeof value.syncMs === 'number'
    && typeof value.rssBefore === 'number'
    && typeof value.rssPeak === 'number'
    && typeof value.rssAfter === 'number'
  )
}

function parseSample(stdout: string): WorkerSample {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout) as unknown
  } catch {
    throw new Error(`bench worker printed no JSON: ${stdout.slice(0, 200)}`)
  }
  if (!isWorkerSample(parsed)) throw new Error('bench worker printed a foreign shape')
  return parsed
}

export function runChild(workerPath: string, projectDir: string, sampleMs: number): Promise<WorkerSample> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [workerPath, projectDir, String(sampleMs)], {
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    let stdout = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8')
    })
    child.on('error', (err) => reject(err))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`bench worker exited with code ${code ?? 'unknown'}`))
        return
      }
      try {
        resolve(parseSample(stdout.trim()))
      } catch (err) {
        reject(err)
      }
    })
  })
}

function fileBytes(path: string): { raw: number; gzip: number } {
  const raw = statSync(path).size
  const gzip = gzipSync(readFileSync(path)).length
  return { raw, gzip }
}

export function readBundleSizes(outDir: string): BundleSizes {
  const css = fileBytes(join(outDir, 'styled', 'styles.css'))
  const data = fileBytes(join(outDir, 'styled', 'runtime-data.mjs'))
  return {
    cssBytes: css.raw,
    dataBytes: data.raw,
    totalBytes: css.raw + data.raw,
    cssGzip: css.gzip,
    dataGzip: data.gzip,
    totalGzip: css.gzip + data.gzip,
  }
}
