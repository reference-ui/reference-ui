#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(__dirname, '../..')
const perfJsonlPath = resolve(pkgDir, '.reference-ui/book-perf.jsonl')

function percentile(arr, p) {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

function runReport() {
  if (!existsSync(perfJsonlPath)) {
    console.log('\n[book:perf] No performance log found at .reference-ui/book-perf.jsonl')
    console.log('Run Book via "pnpm dev:lib" and make edits to gather HMR & transform metrics.\n')
    return
  }

  const lines = readFileSync(perfJsonlPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  if (lines.length === 0) {
    console.log('\n[book:perf] No performance records recorded yet.\n')
    return
  }

  const hmrTimes = lines.map(r => r.viteHmrMs).filter(n => typeof n === 'number')
  const clientTimes = lines.map(r => r.clientApplyMs).filter(n => typeof n === 'number')
  const syncTimes = lines.map(r => r.syncMs).filter(n => typeof n === 'number' && n > 0)
  const storyImportTimes = lines.map(r => r.storyImportMs).filter(n => typeof n === 'number' && n > 0)

  console.log('\n================ BOOK HMR & PERF SUMMARY ================')
  console.log(`Total Cycles Recorded: ${lines.length}`)
  console.log('---------------------------------------------------------')
  console.log(`Vite HMR ms:         p50: ${percentile(hmrTimes, 50)}ms   | p95: ${percentile(hmrTimes, 95)}ms`)
  console.log(`Client Apply ms:     p50: ${percentile(clientTimes, 50)}ms   | p95: ${percentile(clientTimes, 95)}ms`)
  if (syncTimes.length > 0) {
    console.log(`Sync Deferral ms:    p50: ${percentile(syncTimes, 50)}ms   | p95: ${percentile(syncTimes, 95)}ms`)
  }
  if (storyImportTimes.length > 0) {
    console.log(`Story Import ms:     p50: ${percentile(storyImportTimes, 50)}ms   | p95: ${percentile(storyImportTimes, 95)}ms`)
  }
  console.log('---------------------------------------------------------')

  // Top slowest files
  const fileMap = new Map()
  for (const r of lines) {
    if (!r.file || r.file === 'startup') continue
    const list = fileMap.get(r.file) || []
    list.push(r.clientApplyMs || r.viteHmrMs || 0)
    fileMap.set(r.file, list)
  }

  const fileStats = Array.from(fileMap.entries())
    .map(([file, times]) => ({
      file,
      p95: percentile(times, 95),
      count: times.length,
    }))
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 5)

  if (fileStats.length > 0) {
    console.log('Slowest Files (p95):')
    for (const s of fileStats) {
      console.log(`  - ${s.file.padEnd(45)} ${s.p95}ms (${s.count} edits)`)
    }
  }
  console.log('=========================================================\n')
}

runReport()
