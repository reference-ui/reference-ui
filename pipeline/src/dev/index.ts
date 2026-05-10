/**
 * Development entrypoints that reuse pipeline build caching for the public
 * packages (release scope) without pulling in fixture libraries used by the
 * matrix.
 */

import { RELEASE_PACKAGE_NAMES } from '../../config.js'
import { buildWorkspaceArtifacts } from '../build/index.js'
import { repoRoot, run } from '../build/workspace.js'

export interface RunPipelineDevOptions {
  trace?: boolean
}

export async function runDevDocs(options: RunPipelineDevOptions = {}): Promise<void> {
  await buildWorkspaceArtifacts(RELEASE_PACKAGE_NAMES, { trace: options.trace })
  await run('pnpm', ['--filter', '@reference-ui/reference-docs', 'run', 'dev'], {
    cwd: repoRoot,
    interactive: true,
    label: 'reference-docs dev',
  })
}

export async function runDevLib(options: RunPipelineDevOptions = {}): Promise<void> {
  await buildWorkspaceArtifacts(RELEASE_PACKAGE_NAMES, { trace: options.trace })
  await run('pnpm', ['--filter', '@reference-ui/lib', 'run', 'cosmos'], {
    cwd: repoRoot,
    interactive: true,
    label: 'reference-lib cosmos',
  })
}
