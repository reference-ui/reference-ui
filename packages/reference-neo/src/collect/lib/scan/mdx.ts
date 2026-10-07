// MDX-scoped fragment discovery helpers.
// They take raw `.mdx` text and emit the regions that can carry needle bytes
// but no top-level ESM (frontmatter, fenced code blocks) plus a line-anchored
// import matcher. MDX cannot reuse the global import patterns because a fence
// or prose can copy `from 'id'` verbatim; compiling instead lives in the
// microbundle loader, so this stays a pure, sync selection pass.
import { escapeRegex, toArray, type DiscoveryPattern } from './patterns.ts'

// Leading frontmatter is a `---` line at the very top and its first `---` or
// `...` closer (YAML's alternate end marker). No closer means the opener was a
// thematic break, so nothing is stripped.
function findFrontmatterEnd(lines: string[]): number {
  if (lines[0]?.replace(/\r$/, '') !== '---') return -1
  for (let index = 1; index < lines.length; index++) {
    if (/^(?:---|\.\.\.)[ \t]*$/.test(lines[index].replace(/\r$/, ''))) return index
  }
  return -1
}

// Fence opener: 3+ backticks or tildes, optional info string. Fence closer:
// only the same fence character with a run at least as long as the opener.
const FENCE_OPEN = /^[ \t]*(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^[ \t]*(`{3,}|~{3,})[ \t]*$/

function opensFence(line: string): { char: string; length: number } | null {
  const open = FENCE_OPEN.exec(line)
  return open === null ? null : { char: open[1][0], length: open[1].length }
}

function closesFence(line: string, char: string, length: number): boolean {
  const close = FENCE_CLOSE.exec(line)
  return close !== null && close[1][0] === char && close[1].length >= length
}

// Blank every fenced block from `start` on. An unclosed fence blanks to EOF,
// which is the safe direction: the removed bytes carry no top-level ESM.
function blankFences(lines: string[], out: string[], start: number): void {
  let char = ''
  let length = 0
  for (let index = start; index < lines.length; index++) {
    const line = lines[index].replace(/\r$/, '')
    if (char === '') {
      const opened = opensFence(line)
      if (opened !== null) {
        char = opened.char
        length = opened.length
        out[index] = ''
      }
      continue
    }
    out[index] = ''
    if (closesFence(line, char, length)) {
      char = ''
      length = 0
    }
  }
}

/**
 * Remove the MDX regions that can carry needle bytes but no top-level ESM: a
 * leading frontmatter block and fenced code blocks (including their info
 * string). Removed lines become blanks so line numbers survive. A fence with
 * no matching close strips to end of file.
 */
export function stripMdxNoise(content: string): string {
  const text = content.startsWith('\uFEFF') ? content.slice(1) : content
  const lines = text.split('\n')
  const out = [...lines]
  const frontmatterEnd = findFrontmatterEnd(lines)
  if (frontmatterEnd >= 0) {
    for (let index = 0; index <= frontmatterEnd; index++) out[index] = ''
  }
  blankFences(lines, out, frontmatterEnd >= 0 ? frontmatterEnd + 1 : 0)
  return out.join('\n')
}

// Line-anchored import matcher for `.mdx` only. A fenced block or prose can
// carry `from 'id'` verbatim, so the global unanchored pattern would false-hit;
// this anchors to a real `import` statement and tolerates a multiline binding
// list (`import {\n  font\n} from 'id'`) plus the bare `import 'id'` side-effect
// form. The needle stays the module id, so the includes pre-gate and the native
// needle union are unchanged.
export function createMdxImportPatterns(importFrom?: string | string[]): DiscoveryPattern[] {
  return toArray(importFrom).map((moduleId) => ({
    pattern: new RegExp(
      `^[ \\t]*import\\b[ \\t]*(?:[\\s\\S]*?from[ \\t]*)?['"]${escapeRegex(moduleId)}['"]`,
      'm',
    ),
    needle: moduleId,
  }))
}
