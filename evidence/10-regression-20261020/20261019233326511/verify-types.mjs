import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const project = path.dirname(fileURLToPath(import.meta.url))
const configPath = path.join(project, 'ui.config.ts')
const config = fs.readFileSync(configPath)
const flags = ['exec', '--', 'tsc', '--noEmit', '--strict', '--skipLibCheck', '--moduleResolution', 'bundler', '--module', 'esnext', '--target', 'es2022', '--jsx', 'react-jsx']
const results = []
function run(name, args) {
  const r = spawnSync('npm', args, { cwd: project, encoding: 'utf8', timeout: 60000 })
  fs.writeFileSync(path.join(project, 'logs', `${name}.log`), `$ npm ${args.join(' ')}\n${r.stdout || ''}${r.stderr || ''}\nExit ${r.status}\n`)
  console.log(JSON.stringify({ name, exit: r.status }))
  return { exit: r.status, output: (r.stdout || '') + (r.stderr || '') }
}
for (const [issue, file] of [[14, 'repro/responsive.tsx'], [21, 'repro/config-controls.ts'], [22, 'repro/css-skipped-values.ts']]) {
  const result = run(`issue-${issue}-types`, [...flags, file])
  results.push({ issue, passed: result.exit === 0, command: `npm ${[...flags, file].join(' ')}`, ...result })
}
fs.writeFileSync(path.join(project, 'repro/accordion-baseline.tsx'), "import { Accordion } from '@reference-ui/lib'\nexport const baseline = <Accordion />\n")
fs.writeFileSync(path.join(project, 'repro/accordion-default-value.tsx'), "import { Accordion } from '@reference-ui/lib'\nexport const proposed = <Accordion defaultValue=\"one\" />\n")
const accordionBaseline = run('issue-16-baseline-types', [...flags, 'repro/accordion-baseline.tsx'])
const accordionProposed = run('issue-16-default-value-types', [...flags, 'repro/accordion-default-value.tsx'])
results.push({ issue: 16, baseline: accordionBaseline, defaultValue: accordionProposed, metadataCheckPending: true })
try {
  fs.writeFileSync(configPath, "import {defineConfig} from '@reference-ui/core'\nimport {baseSystem} from '@reference-ui/lib/baseSystem'\nexport default defineConfig({name:'10-regression-20261020',include:['repro/consumed-size-prop.tsx'],extends:[baseSystem]})\n")
  fs.copyFileSync(configPath, path.join(project, 'repro/consumed-size-config.ts'))
  const typed = run('issue-23-types', [...flags, 'repro/consumed-size-prop.tsx'])
  const compiled = run('issue-23-sync', ['run', 'sync', '--', '--verbose'])
  results.push({ issue: 23, passed: typed.exit === 0 && compiled.exit === 0 && !compiled.output.includes('ATM-W-UNKNOWN-TOKEN'), typed, compiled })
} finally {
  fs.writeFileSync(configPath, config)
  const restored = run('restored-sync', ['run', 'sync'])
  results.push({ check: 'restored-sync', passed: restored.exit === 0 })
}
const app = run('app-typecheck', ['run', 'typecheck'])
results.push({ check: 'app-typecheck', passed: app.exit === 0, ...app })
fs.writeFileSync(path.join(project, 'logs/type-regressions.json'), JSON.stringify(results, null, 2) + '\n')
console.log(JSON.stringify(results.map(({ issue, check, passed, baseline, defaultValue }) => ({ issue, check, passed, baselineExit: baseline?.exit, defaultValueExit: defaultValue?.exit })), null, 2))
