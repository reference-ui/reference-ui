/**
 * Builds precise selectors and isolated artifact paths for component jobs.
 * Literal component names cannot match their longer siblings, and simultaneous
 * jobs and React majors do not share a directory Playwright may clear.
 */
import path from 'node:path'

export function ctFileTarget(file, line = null) {
  const literal = path.resolve(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `^${literal}$${line === null ? '' : `:${line}`}`
}

export function unitDirectory(component) {
  return `src/components/${component}/`
}

export function artifactsDirectory(playwrightDir, pid, runtime = '') {
  const job = path.join(playwrightDir, 'test-results', `agentct-${pid}`)
  return runtime ? path.join(job, runtime) : job
}
