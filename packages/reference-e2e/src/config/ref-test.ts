/**
 * Load ref-test config. Env vars override for CI/flexibility.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = join(__dirname, '..', '..', 'ref-test.config.json')

export interface RefTestConfig {
  defaultProject: string
  basePort: number
  workers: number
  parallelSandboxes: boolean
}

let _config: RefTestConfig | null = null

export function loadConfig(): RefTestConfig {
  if (_config) return _config
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as RefTestConfig
  _config = {
    defaultProject: process.env.REF_TEST_PROJECT ?? raw.defaultProject,
    basePort: raw.basePort,
    workers: process.env.REF_TEST_WORKERS ? parseInt(process.env.REF_TEST_WORKERS, 10) : raw.workers,
    parallelSandboxes:
      process.env.REF_TEST_PARALLEL !== undefined
        ? process.env.REF_TEST_PARALLEL === '1'
        : raw.parallelSandboxes,
  }
  return _config
}
