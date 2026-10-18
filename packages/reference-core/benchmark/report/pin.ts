// Report pin rule for Neo benchmark logs.
// It takes the benchmark directory and emits where this run must write.
// Dirty trees overwrite reports/latest/; clean trees pin reports/<hash>/.
// Report files never decide the pin, so leftover latest/ cannot block a hash folder.
// Resolve this before generation: writing the report must not dirty its own verdict.

import { execFileSync } from 'node:child_process'

export interface PinInfo {
  name: string
  hash: string | null
  dirty: boolean
}

function git(args: string[], cwd: string): string | null {
  try {
    const out = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim()
  } catch {
    return null
  }
}

function shortHash(cwd: string): string | null {
  const hash = git(['rev-parse', '--short=12', 'HEAD'], cwd)
  if (!hash || !/^[0-9a-f]+$/.test(hash)) return null
  return hash
}

function repoRoot(cwd: string): string | null {
  const root = git(['rev-parse', '--show-toplevel'], cwd)
  if (!root) return null
  return root
}

function isDirty(cwd: string): boolean {
  const root = repoRoot(cwd)
  if (!root) return true
  const status = git(['status', '--porcelain', '--', ':!packages/reference-neo/benchmark/reports'], root)
  if (status === null) return true
  return status.length > 0
}

export function resolvePin(cwd: string): PinInfo {
  const hash = shortHash(cwd)
  if (!hash) return { name: 'latest', hash: null, dirty: true }
  if (!isDirty(cwd)) return { name: hash, hash, dirty: false }
  return { name: 'latest', hash, dirty: true }
}
