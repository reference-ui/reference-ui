/**
 * Publish-auth preflight.
 *
 * This stage checks whether the developer machine is authenticated with the
 * target npm registry before any local release mutation or staging work begins.
 */

import { execFileSync } from 'node:child_process'
import { repoRoot } from '../build/workspace.js'
import { failStep, finishStep, startStep } from '../lib/log/index.js'
import { defaultNpmAuthRegistryUrl } from './types.js'

export function ensureNpmAuth(authRegistryUrl: string = defaultNpmAuthRegistryUrl): string {
  const step = startStep(`Check npm auth for ${authRegistryUrl}`)

  try {
    const username = execFileSync('npm', ['whoami', '--registry', authRegistryUrl], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    if (username.length === 0) {
      throw new Error(`npm whoami returned no username for ${authRegistryUrl}`)
    }

    finishStep(step, `npm auth OK as ${username}`)
    return username
  } catch (error) {
    failStep(step, `npm auth missing for ${authRegistryUrl}`)
    throw error
  }
}