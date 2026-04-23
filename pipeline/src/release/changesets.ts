/**
 * Changesets status collection and parsing.
 *
 * This stage is responsible for reading the pending release intent out of the
 * repository without deciding what the local release flow should do with it.
 */

import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { repoRoot } from '../build/workspace.js'
import type { ChangesetStatus, ChangesetStatusRelease } from './types.js'

export class MissingChangesetReleaseIntentError extends Error {
  constructor() {
    super(
      'Release blocked: packages changed without a changeset. Run `pnpm changeset` to add one, or `pnpm changeset add --empty` when no versioned release is needed.',
    )
  }
}

function readExecFileSyncStderr(error: unknown): string {
  if (!(error instanceof Error)) {
    return ''
  }

  const stderr = Reflect.get(error, 'stderr')

  if (typeof stderr === 'string') {
    return stderr
  }

  if (stderr instanceof Buffer) {
    return stderr.toString('utf8')
  }

  return ''
}

function formatChangesetStatusReadError(error: unknown): Error {
  const stderr = readExecFileSyncStderr(error).trim()

  if (stderr.includes('Some packages have been changed but no changesets were found')) {
    return new MissingChangesetReleaseIntentError()
  }

  if (stderr.length > 0) {
    return new Error(`Failed to read Changesets release status.\n${stderr}`)
  }

  if (error instanceof Error) {
    return new Error(`Failed to read Changesets release status.\n${error.message}`)
  }

  return new Error('Failed to read Changesets release status.')
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function countChangesetEntries(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0
  }

  return value.filter((entry) => typeof entry === 'string' || isRecord(entry)).length
}

export function parseChangesetStatus(rawStatus: unknown): ChangesetStatus {
  if (!isRecord(rawStatus)) {
    throw new Error('Changesets status output was not an object.')
  }

  const rawReleases = Array.isArray(rawStatus.releases) ? rawStatus.releases : []

  return {
    changesets: Array.from({ length: countChangesetEntries(rawStatus.changesets) }, () => 'changeset'),
    releases: rawReleases.flatMap((release): ChangesetStatusRelease[] => {
      if (!isRecord(release) || typeof release.name !== 'string') {
        return []
      }

      return [
        {
          changesets: asStringArray(release.changesets),
          name: release.name,
          newVersion: typeof release.newVersion === 'string' ? release.newVersion : undefined,
          oldVersion: typeof release.oldVersion === 'string' ? release.oldVersion : undefined,
          type: typeof release.type === 'string' ? release.type : undefined,
        },
      ]
    }),
  }
}

export async function readChangesetStatus(): Promise<ChangesetStatus> {
  const tempDir = await mkdtemp(resolve(tmpdir(), 'reference-ui-changesets-'))
  const outputPath = resolve(tempDir, 'status.json')

  try {
    try {
      execFileSync('pnpm', ['exec', 'changeset', 'status', `--output=${outputPath}`], {
        cwd: repoRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      throw formatChangesetStatusReadError(error)
    }

    return parseChangesetStatus(JSON.parse(await readFile(outputPath, 'utf8')) as unknown)
  } finally {
    await rm(tempDir, { force: true, recursive: true })
  }
}