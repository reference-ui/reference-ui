// One-command entry for deepsee observability tooling.
// It takes a tool name plus a bench scale and runs the locked-load analysis:
// `burndown` (per-phase sync walls), `rss` (retention attribution), `bundle`
// (byte accounting over a synced dir). `all` runs the full set in one go.
// Reads the frozen generators and plans; never edits load, engine, or bench.

import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getOutDirPath } from '../../src/lib/paths/out-dir.ts'
import { burndown } from './burndown.ts'
import { accountBundle } from './bundle.ts'
import { attributeFromRun, rss } from './rss.ts'

const USAGE = [
  'usage: deepsee <burndown|rss|bundle|all> [--scale name] [--keep] [--out dir]',
  '       deepsee bundle --dir <out-dir>',
  '       deepsee all: one sampled sync, then burndown + RSS + bundle off that run',
].join('\n')

interface CliArgs {
  tool: string
  scale: string
  keep: boolean
  out: string | undefined
  dir: string | undefined
}

function applyFlag(args: CliArgs, argv: string[], index: number): number {
  const arg = argv[index] as string
  if (arg === '--keep') {
    args.keep = true
    return index + 1
  }
  const value = argv[index + 1]
  if (arg === '--scale' && value !== undefined) {
    args.scale = value
    return index + 2
  }
  if (arg === '--out' && value !== undefined) {
    args.out = value
    return index + 2
  }
  if (arg === '--dir' && value !== undefined) {
    args.dir = value
    return index + 2
  }
  throw new Error(`unknown flag: ${arg}\n${USAGE}`)
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { tool: argv[0] ?? '', scale: 'medium', keep: false, out: undefined, dir: undefined }
  let index = 1
  while (index < argv.length) index = applyFlag(args, argv, index)
  return args
}

async function main(argv: string[]): Promise<number> {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE)
    return 0
  }
  const args = parseArgs(argv)
  if (args.tool === 'burndown') {
    const result = await burndown({ scale: args.scale, keep: args.keep, outDir: args.out })
    console.log(result.markdown)
    console.log(`sample: ${result.sampleFile}`)
    console.log(`report: ${result.reportFile}`)
    return 0
  }
  if (args.tool === 'rss') {
    const result = await rss({ scale: args.scale, keep: args.keep, outDir: args.out })
    console.log(result.markdown)
    console.log(`report: ${result.reportFile}`)
    return 0
  }
  if (args.tool === 'all') {
    const combined = await burndown({ scale: args.scale, keep: true, outDir: args.out })
    try {
      const attributed = attributeFromRun({
        scale: combined.scale,
        seed: combined.seed,
        parsed: combined.worker,
        timeline: combined.ticks,
        projectDir: combined.projectDir,
        workDir: combined.workDir,
      })
      const bundle = accountBundle(getOutDirPath(combined.projectDir))
      const full = [combined.markdown, attributed.markdown, bundle.markdown].join('\n\n')
      const fullFile = join(combined.workDir, `deepsee-${combined.scale}.md`)
      writeFileSync(fullFile, `${full}\n`, 'utf-8')
      console.log(full)
      console.log(`full report: ${fullFile}`)
      console.log(`sample: ${combined.sampleFile}`)
      return 0
    } finally {
      if (!args.keep) rmSync(combined.projectDir, { recursive: true, force: true })
    }
  }
  if (args.tool === 'bundle') {
    if (!args.dir) throw new Error('bundle needs --dir <synced .reference-ui dir>')
    const report = accountBundle(args.dir)
    console.log(report.markdown)
    return 0
  }
  throw new Error(`unknown tool: ${args.tool}\n${USAGE}`)
}

try {
  process.exitCode = await main(process.argv.slice(2))
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}
