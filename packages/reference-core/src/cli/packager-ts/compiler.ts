import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnMonitoredAsync } from '../lib/child-process'
import { findDtsFile } from './find-dts-file'

/**
 * Run tsdown to generate .d.mts declarations only (output to temp dir).
 * We use a temp dir because tsdown also emits .mjs, but we keep esbuild's
 * .mjs (which bundles @pandacss/dev). Tsdown leaves @pandacss/dev as an
 * import, which breaks at runtime in consumer apps.
 * Returns the path to the generated .d.mts file.
 */
export async function compileDeclarations(
  cwd: string,
  entryFile: string,
  outDtsPath: string
): Promise<string> {
  // realpathSync ensures consistent path (fixes macOS /var vs /private/var)
  const tmpOut = realpathSync(mkdtempSync(join(tmpdir(), 'ref-ui-dts-')))
  try {
    const result = await spawnMonitoredAsync(
      'npx',
      [
        'tsdown',
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
        '--no-inlineOnly',
      ],
      {
        processName: 'tsdown',
        cwd,
        shell: false,
        logCategory: 'packager:ts',
        memoryMonitorInterval: 100,
        logMemory: true,
      }
    )

    if (result.code !== 0) {
      throw new Error(
        `tsdown exited with code ${result.code}\nstderr: ${result.stderr}\nstdout: ${result.stdout}`
      )
    }

    const tmpDtsPath = findDtsFile(tmpOut)
    if (!tmpDtsPath) {
      throw new Error(
        `tsdown did not produce .d.ts or .d.mts in ${tmpOut}. stdout: ${result.stdout}`
      )
    }

    mkdirSync(dirname(outDtsPath), { recursive: true })
    copyFileSync(tmpDtsPath, outDtsPath)
    return outDtsPath
  } finally {
    rmSync(tmpOut, { recursive: true, force: true })
  }
}
