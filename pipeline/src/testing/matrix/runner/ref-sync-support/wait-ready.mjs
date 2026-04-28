/**
 * Runtime helper staged into generated matrix consumers.
 *
 * This script waits for `ref sync --watch` to reach the runtime-ready boundary
 * that browser and runtime-focused tests can safely execute against. It fails
 * fast when the watch session reports a failed build instead of waiting for the
 * full timeout.
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function readPositiveIntEnv(name, fallback) {
  const rawValue = process.env[name]

  if (rawValue === undefined) {
    return fallback
  }

  const parsedValue = Number.parseInt(rawValue, 10)

  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue
  }

  return fallback
}

function isTransientManifestReadError(error) {
  return error instanceof SyntaxError
    || (typeof error === 'object'
      && error !== null
      && 'code' in error
      && (error.code === 'ENOENT' || error.code === 'EISDIR'))
}

function describeManifestFailure(sessionPath, manifestSource) {
  return [
    `ref sync watch failed before reaching ready at ${sessionPath}`,
    'Last session manifest:',
    manifestSource,
  ].join('\n')
}

const sessionPath = resolve(
  process.cwd(),
  process.env.REFERENCE_UI_MATRIX_REF_SYNC_SESSION_PATH ?? '.reference-ui/tmp/session.json',
)
const timeoutMs = readPositiveIntEnv('REFERENCE_UI_MATRIX_REF_SYNC_READY_TIMEOUT_MS', 30_000)
const pollMs = readPositiveIntEnv('REFERENCE_UI_MATRIX_REF_SYNC_READY_POLL_MS', 50)
const startedAt = Date.now()
let lastManifestSource = ''

while (Date.now() - startedAt <= timeoutMs) {
  if (existsSync(sessionPath)) {
    try {
      const manifestSource = await readFile(sessionPath, 'utf8')
      lastManifestSource = manifestSource
      const manifest = JSON.parse(manifestSource)

      if (!manifest || typeof manifest !== 'object') {
        continue
      }

      if (manifest.buildState === 'ready') {
        process.exit(0)
      }

      if (manifest.buildState === 'failed' || manifest.state === 'failed') {
        throw new Error(describeManifestFailure(sessionPath, manifestSource))
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('ref sync watch failed before reaching ready')) {
        throw error
      }

      if (!isTransientManifestReadError(error)) {
        throw error
      }
    }
  }

  await new Promise(resolvePromise => setTimeout(resolvePromise, pollMs))
}

const details = lastManifestSource.length > 0
  ? `\nLast session manifest:\n${lastManifestSource}`
  : ''

throw new Error(`Timed out waiting for ref sync watch readiness at ${sessionPath}${details}`)