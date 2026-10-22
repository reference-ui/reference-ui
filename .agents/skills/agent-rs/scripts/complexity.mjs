#!/usr/bin/env node

/**
 * Code Quality & Cyclomatic Complexity Engine for Reference RS
 *
 * Enforces:
 * 1. File Length: Warning at > 365 lines, failure at > 500 lines ("Can you split this up, please?").
 * 2. Function Cyclomatic Complexity (McCabe): Target <= 10, warning at > 10, failure at > 15.
 * 3. Function Cognitive Complexity (SonarSource): Target <= 15, warning at > 15, failure at > 20. Nesting starts at zero inside the function body.
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
  FILE_LINES_FAIL: 500,
  FN_LINES_WARN: 80,
  FN_LINES_FAIL: 120,
  CYCLOMATIC_WARN: 10,
  CYCLOMATIC_FAIL: 15,
  COGNITIVE_WARN: 15,
  COGNITIVE_FAIL: 20,
  FN_ARGS_WARN: 4,
  FN_ARGS_FAIL: 5,
  VERBOSE_COMMENT_WARN: 20,
  HEADER_SENTENCE_MIN: 1,
  HEADER_SENTENCE_MAX: 8,
  HEADER_LINES_FAIL: 30,
}

/** Clippy allow/expect is banned. Messages tell the agent how to fix, not how to silence. */
export const CLIPPY_ALLOW_FIXES = {
  too_many_arguments:
    'NOPE. Silencing clippy::too_many_arguments is banned. Those args are one missing type: group shared state into a named context/session struct and pass that. Keep the primary input as its own argument; do not pack leftovers into a tuple.',
  too_many_lines:
    'NOPE. Silencing clippy::too_many_lines is banned. The function is several steps wearing one name. Split into helpers named after the work they do (a phase, a case, a transformation), not foo_part2.',
  cognitive_complexity:
    'NOPE. Silencing clippy::cognitive_complexity is banned. Flatten with early returns; extract nested branches and match arms into helpers named after the decision they make.',
  type_complexity:
    'NOPE. Silencing clippy::type_complexity is banned. An unnamed nested generic is a type. Name it: a struct or type alias, not a nested generic soup.',
  large_enum_variant:
    'NOPE. Silencing clippy::large_enum_variant is banned. Box the fat variant so the enum stays small on the stack.',
  result_large_err:
    'NOPE. Silencing clippy::result_large_err is banned. Shrink the error (Box it, a smaller enum, or a shared error type) so Ok stays cheap.',
  large_stack_arrays:
    'NOPE. Silencing clippy::large_stack_arrays is banned. Move it off the stack: Vec or Box<[T]>, not a giant array local.',
  redundant_clone:
    'NOPE. Silencing clippy::redundant_clone is banned. Borrow, take ownership once, or restructure so the clone is unnecessary.',
  clone_on_copy:
    'NOPE. Silencing clippy::clone_on_copy is banned. The type is Copy; assign or dereference it. Do not clone.',
  needless_pass_by_value:
    'NOPE. Silencing clippy::needless_pass_by_value is banned. Take &T (or &mut T) unless the function must store, return, or otherwise own the value.',
  unwrap_used:
    'NOPE. Silencing clippy::unwrap_used is banned. Return Result/Option and propagate the failure; do not unwrap in library code.',
  expect_used:
    'NOPE. Silencing clippy::expect_used is banned. Return Result/Option and propagate the failure; do not expect in library code.',
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
  // Gitignored test output (tasty tests/.scratch): generated JS, not source.
  '.scratch',
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
        if (normalized.endsWith('/canon/src')) {
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

const COGNITIVE_TOKEN_RE =
  /(\s+)|([A-Za-z_$][\w$]*)|('[A-Za-z_]\w*)|(\d[\w.]*)|(\?\.(?!\d)|\?\?=?|&&=?|\|\|=?|=>|::|\.\.\.|[\s\S])/g

const COGNITIVE_WORD_KINDS = {
  rust: new Map([
    ['if', 'if'], ['else', 'else'], ['for', 'nest'], ['while', 'nest'], ['loop', 'nest'],
    ['match', 'match'], ['fn', 'fn'], ['break', 'jump'], ['continue', 'jump'],
  ]),
  js: new Map([
    ['if', 'if'], ['else', 'else'], ['for', 'nest'], ['while', 'nest'], ['do', 'nest'],
    ['catch', 'nest'], ['switch', 'match'], ['function', 'fn'], ['break', 'jump'], ['continue', 'jump'],
  ]),
}

// After these words a bar or ampersand is a prefix (closure or borrow), not a binary operator.
const NON_OPERAND_WORDS = new Set(['return', 'move', 'in', 'of', 'typeof', 'await', 'yield'])

// A slash starts a JS regex literal only where an operand cannot end, so `a / b` stays division.
const JS_REGEX_LITERAL_RE =
  /(^|[(,=:\[!&|?{};+\-*%<>~^]|\b(?:return|typeof|case|do|else|in|of|void|delete|throw|new|yield|await))(\s*)(\/(?![*\/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\/\\\[\n])+\/[a-z]*)/gm

/**
 * Cognitive complexity (SonarSource) of one function body, cleaned of strings and comments and
 * starting at its opening brace. A structure (if, loop, catch, match or switch, ternary, or a
 * labelled break or continue) costs 1 plus its nesting depth; else and else-if cost a flat 1; each
 * run of like && or || costs 1. Only structure bodies, arrow and closure bodies and nested fns add
 * depth, so the function body is depth zero and object literals, bare blocks and match arms add none.
 */
export function cognitiveComplexity(body, language) {
  const source = language === 'js' ? blankJsRegexLiterals(body) : body
  const tokens = tokenizeCognitive(source)
  const walk = {
    language,
    score: 0,
    nesting: 0,
    frames: [],
    header: null,
    parens: 0,
    logicalOp: null,
    afterDoBody: false,
  }
  for (let i = 0; i < tokens.length; i++) {
    const afterDoBody = walk.afterDoBody
    walk.afterDoBody = false
    if (tokens[i].type === 'word') stepWord(walk, tokens, i, afterDoBody)
    else if (tokens[i].type === 'op') stepPunct(walk, tokens, i)
  }
  return walk.score
}

function blankJsRegexLiterals(body) {
  return body.replace(JS_REGEX_LITERAL_RE, (_, lead, gap, literal) => `${lead}${gap}${' '.repeat(literal.length)}`)
}

function tokenizeCognitive(source) {
  const tokens = []
  let newline = false
  for (const m of source.matchAll(COGNITIVE_TOKEN_RE)) {
    if (m[1] !== undefined) {
      if (m[1].includes('\n')) newline = true
      continue
    }
    const type = m[2] !== undefined ? 'word' : m[3] !== undefined ? 'life' : m[4] !== undefined ? 'num' : 'op'
    tokens.push({ type, value: m[0], newline })
    newline = false
  }
  return tokens
}

function stepWord(walk, tokens, i, afterDoBody) {
  const { value } = tokens[i]
  const prev = tokens[i - 1]
  // `x.catch(` and `x?.for` are member names, not keywords.
  if (prev?.type === 'op' && (prev.value === '.' || prev.value === '?.')) return
  switch (COGNITIVE_WORD_KINDS[walk.language].get(value)) {
    case 'if':
      return stepIf(walk, prev)
    case 'else':
      // A Rust let-else (`let P = e else { .. }`) follows an expression, not a block; it is an early exit, not a branch.
      if (walk.language === 'rust' && !(prev?.type === 'op' && prev.value === '}')) return
      walk.score += 1
      return setHeader(walk, 'nest', false)
    case 'nest':
      // The `while` closing a do-body is the tail of the do-while, already counted at `do`.
      if (value === 'while' && afterDoBody) return
      return enterStructure(walk, 'nest', value === 'do')
    case 'match':
      return enterStructure(walk, 'match', false)
    case 'fn':
      return setHeader(walk, 'nest', false)
    case 'jump':
      return stepJump(walk, tokens, i)
    default:
      return
  }
}

function stepIf(walk, prev) {
  if (prev?.type === 'word' && prev.value === 'else') return
  if (isMatchGuard(walk)) return
  enterStructure(walk, 'nest', false)
}

function stepJump(walk, tokens, i) {
  const next = tokens[i + 1]
  const labelled = walk.language === 'rust' ? next?.type === 'life' : next?.type === 'word' && !next.newline
  if (labelled) walk.score += 1 + walk.nesting
}

function stepPunct(walk, tokens, i) {
  switch (tokens[i].value) {
    case '(':
      walk.parens++
      return
    case ')':
      walk.parens = Math.max(0, walk.parens - 1)
      return
    case '{':
      return openBlock(walk, tokens[i - 1])
    case '}':
      return closeBlock(walk)
    case ';':
      walk.logicalOp = null
      if (walk.parens === 0) walk.header = null
      return
    case ',':
      walk.logicalOp = null
      return setArmBody(walk, false)
    case ':':
      walk.logicalOp = null
      return
    case '=>':
      walk.logicalOp = null
      if (walk.language === 'rust') setArmBody(walk, true)
      return
    case '?':
      return stepQuestion(walk, tokens, i)
    case '&&':
    case '||':
      return stepLogical(walk, tokens, i)
    default:
      return
  }
}

// Rust's `?` is the try operator, which does not count; JS `?` is a ternary unless it marks `name?: T`.
function stepQuestion(walk, tokens, i) {
  if (walk.language !== 'js') return
  const next = tokens[i + 1]
  if (next?.type === 'op' && next.value === ':') return
  walk.logicalOp = null
  walk.score += 1 + walk.nesting
}

function stepLogical(walk, tokens, i) {
  const op = tokens[i].value
  if (!endsOperand(tokens[i - 1])) return
  if (walk.logicalOp !== op) {
    walk.score += 1
    walk.logicalOp = op
  }
}

function endsOperand(tok) {
  if (!tok) return false
  if (tok.type === 'word') return !NON_OPERAND_WORDS.has(tok.value)
  if (tok.type === 'num') return true
  return tok.type === 'op' && (tok.value === ')' || tok.value === ']' || tok.value === '}' || tok.value === '?')
}

function enterStructure(walk, block, doLoop) {
  walk.score += 1 + walk.nesting
  setHeader(walk, block, doLoop)
}

// The next `{` at the same paren depth is this keyword's body.
function setHeader(walk, block, doLoop) {
  walk.header = { parens: walk.parens, block, doLoop }
}

function openBlock(walk, prev) {
  walk.logicalOp = null
  let block = 'plain'
  let doLoop = false
  const header = walk.header
  if (header && header.parens === walk.parens) {
    block = header.block
    doLoop = header.doLoop
    walk.header = null
  } else if (walk.language === 'js' && prev?.value === '=>') {
    block = 'nest'
  } else if (walk.language === 'rust' && (prev?.value === '|' || prev?.value === '||')) {
    block = 'nest'
  }
  walk.frames.push({ block, parens: walk.parens, armBody: false, doLoop })
  if (block !== 'plain') walk.nesting++
}

function closeBlock(walk) {
  walk.logicalOp = null
  if (walk.parens === 0) walk.header = null
  const frame = walk.frames.pop()
  if (!frame) return
  if (frame.block !== 'plain') walk.nesting--
  walk.afterDoBody = frame.doLoop
  setArmBody(walk, false)
}

// Rust match arms: a `pat if cond =>` guard sits before its `=>`, so an `if` there is not a structure.
function isMatchGuard(walk) {
  const top = walk.frames[walk.frames.length - 1]
  return walk.language === 'rust' && top?.block === 'match' && top.parens === walk.parens && !top.armBody
}

function setArmBody(walk, value) {
  const top = walk.frames[walk.frames.length - 1]
  if (top?.block === 'match' && top.parens === walk.parens) top.armBody = value
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
    const bodyLines = body.split('\n')

    for (const bLine of bodyLines) {
      const trimmed = bLine.trim()
      
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
    }

    const cognitive = cognitiveComplexity(body, 'rust')

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

    const bodyLines = body.split('\n')
    for (const bLine of bodyLines) {
      const trimmed = bLine.trim()

      const ifMatches = trimmed.match(/\bif\b/g) || []
      const caseMatches = trimmed.match(/\bcase\b/g) || []
      const loopMatches = trimmed.match(/\b(?:for|while|do)\b/g) || []
      const catchMatches = trimmed.match(/\bcatch\b/g) || []
      const ternaryMatches = trimmed.match(/\?/g) || []
      const logicalMatches = trimmed.match(/(?:&&|\|\||\?\?)/g) || []

      const totalBranches = ifMatches.length + caseMatches.length + loopMatches.length +
                            catchMatches.length + ternaryMatches.length + logicalMatches.length

      cyclomatic += totalBranches
    }

    const cognitive = cognitiveComplexity(body, 'js')

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

  // Markdown files, generated files, canon tables, and ignore directories are exempt from code checks.
  const sourceFiles = files.filter((f) => {
    if (f.endsWith('.md') || f.endsWith('.d.ts') || f.endsWith('.min.js')) return false
    const normalized = f.replace(/\\/g, '/')
    if (normalized.includes('/js/generated/')) return false
    if (normalized.includes('/modules/canon/src/')) return false
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
