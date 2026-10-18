import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { declarationSpecifierProblems, rewriteDeclarationSpecifiers } from './rewrite-declaration-specifiers.mjs'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
  resolve(distDir, 'runtime/reference-ui/react/react.mjs'),
  resolve(distDir, 'runtime/reference-ui/styled/styles.css'),
  resolve(distDir, 'runtime/reference-ui/styled/index.d.ts'),
]

function run(command, args) {
  execFileSync(command, args, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

await rm(distDir, { recursive: true, force: true })

run(process.execPath, ['scripts/generate.mjs'])
run(process.execPath, [resolve(packageRoot, '../reference-core/tools/ensure-dist.mjs')])
run(process.execPath, [resolve(packageRoot, '../reference-core/dist/bin/ref.js'), 'sync'])
run(process.execPath, ['scripts/build-bundle.mjs'])
run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json'])
run(process.execPath, ['scripts/materialize-runtime.mjs'])

// tsc emits extensionless relative specifiers, which node16 and nodenext reject. Give each its declaration's
// extension, then fail the build on any shipped declaration that still names no shipped file.
const declarations = rewriteDeclarationSpecifiers({ packageRoot })
console.log(
  `build: rewrote ${declarations.rewritten} declaration specifiers in ${declarations.filesChanged} of ${declarations.files} .d.ts files`,
)
const danglingSpecifiers = declarationSpecifierProblems({ packageRoot })
if (danglingSpecifiers.length > 0) {
  throw new Error(
    [
      `build: ${danglingSpecifiers.length} shipped declaration specifier(s) name no shipped file:`,
      ...danglingSpecifiers.map((line) => `  ${line}`),
    ].join('\n'),
  )
}

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}
