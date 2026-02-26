/**
 * Structured logging using debug library.
 * Context-aware logging for tests (test ID, phase, environment).
 */

import createDebug from 'debug'

const base = createDebug('reference-test')

/** Log levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Create a namespaced logger (e.g. reference-test:runner, reference-test:project) */
export function createLogger(namespace: string): ReturnType<typeof createDebug> {
  return base.extend(namespace)
}

/** Default loggers for each module */
export const loggers = {
  project: createLogger('project'),
  runner: createLogger('runner'),
  browser: createLogger('browser'),
  orchestrator: createLogger('orchestrator'),
  utils: createLogger('utils'),
} as const

/** Enable logging via DEBUG=reference-test or DEBUG=reference-test:* */
export function enableLogging(pattern = 'reference-test:*'): void {
  // eslint-disable-next-line no-process-env
  const current = process.env.DEBUG ?? ''
  if (!current.includes(pattern)) {
    // eslint-disable-next-line no-process-env
    process.env.DEBUG = current ? `${current},${pattern}` : pattern
  }
}
