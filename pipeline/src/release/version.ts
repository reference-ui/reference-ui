/**
 * Changesets version materialization.
 *
 * This stage applies the pending Changesets release intent to the workspace so
 * the subsequent build and staging steps operate on the exact release versions.
 */

import { run } from '../build/workspace.js'

export async function materializeReleaseVersions(): Promise<void> {
  await run('pnpm', ['version-packages'], {
    label: 'Materialize release versions with Changesets',
  })
}