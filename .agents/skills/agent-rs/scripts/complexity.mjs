#!/usr/bin/env node

/**
 * Code Quality & Cyclomatic Complexity Engine for Reference RS
 *
 * Enforces:
 * 1. File Length: Warning at > 365 lines, failure at > 500 lines ("Can you split this up, please?").
 * 2. Function Cyclomatic Complexity (McCabe): Target <= 10, warning at > 10, failure at > 15.
 * 3. Function Cognitive Complexity: Target <= 15, warning at > 15, failure at > 20.
 * 4. Function Length: Warning at > 80 lines, failure at > 120 lines.
 * 5. Clippy Integration: Ingests clippy JSON diagnostics (cognitive complexity, too many lines, etc.).
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

export const THRESHOLDS = {
  FILE_LINES_WARN: 365,
  FILE_LINES_FAIL: 500,
  FN_LINES_WARN: 80,
  FN_LINES_FAIL: 120,
  CYCLOMATIC_WARN: 10,
  CYCLOMATIC_FAIL: 15,
  COGNITIVE_WARN: 15,
  COGNITIVE_FAIL: 20,
  VERBOSE_COMMENT_WARN: 15,
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
        if (!IGNORE_DIRS.has(entry.name)) {
          walk(path.join(cur, entry.name))
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

/**
 * Checks if a source file begins with a concise top-of-file commentary describing what it is.
 */
export function checkTopComment(content, filePath) {
  const lines = content.split(/\r?\n/)
  let firstIdx = 0
  while (firstIdx < lines.length && (!lines[firstIdx].trim() || lines[firstIdx].trim().startsWith('#!'))) {
    firstIdx++
  }
  if (firstIdx >= lines.length) return false
  const first = lines[firstIdx].trim()

  if (filePath.endsWith('.rs')) {
    return first.startsWith('//! ') || first.startsWith('/// ') || first.startsWith('/*')
  }
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
    return first.startsWith('/**') || first.startsWith('// ')
  }
  return true
}

/**
 * Checks for overly verbose comment blocks (no filthy long comments, only terse comments).
 */
export function checkVerboseComments(content) {
  const lines = content.split(/\r?\n/)
  const violations = []
  let commentStreak = 0
  let streakStart = 0

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')
    if (isComment && trimmed.length > 0) {
      if (commentStreak === 0) streakStart = i + 1
      commentStreak++
    } else {
      if (commentStreak > THRESHOLDS.VERBOSE_COMMENT_WARN) {
        // Exclude the top-of-file header comment if it's within first 30 lines
        if (streakStart > 5) {
          violations.push({
            line: streakStart,
            length: commentStreak,
          })
        }
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

    for (let i = searchIdx; i < cleaned.length; i++) {
      const c = cleaned[i]
      if (c === '(') parenDepth++
      else if (c === ')') {
        parenDepth--
        if (parenDepth === 0) {
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

  // Markdown files can be arbitrarily long (>500 lines) and are completely exempt from code length and complexity checks.
  const sourceFiles = files.filter((f) => {
    if (f.endsWith('.md')) return false
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
      if (!checkTopComment(content, filePath)) {
        fileIssues.push({
          type: 'MISSING_TOP_COMMENT',
          severity: 'error',
          line: 1,
          message: 'Missing top-of-file header comment. All files must begin with a short, precise comment describing what the file is.',
        })
        totalViolations++
      }

      const verboseBlocks = checkVerboseComments(content)
      for (const vb of verboseBlocks) {
        fileIssues.push({
          type: 'VERBOSE_COMMENT',
          severity: 'warn',
          line: vb.line,
          message: `Overly verbose comment block (${vb.length} lines). We only like very terse comments.`,
        })
        totalWarnings++
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
          message: `Function '${fn.name}' has ${fn.lines} lines (> ${THRESHOLDS.FN_LINES_FAIL}).`,
        })
        totalViolations++
      } else if (fn.lines > THRESHOLDS.FN_LINES_WARN) {
        fileIssues.push({
          type: 'FN_LINES_WARN',
          severity: 'warn',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has ${fn.lines} lines (> ${THRESHOLDS.FN_LINES_WARN}).`,
        })
        totalWarnings++
      }

      if (fn.cyclomatic > THRESHOLDS.CYCLOMATIC_FAIL) {
        fileIssues.push({
          type: 'CYCLOMATIC_FAIL',
          severity: 'error',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cyclomatic complexity ${fn.cyclomatic} (> ${THRESHOLDS.CYCLOMATIC_FAIL}).`,
        })
        totalViolations++
      } else if (fn.cyclomatic > THRESHOLDS.CYCLOMATIC_WARN) {
        fileIssues.push({
          type: 'CYCLOMATIC_WARN',
          severity: 'warn',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cyclomatic complexity ${fn.cyclomatic} (> ${THRESHOLDS.CYCLOMATIC_WARN}).`,
        })
        totalWarnings++
      }

      if (fn.cognitive > THRESHOLDS.COGNITIVE_FAIL) {
        fileIssues.push({
          type: 'COGNITIVE_FAIL',
          severity: 'error',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cognitive complexity ${fn.cognitive} (> ${THRESHOLDS.COGNITIVE_FAIL}).`,
        })
        totalViolations++
      } else if (fn.cognitive > THRESHOLDS.COGNITIVE_WARN) {
        fileIssues.push({
          type: 'COGNITIVE_WARN',
          severity: 'warn',
          fn: fn.name,
          line: fn.startLine,
          message: `Function '${fn.name}' has cognitive complexity ${fn.cognitive} (> ${THRESHOLDS.COGNITIVE_WARN}).`,
        })
        totalWarnings++
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
