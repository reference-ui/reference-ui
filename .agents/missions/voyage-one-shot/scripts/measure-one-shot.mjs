// One-shot ref sync startup measurement for the voyage-one-shot mission.
// It takes a mode and a target package dir. Two modes keep cold measurements
// honest (a single Node process can only load the config graph cold once):
//
//   sync   <pkgDir>  run sync() with the phase recorder, then the tasty drain:
//                    reports config/scan/evaluate/compile/publish/residual,
//                    syncTotal, and drainMs.
//   config <pkgDir>  cold esbuild-bundle vs evaluateConfig split, plus the
//                    isolated fresh-process cost of the config's two entries
//                    (import('@reference-ui/neo'), import('@reference-ui/lib')).
//
// Uses the built neo dist modules (the same ones the `ref` CLI runs). Run each
// mode in a fresh process per sample.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ROOT = new URL('../../../../', import.meta.url).pathname.replace(/\/$/, '')
const [mode = 'sync', pkgDir] = process.argv.slice(2)
if (!pkgDir) {
  console.error('usage: measure-one-shot.mjs <sync|config> <package-dir>')
  process.exit(2)
}
const cwd = `${ROOT}/${pkgDir}`
const dist = `${ROOT}/packages/reference-neo/dist/src`

if (mode === 'sync') {
  process.env.REFERENCE_UI_PHASES_OUT = join(tmpdir(), `voyage-one-shot-phases-${process.pid}.json`)
  const { sync } = await import(`${dist}/sync/index.js`)
  const { flushReferenceBuild } = await import(`${dist}/reference/bridge/init.js`)
  const { writePhasesFile } = await import(`${dist}/sync/phases.js`)

  const t0 = performance.now()
  await sync(cwd, { verbose: false, json: false, foldRefDiagnostics: true })
  const t1 = performance.now()
  const build = await flushReferenceBuild(cwd)
  const t2 = performance.now()
  const phasesPath = writePhasesFile()
  const phases = phasesPath ? JSON.parse(readFileSync(phasesPath, 'utf8')).phases : null
  console.log(
    JSON.stringify(
      { atomicMs: Math.round(t1 - t0), drainMs: Math.round(t2 - t1), buildStatus: build?.status, phases },
      null,
      2
    )
  )
} else if (mode === 'config') {
  const { bundleConfigWithDependencies } = await import(`${dist}/config/bundle.js`)
  const { evaluateConfig } = await import(`${dist}/config/evaluate.js`)
  const { resolveRefConfigFile } = await import(`${dist}/lib/paths/index.js`)

  const configPath = resolveRefConfigFile(cwd)
  const c0 = performance.now()
  const bundled = await bundleConfigWithDependencies(configPath)
  const c1 = performance.now()
  await evaluateConfig(bundled.code, configPath)
  const c2 = performance.now()

  const importCost = (id) =>
    Math.round(
      Number(
        execFileSync('node', ['--input-type=module', '-e', `const t=performance.now();await import(${JSON.stringify(id)});console.log(performance.now()-t)`], {
          cwd,
          encoding: 'utf8',
        }).trim()
      )
    )

  console.log(
    JSON.stringify(
      {
        configPath,
        bundleMs: Math.round(c1 - c0),
        evaluateMs: Math.round(c2 - c1),
        depInputs: bundled.dependencyPaths.length,
        codeBytes: bundled.code.length,
        importNeoMs: importCost('@reference-ui/neo'),
        importLibMs: importCost('@reference-ui/lib'),
      },
      null,
      2
    )
  )
} else {
  console.error(`unknown mode: ${mode}`)
  process.exit(2)
}
