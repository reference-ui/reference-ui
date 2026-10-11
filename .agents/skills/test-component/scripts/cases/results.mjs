/**
 * Checks execution reports against the declarations selected from the catalog.
 * A successful process exit without complete passing evidence is a failure;
 * filtering may exclude siblings but cannot turn a missing selected case green.
 */
import path from 'node:path'
import { titlePattern } from './discover.mjs'

function sameFile(actual, expected) {
  if (typeof actual !== 'string') return false
  const normalized = actual.replaceAll('\\', '/')
  return path.resolve(normalized) === expected || expected.endsWith(`/${normalized}`)
}

// Known full row titles are matched literally (never retokenized into a
// wildcard pattern), and their multiset must be satisfied exactly per file and
// runtime, so an unknown or duplicate row cannot stand in for a missing one.
export function evidenceErrors(tests, cases, { runtime = '' } = {}) {
  const errors = []
  const active = runtime ? tests.filter(test => test.react === runtime) : tests
  if (!active.some(test => test.status === 'passed')) errors.push(`${runtime || 'Unit'}: no passing tests were reported`)
  for (const entry of cases) {
    const inFile = active.filter(test => sameFile(test.file, entry.absoluteFile))
    const titles = Array.isArray(entry.rowTitles) && entry.rowTitles.length ? entry.rowTitles : null
    if (titles) {
      const expected = new Map()
      for (const title of titles) expected.set(title, (expected.get(title) || 0) + 1)
      const problems = []
      for (const [title, need] of expected) {
        const seen = inFile.filter(test => (test.fullTitle || test.title) === title)
        const passed = seen.filter(test => test.status === 'passed').length
        if (seen.length !== need || passed !== need) problems.push(`${JSON.stringify(title)} expected ${need} passing, received ${passed}/${seen.length}`)
      }
      if (problems.length) errors.push(`${entry.id}${runtime ? ` [${runtime}]` : ''}: incomplete rows: ${problems.join('; ')}`)
      continue
    }
    const pattern = new RegExp(titlePattern(entry.title, entry.parameterized))
    const matched = inFile.filter(test => pattern.test(test.fullTitle || test.title))
    const passed = matched.filter(test => test.status === 'passed').length
    if (matched.length !== entry.rows || passed !== entry.rows) {
      errors.push(`${entry.id}${runtime ? ` [${runtime}]` : ''}: expected ${entry.rows} passing row(s), received ${passed}/${matched.length}`)
    }
  }
  return errors
}
