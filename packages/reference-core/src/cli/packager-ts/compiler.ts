import { spawnMonitoredAsync } from '../lib/child-process'

/**
 * Run tsdown as a child process to generate JS + declarations.
 * tsdown uses --out-dir (not --outfile); output filenames are derived from entry
 * (e.g. src/entry/react.ts → react.js, react.d.ts in outDir).
 */
export async function compileDeclarations(
  cwd: string,
  entryFile: string,
  outDir: string
): Promise<void> {
  const result = await spawnMonitoredAsync(
    'npx',
    [
      'tsdown',
      entryFile,
      '--dts',
      '--format',
      'esm',
      '--out-dir',
      outDir,
      '--target',
      'es2020',
      '--external',
      'react',
      '--external',
      'react-dom',
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
}
