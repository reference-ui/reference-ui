/**
 * Resolves the catalog declarations an invocation must execute and prove from
 * the catalog alone, before any test runs. Grep and legacy targets map back to
 * whole declarations (their complete static row count included), so the
 * observed execution report can never define what the expected evidence was.
 */
import { titlePattern } from './discover.mjs'
import { ctFileTarget } from './targets.mjs'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function compileGrep(pattern) {
  try {
    return new RegExp(pattern)
  } catch (error) {
    throw new Error(`Invalid grep pattern ${JSON.stringify(pattern)}: ${error.message}`)
  }
}

export function declarationPattern(entry) {
  if (Array.isArray(entry.rowTitles) && entry.rowTitles.length) {
    return `^(${entry.rowTitles.map(escapeRegex).join('|')})$`
  }
  return titlePattern(entry.title, entry.parameterized)
}

export function matchesDeclaration(entry, regex) {
  if (regex.test(entry.title)) return true
  return (entry.rowTitles || []).some(title => regex.test(title))
}

export function executionSelector(entries) {
  return entries.map(entry => `(${declarationPattern(entry)})`).join('|')
}

// Vitest matches -t against declaration titles, Playwright prefixes project and
// file text, so CT is selected by exact file:line rather than an anchored grep.
export function executionArguments(cases, { filtered = true, catalogCases = cases } = {}) {
  const ctCases = cases.filter(entry => entry.kind === 'ct')
  const selectedIds = new Set(ctCases.map(entry => entry.id))
  const files = new Map()
  for (const entry of catalogCases.filter(entry => entry.kind === 'ct')) {
    if (!files.has(entry.absoluteFile)) files.set(entry.absoluteFile, [])
    files.get(entry.absoluteFile).push(entry.id)
  }
  return {
    unitSelector: filtered ? executionSelector(cases.filter(entry => entry.kind === 'unit')) : '',
    ctTargets: [...new Set(ctCases.map(entry => {
      const complete = !filtered && files.get(entry.absoluteFile)?.every(id => selectedIds.has(id))
      return ctFileTarget(entry.absoluteFile, complete ? null : entry.line)
    }))],
  }
}

export function selectByGrep(cases, pattern) {
  const regex = compileGrep(pattern)
  const matched = cases.filter(entry => matchesDeclaration(entry, regex))
  if (matched.length === 0) {
    throw new Error(`No registered declaration matches grep ${JSON.stringify(pattern)}; refusing to execute with empty expected evidence. Use a catalog case ID or a declaration title.`)
  }
  for (const entry of cases) {
    if (entry.parameterized && !entry.rowTitles) {
      throw new Error(`Grep ${JSON.stringify(pattern)} cannot establish the rows of parameterized declaration ${entry.id}, whose runtime titles are not statically resolvable. Use the catalog case ID ${entry.id}.`)
    }
  }
  return matched
}

function uniqueTarget(matches, label) {
  if (matches.length === 0) throw new Error(`No catalog declaration matches ${label}; selection is empty before execution. Use a catalog case ID instead.`)
  if (matches.length > 1) throw new Error(`Legacy target ${label} is ambiguous (${matches.length} declarations); use a catalog case ID instead.`)
  return matches
}

export function selectLegacyTarget(cases, { id = '', line = null, component = '' } = {}) {
  const scoped = component ? cases.filter(entry => entry.component === component) : cases
  if (Number.isInteger(line)) return uniqueTarget(scoped.filter(entry => entry.line === line), `line ${line}`)
  if (id) {
    const relative = entry => `src/components/${entry.component}/${entry.file}`
    const identity = entry => entry.id === id || entry.name === id || entry.title === id ||
      (entry.rowTitles || []).includes(id) ||
      entry.file === id || relative(entry) === id ||
      entry.file.endsWith(`/${id}`) || relative(entry).endsWith(`/${id}`)
    const direct = scoped.filter(identity)
    if (direct.length) return uniqueTarget(direct, `target ${JSON.stringify(id)}`)
    const fuzzy = scoped.filter(entry => entry.title.includes(id))
    for (const entry of fuzzy) {
      if (entry.parameterized && !entry.rowTitles) {
        throw new Error(`Legacy target ${JSON.stringify(id)} cannot resolve a row of parameterized declaration ${entry.id} whose titles are not statically resolvable. Use the catalog case ID ${entry.id}.`)
      }
    }
    return uniqueTarget(fuzzy, `target ${JSON.stringify(id)}`)
  }
  return []
}

export function resolveSelection(catalog, { component = '', grep = '', targetId = '', targetLine = null, kinds = null } = {}) {
  if (targetId || Number.isInteger(targetLine)) {
    const cases = selectLegacyTarget(catalog.cases, { id: targetId, line: targetLine, component })
    return { mode: 'legacy', cases, selector: executionSelector(cases) }
  }
  const scoped = component ? catalog.cases.filter(entry => entry.component === component) : catalog.cases
  if (grep) {
    const universe = kinds && kinds.length ? scoped.filter(entry => kinds.includes(entry.kind)) : scoped
    const cases = selectByGrep(universe, grep)
    return { mode: 'grep', cases, selector: executionSelector(cases) }
  }
  return { mode: component ? 'component' : 'all', cases: scoped, selector: '' }
}
