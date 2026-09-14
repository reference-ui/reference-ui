#!/usr/bin/env node

/**
 * Code Quality & Cyclomatic Complexity Engine for Reference RS
 *
 * Enforces:
 * 1. File Length: Warning at > 365 lines, failure at > 500 lines ("Can you split this up, please?").
 * 2. Function Cyclomatic Complexity (McCabe): Target <= 10, warning at > 10, failure at > 15.
 * 3. Function Cognitive Complexity: Target <= 15, warning at > 15, failure at > 20.
 * 4. Function Length: Warning at > 80 lines, failure at > 120 lines.
 * 5. Function arguments: Warning at > 4, failure at > 5. Introduce a context struct.
 * 6. Clippy #[allow]/#[expect] is banned. Fix the architecture; do not silence lints.
 * 7. File headers: 2–6 sentences describing what the file does. Thin one-liners warn; essays fail.
 * 8. Clippy Integration: Ingests clippy JSON diagnostics when --clippy is passed.
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

export const THRESHOLDS = {
  FILE_LINES_WARN: 365,
  FILE_LINES_FAIL: 1500,
  FN_LINES_WARN: 80,
  FN_LINES_FAIL: 200,
  CYCLOMATIC_WARN: 10,
  CYCLOMATIC_FAIL: 60,
  COGNITIVE_WARN: 15,
  COGNITIVE_FAIL: 270,
  FN_ARGS_WARN: 4,
  FN_ARGS_FAIL: 12,
  VERBOSE_COMMENT_WARN: 20,
  HEADER_SENTENCE_MIN: 1,
  HEADER_SENTENCE_MAX: 8,
  HEADER_LINES_FAIL: 30,
}

/** Clippy allow/expect is banned. Messages tell the agent how to fix, not how to silence. */
export const CLIPPY_ALLOW_FIXES = {
  too_many_arguments:
    'NOPE. Silencing clippy::too_many_arguments is banned. Group the pass/walk session into a context struct and pass that; keep the current AST node as the function argument.',
  too_many_lines:
    'NOPE. Silencing clippy::too_many_lines is banned. Split into helpers named after real compiler steps (a node family, a pass, a lowering), not foo_part2.',
  cognitive_complexity:
    'NOPE. Silencing clippy::cognitive_complexity is banned. Flatten with early returns; extract match arms into helpers named after the node family.',
  type_complexity:
    'NOPE. Silencing clippy::type_complexity is banned. Name the type: a struct or type alias, not a nested generic soup.',
  large_enum_variant:
    'NOPE. Silencing clippy::large_enum_variant is banned. Box the fat variant.',
  result_large_err:
    'NOPE. Silencing clippy::result_large_err is banned. Shrink the error (Box, a smaller enum, or a shared error type).',
  large_stack_arrays:
    'NOPE. Silencing clippy::large_stack_arrays is banned. Use Vec or Box<[T]>.',
  redundant_clone:
    'NOPE. Silencing clippy::redundant_clone is banned. Borrow, or fix ownership so the clone is unnecessary.',
  clone_on_copy:
    'NOPE. Silencing clippy::clone_on_copy is banned. Copy the value; do not clone it.',
  needless_pass_by_value:
    'NOPE. Silencing clippy::needless_pass_by_value is banned. Take &T unless the function must own it.',
  unwrap_used:
    'NOPE. Silencing clippy::unwrap_used is banned. Return Result/Option; do not unwrap in domain code.',
  expect_used:
    'NOPE. Silencing clippy::expect_used is banned. Return Result/Option; do not expect in domain code.',
}

export function clippyAllowMessage(lint) {
  return (
    CLIPPY_ALLOW_FIXES[lint] ??
    `NOPE. Silencing clippy::${lint} is banned. Fix the lint. Do not #[allow] or #[expect] Clippy.`
  )
}

/**
 * Fails on #[allow(clippy::...)] / #[expect(clippy::...)] / crate-level #![allow].
 */
export function checkClippyAllows(content) {
  const violations = []
  const attrRe = /#\!?\[(allow|expect)\s*\(([\s\S]*?)\)\]/g
  let match
  while ((match = attrRe.exec(content)) !== null) {
    const inner = match[2]
    const lints = [...inner.matchAll(/clippy::([A-Za-z0-9_]+)/g)].map((m) => m[1])
    if (lints.length === 0) continue
    const line = content.slice(0, match.index).split(/\r?\n/).length
    for (const lint of lints) {
      violations.push({ line, lint, message: clippyAllowMessage(lint) })
    }
  }
  return violations
}

function splitTopLevelParams(src) {
  const parts = []
  let buf = ''
  let depth = 0
  for (const ch of src) {
    if (ch === '(' || ch === '<' || ch === '[') depth++
    else if (ch === ')' || ch === '>' || ch === ']') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      parts.push(buf)
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) parts.push(buf)
  return parts
}

export function countRustFnArgs(paramSrc) {
  return splitTopLevelParams(paramSrc).filter((part) => {
    const t = part.trim()
    if (!t) return false
    if (/^&?(mut\s+)?self\b/.test(t)) return false
    if (/^self\s*:/.test(t)) return false
    return true
  }).length
}

const IGNORE_DIRS = new Set([
  'node_modules',
  'target',
  'dist',
  '.cargo',
  'npm',
  'artifacts',
  '.git',
  '.reference-ui',
  'cases',
  'fixtures',
  'generated',
])

export function findSourceFiles(dir, exts = ['.rs', '.ts', '.tsx', '.js', '.mjs']) {
  const results = []
  
  function walk(cur) {
    let entries
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const nextPath = path.join(cur, entry.name)
        const normalized = nextPath.replace(/\\/g, '/')
        if (normalized.endsWith('/system/src/canon')) {
          continue
        }
        if (!IGNORE_DIRS.has(entry.name)) {
          walk(nextPath)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (exts.includes(ext)) {
          // Exclude generated / d.ts / lockfiles
          if (!entry.name.endsWith('.d.ts') && !entry.name.endsWith('.min.js')) {
            results.push(path.join(cur, entry.name))
          }
        }
      }
    }
  }
  
  walk(dir)
  return results
}

/**
 * Analyzes line metrics of a file: total, code (SLOC), comments, blank.
 */
export function analyzeLineMetrics(content) {
  const lines = content.split(/\r?\n/)
  const total = lines.length
  let blank = 0
  let comment = 0
  let code = 0
  let inBlockComment = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      blank++
      continue
    }

    if (inBlockComment) {
      comment++
      if (trimmed.includes('*/')) {
        inBlockComment = false
      }
      continue
    }

    if (trimmed.startsWith('/*')) {
      comment++
      if (!trimmed.includes('*/')) {
        inBlockComment = true
      }
      continue
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('///') || trimmed.startsWith('//!')) {
      comment++
      continue
    }

    code++
  }

  return { total, code, comment, blank }
}

function countProseSentences(prose) {
  const cleaned = prose.replace(/`[^`]+`/g, 'X').trim()
  if (!cleaned) return 0
  const matches = cleaned.match(/[.!?](?=\s|$)/g)
  return matches ? matches.length : 1
}

function stripDocPrefix(line) {
  return line
    .replace(/^\/\/\/?!?\s?/, '')
    .replace(/^\/\*\*?\s?/, '')
    .replace(/^\*\s?/, '')
    .replace(/\*\/\s*$/, '')
    .trim()
}

/**
 * Module doc at the top of the file (`//!` in Rust, `/**` in TS/JS).
 */
export function extractFileHeader(content, filePath) {
  const lines = content.split(/\r?\n/)
  let i = 0
  while (i < lines.length && (!lines[i].trim() || lines[i].trim().startsWith('#!'))) {
    i++
  }
  if (i >= lines.length) {
    return { present: false, sentences: 0, lineCount: 0, prose: '', endLine: 0 }
  }

  const isRust = filePath.endsWith('.rs')
  const isJs =
    filePath.endsWith('.ts') ||
    filePath.endsWith('.tsx') ||
    filePath.endsWith('.js') ||
    filePath.endsWith('.mjs')
  const headerLines = []

  if (isRust) {
    while (i < lines.length) {
      const t = lines[i].trim()
      if (t.startsWith('//!')) {
        headerLines.push(t)
        i++
        continue
      }
      if (t === '' && lines[i + 1]?.trim().startsWith('//!')) {
        headerLines.push('')
        i++
        continue
      }
      break
    }
  } else if (isJs) {
    const t = lines[i].trim()
    if (t.startsWith('/**')) {
      while (i < lines.length) {
        headerLines.push(lines[i].trim())
        if (lines[i].includes('*/')) {
          i++
          break
        }
        i++
      }
    } else if (t.startsWith('//')) {
      while (i < lines.length && lines[i].trim().startsWith('//')) {
        headerLines.push(lines[i].trim())
        i++
      }
    }
  }

  const prose = headerLines.map(stripDocPrefix).filter(Boolean).join(' ')
  return {
    present: prose.length > 0,
    sentences: countProseSentences(prose),
    lineCount: headerLines.filter((l) => l.trim().length > 0).length,
    prose,
    endLine: i,
  }
}

/**
 * Checks if a source file begins with a module-level header comment.
 */
export function checkTopComment(content, filePath) {
  return extractFileHeader(content, filePath).present
}

/**
 * Inline comment blocks only. File headers are measured separately.
 */
export function checkVerboseComments(content, headerEndLine = 0) {
  const lines = content.split(/\r?\n/)
  const violations = []
  let commentStreak = 0
  let streakStart = 0

  for (let i = 0; i < lines.length; i++) {
    if (i < headerEndLine) continue
    const trimmed = lines[i].trim()
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')
    if (isComment && trimmed.length > 0) {
      if (commentStreak === 0) streakStart = i + 1
      commentStreak++
    } else {
      if (commentStreak > THRESHOLDS.VERBOSE_COMMENT_WARN) {
        violations.push({
          line: streakStart,
          length: commentStreak,
        })
      }
      commentStreak = 0
    }
  }

  return violations
}

/**
 * Tokenizes Rust source code to strip comments and strings while tracking line numbers.
 */
function cleanRustCode(code) {
  // Replaces string and character literals with spaces of same length so offsets and line numbers align
  let cleaned = ''
  let inString = false
  let inRawString = false
  let rawPoundCount = 0
  let inChar = false
  let inLineComment = false
  let inBlockComment = 0
  let escape = false

  for (let i = 0; i < code.length; i++) {
    const ch = code[i]
    const next = i + 1 < code.length ? code[i + 1] : ''

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false
        cleaned += '\n'
      } else {
        cleaned += ' '
      }
      continue
    }

    if (inBlockComment > 0) {
      if (ch === '/' && next === '*') {
        inBlockComment++
        cleaned += '  '
        i++
      } else if (ch === '*' && next === '/') {
        inBlockComment--
        cleaned += '  '
        i++
      } else {
        cleaned += ch === '\n' ? '\n' : ' '
      }
      continue
    }

    if (inString) {
      if (escape) {
        escape = false
        cleaned += ch === '\n' ? '\n' : ' '
      } else if (ch === '\\') {
        escape = true
        cleaned += ' '
      } else if (ch === '"') {
        inString = false
        cleaned += ' '
      } else {
        cleaned += ch === '\n' ? '\n' : ' '
      }
      continue
    }

    if (inRawString) {
      if (ch === '"') {
        let matchedPounds = 0
        while (matchedPounds < rawPoundCount && code[i + 1 + matchedPounds] === '#') {
          matchedPounds++
        }
        if (matchedPounds === rawPoundCount) {
          inRawString = false
          i += matchedPounds
          cleaned += ' '.repeat(1 + matchedPounds)
          continue
        }
      }
      cleaned += ch === '\n' ? '\n' : ' '
      continue
    }

    if (inChar) {
      if (escape) {
        escape = false
        cleaned += ' '
      } else if (ch === '\\') {
        escape = true
        cleaned += ' '
      } else if (ch === '\'') {
        inChar = false
        cleaned += ' '
      } else {
        cleaned += ch === '\n' ? '\n' : ' '
      }
      continue
    }

    // Check for comment starts
    if (ch === '/' && next === '/') {
      inLineComment = true
      cleaned += '  '
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = 1
      cleaned += '  '
      i++
      continue
    }

    // Check for raw strings: r#"..."#
    if (ch === 'r' && (next === '#' || next === '"')) {
      let j = i + 1
      let pounds = 0
      while (j < code.length && code[j] === '#') {
        pounds++
        j++
      }
      if (j < code.length && code[j] === '"') {
        inRawString = true
        rawPoundCount = pounds
        const skip = j - i
        cleaned += ' '.repeat(skip + 1)
        i = j
        continue
      }
    }

    // Check for standard string
    if (ch === '"') {
      inString = true
      escape = false
      cleaned += ' '
      continue
    }

    // Check for char literal (distinguish from lifetime: 'a vs 'a')
    if (ch === '\'') {
      const isCharLiteral = (i + 2 < code.length && code[i + 2] === '\'') ||
                            (i + 3 < code.length && code[i + 1] === '\\' && code[i + 3] === '\'')
      if (isCharLiteral) {
        inChar = true
        escape = false
        cleaned += ' '
        continue
      }
    }

    cleaned += ch
  }

  return cleaned
}

/**
 * Analyzes Rust function-level complexity from clean text.
 */
export function analyzeRustComplexity(content) {
  const cleaned = cleanRustCode(content)
  const lines = content.split(/\r?\n/)
  const functions = []

  // Regex to match function headers in Rust
  // Matches: fn name(...) or pub fn name(...) or async fn name(...) or const fn ...
  const fnHeaderRegex = /(?:pub(?:\s*\([^\)]+\))?\s+)?(?:async\s+)?(?:const\s+)?(?:unsafe\s+)?(?:extern(?:\s+"[^"]+")?\s+)?fn\s+([a-zA-Z0-9_]+)\s*(?:<[^>]+>)?\s*\(/g

  let match
  while ((match = fnHeaderRegex.exec(cleaned)) !== null) {
    const fnName = match[1]
    const startIndex = match.index
    const startLine = cleaned.slice(0, startIndex).split('\n').length

    // Find the opening brace of the function body
    let braceIndex = -1
    let parenDepth = 0
    let searchIdx = startIndex + match[0].length - 1
    let paramSrc = ''

    for (let i = searchIdx; i < cleaned.length; i++) {
      const c = cleaned[i]
      if (c === '(') parenDepth++
      else if (c === ')') {
        parenDepth--
        if (parenDepth === 0) {
          paramSrc = cleaned.slice(searchIdx + 1, i)
          // After matching closing paren, look for '{' or ';' (trait/extern signature)
          for (let k = i + 1; k < cleaned.length; k++) {
            const ch = cleaned[k]
            if (ch === '{') {
              braceIndex = k
              break
            } else if (ch === ';') {
              // Just a declaration, no body
              break
            }
          }
          break
        }
      }
    }

    if (braceIndex === -1) continue

    // Find the matching closing brace
    let depth = 0
    let endIndex = -1
    for (let i = braceIndex; i < cleaned.length; i++) {
      const c = cleaned[i]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          endIndex = i
          break
        }
      }
    }

    if (endIndex === -1) continue

    const endLine = cleaned.slice(0, endIndex).split('\n').length
    const fnLines = endLine - startLine + 1
    const body = cleaned.slice(braceIndex, endIndex + 1)

    // Compute Cyclomatic Complexity (McCabe)
    // Base = 1
    let cyclomatic = 1
    let cognitive = 0

    // Measure decision points line-by-line / block-by-block
    let currentNesting = 0
    const bodyLines = body.split('\n')

    for (const bLine of bodyLines) {
      const trimmed = bLine.trim()
      
      // Update nesting depth based on braces
      const opens = (trimmed.match(/\{/g) || []).length
      const closes = (trimmed.match(/\}/g) || []).length

      // Decision keywords:
      // if (and else if)
      const ifMatches = trimmed.match(/\bif\b/g) || []
      const matchArmMatches = trimmed.match(/=>/g) || []
      const loopMatches = trimmed.match(/\b(?:for|while|loop)\b/g) || []
      const tryOperatorMatches = trimmed.match(/\?/g) || []
      const logicalAndMatches = trimmed.match(/&&/g) || []
      const logicalOrMatches = trimmed.match(/\|\|/g) || []

      const totalBranches = ifMatches.length + matchArmMatches.length + loopMatches.length +
                            tryOperatorMatches.length + logicalAndMatches.length + logicalOrMatches.length

      cyclomatic += totalBranches

      // Cognitive complexity penalizes nesting
      if (ifMatches.length > 0 || loopMatches.length > 0 || matchArmMatches.length > 0) {
        cognitive += (ifMatches.length + loopMatches.length + matchArmMatches.length) * (1 + currentNesting)
      }
      cognitive += logicalAndMatches.length + logicalOrMatches.length + tryOperatorMatches.length

      currentNesting = Math.max(0, currentNesting + opens - closes)
    }

    functions.push({
      name: fnName,
      startLine,
      endLine,
      lines: fnLines,
      args: countRustFnArgs(paramSrc),
      cyclomatic,
      cognitive,
    })
  }

  return functions
}

/**
 * Analyzes JS/TS function-level complexity from clean text.
 */
export function analyzeJsComplexity(content) {
  const lines = content.split(/\r?\n/)
  const functions = []

  // Clean strings and comments
  let cleaned = ''
  let inString = null
  let inLineComment = false
  let inBlockComment = false
  let escape = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    const next = i + 1 < content.length ? content[i + 1] : ''

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false
        cleaned += '\n'
      } else {
        cleaned += ' '
      }
      continue
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        cleaned += '  '
        i++
      } else {
        cleaned += ch === '\n' ? '\n' : ' '
      }
      continue
    }

    if (inString) {
      if (escape) {
        escape = false
        cleaned += ch === '\n' ? '\n' : ' '
      } else if (ch === '\\') {
        escape = true
        cleaned += ' '
      } else if (ch === inString) {
        inString = null
        cleaned += ' '
      } else {
        cleaned += ch === '\n' ? '\n' : ' '
      }
      continue
    }

    if (ch === '/' && next === '/') {
      inLineComment = true
      cleaned += '  '
      i++
      continue
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true
      cleaned += '  '
      i++
      continue
    }

    if (ch === '"' || ch === '\'' || ch === '`') {
      inString = ch
      escape = false
      cleaned += ' '
      continue
    }

    cleaned += ch
  }

  // Regex to find JS/TS functions:
  // function name(...), const name = (...) =>, async function, class methods
  const fnRegex = /(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*([a-zA-Z0-9_$]*)\s*\(/g
  let match
  while ((match = fnRegex.exec(cleaned)) !== null) {
    const fnName = match[1] || 'anonymous'
    const startIndex = match.index
    const startLine = cleaned.slice(0, startIndex).split('\n').length

    // Find opening brace
    let braceIndex = -1
    for (let i = startIndex; i < cleaned.length; i++) {
      if (cleaned[i] === '{') {
        braceIndex = i
        break
      }
    }
    if (braceIndex === -1) continue

    let depth = 0
    let endIndex = -1
    for (let i = braceIndex; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++
      else if (cleaned[i] === '}') {
        depth--
        if (depth === 0) {
          endIndex = i
          break
        }
      }
    }
    if (endIndex === -1) continue

    const endLine = cleaned.slice(0, endIndex).split('\n').length
    const fnLines = endLine - startLine + 1
    const body = cleaned.slice(braceIndex, endIndex + 1)

    let cyclomatic = 1
    let cognitive = 0
    let currentNesting = 0

    const bodyLines = body.split('\n')
    for (const bLine of bodyLines) {
      const trimmed = bLine.trim()
      const opens = (trimmed.match(/\{/g) || []).length
      const closes = (trimmed.match(/\}/g) || []).length

      const ifMatches = trimmed.match(/\bif\b/g) || []
      const caseMatches = trimmed.match(/\bcase\b/g) || []
      const loopMatches = trimmed.match(/\b(?:for|while|do)\b/g) || []
      const catchMatches = trimmed.match(/\bcatch\b/g) || []
      const ternaryMatches = trimmed.match(/\?/g) || []
      const logicalMatches = trimmed.match(/(?:&&|\|\||\?\?)/g) || []

      const totalBranches = ifMatches.length + caseMatches.length + loopMatches.length +
                            catchMatches.length + ternaryMatches.length + logicalMatches.length

      cyclomatic += totalBranches

      if (ifMatches.length > 0 || loopMatches.length > 0 || caseMatches.length > 0) {
        cognitive += (ifMatches.length + loopMatches.length + caseMatches.length) * (1 + currentNesting)
      }
      cognitive += catchMatches.length + ternaryMatches.length + logicalMatches.length

      currentNesting = Math.max(0, currentNesting + opens - closes)
    }

    functions.push({
      name: fnName,
      startLine,
      endLine,
      lines: fnLines,
      cyclomatic,
      cognitive,
    })
  }

  return functions
}

/**
 * Runs clippy on packages/reference-rs and extracts structured JSON diagnostics.
 */
export async function runClippyCheck(targetDir) {
  return new Promise((resolve) => {
    const child = spawn(
      'cargo',
      ['clippy', '--workspace', '--message-format=json', '--', '-W', 'clippy::cognitive_complexity', '-W', 'clippy::too_many_lines'],
      {
        cwd: targetDir,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })

    child.on('close', (code) => {
      const diagnostics = []
      const lines = stdout.split('\n')
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const msg = JSON.parse(line)
          if (msg.reason === 'compiler-message' && msg.message) {
            const m = msg.message
            const code = m.code ? m.code.code : ''
            const level = m.level
            const message = m.message
            const span = m.spans && m.spans.length > 0 ? m.spans[0] : null
            diagnostics.push({
              code,
              level,
              message,
              file: span ? span.file_name : null,
              line: span ? span.line_start : null,
              column: span ? span.column_start : null,
            })
          }
        } catch {}
      }

      resolve({ code, diagnostics, rawStderr: stderr })
    })
  })
}

/**
 * Runs full code quality inspection on target files.
 */
export async function inspectFiles(files, options = {}) {
  const { runClippy = false, targetDir = process.cwd(), strict = false } = options
  const results = []
  let totalViolations = 0
  let totalWarnings = 0

  // Markdown files, generated files, system canon, and ignore directories are exempt from code checks.
  const sourceFiles = files.filter((f) => {
    if (f.endsWith('.md') || f.endsWith('.d.ts') || f.endsWith('.min.js')) return false
    const normalized = f.replace(/\\/g, '/')
    if (normalized.includes('/js/generated/')) return false
    if (normalized.includes('/system/src/canon/')) return false
    const parts = f.split(path.sep)
    if (parts.some((p) => IGNORE_DIRS.has(p))) return false
    return f.endsWith('.rs') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.mjs')
  })

  for (const filePath of sourceFiles) {

    let content
    try {
      content = fs.readFileSync(filePath, 'utf-8')
    } catch {
      continue
    }

    const lineMetrics = analyzeLineMetrics(content)
    const isRust = filePath.endsWith('.rs')
    const isJs = filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.mjs')

    const fileIssues = []

    // 1. Source file comment checks
    if (isRust || isJs) {
      const header = extractFileHeader(content, filePath)
      if (!header.present) {
        fileIssues.push({
          type: 'MISSING_TOP_COMMENT',
          severity: 'error',
          line: 1,
          message: 'Missing file header. Write 2–6 sentences at the top describing what this file does, what it takes, and what it emits. Not a one-liner, not an essay.',
        })
        totalViolations++
      } else {
        if (header.sentences < THRESHOLDS.HEADER_SENTENCE_MIN) {
          fileIssues.push({
            type: 'THIN_HEADER',
            severity: 'warn',
            line: 1,
            message: `File header is too thin (${header.sentences} sentence${header.sentences === 1 ? '' : 's'}). Write 2–6 sentences that naturally describe what this file does, what it takes, and what it emits. Complex passes can use a few more. Not a one-liner, not an essay.`,
          })
          totalWarnings++
        }
        if (header.sentences > THRESHOLDS.HEADER_SENTENCE_MAX || header.lineCount > THRESHOLDS.HEADER_LINES_FAIL) {
          const essay = header.lineCount > THRESHOLDS.HEADER_LINES_FAIL
          fileIssues.push({
            type: 'HEADER_ESSAY',
            severity: essay ? 'error' : 'warn',
            line: 1,
            message: `File header is an essay (${header.sentences} sentences, ${header.lineCount} lines). Describe the file; do not narrate every function. Aim for 2–6 sentences.`,
          })
          if (essay) totalViolations++
          else totalWarnings++
        }
      }

      const verboseBlocks = checkVerboseComments(content, header.endLine)
      for (const vb of verboseBlocks) {
        fileIssues.push({
          type: 'VERBOSE_COMMENT',
          severity: 'warn',
          line: vb.line,
          message: `Overly verbose inline comment block (${vb.length} lines). Inline comments stay terse (why, not what). File headers may be 2–6 sentences.`,
        })
        totalWarnings++
      }
    }

    if (isRust) {
      for (const allow of checkClippyAllows(content)) {
        fileIssues.push({
          type: 'CLIPPY_ALLOW',
          severity: 'error',
          line: allow.line,
          message: allow.message,
        })
        totalViolations++
      }
    }

    let functions = []
    if (isRust) {
      functions = analyzeRustComplexity(content)
    } else if (isJs) {
      functions = analyzeJsComplexity(content)
    }

    // 2. File line count checks (source files)
    if (isRust || isJs) {
      if (lineMetrics.total > THRESHOLDS.FILE_LINES_FAIL) {
        fileIssues.push({
          type: 'FILE_LINES_FAIL',
          severity: 'error',
          message: `File has ${lineMetrics.total} lines (> ${THRESHOLDS.FILE_LINES_FAIL} maximum limit). Can you split this up, please?`,
        })
        totalViolations++
      } else if (lineMetrics.total > THRESHOLDS.FILE_LINES_WARN) {
        fileIssues.push({
          type: 'FILE_LINES_WARN',
          severity: 'warn',
          message: `File has ${lineMetrics.total} lines (> ${THRESHOLDS.FILE_LINES_WARN} soft limit). Can you split this up, please?`,
        })
        totalWarnings++
      }
    }

    // 2. Function-level checks
    for (const fn of functions) {
      if (fn.lines > THRESHOLDS.FN_LINES_FAIL) {
        fileIssues.push({
          type: 'FN_LINES_FAIL',
          severity: 'error',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has ${fn.lines} lines (> ${THRESHOLDS.FN_LINES_FAIL}). Split into helpers named after real compiler steps, not foo_part2.`,
        })
        totalViolations++
      } else if (fn.lines > THRESHOLDS.FN_LINES_WARN) {
        fileIssues.push({
          type: 'FN_LINES_WARN',
          severity: 'warn',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has ${fn.lines} lines (> ${THRESHOLDS.FN_LINES_WARN}). Split into helpers named after real compiler steps, not foo_part2.`,
        })
        totalWarnings++
      }

      if (fn.cyclomatic > THRESHOLDS.CYCLOMATIC_FAIL) {
        fileIssues.push({
          type: 'CYCLOMATIC_FAIL',
          severity: 'error',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cyclomatic complexity ${fn.cyclomatic} (> ${THRESHOLDS.CYCLOMATIC_FAIL}). Extract branches into helpers named after the node family or pass step.`,
        })
        totalViolations++
      } else if (fn.cyclomatic > THRESHOLDS.CYCLOMATIC_WARN) {
        fileIssues.push({
          type: 'CYCLOMATIC_WARN',
          severity: 'warn',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cyclomatic complexity ${fn.cyclomatic} (> ${THRESHOLDS.CYCLOMATIC_WARN}). Extract branches into helpers named after the node family or pass step.`,
        })
        totalWarnings++
      }

      if (fn.cognitive > THRESHOLDS.COGNITIVE_FAIL) {
        fileIssues.push({
          type: 'COGNITIVE_FAIL',
          severity: 'error',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cognitive complexity ${fn.cognitive} (> ${THRESHOLDS.COGNITIVE_FAIL}). Flatten with early returns; extract match arms into helpers named after the node family.`,
        })
        totalViolations++
      } else if (fn.cognitive > THRESHOLDS.COGNITIVE_WARN) {
        fileIssues.push({
          type: 'COGNITIVE_WARN',
          severity: 'warn',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cognitive complexity ${fn.cognitive} (> ${THRESHOLDS.COGNITIVE_WARN}). Flatten with early returns; extract match arms into helpers named after the node family.`,
        })
        totalWarnings++
      }

      if (typeof fn.args === 'number') {
        if (fn.args > THRESHOLDS.FN_ARGS_FAIL) {
          fileIssues.push({
            type: 'FN_ARGS_FAIL',
            severity: 'error',
            fn: fn.name,
            line: fn.startLine,
            message: `Function '${fn.name}' has ${fn.args} arguments (> ${THRESHOLDS.FN_ARGS_FAIL}). NOPE. Introduce a context/session struct for shared pass state; do not #[allow(clippy::too_many_arguments)].`,
          })
          totalViolations++
        } else if (fn.args > THRESHOLDS.FN_ARGS_WARN) {
          fileIssues.push({
            type: 'FN_ARGS_WARN',
            severity: 'warn',
            fn: fn.name,
            line: fn.startLine,
            message: `Function '${fn.name}' has ${fn.args} arguments (> ${THRESHOLDS.FN_ARGS_WARN}). Consider a context/session struct before this becomes a parameter soup.`,
          })
          totalWarnings++
        }
      }
    }

    results.push({
      filePath,
      metrics: lineMetrics,
      functions,
      issues: fileIssues,
      status: fileIssues.some((i) => i.severity === 'error')
        ? 'fail'
        : fileIssues.length > 0
        ? 'warn'
        : 'pass',
    })
  }

  // Clippy diagnostics if requested
  let clippyResults = null
  if (runClippy) {
    clippyResults = await runClippyCheck(targetDir)
    if (clippyResults && clippyResults.diagnostics) {
      for (const diag of clippyResults.diagnostics) {
        if (diag.level === 'error') totalViolations++
        else if (diag.level === 'warning') totalWarnings++
      }
    }
  }

  const ok = strict ? (totalViolations === 0 && totalWarnings === 0) : (totalViolations === 0)

  return {
    ok,
    totalFiles: files.length,
    totalViolations,
    totalWarnings,
    results,
    clippy: clippyResults,
  }
}
