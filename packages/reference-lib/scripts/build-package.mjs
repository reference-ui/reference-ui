import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
  resolve(distDir, 'theme/index.d.ts'),
]

// Landing Phase C (B5): Neo layout asserts — styled/ is data-only
// (runtime-data.mjs + styles.css + types), no Panda css/jsx/patterns dirs.
const packagedRuntimeFiles = [
  resolve(distDir, 'runtime/reference-ui/react/react.mjs'),
  resolve(distDir, 'runtime/reference-ui/styled/runtime-data.mjs'),
]

function run(command, args) {
  execFileSync(command, args, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

await mkdir(resolve(distDir, 'theme'), { recursive: true })
await writeFile(
  resolve(distDir, 'theme/index.d.ts'),
  `export * from '../core/theme/index'\nexport { default } from '../core/theme/index'\n`,
  'utf8',
)

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}

await mkdir(distDir, { recursive: true })
run(process.execPath, ['scripts/materialize-runtime.mjs'])

for (const filePath of packagedRuntimeFiles) {
  await access(filePath, constants.F_OK)
}

// B-35: the bundled tasty manifest runtime (pulled in via @reference-ui/types
// values used by the Reference browser) carries a Node-only branch,
// `await import("url")`, which makes every consumer Vite build warn about a
// browser-externalized builtin. The branch is dead in the packaged artifact:
// callers always pass URL-like specifiers derived from manifestUrl, and the
// isUrlLike guard returns first. Replace it with an explicit error so the
// shipped bundle holds zero node-builtin specifiers; a Node fs-path caller
// (none exists in practice) fails loudly instead of cryptically.
const NODE_URL_BRANCH_PATTERN =
  /const \{ pathToFileURL \} = await import\("url"\);\n(\s*)return pathToFileURL\(([^)]+)\)\.href;/g
const NODE_BUILTIN_SPECIFIER_PATTERN =
  /\bimport\s*\(\s*["'](?:node:)?(?:url|fs|path|module|os)["']\s*\)|\bfrom\s+["'](?:node:)?(?:url|fs|path|module|os)["']|\brequire\s*\(\s*["'](?:node:)?(?:url|fs|path)["']\s*\)/g

async function stripNodeUrlBranches() {
  const bundlePath = resolve(distDir, 'index.mjs')
  const content = await readFile(bundlePath, 'utf8')
  let patched = 0
  const next = content.replace(NODE_URL_BRANCH_PATTERN, (_match, indent, arg) => {
    patched += 1
    return (
      `${indent}throw new Error(\n` +
      `${indent}  \`[reference-ui] cannot resolve filesystem path "\${${arg}}" in this browser build \` +\n` +
      `${indent}  '(node:url is unavailable); pass a file:// URL instead.',\n` +
      `${indent});`
    )
  })
  if (patched === 0) {
    console.warn(
      'build-package: node:url branch not found in dist/index.mjs ' +
        '(tasty runtime shape changed?) — skipping patch, still asserting.',
    )
  } else {
    await writeFile(bundlePath, next)
  }
  for (const fileName of ['index.mjs', 'theme/index.mjs']) {
    const filePath = resolve(distDir, fileName)
    try {
      const text = await readFile(filePath, 'utf8')
      const hits = text.match(NODE_BUILTIN_SPECIFIER_PATTERN)
      if (hits) {
        throw new Error(
          `build-package: ${fileName} still references node builtins (${hits.join(', ')}) — refusing to ship`,
        )
      }
    } catch (error) {
      if (error?.code === 'ENOENT' && fileName !== 'index.mjs') continue
      throw error
    }
  }
  console.log(`build-package: B-35 node:url branches patched: ${patched}`)
}

await stripNodeUrlBranches()
