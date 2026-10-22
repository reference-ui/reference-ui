/**
 * Copies the docs corpus into a git worktree that lacks it. The corpus at vendor/docs/_normalized is
 * gitignored generated output, so a fresh worktree has none and memex's docs-corpus collection is empty.
 * A symlink will not do: memex skips a root that resolves outside the repo. On macOS the copy is an APFS
 * clone, so it costs no disk. It does nothing in the main checkout, when the corpus is already present,
 * or when the main worktree has none.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'

const CORPUS = join('vendor', 'docs', '_normalized')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

const here = git('rev-parse', '--show-toplevel')
// The first entry of `git worktree list` is always the main worktree.
const main = git('worktree', 'list', '--porcelain').split('\n')[0].replace(/^worktree /, '')

const target = join(here, CORPUS)
const source = join(main, CORPUS)

if (here === main || existsSync(target)) process.exit(0)
if (!existsSync(source)) {
  console.log(`[copy-corpus] no corpus in the main worktree (${source}); docs-corpus stays empty`)
  process.exit(0)
}
mkdirSync(dirname(target), { recursive: true })
// -c clones on APFS; elsewhere fall back to a plain copy.
const cloneFlags = process.platform === 'darwin' ? ['-cR'] : ['-R']
execFileSync('cp', [...cloneFlags, source, target])
console.log(`[copy-corpus] copied ${CORPUS} from ${main}`)
