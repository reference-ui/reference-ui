/**
 * Read-only analyze verbs for `pnpm agentrs flame` (`--callers`, `--top`,
 * `--inspect`, `--modules`). Parses its own flags, loads the named bundle's
 * preserved raws, and either files derived attribution or prints scoped
 * reports to stdout. Never records, rebuilds, or touches bundle raws; every
 * verb fails loudly on a missing bundle, an unknown phase, or an ambiguous
 * inspect target instead of rendering a partial answer.
 */

import { runCallersCommand } from './flame-callers.mjs'
import { runQueryCommand } from './flame-query.mjs'

export const ANALYZE_FLAGS = { '--callers': 'callers', '--top': 'top', '--inspect': 'inspect', '--modules': 'modules' }

export const ANALYZE_USAGE = [
  '       pnpm agentrs flame --callers <bundleDir> [--out dir]   (file callers.md attribution, no re-record)',
  '       pnpm agentrs flame --top <bundleDir> [--phase P] [--n N]   (longest functions in scope)',
  '       pnpm agentrs flame --inspect <bundleDir> <fn> [--phase P]   (callers/callees/stacks drill-down)',
  '       pnpm agentrs flame --modules <bundleDir> [--phase P] [--n N]   (module-grain burndown report)',
]

function analyzeUsageError(message) {
  const err = new Error(`${message}\n${ANALYZE_USAGE.join('\n')}`)
  err.code = 'FLAME_USAGE'
  return err
}

function parseLimit(value) {
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw analyzeUsageError(`--n needs an integer 1..200, got: ${value}`)
  }
  return limit
}

function consumeAnalyzeFlag(ctx, index) {
  const arg = ctx.words[index]
  const value = ctx.words[index + 1]
  if (!value || value.startsWith('-')) throw analyzeUsageError(`${arg} needs a value`)
  if (arg === '--phase') ctx.analyze.phase = value
  else if (arg === '--n') ctx.analyze.limit = parseLimit(value)
  else ctx.options.outDir = value
  return index + 2
}

function consumeAnalyzeWord(ctx, index, flag) {
  const arg = ctx.words[index]
  const mode = ANALYZE_FLAGS[flag]
  if (arg === flag) return index + 1
  if (ANALYZE_FLAGS[arg]) throw analyzeUsageError(`one analyze verb per invocation, got ${flag} and ${arg}`)
  if (arg === '--phase' || arg === '--n' || arg === '--out') return consumeAnalyzeFlag(ctx, index)
  if (arg.startsWith('-')) throw analyzeUsageError(`${mode} takes only --phase/--n/--out, got: ${arg}`)
  if (!ctx.analyze.dir) {
    ctx.analyze.dir = arg
    return index + 1
  }
  if (mode === 'inspect' && !ctx.analyze.target) {
    ctx.analyze.target = arg
    return index + 1
  }
  throw analyzeUsageError(`unexpected argument for ${mode}: ${arg}`)
}

export function parseAnalyzeArgs(options, words, flag) {
  const ctx = { options, words, analyze: { mode: ANALYZE_FLAGS[flag], dir: null, target: null, phase: 'compile', limit: 20 } }
  let index = 0
  while (index < words.length) index = consumeAnalyzeWord(ctx, index, flag)
  if (!ctx.analyze.dir) throw analyzeUsageError(`${ctx.analyze.mode} needs a bundle evidence dir`)
  if (ctx.analyze.mode === 'inspect' && !ctx.analyze.target) throw analyzeUsageError('--inspect needs a function name or substring')
  options.analyze = ctx.analyze
  return options
}

export function runAnalyzeCommand(options, args, repoRoot) {
  const mode = options.analyze.mode
  try {
    if (mode === 'callers') {
      runCallersCommand({
        srcDir: options.analyze.dir,
        outDir: options.outDir,
        repoRoot,
        command: ['pnpm', 'agentrs', 'flame', ...args],
      })
    } else {
      runQueryCommand({
        mode,
        srcDir: options.analyze.dir,
        target: options.analyze.target,
        phase: options.analyze.phase,
        limit: options.analyze.limit,
      })
    }
  } catch (err) {
    console.error(`[agent-rs] flame ${mode} failed: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
  return 0
}
