#!/usr/bin/env node
/**
 * Complexity report for packages/reference-core/src/cli only.
 * Transpiles TypeScript to CJS (esprima doesn't support ESM/TS), then runs complexity-report.
 */
import { transform } from 'esbuild'
import fg from 'fast-glob'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const srcDir = join(root, 'src/cli')
const tempDir = join(root, '.complexity-temp')
const reportDir = join(root, 'reports', 'complexity')

async function main() {
  const tsFiles = await fg('**/*.ts', {
    cwd: srcDir,
    absolute: true,
    ignore: ['**/*.d.ts', '**/*.plan.ts', '**/node_modules/**'],
  })

  if (tsFiles.length === 0) {
    console.error('No .ts files found in src/cli')
    process.exit(1)
  }

  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(tempDir, { recursive: true })

  for (const fp of tsFiles) {
    const code = readFileSync(fp, 'utf-8')
    const out = await transform(code, {
      loader: 'ts',
      format: 'cjs',
      target: 'es2015',
    })
    const rel = relative(srcDir, fp).replace(/\.ts$/, '.js')
    const outPath = join(tempDir, rel)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, out.code)
  }

  const format = process.argv[2] || 'plain'
  const ext = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt'
  mkdirSync(reportDir, { recursive: true })
  const outFile = join(reportDir, `cli.${ext}`)

  const cr = spawnSync(
    'pnpm',
    ['exec', 'cr', tempDir, '-p', '\\.js$', '-e', '-f', format, '-o', outFile],
    {
      cwd: root,
      stdio: 'ignore',
      shell: true,
    }
  )

  if (cr.status === 0) {
    let report = readFileSync(outFile, 'utf-8')
    const srcCliPrefix = 'src/cli'
    report = report
      .replace(new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\\\/]', 'g'), srcCliPrefix + '/')
      .replace(/src\/cli\/([^\s"'\\]+)\.js/g, 'src/cli/$1.ts')
    writeFileSync(outFile, report)
    console.error(`Report written to ${outFile}`)
  }

  if (process.env.COMPLEXITY_KEEP_TEMP !== '1') {
    rmSync(tempDir, { recursive: true, force: true })
  } else {
    console.error(`Temp files kept at ${tempDir}`)
  }
  process.exit(cr.status ?? 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
