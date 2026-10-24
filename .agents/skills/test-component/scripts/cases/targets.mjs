/**
 * Builds precise selectors and isolated artifact paths for component jobs.
 * Literal component names cannot match their longer siblings, and simultaneous
 * jobs and React majors do not share a directory Playwright may clear. Also
 * names the `core` target, the lib unit tests that live outside any component.
 */
import path from 'node:path'

export function ctFileTarget(file, line = null) {
  const literal = path.resolve(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `^${literal}$${line === null ? '' : `:${line}`}`
}

// `pnpm agentct core`: the unit tests under src/core and scripts, which no
// component directory selects. Trailing slashes keep Vitest's substring filter
// from matching an unrelated path that merely contains the word.
export const CORE_TARGET = 'core'
export const CORE_UNIT_PATHS = ['src/core/', 'scripts/']

export function unitDirectory(component) {
  return `src/components/${component}/`
}

export function artifactsDirectory(playwrightDir, pid, runtime = '') {
  const job = path.join(playwrightDir, 'test-results', `agentct-${pid}`)
  return runtime ? path.join(job, runtime) : job
}
