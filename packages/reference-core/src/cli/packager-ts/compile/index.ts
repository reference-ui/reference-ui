import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnMonitoredAsync } from '../../lib/child-process'
import { findDtsFile } from './find-dts'

/**
 * Compile TypeScript source to .d.mts declarations.
 * Spawns tsup; outputs to temp dir then copies to out path (keeps esbuild's .mjs).
 */
export async function compileDeclarations(
  cwd: string,
  entryFile: string,
  outDtsPath: string
): Promise<string> {
  const tmpOut = realpathSync(mkdtempSync(join(tmpdir(), 'ref-ui-dts-')))
  try {
    const result = await spawnMonitoredAsync(
      'npx',
      [
        'tsup',
        entryFile,
        '--dts',
        '--format',
        'esm',
        '--out-dir',
        tmpOut,
        '--target',
        'es2020',
        '--external',
        'react',
        '--external',
        'react-dom',
      ],
      {
        processName: 'tsup',
        cwd,
        shell: false,
        logCategory: 'packager:ts',
        memoryMonitorInterval: 100,
        logMemory: true,
      }
    )

    if (result.code !== 0) {
      throw new Error(
        `tsup exited with code ${result.code}\nstderr: ${result.stderr}\nstdout: ${result.stdout}`
      )
    }

    const tmpDtsPath = findDtsFile(tmpOut)
    if (!tmpDtsPath) {
      throw new Error(
        `tsup did not produce .d.ts or .d.mts in ${tmpOut}. stdout: ${result.stdout}`
      )
    }

    mkdirSync(dirname(outDtsPath), { recursive: true })
    copyFileSync(tmpDtsPath, outDtsPath)
    return outDtsPath
  } finally {
    rmSync(tmpOut, { recursive: true, force: true })
  }
}
