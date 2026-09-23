/**
 * Runtime helper staged into generated matrix consumers.
 *
 * This script waits for `neo sync --watch` to publish consumable output:
 * the generated system entry inside the out dir plus the scope links Neo
 * junctions into node_modules as the last step of a sync. Neo emits no
 * session sentinel, so readiness is the artifacts the tests consume.
 * Watch-process death is reported by the session runner's exit race;
 * this helper only polls, then fails loud on timeout.
 */

import { existsSync } from 'node:fs'
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

// Neo publishes the sync folder first (system/system.mjs is the system
// leg entry) and junctions the node_modules scope links last, after the
// runtime/react/types/reference-types legs. Both present means a complete
// sync published; existsSync follows junctions, so a dangling link reads
// as missing.
function missingReadyPaths(outDirPath, scopePath) {
  const requiredPaths = [
    resolve(outDirPath, 'system', 'system.mjs'),
    resolve(scopePath, '@reference-ui', 'react'),
  ]

  return requiredPaths.filter(requiredPath => !existsSync(requiredPath))
}

const outDirPath = resolve(
  process.cwd(),
  process.env.REFERENCE_UI_MATRIX_REF_SYNC_OUT_DIR ?? '.reference-ui',
)
const scopePath = resolve(process.cwd(), 'node_modules')
const timeoutMs = readPositiveIntEnv('REFERENCE_UI_MATRIX_REF_SYNC_READY_TIMEOUT_MS', 30_000)
const pollMs = readPositiveIntEnv('REFERENCE_UI_MATRIX_REF_SYNC_READY_POLL_MS', 50)
const startedAt = Date.now()
let lastMissingPaths = []

while (Date.now() - startedAt <= timeoutMs) {
  lastMissingPaths = missingReadyPaths(outDirPath, scopePath)

  if (lastMissingPaths.length === 0) {
    process.exit(0)
  }

  await new Promise(resolvePromise => setTimeout(resolvePromise, pollMs))
}

const details = lastMissingPaths.length > 0
  ? `\nMissing neo sync output:\n${lastMissingPaths.join('\n')}`
  : ''

throw new Error(`Timed out waiting for neo sync watch readiness at ${outDirPath}${details}`)
