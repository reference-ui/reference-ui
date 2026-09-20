/**
 * Dev miss probe over the live sheet's `@layer utilities` selectors.
 * Takes constructed class names with their diagnostic messages and warns
 * once the sheet proves a class has no rule. Browser dev only: silent
 * without a document, off the paint path in a microtask, gated on sheet
 * completeness with a `load` re-arm, and silent on scan errors rather
 * than misdiagnosing hits.
 */

/** One constructed class plus the diagnostic its absence earns. */
export interface MissCandidate {
  className: string
  message: string
}

/** Dot-class tokens with escapes intact, split from pseudo-classes. */
const CLASS_TOKEN = /\.((?:\\.|[^.,:()[\]\s>+~])+)/g

/** Hex-plus-tail escape body the unescaper decodes to a code point. */
const ESCAPE_BODY = /\\([0-9a-fA-F]{1,6}\s?|.)/gs

let cachedKey: string | undefined
let cachedClasses: Set<string> = new Set()
let pending: MissCandidate[] = []
let loadArmed = false

/**
 * Warn for every candidate class no utilities rule backs. No-ops without
 * a document; the check itself runs in a microtask, past first paint.
 */
export function reportMissCandidates(candidates: MissCandidate[]): void {
  if (candidates.length === 0 || typeof document === 'undefined') {
    return
  }
  queueMicrotask(() => checkCandidates(candidates))
}

/** Check one batch against the sheet, re-arming while it is incomplete. */
function checkCandidates(candidates: MissCandidate[]): void {
  if (!sheetsComplete()) {
    rearmOnLoad(candidates)
    return
  }
  const classes = currentClasses()
  if (classes === undefined) {
    return
  }
  for (const candidate of candidates) {
    if (!classes.has(candidate.className)) {
      console.warn(candidate.message)
    }
  }
}

/**
 * True once no same-origin linked sheet still reads empty. Inline sheets
 * and unreadable cross-origin sheets never gate; a genuinely empty sheet
 * stops gating at `complete`.
 */
function sheetsComplete(): boolean {
  if (document.readyState === 'complete') {
    return true
  }
  const sheets = document.styleSheets
  for (let index = 0; index < sheets.length; index += 1) {
    const sheet = sheets.item(index)
    if (sheet === null || sheet.href === null) {
      continue
    }
    let count: number
    try {
      count = sheet.cssRules.length
    } catch {
      continue
    }
    if (count === 0) {
      return false
    }
  }
  return true
}

/** Hold candidates for `load`, arming the listener once per wait. */
function rearmOnLoad(candidates: MissCandidate[]): void {
  pending.push(...candidates)
  if (loadArmed || typeof window === 'undefined') {
    return
  }
  loadArmed = true
  window.addEventListener('load', flushPending, { once: true })
}

/** Run the candidates `load` waited for. */
function flushPending(): void {
  loadArmed = false
  const drained = pending
  pending = []
  checkCandidates(drained)
}

/** The cached class set, rebuilt when the sheet list changes. */
function currentClasses(): Set<string> | undefined {
  let key: string
  try {
    key = sheetFingerprint()
  } catch {
    return undefined
  }
  if (key !== cachedKey) {
    const fresh = scanSheets()
    if (fresh === undefined) {
      return undefined
    }
    cachedKey = key
    cachedClasses = fresh
  }
  return cachedClasses
}

/** Sheet-list identity: count plus every sheet's link, inline or not. */
function sheetFingerprint(): string {
  const sheets = document.styleSheets
  const hrefs: string[] = []
  for (let index = 0; index < sheets.length; index += 1) {
    hrefs.push(sheets.item(index)?.href ?? '')
  }
  return `${sheets.length}|${hrefs.join('|')}`
}

/** Collect every utilities class across readable sheets, or undefined. */
function scanSheets(): Set<string> | undefined {
  const found = new Set<string>()
  try {
    const sheets = document.styleSheets
    for (let index = 0; index < sheets.length; index += 1) {
      const sheet = sheets.item(index)
      if (sheet === null) {
        continue
      }
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      walkRules(rules, false, found)
    }
  } catch {
    return undefined
  }
  return found
}

/** Walk one rule list, collecting style selectors inside utilities. */
function walkRules(rules: CSSRuleList, inUtilities: boolean, out: Set<string>): void {
  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules.item(index)
    if (rule === null) {
      continue
    }
    walkRule(rule, inUtilities, out)
  }
}

/** Collect one rule's selector, then descend into its nested rules. */
function walkRule(rule: CSSRule, inUtilities: boolean, out: Set<string>): void {
  const inside = inUtilities || isUtilitiesLayer(rule)
  if (inside) {
    const selector = selectorOf(rule)
    if (selector !== undefined) {
      collectClasses(selector, out)
    }
  }
  const children = childRules(rule)
  if (children !== undefined) {
    walkRules(children, inside, out)
  }
}

/**
 * True for a `@layer utilities` block. Never matches `rule.type`:
 * Chromium reports 0 for layer blocks, so identity is `instanceof` with
 * a constructor-name fallback, then the block's own name.
 */
function isUtilitiesLayer(rule: CSSRule): boolean {
  if (typeof CSSLayerBlockRule !== 'undefined' && rule instanceof CSSLayerBlockRule) {
    return rule.name === 'utilities'
  }
  const guarded = rule as CSSRule & { constructor?: { name?: unknown }; name?: unknown }
  return guarded.constructor?.name === 'CSSLayerBlockRule' && guarded.name === 'utilities'
}

/** The selector text of a style rule, or undefined for other rules. */
function selectorOf(rule: CSSRule): string | undefined {
  const selector = (rule as Partial<CSSStyleRule>).selectorText
  return typeof selector === 'string' ? selector : undefined
}

/** Nested rules of a grouping rule, or undefined past any guard. */
function childRules(rule: CSSRule): CSSRuleList | undefined {
  const grouping = rule as Partial<CSSGroupingRule>
  if (grouping.cssRules === undefined) {
    return undefined
  }
  try {
    return grouping.cssRules
  } catch {
    return undefined
  }
}

/** Add every dot-class in a selector list, grouped selectors split. */
function collectClasses(selectorText: string, out: Set<string>): void {
  for (const part of selectorText.split(',')) {
    for (const match of part.matchAll(CLASS_TOKEN)) {
      out.add(unescapeCss(match[1] ?? ''))
    }
  }
}

/** Decode selector escapes back to the DOM class spelling. */
function unescapeCss(escaped: string): string {
  return escaped.replace(ESCAPE_BODY, (_full, body: string) => decodeEscape(body))
}

/** One escape body: a leading hex digit means a code point, else literal. */
function decodeEscape(body: string): string {
  const head = body.charCodeAt(0)
  if (head >= 0x30 && head <= 0x39) {
    return codePointChar(body)
  }
  if ((head >= 0x41 && head <= 0x46) || (head >= 0x61 && head <= 0x66)) {
    return codePointChar(body)
  }
  return body
}

/** Code point for a hex escape body, replacement char past the range. */
function codePointChar(body: string): string {
  const value = Number.parseInt(body.trimEnd(), 16)
  if (!Number.isFinite(value) || value === 0 || value > 0x10ffff) {
    return '�'
  }
  if (value >= 0xd800 && value <= 0xdfff) {
    return '�'
  }
  return String.fromCodePoint(value)
}
